import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { XCircle, ArrowLeft } from 'lucide-react';

interface PaymentCancelPageProps {
  onNavigate: (tab: string) => void;
}

export default function PaymentCancelPage({ onNavigate }: PaymentCancelPageProps) {
  useEffect(() => {
    // Clear URL parameters
    window.history.replaceState({}, '', window.location.pathname);
  }, []);

  return (
    <div className="container max-w-2xl py-12">
      <Card className="border-orange-200 dark:border-orange-800">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900">
            <XCircle className="h-12 w-12 text-orange-600 dark:text-orange-400" />
          </div>
          <CardTitle className="text-3xl text-orange-600 dark:text-orange-400">
            Zahlung abgebrochen
          </CardTitle>
          <CardDescription className="text-base mt-2">
            Ihre Zahlung wurde abgebrochen. Die Reservierung wurde nicht bestätigt.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg bg-muted p-4 space-y-2">
            <p className="text-sm text-muted-foreground">
              Keine Sorge, es wurden keine Gebühren erhoben.
            </p>
            <p className="text-sm text-muted-foreground">
              Sie können jederzeit eine neue Reservierung erstellen und den Zahlungsvorgang erneut durchführen.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              size="lg"
              className="w-full gap-2"
              onClick={() => onNavigate('reservierungen')}
            >
              <ArrowLeft className="h-4 w-4" />
              Zurück zu Reservierungen
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full"
              onClick={() => onNavigate('home')}
            >
              Zur Startseite
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

