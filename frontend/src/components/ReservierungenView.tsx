import { useState, useEffect } from 'react';
import { useGetMeineReservierungen, useGetReservierungenFuerHost, useGetAllParkplaetze, useCreateReservierung, useCheckIn, useCheckOut, useGetAllReservierungen, useIsCallerAdmin, useCreateCheckoutSession, useIsStripeConfigured } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Calendar as CalendarIcon, MapPin, LogIn, LogOut, Clock, ExternalLink, AlertCircle, List, Image as ImageIcon, User, Coins, CreditCard, CheckCircle2, Car } from 'lucide-react';
import { toast } from 'sonner';
import { ReservierungsStatus, type Reservierung, type ReservierungMitName, type ShoppingItem } from '../backend';
import ReservierungCalendar from './ReservierungCalendar';
import StripeSetupModal from './StripeSetupModal';

export default function ReservierungenView() {
  const { data: meineReservierungen, isLoading: loadingMeine } = useGetMeineReservierungen();
  const { data: hostReservierungen, isLoading: loadingHost } = useGetReservierungenFuerHost();
  const { data: parkplaetze } = useGetAllParkplaetze();
  const { data: alleReservierungen } = useGetAllReservierungen();
  const { data: isAdmin } = useIsCallerAdmin();
  const { data: isStripeConfigured } = useIsStripeConfigured();
  const createReservierung = useCreateReservierung();
  const createCheckoutSession = useCreateCheckoutSession();
  const checkIn = useCheckIn();
  const checkOut = useCheckOut();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isStripeSetupOpen, setIsStripeSetupOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<Reservierung | ReservierungMitName | null>(null);
  const [showPaymentSummary, setShowPaymentSummary] = useState(false);
  const [pendingReservationId, setPendingReservationId] = useState<bigint | null>(null);
  const [formData, setFormData] = useState({
    parkplatzId: '',
    startDate: '',
    startTime: '09:00',
    endDate: '',
    endTime: '18:00',
  });
  const [validationError, setValidationError] = useState<string | null>(null);
  const [calculatedCost, setCalculatedCost] = useState<number | null>(null);

  useEffect(() => {
    if (isAdmin && isStripeConfigured === false) {
      setIsStripeSetupOpen(true);
    }
  }, [isAdmin, isStripeConfigured]);

  useEffect(() => {
    if (isCreateOpen && !formData.startDate) {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      setFormData(prev => ({
        ...prev,
        startDate: today.toISOString().split('T')[0],
        endDate: tomorrow.toISOString().split('T')[0],
      }));
    }
  }, [isCreateOpen]);

  useEffect(() => {
    if (formData.parkplatzId && formData.startDate && formData.startTime && formData.endDate && formData.endTime) {
      const parkplatz = parkplaetze?.find(p => p.id.toString() === formData.parkplatzId);
      if (parkplatz) {
        const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
        const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);
        const durationHours = (endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60 * 60);
        const hourlyRate = Number(parkplatz.preis) / 100;
        const totalCost = durationHours * hourlyRate;
        setCalculatedCost(totalCost);
      }
    } else {
      setCalculatedCost(null);
    }
  }, [formData, parkplaetze]);

  const availableParkplaetze = parkplaetze || [];

  const checkReservationConflict = (
    parkplatzId: bigint,
    startTime: bigint,
    endTime: bigint
  ): { hasConflict: boolean; conflictingReservation?: ReservierungMitName; nextAvailable?: Date } => {
    if (!alleReservierungen) {
      return { hasConflict: false };
    }

    const relevantReservations = alleReservierungen
      .filter(r => 
        r.parkplatzId === parkplatzId && 
        r.status !== ReservierungsStatus.storniert &&
        r.status !== ReservierungsStatus.ausgecheckt
      )
      .sort((a, b) => Number(a.startZeit - b.startZeit));

    for (const reservation of relevantReservations) {
      if (startTime < reservation.endZeit && endTime > reservation.startZeit) {
        const conflictEnd = new Date(Number(reservation.endZeit) / 1_000_000);
        return {
          hasConflict: true,
          conflictingReservation: reservation,
          nextAvailable: conflictEnd,
        };
      }
    }

    return { hasConflict: false };
  };

  const validateReservation = (): boolean => {
    setValidationError(null);

    if (!formData.parkplatzId || !formData.startDate || !formData.endDate) {
      setValidationError('Bitte füllen Sie alle Felder aus');
      return false;
    }

    const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
    const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);
    const now = new Date();

    if (startDateTime < now) {
      setValidationError('Startzeitpunkt muss in der Zukunft liegen');
      return false;
    }

    if (endDateTime <= startDateTime) {
      setValidationError('Endzeitpunkt muss nach dem Startzeitpunkt liegen');
      return false;
    }

    const parkplatz = parkplaetze?.find(p => p.id.toString() === formData.parkplatzId);
    if (parkplatz) {
      const durationHours = (endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60 * 60);
      const maxDuration = Number(parkplatz.maxParkdauer);
      if (durationHours > maxDuration) {
        setValidationError(`Die maximale Parkdauer für diesen Parkplatz beträgt ${maxDuration} Stunden`);
        return false;
      }
    }

    const startTimestamp = BigInt(startDateTime.getTime() * 1_000_000);
    const endTimestamp = BigInt(endDateTime.getTime() * 1_000_000);

    const conflict = checkReservationConflict(
      BigInt(formData.parkplatzId),
      startTimestamp,
      endTimestamp
    );

    if (conflict.hasConflict && conflict.conflictingReservation) {
      const conflictStart = new Date(Number(conflict.conflictingReservation.startZeit) / 1_000_000);
      const conflictEnd = new Date(Number(conflict.conflictingReservation.endZeit) / 1_000_000);
      
      const formatDate = (date: Date) => date.toLocaleString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      let errorMessage = `Dieser Parkplatz ist im gewählten Zeitraum bereits reserviert (${formatDate(conflictStart)} - ${formatDate(conflictEnd)}).`;
      
      if (conflict.nextAvailable) {
        errorMessage += ` Nächster verfügbarer Zeitpunkt: ab ${formatDate(conflict.nextAvailable)}`;
      }

      setValidationError(errorMessage);
      return false;
    }

    return true;
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateReservation()) {
      return;
    }

    try {
      const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
      const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);

      const reservationId = await createReservierung.mutateAsync({
        parkplatzId: BigInt(formData.parkplatzId),
        startZeit: BigInt(startDateTime.getTime() * 1_000_000),
        endZeit: BigInt(endDateTime.getTime() * 1_000_000),
      });

      const parkplatz = parkplaetze?.find(p => p.id.toString() === formData.parkplatzId);
      const isFree = parkplatz && Number(parkplatz.preis) === 0;

      if (isFree) {
        toast.success('Reservierung erfolgreich erstellt!');
        setIsCreateOpen(false);
        setFormData({
          parkplatzId: '',
          startDate: '',
          startTime: '09:00',
          endDate: '',
          endTime: '18:00',
        });
        setValidationError(null);
        setCalculatedCost(null);
      } else {
        setPendingReservationId(reservationId);
        setShowPaymentSummary(true);
      }
    } catch (error: any) {
      console.error('Reservation creation error:', error);
      const errorMessage = error?.message || 'Fehler beim Erstellen der Reservierung';
      
      if (errorMessage.includes('bereits reserviert')) {
        setValidationError(errorMessage);
        toast.error('Zeitraum nicht verfügbar', {
          description: 'Dieser Parkplatz ist im gewählten Zeitraum bereits reserviert.',
        });
      } else if (errorMessage.includes('Unauthorized')) {
        toast.error('Keine Berechtigung', {
          description: 'Sie haben keine Berechtigung, Reservierungen zu erstellen.',
        });
      } else {
        toast.error('Fehler beim Erstellen der Reservierung', {
          description: errorMessage,
        });
      }
    }
  };

  const handlePayment = async () => {
    if (!pendingReservationId || calculatedCost === null) return;

    const parkplatz = parkplaetze?.find(p => p.id.toString() === formData.parkplatzId);
    if (!parkplatz) return;

    try {
      const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
      const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);
      const durationHours = (endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60 * 60);

      const items: ShoppingItem[] = [
        {
          productName: `Parkplatz: ${parkplatz.adresse}`,
          productDescription: `Reservierung von ${startDateTime.toLocaleString('de-DE')} bis ${endDateTime.toLocaleString('de-DE')} (${durationHours.toFixed(1)}h)`,
          priceInCents: BigInt(Math.round(calculatedCost * 100)),
          quantity: BigInt(1),
          currency: 'chf',
        },
      ];

      const baseUrl = `${window.location.protocol}//${window.location.host}`;
      const successUrl = `${baseUrl}?payment=success&reservationId=${pendingReservationId}`;
      const cancelUrl = `${baseUrl}?payment=cancel`;

      const session = await createCheckoutSession.mutateAsync({
        items,
        successUrl,
        cancelUrl,
      });

      window.location.href = session.url;
    } catch (error: any) {
      toast.error('Fehler bei der Zahlungsabwicklung', {
        description: error?.message || 'Bitte versuchen Sie es erneut.',
      });
      console.error('Payment error:', error);
    }
  };

  const handleCheckIn = async (id: bigint) => {
    try {
      await checkIn.mutateAsync(id);
      toast.success('Erfolgreich eingecheckt!');
    } catch (error: any) {
      toast.error('Fehler beim Check-in', {
        description: error?.message || 'Bitte versuchen Sie es erneut.',
      });
      console.error(error);
    }
  };

  const handleCheckOut = async (id: bigint) => {
    try {
      await checkOut.mutateAsync(id);
      toast.success('Erfolgreich ausgecheckt!');
    } catch (error: any) {
      toast.error('Fehler beim Check-out', {
        description: error?.message || 'Bitte versuchen Sie es erneut.',
      });
      console.error(error);
    }
  };

  const handleCalendarDayClick = (date: Date) => {
    const tomorrow = new Date(date);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    setFormData({
      parkplatzId: '',
      startDate: date.toISOString().split('T')[0],
      startTime: '09:00',
      endDate: tomorrow.toISOString().split('T')[0],
      endTime: '18:00',
    });
    setValidationError(null);
    setCalculatedCost(null);
    setIsCreateOpen(true);
  };

  const getStatusBadge = (status: ReservierungsStatus) => {
    switch (status) {
      case ReservierungsStatus.reserviert:
        return <Badge className="bg-green-500 hover:bg-green-600">Reserviert</Badge>;
      case ReservierungsStatus.eingecheckt:
        return <Badge className="bg-blue-500 hover:bg-blue-600">Eingecheckt</Badge>;
      case ReservierungsStatus.ausgecheckt:
        return <Badge variant="outline">Ausgecheckt</Badge>;
      case ReservierungsStatus.storniert:
        return <Badge variant="destructive">Storniert</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getPaymentBadge = (bezahlt: boolean) => {
    if (bezahlt) {
      return (
        <Badge className="bg-green-500 hover:bg-green-600 gap-1">
          <CheckCircle2 className="h-3 w-3" />
          Bezahlt
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="gap-1">
        <Clock className="h-3 w-3" />
        Ausstehend
      </Badge>
    );
  };

  const formatDateTime = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1_000_000);
    return date.toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getParkplatzInfo = (id: bigint) => {
    return parkplaetze?.find(p => p.id === id);
  };

  const openGoogleMaps = (adresse: string) => {
    const mapsUrl = `https://www.google.com/maps?q=${encodeURIComponent(adresse)}`;
    window.open(mapsUrl, '_blank', 'noopener,noreferrer');
  };

  const handleFormChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    setValidationError(null);
  };

  const formatPrice = (preis: bigint) => {
    const price = Number(preis) / 100;
    if (price === 0) {
      return 'Kostenlos';
    }
    return `CHF ${price.toFixed(2)} / Stunde`;
  };

  if (loadingMeine || loadingHost) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="text-muted-foreground">Reservierungen werden geladen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <StripeSetupModal open={isStripeSetupOpen} onOpenChange={setIsStripeSetupOpen} />

      <Tabs defaultValue="list" className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold">Reservierungen</h3>
            <p className="text-muted-foreground">Verwalten Sie Ihre Buchungen</p>
          </div>
          <div className="flex items-center gap-2">
            <TabsList>
              <TabsTrigger value="list" className="gap-2">
                <List className="h-4 w-4" />
                <span className="hidden sm:inline">Liste</span>
              </TabsTrigger>
              <TabsTrigger value="calendar" className="gap-2">
                <CalendarIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Kalender</span>
              </TabsTrigger>
            </TabsList>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Neue Reservierung</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Parkplatz reservieren</DialogTitle>
                  <DialogDescription>
                    Wählen Sie einen Parkplatz und den gewünschten Zeitraum
                  </DialogDescription>
                </DialogHeader>
                {!showPaymentSummary ? (
                  <form onSubmit={handleCreate} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="parkplatz">Parkplatz *</Label>
                      <Select 
                        value={formData.parkplatzId} 
                        onValueChange={(value) => handleFormChange('parkplatzId', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Parkplatz auswählen" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableParkplaetze.length === 0 ? (
                            <div className="p-2 text-sm text-muted-foreground text-center">
                              Keine verfügbaren Parkplätze
                            </div>
                          ) : (
                            availableParkplaetze.map((p) => (
                              <SelectItem key={p.id.toString()} value={p.id.toString()}>
                                <div className="flex flex-col">
                                  <span>#{p.id.toString()} - {p.adresse}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {formatPrice(p.preis)} • Max. {p.maxParkdauer.toString()}h
                                  </span>
                                </div>
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="startDate">Startdatum *</Label>
                        <Input
                          id="startDate"
                          type="date"
                          value={formData.startDate}
                          onChange={(e) => handleFormChange('startDate', e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="startTime">Startzeit *</Label>
                        <Input
                          id="startTime"
                          type="time"
                          value={formData.startTime}
                          onChange={(e) => handleFormChange('startTime', e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="endDate">Enddatum *</Label>
                        <Input
                          id="endDate"
                          type="date"
                          value={formData.endDate}
                          onChange={(e) => handleFormChange('endDate', e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="endTime">Endzeit *</Label>
                        <Input
                          id="endTime"
                          type="time"
                          value={formData.endTime}
                          onChange={(e) => handleFormChange('endTime', e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    
                    {calculatedCost !== null && (
                      <Alert className="bg-primary/5 border-primary/20">
                        <Coins className="h-4 w-4 text-primary" />
                        <AlertDescription className="text-sm font-medium">
                          {calculatedCost === 0 ? (
                            <span className="text-green-600 dark:text-green-400">Kostenlos</span>
                          ) : (
                            <span>Gesamtkosten: <span className="text-primary font-bold">CHF {calculatedCost.toFixed(2)}</span></span>
                          )}
                        </AlertDescription>
                      </Alert>
                    )}

                    {validationError && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-sm">
                          {validationError}
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="flex gap-2">
                      <Button 
                        type="submit" 
                        className="flex-1" 
                        disabled={createReservierung.isPending || availableParkplaetze.length === 0}
                      >
                        {createReservierung.isPending ? 'Wird erstellt...' : 'Reservieren'}
                      </Button>
                      <Button type="button" variant="outline" onClick={() => {
                        setIsCreateOpen(false);
                        setValidationError(null);
                        setCalculatedCost(null);
                      }}>
                        Abbrechen
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <Alert className="bg-primary/5 border-primary/20">
                      <CreditCard className="h-4 w-4 text-primary" />
                      <AlertDescription>
                        <div className="space-y-2">
                          <p className="font-semibold">Zahlungsübersicht</p>
                          <div className="text-sm space-y-1">
                            <div className="flex justify-between">
                              <span>Stundensatz:</span>
                              <span>CHF {(Number(parkplaetze?.find(p => p.id.toString() === formData.parkplatzId)?.preis || 0) / 100).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Dauer:</span>
                              <span>{((new Date(`${formData.endDate}T${formData.endTime}`).getTime() - new Date(`${formData.startDate}T${formData.startTime}`).getTime()) / (1000 * 60 * 60)).toFixed(1)} Stunden</span>
                            </div>
                            <div className="flex justify-between font-bold text-base pt-2 border-t">
                              <span>Gesamtbetrag:</span>
                              <span className="text-primary">CHF {calculatedCost?.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      </AlertDescription>
                    </Alert>

                    <div className="flex gap-2">
                      <Button 
                        className="flex-1 gap-2" 
                        onClick={handlePayment}
                        disabled={createCheckoutSession.isPending}
                      >
                        <CreditCard className="h-4 w-4" />
                        {createCheckoutSession.isPending ? 'Wird verarbeitet...' : 'Jetzt bezahlen'}
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => {
                          setShowPaymentSummary(false);
                          setPendingReservationId(null);
                          setIsCreateOpen(false);
                          setFormData({
                            parkplatzId: '',
                            startDate: '',
                            startTime: '09:00',
                            endDate: '',
                            endTime: '18:00',
                          });
                          setValidationError(null);
                          setCalculatedCost(null);
                        }}
                      >
                        Abbrechen
                      </Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <TabsContent value="list" className="space-y-8">
          <div>
            <h4 className="text-xl font-semibold mb-4">Meine Reservierungen</h4>
            {!meineReservierungen || meineReservierungen.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                    <CalendarIcon className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">Keine Reservierungen</h3>
                  <p className="mb-4 text-center text-sm text-muted-foreground">
                    Sie haben noch keine Parkplätze reserviert
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {meineReservierungen.map((reservierung) => {
                  const parkplatz = getParkplatzInfo(reservierung.parkplatzId);
                  const isFree = parkplatz && Number(parkplatz.preis) === 0;
                  return (
                    <Card key={reservierung.id.toString()} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setSelectedReservation(reservierung)}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="flex items-center gap-2 text-lg">
                              <MapPin className="h-4 w-4 text-primary" />
                              {parkplatz ? (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openGoogleMaps(parkplatz.adresse);
                                  }}
                                  className="flex items-center gap-1 hover:underline cursor-pointer group"
                                >
                                  <span>{parkplatz.adresse}</span>
                                  <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </button>
                              ) : (
                                `Parkplatz #${reservierung.parkplatzId.toString()}`
                              )}
                            </CardTitle>
                            <CardDescription className="mt-1">
                              Reservierung #{reservierung.id.toString()}
                            </CardDescription>
                          </div>
                          <div className="flex flex-col gap-1 items-end">
                            {getStatusBadge(reservierung.status)}
                            {!isFree && getPaymentBadge(reservierung.bezahlt)}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>Von: {formatDateTime(reservierung.startZeit)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>Bis: {formatDateTime(reservierung.endZeit)}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {reservierung.status === ReservierungsStatus.reserviert && (
                            <Button
                              size="sm"
                              className="flex-1 gap-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCheckIn(reservierung.id);
                              }}
                              disabled={checkIn.isPending}
                            >
                              <LogIn className="h-4 w-4" />
                              Check-in
                            </Button>
                          )}
                          {reservierung.status === ReservierungsStatus.eingecheckt && (
                            <Button
                              size="sm"
                              variant="secondary"
                              className="flex-1 gap-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCheckOut(reservierung.id);
                              }}
                              disabled={checkOut.isPending}
                            >
                              <LogOut className="h-4 w-4" />
                              Check-out
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {hostReservierungen && hostReservierungen.length > 0 && (
            <div>
              <h4 className="text-xl font-semibold mb-4">Reservierungen für meine Parkplätze</h4>
              <div className="grid gap-4 md:grid-cols-2">
                {hostReservierungen.map((reservierung) => {
                  const parkplatz = getParkplatzInfo(reservierung.parkplatzId);
                  const isFree = parkplatz && Number(parkplatz.preis) === 0;
                  return (
                    <Card key={reservierung.id.toString()} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setSelectedReservation(reservierung)}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="flex items-center gap-2 text-lg">
                              <MapPin className="h-4 w-4 text-primary" />
                              {parkplatz ? (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openGoogleMaps(parkplatz.adresse);
                                  }}
                                  className="flex items-center gap-1 hover:underline cursor-pointer group"
                                >
                                  <span>{parkplatz.adresse}</span>
                                  <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </button>
                              ) : (
                                `Parkplatz #${reservierung.parkplatzId.toString()}`
                              )}
                            </CardTitle>
                            <CardDescription className="mt-1">
                              Reservierung #{reservierung.id.toString()}
                            </CardDescription>
                          </div>
                          <div className="flex flex-col gap-1 items-end">
                            {getStatusBadge(reservierung.status)}
                            {!isFree && isAdmin && getPaymentBadge(reservierung.bezahlt)}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="space-y-2 text-sm">
                          {isAdmin && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <User className="h-4 w-4" />
                              <span>Reserviert von: {reservierung.name}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>Von: {formatDateTime(reservierung.startZeit)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>Bis: {formatDateTime(reservierung.endZeit)}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="calendar">
          <ReservierungCalendar
            meineReservierungen={meineReservierungen || []}
            hostReservierungen={hostReservierungen || []}
            parkplaetze={parkplaetze || []}
            onReservationClick={setSelectedReservation}
            onDayClick={handleCalendarDayClick}
          />
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedReservation} onOpenChange={(open) => !open && setSelectedReservation(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Reservierungsdetails</DialogTitle>
            <DialogDescription>
              Vollständige Informationen zu dieser Reservierung
            </DialogDescription>
          </DialogHeader>
          {selectedReservation && (
            <div className="space-y-6">
              {(() => {
                const parkplatz = getParkplatzInfo(selectedReservation.parkplatzId);
                const reserverName = 'name' in selectedReservation ? selectedReservation.name : null;
                const isFree = parkplatz && Number(parkplatz.preis) === 0;
                return (
                  <>
                    {parkplatz && (
                      <div className="relative rounded-lg overflow-hidden border">
                        {parkplatz.situationsbild ? (
                          <img 
                            src={parkplatz.situationsbild.getDirectURL()} 
                            alt="Parkplatz Situationsbild" 
                            className="w-full h-64 object-cover"
                          />
                        ) : (
                          <div className="w-full h-64 bg-muted flex items-center justify-center">
                            <div className="text-center text-muted-foreground">
                              <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                              <p className="text-sm">Kein Bild verfügbar</p>
                            </div>
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                          <p className="text-white font-semibold text-lg">{parkplatz.adresse}</p>
                        </div>
                      </div>
                    )}
                    <div className="grid gap-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">Status</span>
                        {getStatusBadge(selectedReservation.status)}
                      </div>
                      {!isFree && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-muted-foreground">Zahlungsstatus</span>
                          {getPaymentBadge(selectedReservation.bezahlt)}
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">Reservierungs-ID</span>
                        <span className="font-mono text-sm">#{selectedReservation.id.toString()}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">Parkplatz-ID</span>
                        <span className="font-mono text-sm">#{selectedReservation.parkplatzId.toString()}</span>
                      </div>
                      {isAdmin && reserverName && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-muted-foreground">Reserviert von</span>
                          <span className="text-sm font-semibold">{reserverName}</span>
                        </div>
                      )}
                      {selectedReservation.kennzeichen && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Car className="h-4 w-4" />
                            Kennzeichen
                          </span>
                          <span className="text-sm font-semibold">{selectedReservation.kennzeichen}</span>
                        </div>
                      )}
                      {selectedReservation.fahrzeugmarke && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Car className="h-4 w-4" />
                            Fahrzeugmarke
                          </span>
                          <span className="text-sm font-semibold">{selectedReservation.fahrzeugmarke}</span>
                        </div>
                      )}
                      {parkplatz && (
                        <>
                          <div className="flex items-start justify-between">
                            <span className="text-sm font-medium text-muted-foreground">Adresse</span>
                            <button
                              onClick={() => openGoogleMaps(parkplatz.adresse)}
                              className="flex items-center gap-1 text-sm text-primary hover:underline cursor-pointer group text-right"
                            >
                              <span>{parkplatz.adresse}</span>
                              <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                          </div>
                          <div className="flex items-start justify-between">
                            <span className="text-sm font-medium text-muted-foreground">Beschreibung</span>
                            <span className="text-sm text-right max-w-xs">{parkplatz.beschreibung}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-muted-foreground">Preis</span>
                            <span className="text-sm font-semibold">{formatPrice(parkplatz.preis)}</span>
                          </div>
                        </>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">Start</span>
                        <span className="text-sm">{formatDateTime(selectedReservation.startZeit)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">Ende</span>
                        <span className="text-sm">{formatDateTime(selectedReservation.endZeit)}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {selectedReservation.status === ReservierungsStatus.reserviert && (
                        <Button
                          className="flex-1 gap-2"
                          onClick={() => {
                            handleCheckIn(selectedReservation.id);
                            setSelectedReservation(null);
                          }}
                          disabled={checkIn.isPending}
                        >
                          <LogIn className="h-4 w-4" />
                          Check-in
                        </Button>
                      )}
                      {selectedReservation.status === ReservierungsStatus.eingecheckt && (
                        <Button
                          variant="secondary"
                          className="flex-1 gap-2"
                          onClick={() => {
                            handleCheckOut(selectedReservation.id);
                            setSelectedReservation(null);
                          }}
                          disabled={checkOut.isPending}
                        >
                          <LogOut className="h-4 w-4" />
                          Check-out
                        </Button>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
