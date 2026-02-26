import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Car, List, Home, Users, CreditCard } from 'lucide-react';
import type { UserProfile } from '../backend';
import ParkplaetzeView from '../components/ParkplaetzeView';
import ReservierungenView from '../components/ReservierungenView';
import BenutzerverwaltungView from '../components/BenutzerverwaltungView';
import StripeVerwaltungView from '../components/StripeVerwaltungView';
import PaymentSuccessPage from '../components/PaymentSuccessPage';
import PaymentCancelPage from '../components/PaymentCancelPage';
import HomePage from './HomePage';
import { useIsCallerAdmin } from '../hooks/useQueries';

interface DashboardProps {
  userProfile: UserProfile;
}

export default function Dashboard({ userProfile }: DashboardProps) {
  const [activeTab, setActiveTab] = useState('home');
  const { data: isAdmin } = useIsCallerAdmin();

  // Check for payment status in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get('payment');

    if (paymentStatus === 'success') {
      setActiveTab('payment-success');
    } else if (paymentStatus === 'cancel') {
      setActiveTab('payment-cancel');
    }
  }, []);

  return (
    <div className="container py-8">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-5' : 'grid-cols-3'} lg:w-auto lg:inline-grid`}>
          <TabsTrigger value="home" className="gap-2">
            <Home className="h-4 w-4" />
            <span className="hidden sm:inline">Startseite</span>
          </TabsTrigger>
          <TabsTrigger value="parkplaetze" className="gap-2">
            <Car className="h-4 w-4" />
            <span className="hidden sm:inline">Parkplätze</span>
          </TabsTrigger>
          <TabsTrigger value="reservierungen" className="gap-2">
            <List className="h-4 w-4" />
            <span className="hidden sm:inline">Reservierungen</span>
          </TabsTrigger>
          {isAdmin && (
            <>
              <TabsTrigger value="benutzerverwaltung" className="gap-2">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Benutzer</span>
              </TabsTrigger>
              <TabsTrigger value="stripe" className="gap-2">
                <CreditCard className="h-4 w-4" />
                <span className="hidden sm:inline">Stripe</span>
              </TabsTrigger>
            </>
          )}
        </TabsList>

        <TabsContent value="home" className="space-y-4">
          <HomePage userProfile={userProfile} onNavigate={setActiveTab} isAdmin={isAdmin || false} />
        </TabsContent>

        <TabsContent value="parkplaetze" className="space-y-4">
          <ParkplaetzeView />
        </TabsContent>

        <TabsContent value="reservierungen" className="space-y-4">
          <ReservierungenView />
        </TabsContent>

        {isAdmin && (
          <>
            <TabsContent value="benutzerverwaltung" className="space-y-4">
              <BenutzerverwaltungView />
            </TabsContent>

            <TabsContent value="stripe" className="space-y-4">
              <StripeVerwaltungView />
            </TabsContent>
          </>
        )}

        <TabsContent value="payment-success" className="space-y-4">
          <PaymentSuccessPage onNavigate={setActiveTab} />
        </TabsContent>

        <TabsContent value="payment-cancel" className="space-y-4">
          <PaymentCancelPage onNavigate={setActiveTab} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
