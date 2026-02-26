import { useState } from 'react';
import { useRegisterWithInvite } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Info } from 'lucide-react';
import { toast } from 'sonner';

interface ProfileSetupModalProps {
  inviteCode: string | null;
  onComplete: () => void;
}

export default function ProfileSetupModal({ inviteCode, onComplete }: ProfileSetupModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const registerWithInvite = useRegisterWithInvite();

  const handleSubmit = async (e: React.FormEvent) => {
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
      // Use a placeholder invite code if none provided (for first user)
      const codeToUse = inviteCode || 'FIRST_USER_REGISTRATION';
      
      await registerWithInvite.mutateAsync({
        name: name.trim(),
        email: email.trim(),
        inviteCode: codeToUse,
      });
      
      toast.success('Profil erfolgreich erstellt!', {
        description: 'Willkommen bei der ParkPlatz Verwaltungs-App',
      });
      onComplete();
    } catch (error: any) {
      console.error('Registration error:', error);
      const errorMessage = error?.message || 'Fehler beim Erstellen des Profils';
      
      if (errorMessage.includes('bereits registriert')) {
        setError('Sie sind bereits registriert. Bitte laden Sie die Seite neu.');
      } else if (errorMessage.includes('Ungültiger Einladungscode')) {
        setError('Der Einladungscode ist ungültig. Bitte verwenden Sie einen gültigen Einladungslink.');
      } else if (errorMessage.includes('bereits verwendet')) {
        setError('Dieser Einladungscode wurde bereits verwendet. Bitte fordern Sie einen neuen an.');
      } else {
        setError(errorMessage);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle>Willkommen bei ParkPlatz!</CardTitle>
          <CardDescription>
            Bitte vervollständigen Sie Ihr Profil, um fortzufahren.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {!inviteCode && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Sie sind der erste Benutzer und werden automatisch als Administrator registriert.
                </AlertDescription>
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

            {inviteCode && (
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">
                  Einladungscode: <span className="font-mono">{inviteCode.substring(0, 8)}...</span>
                </p>
              </div>
            )}
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={registerWithInvite.isPending}
            >
              {registerWithInvite.isPending ? 'Wird registriert...' : 'Profil erstellen'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
