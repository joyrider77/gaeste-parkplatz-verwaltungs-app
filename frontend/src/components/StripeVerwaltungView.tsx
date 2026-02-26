import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CreditCard, Save, CheckCircle2, XCircle } from 'lucide-react';
import { useGetStripeConfiguration, useSetStripeConfiguration } from '../hooks/useQueries';
import { toast } from 'sonner';
import type { StripeConfiguration } from '../backend';

export default function StripeVerwaltungView() {
  const [secretKey, setSecretKey] = useState('');
  const [countries, setCountries] = useState('CH,DE,AT');
  const [isEditing, setIsEditing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const { data: currentConfig, isLoading: configLoading } = useGetStripeConfiguration();
  const setStripeConfig = useSetStripeConfiguration();

  // Load current configuration when available
  useEffect(() => {
    if (currentConfig) {
      setSecretKey(currentConfig.secretKey);
      setCountries(currentConfig.allowedCountries.join(', '));
      setIsEditing(false);
    } else {
      setIsEditing(true);
    }
  }, [currentConfig]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(false);

    if (!secretKey.trim()) {
      toast.error('Bitte geben Sie einen Stripe Secret Key ein');
      return;
    }

    const allowedCountries = countries
      .split(',')
      .map(c => c.trim().toUpperCase())
      .filter(c => c.length === 2);

    if (allowedCountries.length === 0) {
      toast.error('Bitte geben Sie mindestens ein Land ein (z.B. CH, DE, AT)');
      return;
    }

    const config: StripeConfiguration = {
      secretKey: secretKey.trim(),
      allowedCountries,
    };

    try {
      await setStripeConfig.mutateAsync(config);
      toast.success('Stripe-Konfiguration erfolgreich gespeichert!', {
        description: 'Die Zahlungseinstellungen wurden aktualisiert.',
      });
      setSaveSuccess(true);
      setIsEditing(false);
      
      // Reset success indicator after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error: any) {
      toast.error('Fehler beim Speichern der Konfiguration', {
        description: error?.message || 'Bitte versuchen Sie es erneut.',
      });
    }
  };

  const handleCancel = () => {
    if (currentConfig) {
      setSecretKey(currentConfig.secretKey);
      setCountries(currentConfig.allowedCountries.join(', '));
      setIsEditing(false);
    }
  };

  const maskSecretKey = (key: string) => {
    if (key.length <= 8) return key;
    return key.substring(0, 7) + '•'.repeat(Math.min(20, key.length - 7));
  };

  if (configLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Lade Stripe-Konfiguration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <CreditCard className="h-8 w-8 text-primary" />
          Stripe Verwaltung
        </h2>
        <p className="text-muted-foreground mt-2">
          Verwalten Sie Ihre Stripe-Zahlungseinstellungen für Parkplatzreservierungen
        </p>
      </div>

      {saveSuccess && (
        <Alert className="border-green-500/50 bg-green-500/10">
          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription className="text-green-600 dark:text-green-400">
            Konfiguration erfolgreich gespeichert!
          </AlertDescription>
        </Alert>
      )}

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Stripe-Konfiguration
          </CardTitle>
          <CardDescription>
            {currentConfig 
              ? 'Bearbeiten Sie Ihre Stripe-Einstellungen oder aktualisieren Sie den Secret Key'
              : 'Konfigurieren Sie Stripe, um Zahlungen für Parkplatzreservierungen zu akzeptieren'
            }
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {!currentConfig && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                Sie benötigen einen Stripe Account und einen Secret Key. Besuchen Sie{' '}
                <a
                  href="https://stripe.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium underline hover:text-primary"
                >
                  stripe.com
                </a>{' '}
                um einen Account zu erstellen.
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="secretKey" className="text-base font-semibold">
                Stripe Secret Key *
              </Label>
              {isEditing ? (
                <>
                  <Input
                    id="secretKey"
                    type="password"
                    placeholder="sk_test_... oder sk_live_..."
                    value={secretKey}
                    onChange={(e) => setSecretKey(e.target.value)}
                    required
                    className="font-mono"
                  />
                  <p className="text-xs text-muted-foreground">
                    Ihr Stripe Secret Key (beginnt mit sk_test_ oder sk_live_)
                  </p>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <Input
                      value={maskSecretKey(secretKey)}
                      disabled
                      className="font-mono bg-muted"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsEditing(true)}
                    >
                      Bearbeiten
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Secret Key ist konfiguriert und sicher gespeichert
                  </p>
                </>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="countries" className="text-base font-semibold">
                Erlaubte Länder *
              </Label>
              <Input
                id="countries"
                type="text"
                placeholder="CH, DE, AT"
                value={countries}
                onChange={(e) => setCountries(e.target.value)}
                required
                disabled={!isEditing}
                className={!isEditing ? 'bg-muted' : ''}
              />
              <p className="text-xs text-muted-foreground">
                Ländercodes durch Komma getrennt (z.B. CH, DE, AT, US, GB, FR)
              </p>
            </div>

            {isEditing && (
              <div className="flex gap-3 pt-4">
                <Button 
                  type="submit" 
                  className="flex-1 gap-2" 
                  disabled={setStripeConfig.isPending}
                >
                  {setStripeConfig.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Wird gespeichert...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Konfiguration speichern
                    </>
                  )}
                </Button>
                {currentConfig && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={setStripeConfig.isPending}
                    className="gap-2"
                  >
                    <XCircle className="h-4 w-4" />
                    Abbrechen
                  </Button>
                )}
              </div>
            )}
          </form>

          {!isEditing && currentConfig && (
            <div className="pt-4 border-t">
              <Alert className="border-primary/20 bg-primary/5">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <AlertDescription>
                  Stripe ist konfiguriert und einsatzbereit. Zahlungen können für kostenpflichtige Parkplätze akzeptiert werden.
                </AlertDescription>
              </Alert>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-lg border-muted">
        <CardHeader>
          <CardTitle className="text-lg">Informationen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <div className="space-y-2">
            <h4 className="font-semibold text-foreground">Über Stripe-Zahlungen</h4>
            <p>
              Stripe ermöglicht es Ihnen, sichere Online-Zahlungen für kostenpflichtige Parkplatzreservierungen zu akzeptieren. 
              Unterstützt werden Kreditkarten, Debitkarten, Apple Pay und Google Pay.
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold text-foreground">Test- vs. Live-Modus</h4>
            <p>
              Verwenden Sie einen <code className="px-1.5 py-0.5 rounded bg-muted font-mono text-xs">sk_test_</code> Key für Testzahlungen 
              und einen <code className="px-1.5 py-0.5 rounded bg-muted font-mono text-xs">sk_live_</code> Key für echte Transaktionen.
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold text-foreground">Sicherheit</h4>
            <p>
              Ihr Secret Key wird sicher im Backend gespeichert und niemals an Dritte weitergegeben. 
              Teilen Sie Ihren Secret Key niemals öffentlich.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
