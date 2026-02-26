import { useState } from 'react';
import { useGetAllParkplaetze, useCreateParkplatz, useUpdateParkplatz, useDeleteParkplatz, useIsCallerAdmin } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, MapPin, Edit, Trash2, ExternalLink, Upload, X, ShieldAlert, Clock, QrCode } from 'lucide-react';
import { toast } from 'sonner';
import type { Parkplatz, WochentagVerfuegbarkeit } from '../backend';
import { ExternalBlob } from '../backend';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import QRCodeDisplay from './QRCodeDisplay';

const WEEKDAYS = [
  { value: 0, label: 'Montag' },
  { value: 1, label: 'Dienstag' },
  { value: 2, label: 'Mittwoch' },
  { value: 3, label: 'Donnerstag' },
  { value: 4, label: 'Freitag' },
  { value: 5, label: 'Samstag' },
  { value: 6, label: 'Sonntag' },
];

interface WeekdayAvailability {
  enabled: boolean;
  startTime: string;
  endTime: string;
}

export default function ParkplaetzeView() {
  const { data: parkplaetze, isLoading } = useGetAllParkplaetze();
  const { data: isAdmin, isLoading: isAdminLoading } = useIsCallerAdmin();
  const { identity } = useInternetIdentity();
  const createParkplatz = useCreateParkplatz();
  const updateParkplatz = useUpdateParkplatz();
  const deleteParkplatz = useDeleteParkplatz();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingParkplatz, setEditingParkplatz] = useState<Parkplatz | null>(null);
  const [deletingParkplatz, setDeletingParkplatz] = useState<Parkplatz | null>(null);
  const [showQRCode, setShowQRCode] = useState<Parkplatz | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);

  const [formData, setFormData] = useState({
    adresse: '',
    beschreibung: '',
    preis: '',
    maxParkdauer: '24',
    imageFile: null as File | null,
    imagePreview: null as string | null,
  });

  const [weekdayAvailability, setWeekdayAvailability] = useState<WeekdayAvailability[]>(
    WEEKDAYS.map(() => ({ enabled: true, startTime: '00:00', endTime: '23:59' }))
  );

  const myParkplaetze = parkplaetze?.filter(p => p.host.toString() === identity?.getPrincipal().toString()) || [];
  const otherParkplaetze = parkplaetze?.filter(p => p.host.toString() !== identity?.getPrincipal().toString()) || [];

  const resetForm = () => {
    setFormData({ adresse: '', beschreibung: '', preis: '', maxParkdauer: '24', imageFile: null, imagePreview: null });
    setWeekdayAvailability(WEEKDAYS.map(() => ({ enabled: true, startTime: '00:00', endTime: '23:59' })));
    setEditingParkplatz(null);
    setUploadProgress(0);
    setIsUploading(false);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Bild darf maximal 5 MB groß sein');
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast.error('Bitte wählen Sie eine Bilddatei aus');
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData({ ...formData, imageFile: file, imagePreview: e.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setFormData({ ...formData, imageFile: null, imagePreview: null });
  };

  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const buildWochentageVerfuegbarkeit = (): WochentagVerfuegbarkeit[] => {
    return weekdayAvailability
      .map((day, index) => {
        if (!day.enabled) return null;
        return {
          wochentag: BigInt(index),
          startZeit: BigInt(timeToMinutes(day.startTime)),
          endZeit: BigInt(timeToMinutes(day.endTime)),
        };
      })
      .filter((day): day is WochentagVerfuegbarkeit => day !== null);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.adresse.trim() || !formData.beschreibung.trim() || !formData.preis || !formData.maxParkdauer) {
      toast.error('Bitte füllen Sie alle Felder aus');
      return;
    }

    const maxParkdauerNum = parseInt(formData.maxParkdauer);
    if (maxParkdauerNum <= 0) {
      toast.error('Maximale Parkdauer muss größer als 0 sein');
      return;
    }

    try {
      setIsUploading(true);
      let situationsbild: ExternalBlob | null = null;

      if (formData.imageFile) {
        const arrayBuffer = await formData.imageFile.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        situationsbild = ExternalBlob.fromBytes(uint8Array).withUploadProgress((percentage) => {
          setUploadProgress(percentage);
        });
      }

      await createParkplatz.mutateAsync({
        adresse: formData.adresse.trim(),
        beschreibung: formData.beschreibung.trim(),
        preis: BigInt(Math.round(parseFloat(formData.preis) * 100)),
        situationsbild,
        maxParkdauer: BigInt(maxParkdauerNum),
        wochentageVerfuegbarkeit: buildWochentageVerfuegbarkeit(),
      });
      toast.success('Parkplatz erfolgreich erstellt!');
      setIsCreateOpen(false);
      resetForm();
    } catch (error: any) {
      if (error?.message?.includes('Unauthorized')) {
        toast.error('Nur Administratoren können Parkplätze erstellen');
      } else {
        toast.error('Fehler beim Erstellen des Parkplatzes');
      }
      console.error(error);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingParkplatz || !formData.adresse.trim() || !formData.beschreibung.trim() || !formData.preis || !formData.maxParkdauer) {
      toast.error('Bitte füllen Sie alle Felder aus');
      return;
    }

    const maxParkdauerNum = parseInt(formData.maxParkdauer);
    if (maxParkdauerNum <= 0) {
      toast.error('Maximale Parkdauer muss größer als 0 sein');
      return;
    }

    try {
      setIsUploading(true);
      let situationsbild: ExternalBlob | null = editingParkplatz.situationsbild || null;

      if (formData.imageFile) {
        const arrayBuffer = await formData.imageFile.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        situationsbild = ExternalBlob.fromBytes(uint8Array).withUploadProgress((percentage) => {
          setUploadProgress(percentage);
        });
      }

      await updateParkplatz.mutateAsync({
        id: editingParkplatz.id,
        adresse: formData.adresse.trim(),
        beschreibung: formData.beschreibung.trim(),
        preis: BigInt(Math.round(parseFloat(formData.preis) * 100)),
        situationsbild,
        maxParkdauer: BigInt(maxParkdauerNum),
        wochentageVerfuegbarkeit: buildWochentageVerfuegbarkeit(),
      });
      toast.success('Parkplatz erfolgreich aktualisiert!');
      resetForm();
    } catch (error: any) {
      if (error?.message?.includes('Unauthorized')) {
        toast.error('Nur Administratoren können Parkplätze bearbeiten');
      } else {
        toast.error('Fehler beim Aktualisieren des Parkplatzes');
      }
      console.error(error);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async () => {
    if (!deletingParkplatz) return;

    try {
      await deleteParkplatz.mutateAsync(deletingParkplatz.id);
      toast.success('Parkplatz erfolgreich gelöscht!');
      setDeletingParkplatz(null);
    } catch (error: any) {
      if (error?.message?.includes('Unauthorized')) {
        toast.error('Nur Administratoren können Parkplätze löschen');
      } else {
        toast.error('Fehler beim Löschen des Parkplatzes');
      }
      console.error(error);
    }
  };

  const startEdit = (parkplatz: Parkplatz) => {
    setEditingParkplatz(parkplatz);
    setFormData({
      adresse: parkplatz.adresse,
      beschreibung: parkplatz.beschreibung,
      preis: (Number(parkplatz.preis) / 100).toFixed(2),
      maxParkdauer: parkplatz.maxParkdauer.toString(),
      imageFile: null,
      imagePreview: parkplatz.situationsbild ? parkplatz.situationsbild.getDirectURL() : null,
    });

    // Load weekday availability
    const newWeekdayAvailability = WEEKDAYS.map((_, index) => {
      const availability = parkplatz.wochentageVerfuegbarkeit.find(w => Number(w.wochentag) === index);
      if (availability) {
        const startMinutes = Number(availability.startZeit);
        const endMinutes = Number(availability.endZeit);
        const startHours = Math.floor(startMinutes / 60);
        const startMins = startMinutes % 60;
        const endHours = Math.floor(endMinutes / 60);
        const endMins = endMinutes % 60;
        return {
          enabled: true,
          startTime: `${String(startHours).padStart(2, '0')}:${String(startMins).padStart(2, '0')}`,
          endTime: `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`,
        };
      }
      return { enabled: false, startTime: '00:00', endTime: '23:59' };
    });
    setWeekdayAvailability(newWeekdayAvailability);
  };

  const openGoogleMaps = (adresse: string) => {
    const mapsUrl = `https://www.google.com/maps?q=${encodeURIComponent(adresse)}`;
    window.open(mapsUrl, '_blank', 'noopener,noreferrer');
  };

  const formatPrice = (preis: bigint) => {
    const price = Number(preis) / 100;
    if (price === 0) {
      return 'Kostenlos';
    }
    return `CHF ${price.toFixed(2)} / Stunde`;
  };

  if (isLoading || isAdminLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="text-muted-foreground">Parkplätze werden geladen...</p>
        </div>
      </div>
    );
  }

  const renderParkplatzForm = (isEdit: boolean) => (
    <form onSubmit={isEdit ? handleUpdate : handleCreate} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor={isEdit ? 'edit-adresse' : 'adresse'}>Adresse *</Label>
        <Input
          id={isEdit ? 'edit-adresse' : 'adresse'}
          placeholder="z.B. Hauptstraße 123, 12345 Berlin"
          value={formData.adresse}
          onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={isEdit ? 'edit-beschreibung' : 'beschreibung'}>Beschreibung *</Label>
        <Textarea
          id={isEdit ? 'edit-beschreibung' : 'beschreibung'}
          placeholder="Beschreiben Sie Ihren Parkplatz..."
          value={formData.beschreibung}
          onChange={(e) => setFormData({ ...formData, beschreibung: e.target.value })}
          required
          rows={3}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={isEdit ? 'edit-preis' : 'preis'}>Preis pro Stunde (CHF) *</Label>
          <Input
            id={isEdit ? 'edit-preis' : 'preis'}
            type="number"
            step="0.01"
            min="0"
            placeholder="z.B. 2.50"
            value={formData.preis}
            onChange={(e) => setFormData({ ...formData, preis: e.target.value })}
            required
          />
          <p className="text-xs text-muted-foreground">0.00 für kostenlose Parkplätze</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor={isEdit ? 'edit-maxParkdauer' : 'maxParkdauer'}>Max. Parkdauer (Stunden) *</Label>
          <Input
            id={isEdit ? 'edit-maxParkdauer' : 'maxParkdauer'}
            type="number"
            min="1"
            placeholder="z.B. 24"
            value={formData.maxParkdauer}
            onChange={(e) => setFormData({ ...formData, maxParkdauer: e.target.value })}
            required
          />
        </div>
      </div>
      <div className="space-y-3">
        <Label>Verfügbarkeit nach Wochentag</Label>
        <div className="space-y-2 max-h-64 overflow-y-auto border rounded-md p-3">
          {WEEKDAYS.map((weekday, index) => (
            <div key={weekday.value} className="flex items-center gap-3 py-2">
              <Checkbox
                id={`weekday-${index}`}
                checked={weekdayAvailability[index].enabled}
                onCheckedChange={(checked) => {
                  const newAvailability = [...weekdayAvailability];
                  newAvailability[index].enabled = checked as boolean;
                  setWeekdayAvailability(newAvailability);
                }}
              />
              <Label htmlFor={`weekday-${index}`} className="w-24 cursor-pointer">
                {weekday.label}
              </Label>
              {weekdayAvailability[index].enabled && (
                <div className="flex items-center gap-2 flex-1">
                  <Input
                    type="time"
                    value={weekdayAvailability[index].startTime}
                    onChange={(e) => {
                      const newAvailability = [...weekdayAvailability];
                      newAvailability[index].startTime = e.target.value;
                      setWeekdayAvailability(newAvailability);
                    }}
                    className="w-28"
                  />
                  <span className="text-muted-foreground">bis</span>
                  <Input
                    type="time"
                    value={weekdayAvailability[index].endTime}
                    onChange={(e) => {
                      const newAvailability = [...weekdayAvailability];
                      newAvailability[index].endTime = e.target.value;
                      setWeekdayAvailability(newAvailability);
                    }}
                    className="w-28"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor={isEdit ? 'edit-image' : 'image'}>Situationsbild (optional)</Label>
        <div className="space-y-3">
          {formData.imagePreview ? (
            <div className="relative rounded-lg overflow-hidden border-2 border-dashed border-primary/30">
              <img src={formData.imagePreview} alt="Vorschau" className="w-full h-48 object-cover" />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2"
                onClick={removeImage}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <label
              htmlFor={isEdit ? 'edit-image' : 'image'}
              className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-primary/30 rounded-lg cursor-pointer hover:bg-accent/50 transition-colors"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="mb-2 text-sm text-muted-foreground">
                  <span className="font-semibold">Klicken zum Hochladen</span> oder Drag & Drop
                </p>
                <p className="text-xs text-muted-foreground">PNG, JPG, WEBP (max. 5 MB)</p>
              </div>
              <Input
                id={isEdit ? 'edit-image' : 'image'}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageSelect}
              />
            </label>
          )}
          {isUploading && uploadProgress > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Upload-Fortschritt</span>
                <span className="font-medium">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="submit" className="flex-1" disabled={(isEdit ? updateParkplatz : createParkplatz).isPending || isUploading}>
          {isUploading ? `Wird hochgeladen... ${uploadProgress}%` : (isEdit ? updateParkplatz : createParkplatz).isPending ? (isEdit ? 'Wird gespeichert...' : 'Wird erstellt...') : (isEdit ? 'Speichern' : 'Erstellen')}
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => {
            if (isEdit) {
              resetForm();
            } else {
              setIsCreateOpen(false);
              resetForm();
            }
          }}
        >
          Abbrechen
        </Button>
      </div>
    </form>
  );

  return (
    <div className="space-y-6">
      {!isAdmin && (
        <Alert className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
          <ShieldAlert className="h-5 w-5 text-amber-600 dark:text-amber-500" />
          <AlertTitle className="text-amber-900 dark:text-amber-100 font-semibold">
            Eingeschränkte Berechtigungen
          </AlertTitle>
          <AlertDescription className="text-amber-800 dark:text-amber-200">
            Nur Administratoren können Parkplätze erstellen, bearbeiten oder löschen. Sie können verfügbare Parkplätze ansehen und reservieren.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold">
            {isAdmin ? 'Meine Parkplätze' : 'Verfügbare Parkplätze'}
          </h3>
          <p className="text-muted-foreground">
            {isAdmin ? 'Verwalten Sie Ihre Parkplätze' : 'Durchsuchen Sie verfügbare Parkplätze'}
          </p>
        </div>
        {isAdmin ? (
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Parkplatz hinzufügen
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Neuen Parkplatz hinzufügen</DialogTitle>
                <DialogDescription>
                  Geben Sie die Details für Ihren neuen Parkplatz ein
                </DialogDescription>
              </DialogHeader>
              {renderParkplatzForm(false)}
            </DialogContent>
          </Dialog>
        ) : (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button className="gap-2" disabled>
                  <Plus className="h-4 w-4" />
                  Parkplatz hinzufügen
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Nur Administratoren können Parkplätze hinzufügen</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {isAdmin && myParkplaetze.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <MapPin className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">Keine Parkplätze vorhanden</h3>
            <p className="mb-4 text-center text-sm text-muted-foreground">
              Fügen Sie Ihren ersten Parkplatz hinzu, um loszulegen
            </p>
          </CardContent>
        </Card>
      ) : isAdmin ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {myParkplaetze.map((parkplatz) => (
            <Card key={parkplatz.id.toString()} className="relative overflow-hidden">
              {parkplatz.situationsbild && (
                <div className="relative h-40 overflow-hidden">
                  <img
                    src={parkplatz.situationsbild.getDirectURL()}
                    alt="Parkplatz"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                </div>
              )}
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <MapPin className="h-4 w-4 text-primary" />
                      Parkplatz #{parkplatz.id.toString()}
                    </CardTitle>
                    <button
                      onClick={() => openGoogleMaps(parkplatz.adresse)}
                      className="mt-1 flex items-center gap-1 text-sm text-primary hover:underline cursor-pointer group"
                    >
                      <span>{parkplatz.adresse}</span>
                      <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-2">{parkplatz.beschreibung}</p>
                <div className="flex items-center gap-2 text-lg font-bold text-primary">
                  {formatPrice(parkplatz.preis)}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  Max. {parkplatz.maxParkdauer.toString()} Stunden
                </div>
                <div className="flex gap-2">
                  <Dialog open={editingParkplatz?.id === parkplatz.id} onOpenChange={(open) => !open && resetForm()}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="flex-1 gap-2" onClick={() => startEdit(parkplatz)}>
                        <Edit className="h-4 w-4" />
                        Bearbeiten
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Parkplatz bearbeiten</DialogTitle>
                        <DialogDescription>
                          Aktualisieren Sie die Details Ihres Parkplatzes
                        </DialogDescription>
                      </DialogHeader>
                      {renderParkplatzForm(true)}
                    </DialogContent>
                  </Dialog>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => setShowQRCode(parkplatz)}
                  >
                    <QrCode className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="gap-2"
                    onClick={() => setDeletingParkplatz(parkplatz)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}

      {(otherParkplaetze.length > 0 || (!isAdmin && parkplaetze && parkplaetze.length > 0)) && (
        <>
          {isAdmin && (
            <div className="pt-6">
              <h3 className="text-2xl font-bold">Verfügbare Parkplätze</h3>
              <p className="text-muted-foreground">Parkplätze von anderen Hosts</p>
            </div>
          )}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {(isAdmin ? otherParkplaetze : parkplaetze || []).map((parkplatz) => (
              <Card key={parkplatz.id.toString()}>
                {parkplatz.situationsbild && (
                  <div className="relative h-40 overflow-hidden">
                    <img
                      src={parkplatz.situationsbild.getDirectURL()}
                      alt="Parkplatz"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <MapPin className="h-4 w-4 text-primary" />
                    Parkplatz #{parkplatz.id.toString()}
                  </CardTitle>
                  <button
                    onClick={() => openGoogleMaps(parkplatz.adresse)}
                    className="flex items-center gap-1 text-sm text-primary hover:underline cursor-pointer group"
                  >
                    <span>{parkplatz.adresse}</span>
                    <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground line-clamp-2">{parkplatz.beschreibung}</p>
                  <div className="flex items-center gap-2 text-lg font-bold text-primary">
                    {formatPrice(parkplatz.preis)}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    Max. {parkplatz.maxParkdauer.toString()} Stunden
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {!isAdmin && parkplaetze && parkplaetze.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <MapPin className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">Keine Parkplätze verfügbar</h3>
            <p className="mb-4 text-center text-sm text-muted-foreground">
              Derzeit sind keine Parkplätze verfügbar. Bitte schauen Sie später wieder vorbei.
            </p>
          </CardContent>
        </Card>
      )}

      <Dialog open={!!showQRCode} onOpenChange={(open) => !open && setShowQRCode(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>QR-Code für Check-in</DialogTitle>
            <DialogDescription>
              Scannen Sie diesen QR-Code mit einem Smartphone für schnellen Check-in ohne Registrierung
            </DialogDescription>
          </DialogHeader>
          {showQRCode && (
            <QRCodeDisplay url={showQRCode.qrCodeUrl} parkplatzId={showQRCode.id} />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingParkplatz} onOpenChange={(open) => !open && setDeletingParkplatz(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Parkplatz löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Sind Sie sicher, dass Sie diesen Parkplatz löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleteParkplatz.isPending ? 'Wird gelöscht...' : 'Löschen'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
