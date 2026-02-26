import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle, XCircle, Loader2, MapPin, RefreshCw, Car } from 'lucide-react';
import { useQRCheckinOrCheckout } from '../hooks/useQueries';
import { useActor } from '../hooks/useActor';

export default function QRCheckinPage() {
  const [parkplatzId, setParkplatzId] = useState<bigint | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasAttempted, setHasAttempted] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [kennzeichen, setKennzeichen] = useState('');
  const [fahrzeugmarke, setFahrzeugmarke] = useState('');
  const [formError, setFormError] = useState('');
  const { actor, isFetching: actorFetching } = useActor();
  const qrCheckin = useQRCheckinOrCheckout();

  // Extract parkplatzId from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('parkplatzId');
    
    if (id) {
      try {
        const parsedId = BigInt(id);
        setParkplatzId(parsedId);
      } catch (err) {
        setError('Ungültige Parkplatz-ID im QR-Code');
        setHasAttempted(true);
      }
    } else {
      setError('Keine Parkplatz-ID im QR-Code gefunden');
      setHasAttempted(true);
    }
  }, []);

  // Show form when actor is ready and parkplatzId is set
  useEffect(() => {
    if (parkplatzId !== null && actor && !actorFetching && !hasAttempted && !qrCheckin.isPending && !showForm) {
      setShowForm(true);
    }
  }, [parkplatzId, actor, actorFetching, hasAttempted, qrCheckin.isPending, showForm]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    // Validate form
    if (!kennzeichen.trim()) {
      setFormError('Bitte geben Sie ein Kennzeichen ein');
      return;
    }
    if (!fahrzeugmarke.trim()) {
      setFormError('Bitte geben Sie eine Fahrzeugmarke ein');
      return;
    }

    if (parkplatzId !== null) {
      setHasAttempted(true);
      setShowForm(false);
      
      qrCheckin.mutate(
        { parkplatzId, kennzeichen: kennzeichen.trim(), fahrzeugmarke: fahrzeugmarke.trim() },
        {
          onSuccess: (message) => {
            setResult(message);
            setError(null);
          },
          onError: (err: any) => {
            console.error('QR check-in error:', err);
            const errorMessage = err?.message || 'Ein unbekannter Fehler ist aufgetreten';
            
            // Provide more specific error messages
            if (errorMessage.includes('Actor not available')) {
              setError('Verbindung zum Server fehlgeschlagen. Bitte versuchen Sie es erneut.');
            } else if (errorMessage.includes('Parkplatz nicht gefunden')) {
              setError('Parkplatz nicht gefunden. Bitte überprüfen Sie den QR-Code.');
            } else {
              setError(errorMessage);
            }
          },
        }
      );
    }
  };

  const handleRetry = () => {
    setHasAttempted(false);
    setError(null);
    setResult(null);
    setShowForm(true);
    setKennzeichen('');
    setFahrzeugmarke('');
    setFormError('');
  };

  // Show loading state while actor is initializing
  if (actorFetching && !showForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-16 w-16 text-primary animate-spin mb-4" />
            <h3 className="text-xl font-semibold mb-2">Verbindung wird hergestellt...</h3>
            <p className="text-center text-muted-foreground">
              Bitte warten Sie einen Moment
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show vehicle information form
  if (showForm && parkplatzId !== null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20">
              <Car className="h-10 w-10 text-blue-600 dark:text-blue-400" />
            </div>
            <CardTitle className="text-2xl">Fahrzeuginformationen</CardTitle>
            <CardDescription className="text-base">
              Bitte geben Sie Ihre Fahrzeugdaten ein, um den Check-in abzuschließen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="kennzeichen">Kennzeichen *</Label>
                <Input
                  id="kennzeichen"
                  type="text"
                  placeholder="z.B. ZH 12345"
                  value={kennzeichen}
                  onChange={(e) => setKennzeichen(e.target.value)}
                  className="text-base"
                  autoFocus
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="fahrzeugmarke">Fahrzeugmarke *</Label>
                <Input
                  id="fahrzeugmarke"
                  type="text"
                  placeholder="z.B. BMW, Mercedes, VW"
                  value={fahrzeugmarke}
                  onChange={(e) => setFahrzeugmarke(e.target.value)}
                  className="text-base"
                />
              </div>

              {formError && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <p className="text-sm text-red-600 dark:text-red-400">{formError}</p>
                </div>
              )}

              <div className="bg-muted/50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Parkplatz #{parkplatzId.toString()}</span>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={qrCheckin.isPending}
              >
                {qrCheckin.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Wird verarbeitet...
                  </>
                ) : (
                  'Check-in durchführen'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show processing state
  if (qrCheckin.isPending) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-16 w-16 text-primary animate-spin mb-4" />
            <h3 className="text-xl font-semibold mb-2">Verarbeitung läuft...</h3>
            <p className="text-center text-muted-foreground">
              Bitte warten Sie, während wir Ihre Anfrage bearbeiten
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-red-200 dark:border-red-900">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
              <XCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
            </div>
            <CardTitle className="text-2xl text-red-900 dark:text-red-100">Fehler</CardTitle>
            <CardDescription className="text-red-700 dark:text-red-300 text-base">
              {error}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Bitte überprüfen Sie den QR-Code und versuchen Sie es erneut.
            </p>
            <Button
              variant="default"
              onClick={handleRetry}
              className="w-full"
              disabled={qrCheckin.isPending}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Erneut versuchen
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show success state
  if (result) {
    const isCheckin = result.includes('Check-in erfolgreich');
    
    return (
      <div className={`min-h-screen bg-gradient-to-br ${isCheckin ? 'from-green-50 to-emerald-100' : 'from-blue-50 to-cyan-100'} dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4`}>
        <Card className={`w-full max-w-md ${isCheckin ? 'border-green-200 dark:border-green-900' : 'border-blue-200 dark:border-blue-900'}`}>
          <CardHeader className="text-center">
            <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${isCheckin ? 'bg-green-100 dark:bg-green-900/20' : 'bg-blue-100 dark:bg-blue-900/20'}`}>
              <CheckCircle className={`h-10 w-10 ${isCheckin ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'}`} />
            </div>
            <CardTitle className={`text-2xl ${isCheckin ? 'text-green-900 dark:text-green-100' : 'text-blue-900 dark:text-blue-100'}`}>
              {isCheckin ? 'Check-in erfolgreich!' : 'Check-out erfolgreich!'}
            </CardTitle>
            <CardDescription className={`${isCheckin ? 'text-green-700 dark:text-green-300' : 'text-blue-700 dark:text-blue-300'} text-base`}>
              {result}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Parkplatz #{parkplatzId?.toString()}</span>
              </div>
              {isCheckin && kennzeichen && (
                <div className="flex items-center gap-2 text-sm">
                  <Car className="h-4 w-4 text-muted-foreground" />
                  <span>{fahrzeugmarke} • {kennzeichen}</span>
                </div>
              )}
              {isCheckin && (
                <p className="text-xs text-muted-foreground">
                  Standarddauer: 2 Stunden. Scannen Sie den QR-Code erneut für Check-out.
                </p>
              )}
            </div>
            <div className="text-center text-sm text-muted-foreground">
              <p>
                {isCheckin 
                  ? 'Ihre Reservierung wurde erstellt. Viel Spaß beim Parken!' 
                  : 'Vielen Dank für die Nutzung unseres Parkplatzes!'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fallback state (should not normally be reached)
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-16 w-16 text-muted-foreground animate-spin mb-4" />
          <p className="text-center text-muted-foreground">Initialisierung...</p>
        </CardContent>
      </Card>
    </div>
  );
}
