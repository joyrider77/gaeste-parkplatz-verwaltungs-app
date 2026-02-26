import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { UserProfile, Parkplatz, Reservierung, ReservierungMitName, InviteCode, RSVP, WochentagVerfuegbarkeit, StripeConfiguration, ShoppingItem } from '../backend';
import { UserRole, ReservierungsStatus, ExternalBlob } from '../backend';
import type { Principal } from '@icp-sdk/core/principal';

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useIsCallerAdmin() {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['isAdmin'],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      await actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function useRegisterWithInvite() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; email: string; inviteCode: string }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.registerWithInvite(data.name, data.email, data.inviteCode);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      queryClient.invalidateQueries({ queryKey: ['inviteCodes'] });
      queryClient.invalidateQueries({ queryKey: ['rsvps'] });
    },
  });
}

export function useGetAllBenutzer() {
  const { actor, isFetching } = useActor();

  return useQuery<Array<[Principal, UserProfile]>>({
    queryKey: ['alleBenutzer'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.alleBenutzer();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useRolleZuweisen() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { user: Principal; rolle: UserRole }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.rolleZuweisen(data.user, data.rolle);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alleBenutzer'] });
    },
  });
}

export function useBenutzerDeaktivieren() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (user: Principal) => {
      if (!actor) throw new Error('Actor not available');
      await actor.benutzerDeaktivieren(user);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alleBenutzer'] });
    },
  });
}

export function useGetAllParkplaetze() {
  const { actor, isFetching } = useActor();

  return useQuery<Parkplatz[]>({
    queryKey: ['parkplaetze'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.alleParkplaetze();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateParkplatz() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { 
      adresse: string; 
      beschreibung: string; 
      preis: bigint; 
      situationsbild: ExternalBlob | null;
      maxParkdauer: bigint;
      wochentageVerfuegbarkeit: WochentagVerfuegbarkeit[];
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.parkplatzAnlegen(
        data.adresse, 
        data.beschreibung, 
        data.preis, 
        data.situationsbild,
        data.maxParkdauer,
        data.wochentageVerfuegbarkeit
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parkplaetze'] });
    },
  });
}

export function useUpdateParkplatz() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { 
      id: bigint; 
      adresse: string; 
      beschreibung: string; 
      preis: bigint; 
      situationsbild: ExternalBlob | null;
      maxParkdauer: bigint;
      wochentageVerfuegbarkeit: WochentagVerfuegbarkeit[];
    }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.parkplatzBearbeiten(
        data.id, 
        data.adresse, 
        data.beschreibung, 
        data.preis, 
        data.situationsbild,
        data.maxParkdauer,
        data.wochentageVerfuegbarkeit
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parkplaetze'] });
    },
  });
}

export function useDeleteParkplatz() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not available');
      await actor.parkplatzLoeschen(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parkplaetze'] });
    },
  });
}

export function useGetMeineReservierungen() {
  const { actor, isFetching } = useActor();

  return useQuery<Reservierung[]>({
    queryKey: ['meineReservierungen'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.meineReservierungen();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetReservierungenFuerHost() {
  const { actor, isFetching } = useActor();

  return useQuery<ReservierungMitName[]>({
    queryKey: ['hostReservierungen'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.reservierungenFuerHost();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetAllReservierungen() {
  const { actor, isFetching } = useActor();

  return useQuery<ReservierungMitName[]>({
    queryKey: ['alleReservierungen'],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.alleReservierungen();
      } catch (error) {
        // If user is not admin, return empty array
        console.log('Cannot fetch all reservations (not admin)');
        return [];
      }
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateReservierung() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { parkplatzId: bigint; startZeit: bigint; endZeit: bigint }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.reservierungAnlegen(data.parkplatzId, data.startZeit, data.endZeit);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meineReservierungen'] });
      queryClient.invalidateQueries({ queryKey: ['hostReservierungen'] });
      queryClient.invalidateQueries({ queryKey: ['parkplaetze'] });
      queryClient.invalidateQueries({ queryKey: ['alleReservierungen'] });
    },
  });
}

export function useCheckIn() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reservierungsId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      await actor.checkIn(reservierungsId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meineReservierungen'] });
      queryClient.invalidateQueries({ queryKey: ['hostReservierungen'] });
      queryClient.invalidateQueries({ queryKey: ['alleReservierungen'] });
    },
  });
}

export function useCheckOut() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reservierungsId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      await actor.checkOut(reservierungsId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meineReservierungen'] });
      queryClient.invalidateQueries({ queryKey: ['hostReservierungen'] });
      queryClient.invalidateQueries({ queryKey: ['alleReservierungen'] });
    },
  });
}

export function useGenerateInviteCode() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.generateInviteCode();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inviteCodes'] });
    },
  });
}

export function useGetInviteCodes() {
  const { actor, isFetching } = useActor();

  return useQuery<InviteCode[]>({
    queryKey: ['inviteCodes'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getInviteCodes();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetAllRSVPs() {
  const { actor, isFetching } = useActor();

  return useQuery<RSVP[]>({
    queryKey: ['rsvps'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllRSVPs();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSubmitRSVP() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; attending: boolean; inviteCode: string }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.submitRSVP(data.name, data.attending, data.inviteCode);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rsvps'] });
      queryClient.invalidateQueries({ queryKey: ['inviteCodes'] });
    },
  });
}

export function useValidateInviteCode(code: string) {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['validateInvite', code],
    queryFn: async () => {
      if (!actor || !code) return false;
      try {
        return await actor.validateInviteCode(code);
      } catch (error) {
        console.error('Error validating invite code:', error);
        return false;
      }
    },
    enabled: !!actor && !isFetching && !!code,
    retry: false,
    staleTime: 0,
  });
}

// Stripe integration hooks
export function useIsStripeConfigured() {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['stripeConfigured'],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isStripeConfigured();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetStripeConfiguration() {
  const { actor, isFetching } = useActor();

  return useQuery<StripeConfiguration | null>({
    queryKey: ['stripeConfiguration'],
    queryFn: async () => {
      if (!actor) return null;
      try {
        return await actor.getStripeConfiguration();
      } catch (error) {
        console.log('Cannot fetch Stripe configuration (not admin)');
        return null;
      }
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSetStripeConfiguration() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (config: StripeConfiguration) => {
      if (!actor) throw new Error('Actor not available');
      await actor.setStripeConfiguration(config);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stripeConfigured'] });
      queryClient.invalidateQueries({ queryKey: ['stripeConfiguration'] });
    },
  });
}

export type CheckoutSession = {
  id: string;
  url: string;
};

export function useCreateCheckoutSession() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (data: { items: ShoppingItem[]; successUrl: string; cancelUrl: string }): Promise<CheckoutSession> => {
      if (!actor) throw new Error('Actor not available');
      const result = await actor.createCheckoutSession(data.items, data.successUrl, data.cancelUrl);
      return JSON.parse(result) as CheckoutSession;
    },
  });
}

export function useUpdateReservierungZahlungsstatus() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { reservierungsId: bigint; zahlungsId: string }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.updateReservierungZahlungsstatus(data.reservierungsId, data.zahlungsId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meineReservierungen'] });
      queryClient.invalidateQueries({ queryKey: ['hostReservierungen'] });
      queryClient.invalidateQueries({ queryKey: ['alleReservierungen'] });
    },
  });
}

// QR code check-in/check-out hook with vehicle information support
export function useQRCheckinOrCheckout() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (data: { parkplatzId: bigint; kennzeichen?: string; fahrzeugmarke?: string }): Promise<string> => {
      if (!actor) {
        throw new Error('Actor not available');
      }
      
      try {
        const result = await actor.qrCheckinOrCheckout(
          data.parkplatzId,
          data.kennzeichen || null,
          data.fahrzeugmarke || null
        );
        return result;
      } catch (error: any) {
        // Enhance error messages for better user feedback
        if (error?.message) {
          throw error;
        }
        throw new Error('Verbindung zum Server fehlgeschlagen');
      }
    },
    retry: 2, // Retry up to 2 times on failure
    retryDelay: 1000, // Wait 1 second between retries
  });
}
