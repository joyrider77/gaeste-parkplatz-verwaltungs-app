import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface ReservierungMitName {
    id: bigint;
    status: ReservierungsStatus;
    startZeit: bigint;
    endZeit: bigint;
    gast: Principal;
    name: string;
    parkplatzId: bigint;
    istQrCodeReservierung: boolean;
    zahlungsId?: string;
    bezahlt: boolean;
    kennzeichen?: string;
    fahrzeugmarke?: string;
}
export interface Reservierung {
    id: bigint;
    status: ReservierungsStatus;
    startZeit: bigint;
    endZeit: bigint;
    gast: Principal;
    parkplatzId: bigint;
    istQrCodeReservierung: boolean;
    zahlungsId?: string;
    bezahlt: boolean;
    kennzeichen?: string;
    fahrzeugmarke?: string;
}
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export type Time = bigint;
export interface http_header {
    value: string;
    name: string;
}
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface RSVP {
    name: string;
    inviteCode: string;
    timestamp: Time;
    attending: boolean;
}
export interface UserApprovalInfo {
    status: ApprovalStatus;
    principal: Principal;
}
export interface Parkplatz {
    id: bigint;
    situationsbild?: ExternalBlob;
    host: Principal;
    verfuegbarkeit: Array<Verfuegbarkeit>;
    adresse: string;
    maxParkdauer: bigint;
    qrCodeUrl: string;
    preis: bigint;
    beschreibung: string;
    wochentageVerfuegbarkeit: Array<WochentagVerfuegbarkeit>;
}
export interface ShoppingItem {
    productName: string;
    currency: string;
    quantity: bigint;
    priceInCents: bigint;
    productDescription: string;
}
export interface InviteCode {
    created: Time;
    code: string;
    used: boolean;
}
export interface Verfuegbarkeit {
    istVerfuegbar: boolean;
    datum: bigint;
}
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export interface WochentagVerfuegbarkeit {
    startZeit: bigint;
    endZeit: bigint;
    wochentag: bigint;
}
export type StripeSessionStatus = {
    __kind__: "completed";
    completed: {
        userPrincipal?: string;
        response: string;
    };
} | {
    __kind__: "failed";
    failed: {
        error: string;
    };
};
export interface StripeConfiguration {
    allowedCountries: Array<string>;
    secretKey: string;
}
export interface UserProfile {
    active: boolean;
    name: string;
    role: UserRole;
    email: string;
}
export enum ApprovalStatus {
    pending = "pending",
    approved = "approved",
    rejected = "rejected"
}
export enum ReservierungsStatus {
    eingecheckt = "eingecheckt",
    ausgecheckt = "ausgecheckt",
    reserviert = "reserviert",
    storniert = "storniert"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    alleBenutzer(): Promise<Array<[Principal, UserProfile]>>;
    alleParkplaetze(): Promise<Array<Parkplatz>>;
    alleReservierungen(): Promise<Array<ReservierungMitName>>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    benutzerDeaktivieren(user: Principal): Promise<void>;
    checkIn(reservierungsId: bigint): Promise<void>;
    checkOut(reservierungsId: bigint): Promise<void>;
    createCheckoutSession(items: Array<ShoppingItem>, successUrl: string, cancelUrl: string): Promise<string>;
    generateInviteCode(): Promise<string>;
    getAllRSVPs(): Promise<Array<RSVP>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCurrentTime(): Promise<bigint>;
    getInviteCodes(): Promise<Array<InviteCode>>;
    getStripeConfiguration(): Promise<StripeConfiguration | null>;
    getStripeSessionStatus(sessionId: string): Promise<StripeSessionStatus>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    initializeAccessControl(): Promise<void>;
    isCallerAdmin(): Promise<boolean>;
    isCallerApproved(): Promise<boolean>;
    isStripeConfigured(): Promise<boolean>;
    listApprovals(): Promise<Array<UserApprovalInfo>>;
    markReservationAsPaid(reservierungsId: bigint, zahlungsId: string): Promise<void>;
    meineReservierungen(): Promise<Array<Reservierung>>;
    parkplatzAnlegen(adresse: string, beschreibung: string, preis: bigint, situationsbild: ExternalBlob | null, maxParkdauer: bigint, wochentageVerfuegbarkeit: Array<WochentagVerfuegbarkeit>): Promise<bigint>;
    parkplatzBearbeiten(id: bigint, adresse: string, beschreibung: string, preis: bigint, situationsbild: ExternalBlob | null, maxParkdauer: bigint, wochentageVerfuegbarkeit: Array<WochentagVerfuegbarkeit>): Promise<void>;
    parkplatzLoeschen(id: bigint): Promise<void>;
    qrCheckinOrCheckout(parkplatzId: bigint, kennzeichen: string | null, fahrzeugmarke: string | null): Promise<string>;
    registerWithInvite(name: string, email: string, inviteCode: string): Promise<void>;
    requestApproval(): Promise<void>;
    reservierungAnlegen(parkplatzId: bigint, startZeit: bigint, endZeit: bigint): Promise<bigint>;
    reservierungenFuerHost(): Promise<Array<ReservierungMitName>>;
    rolleZuweisen(user: Principal, rolle: UserRole): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setApproval(user: Principal, status: ApprovalStatus): Promise<void>;
    setStripeConfiguration(config: StripeConfiguration): Promise<void>;
    submitRSVP(name: string, attending: boolean, inviteCode: string): Promise<void>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
    updateReservierungZahlungsstatus(reservierungsId: bigint, zahlungsId: string): Promise<void>;
    validateInviteCode(code: string): Promise<boolean>;
    verfuegbareParkplaetze(datum: bigint): Promise<Array<Parkplatz>>;
}
