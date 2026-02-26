import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CreditCard } from 'lucide-react';
import { useSetStripeConfiguration } from '../hooks/useQueries';
import { toast } from 'sonner';
import type { StripeConfiguration } from '../backend';

interface StripeSetupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function StripeSetupModal({ open, onOpenChange }: StripeSetupModalProps) {
  const [secretKey, setSecretKey] = useState('');
  const [countries, setCountries] = useState('CH,DE,AT');
  const setStripeConfig = useSetStripeConfiguration();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
      toast.success('Stripe erfolgreich konfiguriert!');
      onOpenChange(false);
      setSecretKey('');
      setCountries('CH,DE,AT');
    } catch (error: any) {
      toast.error('Fehler bei der Konfiguration', {
        description: error?.message || 'Bitte versuchen Sie es erneut.',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Stripe Zahlungen konfigurieren
          </DialogTitle>
          <DialogDescription>
            Konfigurieren Sie Stripe, um Zahlungen für Parkplatzreservierungen zu akzeptieren
          </DialogDescription>
        </DialogHeader>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            Sie benötigen einen Stripe Account und einen Secret Key. Besuchen Sie{' '}
            <a
              href="https://stripe.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium underline"
            >
              stripe.com
            </a>{' '}
            um einen Account zu erstellen.
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="secretKey">Stripe Secret Key *</Label>
            <Input
              id="secretKey"
              type="password"
              placeholder="sk_test_..."
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              Ihr Stripe Secret Key (beginnt mit sk_test_ oder sk_live_)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="countries">Erlaubte Länder *</Label>
            <Input
              id="countries"
              type="text"
              placeholder="CH,DE,AT"
              value={countries}
              onChange={(e) => setCountries(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              Ländercodes durch Komma getrennt (z.B. CH, DE, AT, US)
            </p>
          </div>

          <div className="flex gap-2">
            <Button type="submit" className="flex-1" disabled={setStripeConfig.isPending}>
              {setStripeConfig.isPending ? 'Wird gespeichert...' : 'Konfiguration speichern'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={setStripeConfig.isPending}
            >
              Abbrechen
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

