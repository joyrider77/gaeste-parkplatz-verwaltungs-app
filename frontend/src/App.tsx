import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile } from './hooks/useQueries';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import Header from './components/Header';
import Footer from './components/Footer';
import ProfileSetupModal from './components/ProfileSetupModal';
import Dashboard from './pages/Dashboard';
import LoginPage from './pages/LoginPage';
import InvitePage from './pages/InvitePage';
import QRCheckinPage from './pages/QRCheckinPage';
import { useEffect, useState } from 'react';

export default function App() {
  const { identity, isInitializing } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [inviteAccepted, setInviteAccepted] = useState(false);
  const [isQRCheckin, setIsQRCheckin] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    
    // Check if this is a QR check-in page
    if (params.has('parkplatzId')) {
      setIsQRCheckin(true);
      return;
    }
    
    const code = params.get('invite');
    if (code) {
      setInviteCode(code);
      sessionStorage.setItem('pendingInviteCode', code);
    } else {
      const pending = sessionStorage.getItem('pendingInviteCode');
      if (pending) {
        setInviteCode(pending);
      }
    }
  }, []);

  // QR check-in page doesn't require authentication
  if (isQRCheckin) {
    return (
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <QRCheckinPage />
        <Toaster />
      </ThemeProvider>
    );
  }

  const isAuthenticated = !!identity;
  const showProfileSetup = isAuthenticated && !profileLoading && isFetched && userProfile === null;

  if (isInitializing || (isAuthenticated && profileLoading)) {
    return (
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="text-center">
            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
            <p className="text-muted-foreground">Lädt...</p>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  if (inviteCode && !isAuthenticated && !inviteAccepted) {
    return (
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <InvitePage inviteCode={inviteCode} onAccepted={() => setInviteAccepted(true)} />
        <Toaster />
      </ThemeProvider>
    );
  }

  if (!isAuthenticated) {
    return (
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <LoginPage />
        <Toaster />
      </ThemeProvider>
    );
  }

  if (isAuthenticated && inviteCode && userProfile) {
    sessionStorage.removeItem('pendingInviteCode');
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <main className="flex-1">
          {showProfileSetup ? (
            <ProfileSetupModal 
              inviteCode={inviteCode} 
              onComplete={() => {
                sessionStorage.removeItem('pendingInviteCode');
                setInviteCode(null);
              }}
            />
          ) : (
            <Dashboard userProfile={userProfile!} />
          )}
        </main>
        <Footer />
      </div>
      <Toaster />
    </ThemeProvider>
  );
}
