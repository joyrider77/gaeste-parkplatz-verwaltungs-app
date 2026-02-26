import { useState } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useValidateInviteCode, useRegisterWithInvite } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Car, CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

interface InvitePageProps {
  inviteCode: string;
  onAccepted: () => void;
}

export default function InvitePage({ inviteCode, onAccepted }: InvitePageProps) {
  const { login, isLoggingIn, identity } = useInternetIdentity();
  const { data: isValid, isLoading: validating } = useValidateInviteCode(inviteCode);
  const registerWithInvite = useRegisterWithInvite();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'validate' | 'login' | 'register'>('validate');

  const isAuthenticated = !!identity;

  const handleAcceptInvite = async () => {
    if (!isValid) {
      setError('Dieser Einladungscode ist ungültig oder wurde bereits verwendet.');
      return;
    }

    try {
      setError(null);
      onAccepted();
      setStep('login');
      await login();
      // After successful login, move to registration step
      setStep('register');
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Fehler bei der Anmeldung. Bitte versuchen Sie es erneut.');
      setStep('validate');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !email.trim()) {
      setError('Bitte füllen Sie alle Felder aus');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Bitte geben Sie eine gültige E-Mail-Adresse ein');
      return;
    }

    try {
      await registerWithInvite.mutateAsync({
        name: name.trim(),
        email: email.trim(),
        inviteCode: inviteCode,
      });
      
      toast.success('Registrierung erfolgreich!', {
        description: 'Willkommen bei der ParkPlatz Verwaltungs-App',
      });
      
      // Reload to show the main app
      window.location.href = '/';
    } catch (error: any) {
      console.error('Registration error:', error);
      const errorMessage = error?.message || 'Fehler bei der Registrierung';
      
      if (errorMessage.includes('bereits registriert')) {
        setError('Sie sind bereits registriert. Die Seite wird neu geladen...');
        setTimeout(() => window.location.href = '/', 2000);
      } else if (errorMessage.includes('Ungültiger Einladungscode')) {
        setError('Der Einladungscode ist ungültig. Bitte verwenden Sie einen gültigen Einladungslink.');
      } else if (errorMessage.includes('bereits verwendet')) {
        setError('Dieser Einladungscode wurde bereits verwendet. Bitte fordern Sie einen neuen an.');
      } else {
        setError(errorMessage);
      }
    }
  };

  if (validating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Einladung wird überprüft...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container flex min-h-screen flex-col items-center justify-center py-12">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[450px]">
          <div className="flex flex-col space-y-4 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/70 shadow-lg">
              <Car className="h-10 w-10 text-primary-foreground" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight">Einladung zur ParkPlatz App</h1>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {isValid ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    {step === 'register' ? 'Registrierung abschließen' : 'Gültige Einladung'}
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-destructive" />
                    Ungültige Einladung
                  </>
                )}
              </CardTitle>
              <CardDescription>
                {isValid
                  ? step === 'register'
                    ? 'Bitte geben Sie Ihre Daten ein, um die Registrierung abzuschließen.'
                    : 'Sie wurden eingeladen, der ParkPlatz Verwaltungs-App beizutreten.'
                  : 'Dieser Einladungslink ist ungültig oder wurde bereits verwendet.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isValid ? (
                <>
                  {step === 'register' && isAuthenticated ? (
                    <form onSubmit={handleRegister} className="space-y-4">
                      {error && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>{error}</AlertDescription>
                        </Alert>
                      )}

                      <div className="space-y-2">
                        <Label htmlFor="name">Name *</Label>
                        <Input
                          id="name"
                          type="text"
                          placeholder="Ihr vollständiger Name"
                          value={name}
                          onChange={(e) => {
                            setName(e.target.value);
                            setError(null);
                          }}
                          required
                          disabled={registerWithInvite.isPending}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">E-Mail *</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="ihre@email.de"
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            setError(null);
                          }}
                          required
                          disabled={registerWithInvite.isPending}
                        />
                      </div>

                      <div className="rounded-lg bg-muted/50 p-3">
                        <p className="text-xs text-muted-foreground">
                          Einladungscode: <span className="font-mono">{inviteCode.substring(0, 8)}...</span>
                        </p>
                      </div>

                      <Button
                        type="submit"
                        size="lg"
                        disabled={registerWithInvite.isPending}
                        className="w-full gap-2"
                      >
                        {registerWithInvite.isPending ? (
                          <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Registrierung läuft...
                          </>
                        ) : (
                          'Registrierung abschließen'
                        )}
                      </Button>
                    </form>
                  ) : (
                    <>
                      <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
                        <p className="text-sm font-medium">Mit dieser Einladung können Sie:</p>
                        <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                          <li>Parkplätze verwalten und anbieten</li>
                          <li>Parkplätze reservieren</li>
                          <li>Check-in und Check-out durchführen</li>
                        </ul>
                      </div>

                      {error && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>{error}</AlertDescription>
                        </Alert>
                      )}

                      <Button
                        size="lg"
                        onClick={handleAcceptInvite}
                        disabled={isLoggingIn}
                        className="w-full gap-2"
                      >
                        {isLoggingIn ? (
                          <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Anmeldung läuft...
                          </>
                        ) : (
                          'Einladung annehmen und anmelden'
                        )}
                      </Button>

                      <p className="text-xs text-center text-muted-foreground">
                        Nach der Anmeldung werden Sie aufgefordert, Ihre Daten einzugeben.
                      </p>
                    </>
                  )}
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground mb-4">
                    Bitte kontaktieren Sie einen Administrator für eine neue Einladung.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => window.location.href = '/'}
                  >
                    Zur Startseite
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
