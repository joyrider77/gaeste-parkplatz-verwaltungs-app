import { useEffect, useState } from 'react';
import { useUpdateReservierungZahlungsstatus } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

interface PaymentSuccessPageProps {
  onNavigate: (tab: string) => void;
}

export default function PaymentSuccessPage({ onNavigate }: PaymentSuccessPageProps) {
  const [processed, setProcessed] = useState(false);
  const updatePaymentStatus = useUpdateReservierungZahlungsstatus();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reservationId = params.get('reservationId');
    const sessionId = params.get('session_id');

    if (reservationId && sessionId && !processed) {
      setProcessed(true);
      
      // Update payment status
      updatePaymentStatus.mutate(
        {
          reservierungsId: BigInt(reservationId),
          zahlungsId: sessionId,
        },
        {
          onSuccess: () => {
            toast.success('Zahlung erfolgreich!', {
              description: 'Ihre Reservierung wurde bestätigt.',
            });
            // Clear URL parameters
            window.history.replaceState({}, '', window.location.pathname);
          },
          onError: (error: any) => {
            console.error('Payment status update error:', error);
            toast.error('Fehler bei der Zahlungsbestätigung', {
              description: 'Bitte kontaktieren Sie den Support.',
            });
          },
        }
      );
    }
  }, [processed, updatePaymentStatus]);

  return (
    <div className="container max-w-2xl py-12">
      <Card className="border-green-200 dark:border-green-800">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
            <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-3xl text-green-600 dark:text-green-400">
            Zahlung erfolgreich!
          </CardTitle>
          <CardDescription className="text-base mt-2">
            Ihre Parkplatzreservierung wurde erfolgreich bezahlt und bestätigt
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg bg-muted p-4 space-y-2">
            <p className="text-sm text-muted-foreground">
              Sie erhalten in Kürze eine Bestätigungs-E-Mail mit allen Details zu Ihrer Reservierung.
            </p>
            <p className="text-sm text-muted-foreground">
              Sie können Ihre Reservierung jederzeit in der Reservierungsübersicht einsehen.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              size="lg"
              className="w-full gap-2"
              onClick={() => onNavigate('reservierungen')}
            >
              Zu meinen Reservierungen
              <ArrowRight className="h-4 w-4" />
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

