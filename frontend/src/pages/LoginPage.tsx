import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Button } from '@/components/ui/button';
import { LogIn, Car, Calendar, Users, Shield, CheckCircle, CreditCard } from 'lucide-react';

export default function LoginPage() {
  const { login, isLoggingIn } = useInternetIdentity();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container flex min-h-screen flex-col items-center justify-center py-12 px-4">
        <div className="mx-auto flex w-full flex-col justify-center space-y-10 sm:w-[650px]">
          {/* Hero Section with Background Image */}
          <div className="relative rounded-3xl overflow-hidden shadow-2xl">
            <div 
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: "url('/assets/generated/parking-lot-hero.dim_800x600.jpg')" }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/95 via-primary/80 to-primary/60 backdrop-blur-[1px]"></div>
            </div>
            <div className="relative p-12 md:p-16 text-center space-y-6">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white drop-shadow-2xl">
                Parkplatz-Verwaltungs-App
              </h1>
              <p className="text-lg md:text-xl text-white/95 max-w-md mx-auto drop-shadow-lg font-medium">
                Intuitive Parkplatzverwaltung für Gäste und Parkplatzanbieter
              </p>
            </div>
          </div>

          {/* Features Section */}
          <div className="space-y-6 animate-fade-in-up" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
            <h2 className="text-2xl font-bold text-center text-foreground">
              Hauptfunktionen
            </h2>
            
            <div className="grid gap-4 md:grid-cols-2">
              {/* Parkplatzverwaltung */}
              <div className="flex gap-4 p-4 rounded-xl bg-card border border-border shadow-md hover:shadow-lg transition-all duration-300">
                <div className="shrink-0">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Car className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold text-foreground">Parkplatzverwaltung</h3>
                  <p className="text-sm text-muted-foreground">
                    Admins können Parkplätze erstellen, bearbeiten und löschen mit Bildern und Details
                  </p>
                </div>
              </div>

              {/* Reservierungskalender */}
              <div className="flex gap-4 p-4 rounded-xl bg-card border border-border shadow-md hover:shadow-lg transition-all duration-300">
                <div className="shrink-0">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Calendar className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold text-foreground">Farbkodierter Kalender</h3>
                  <p className="text-sm text-muted-foreground">
                    Übersichtliche Reservierungen: Grün (reserviert), Blau (eingecheckt), Grau (ausgecheckt), Rot (storniert)
                  </p>
                </div>
              </div>

              {/* Check-in/Check-out */}
              <div className="flex gap-4 p-4 rounded-xl bg-card border border-border shadow-md hover:shadow-lg transition-all duration-300">
                <div className="shrink-0">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <CheckCircle className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold text-foreground">Check-in & Check-out</h3>
                  <p className="text-sm text-muted-foreground">
                    Einfache Verwaltung von Ankunft und Abfahrt mit Echtzeit-Statusaktualisierungen
                  </p>
                </div>
              </div>

              {/* Einladungsbasierte Zugriffskontrolle */}
              <div className="flex gap-4 p-4 rounded-xl bg-card border border-border shadow-md hover:shadow-lg transition-all duration-300">
                <div className="shrink-0">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold text-foreground">Sichere Zugriffskontrolle</h3>
                  <p className="text-sm text-muted-foreground">
                    Einladungsbasierte Registrierung für kontrollierten und sicheren Zugang
                  </p>
                </div>
              </div>

              {/* Stripe Zahlungen */}
              <div className="flex gap-4 p-4 rounded-xl bg-card border border-border shadow-md hover:shadow-lg transition-all duration-300">
                <div className="shrink-0">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <CreditCard className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold text-foreground">Sichere Zahlungen</h3>
                  <p className="text-sm text-muted-foreground">
                    Stripe-Integration für sichere Zahlungen mit Kreditkarte, Apple Pay und Google Pay
                  </p>
                </div>
              </div>

              {/* Benutzerverwaltung */}
              <div className="flex gap-4 p-4 rounded-xl bg-card border border-border shadow-md hover:shadow-lg transition-all duration-300">
                <div className="shrink-0">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold text-foreground">Admin-Benutzerverwaltung</h3>
                  <p className="text-sm text-muted-foreground">
                    Vollständige Kontrolle über Benutzerrollen, Einladungsgenerierung und Zugriffsverwaltung
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Animated Icons Section */}
          <div className="flex items-center justify-center gap-8 py-4">
            <div className="animate-fade-in-up" style={{ animationDelay: '0.3s', animationFillMode: 'both' }}>
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-500">
                <img 
                  src="/assets/generated/car-icon-improved.dim_64x64.png" 
                  alt="Auto" 
                  className="h-12 w-12 drop-shadow-md" 
                />
              </div>
            </div>
            <div className="animate-fade-in-up" style={{ animationDelay: '0.4s', animationFillMode: 'both' }}>
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-500">
                <img 
                  src="/assets/generated/calendar-icon-transparent.dim_64x64.png" 
                  alt="Kalender" 
                  className="h-12 w-12 drop-shadow-md" 
                />
              </div>
            </div>
            <div className="animate-fade-in-up" style={{ animationDelay: '0.5s', animationFillMode: 'both' }}>
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-500">
                <img 
                  src="/assets/generated/user-management-icon.dim_64x64.png" 
                  alt="Benutzerverwaltung" 
                  className="h-12 w-12 drop-shadow-md" 
                />
              </div>
            </div>
          </div>

          {/* Login Button */}
          <div className="space-y-4 animate-fade-in-up" style={{ animationDelay: '0.6s', animationFillMode: 'both' }}>
            <Button
              size="lg"
              onClick={login}
              disabled={isLoggingIn}
              className="w-full gap-3 text-lg h-14 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary font-semibold"
            >
              {isLoggingIn ? (
                <>
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Anmeldung läuft...
                </>
              ) : (
                <>
                  <LogIn className="h-5 w-5" />
                  Mit Internet Identity anmelden
                </>
              )}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Durch die Anmeldung stimmen Sie unseren Nutzungsbedingungen zu
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
