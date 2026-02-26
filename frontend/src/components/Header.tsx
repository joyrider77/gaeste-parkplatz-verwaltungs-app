import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Car, LogOut, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useGetCallerUserProfile } from '../hooks/useQueries';

export default function Header() {
  const { clear, identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const { theme, setTheme } = useTheme();
  const { data: userProfile } = useGetCallerUserProfile();

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/70">
            <Car className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">ParkPlatz</h1>
            <p className="text-xs text-muted-foreground">Verwaltung</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {userProfile && (
            <div className="hidden sm:block text-right mr-2">
              <p className="text-sm font-medium">{userProfile.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{userProfile.role}</p>
            </div>
          )}
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Theme umschalten</span>
          </Button>

          {identity && (
            <Button variant="outline" onClick={handleLogout} className="gap-2">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Abmelden</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
