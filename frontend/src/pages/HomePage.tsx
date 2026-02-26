import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, User, Mail, CheckCircle, CreditCard } from 'lucide-react';
import type { UserProfile } from '../backend';

interface HomePageProps {
  userProfile: UserProfile;
  onNavigate: (tab: string) => void;
  isAdmin: boolean;
}

export default function HomePage({ userProfile, onNavigate, isAdmin }: HomePageProps) {
  return (
    <div className="space-y-8">
      {/* Hero Section with Background Image */}
      <div className="relative rounded-3xl overflow-hidden shadow-2xl">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/assets/generated/parking-lot-hero.dim_800x600.jpg')" }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/95 via-primary/80 to-primary/60 backdrop-blur-[1px]"></div>
        </div>
        <div className="relative p-10 md:p-20 text-center space-y-6">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-white/20 backdrop-blur-md mb-6 shadow-xl">
            <img 
              src="/assets/generated/car-icon-transparent.dim_64x64.png" 
              alt="Auto" 
              className="h-14 w-14 drop-shadow-lg" 
            />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-white drop-shadow-2xl">
            ParkPlatz Verwaltung
          </h1>
          <p className="text-xl md:text-2xl text-white/95 max-w-2xl mx-auto drop-shadow-lg font-medium">
            Verwalten Sie Ihre Parkplätze oder reservieren Sie einen Stellplatz
          </p>
        </div>
      </div>

      {/* Main Action Cards */}
      <div className={`grid gap-6 ${isAdmin ? 'md:grid-cols-2 lg:grid-cols-4' : 'md:grid-cols-2'}`}>
        {isAdmin && (
          <Card 
            className="group relative overflow-hidden hover:shadow-2xl transition-all duration-500 cursor-pointer border-0 bg-gradient-to-br from-primary/10 via-primary/5 to-background"
            onClick={() => onNavigate('parkplaetze')}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardHeader className="relative pb-4">
              <div className="flex items-center justify-between mb-6">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 group-hover:from-primary/30 group-hover:to-primary/20 transition-all duration-500 group-hover:scale-110 shadow-lg group-hover:shadow-xl">
                  <img 
                    src="/assets/generated/car-icon-transparent.dim_64x64.png" 
                    alt="Auto" 
                    className="h-12 w-12 group-hover:scale-110 transition-transform duration-500" 
                  />
                </div>
                <ArrowRight className="h-7 w-7 text-muted-foreground group-hover:text-primary group-hover:translate-x-2 transition-all duration-500" />
              </div>
              <CardTitle className="text-2xl group-hover:text-primary transition-colors duration-300">
                Parkplätze verwalten
              </CardTitle>
              <CardDescription className="text-sm mt-3 leading-relaxed">
                Fügen Sie Parkplätze hinzu und verwalten Sie deren Verfügbarkeit
              </CardDescription>
            </CardHeader>
            <CardContent className="relative">
              <Button 
                variant="outline" 
                className="w-full gap-2 h-11 text-sm font-semibold group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all duration-300 shadow-sm group-hover:shadow-md"
              >
                Zu Parkplätzen
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
              </Button>
            </CardContent>
          </Card>
        )}

        <Card 
          className="group relative overflow-hidden hover:shadow-2xl transition-all duration-500 cursor-pointer border-0 bg-gradient-to-br from-primary/10 via-primary/5 to-background"
          onClick={() => onNavigate('reservierungen')}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <CardHeader className="relative pb-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 group-hover:from-primary/30 group-hover:to-primary/20 transition-all duration-500 group-hover:scale-110 shadow-lg group-hover:shadow-xl">
                <img 
                  src="/assets/generated/calendar-icon-transparent.dim_64x64.png" 
                  alt="Kalender" 
                  className="h-12 w-12 group-hover:scale-110 transition-transform duration-500" 
                />
              </div>
              <ArrowRight className="h-7 w-7 text-muted-foreground group-hover:text-primary group-hover:translate-x-2 transition-all duration-500" />
            </div>
            <CardTitle className="text-2xl group-hover:text-primary transition-colors duration-300">
              Reservierungen
            </CardTitle>
            <CardDescription className="text-sm mt-3 leading-relaxed">
              Buchen Sie verfügbare Parkplätze für Ihre gewünschte Zeit
            </CardDescription>
          </CardHeader>
          <CardContent className="relative">
            <Button 
              variant="outline" 
              className="w-full gap-2 h-11 text-sm font-semibold group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all duration-300 shadow-sm group-hover:shadow-md"
            >
              Zu Reservierungen
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
            </Button>
          </CardContent>
        </Card>

        {isAdmin && (
          <>
            <Card 
              className="group relative overflow-hidden hover:shadow-2xl transition-all duration-500 cursor-pointer border-0 bg-gradient-to-br from-primary/10 via-primary/5 to-background"
              onClick={() => onNavigate('benutzerverwaltung')}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardHeader className="relative pb-4">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 group-hover:from-primary/30 group-hover:to-primary/20 transition-all duration-500 group-hover:scale-110 shadow-lg group-hover:shadow-xl">
                    <img 
                      src="/assets/generated/user-management-icon.dim_64x64.png" 
                      alt="Benutzerverwaltung" 
                      className="h-12 w-12 group-hover:scale-110 transition-transform duration-500" 
                    />
                  </div>
                  <ArrowRight className="h-7 w-7 text-muted-foreground group-hover:text-primary group-hover:translate-x-2 transition-all duration-500" />
                </div>
                <CardTitle className="text-2xl group-hover:text-primary transition-colors duration-300">
                  Benutzerverwaltung
                </CardTitle>
                <CardDescription className="text-sm mt-3 leading-relaxed">
                  Verwalten Sie Benutzerrollen und Zugriffsrechte
                </CardDescription>
              </CardHeader>
              <CardContent className="relative">
                <Button 
                  variant="outline" 
                  className="w-full gap-2 h-11 text-sm font-semibold group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all duration-300 shadow-sm group-hover:shadow-md"
                >
                  Zu Benutzerverwaltung
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                </Button>
              </CardContent>
            </Card>

            <Card 
              className="group relative overflow-hidden hover:shadow-2xl transition-all duration-500 cursor-pointer border-0 bg-gradient-to-br from-primary/10 via-primary/5 to-background"
              onClick={() => onNavigate('stripe')}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardHeader className="relative pb-4">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 group-hover:from-primary/30 group-hover:to-primary/20 transition-all duration-500 group-hover:scale-110 shadow-lg group-hover:shadow-xl">
                    <CreditCard className="h-12 w-12 text-primary group-hover:scale-110 transition-transform duration-500" />
                  </div>
                  <ArrowRight className="h-7 w-7 text-muted-foreground group-hover:text-primary group-hover:translate-x-2 transition-all duration-500" />
                </div>
                <CardTitle className="text-2xl group-hover:text-primary transition-colors duration-300">
                  Stripe Verwaltung
                </CardTitle>
                <CardDescription className="text-sm mt-3 leading-relaxed">
                  Konfigurieren Sie Zahlungseinstellungen für Reservierungen
                </CardDescription>
              </CardHeader>
              <CardContent className="relative">
                <Button 
                  variant="outline" 
                  className="w-full gap-2 h-11 text-sm font-semibold group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all duration-300 shadow-sm group-hover:shadow-md"
                >
                  Zu Stripe Verwaltung
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                </Button>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* User Profile Overview */}
      <Card className="bg-gradient-to-br from-primary/5 via-primary/3 to-background border-primary/20 shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <User className="h-6 w-6 text-primary" />
            Schnellübersicht
          </CardTitle>
          <CardDescription className="text-base">
            Ihre wichtigsten Informationen auf einen Blick
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="flex items-center gap-4 p-5 rounded-xl bg-background/80 backdrop-blur-sm border-2 hover:border-primary/30 hover:shadow-md transition-all duration-300 group">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors shadow-sm">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Name</p>
              <p className="font-bold text-lg">{userProfile.name}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 p-5 rounded-xl bg-background/80 backdrop-blur-sm border-2 hover:border-primary/30 hover:shadow-md transition-all duration-300 group">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors shadow-sm">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-muted-foreground font-medium">E-Mail</p>
              <p className="font-bold text-sm truncate">{userProfile.email}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 p-5 rounded-xl bg-background/80 backdrop-blur-sm border-2 hover:border-primary/30 hover:shadow-md transition-all duration-300 group">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/10 group-hover:bg-green-500/20 transition-colors shadow-sm">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Status</p>
              <p className="font-bold text-lg text-green-600 dark:text-green-400">Aktiv</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
