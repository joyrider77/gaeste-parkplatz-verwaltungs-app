import AccessControl "authorization/access-control";
import InviteLinksModule "invite-links/invite-links-module";
import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";
import Stripe "stripe/stripe";
import OutCall "http-outcalls/outcall";
import Principal "mo:base/Principal";
import OrderedMap "mo:base/OrderedMap";
import Debug "mo:base/Debug";
import Text "mo:base/Text";
import List "mo:base/List";
import Iter "mo:base/Iter";
import Int "mo:base/Int";
import Random "mo:base/Random";
import Time "mo:base/Time";
import Nat "mo:base/Nat";
import UserApproval "user-approval/approval";

persistent actor ParkplatzVerwaltung {
  let accessControlState = AccessControl.initState();
  let inviteState = InviteLinksModule.initState();
  let storage = Storage.new();
  include MixinStorage(storage);

  var isSystemInitialized = false;

  let approvalState = UserApproval.initState(accessControlState);

  public query ({ caller }) func isCallerApproved() : async Bool {
    AccessControl.hasPermission(accessControlState, caller, #admin) or UserApproval.isApproved(approvalState, caller);
  };

  public shared ({ caller }) func requestApproval() : async () {
    UserApproval.requestApproval(approvalState, caller);
  };

  public shared ({ caller }) func setApproval(user : Principal, status : UserApproval.ApprovalStatus) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can perform this action");
    };
    UserApproval.setApproval(approvalState, user, status);
  };

  public query ({ caller }) func listApprovals() : async [UserApproval.UserApprovalInfo] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can perform this action");
    };
    UserApproval.listApprovals(approvalState);
  };

  public shared ({ caller }) func initializeAccessControl() : async () {
    AccessControl.initialize(accessControlState, caller);
  };

  public query ({ caller }) func getCallerUserRole() : async AccessControl.UserRole {
    AccessControl.getUserRole(accessControlState, caller);
  };

  public shared ({ caller }) func assignCallerUserRole(user : Principal, role : AccessControl.UserRole) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can assign roles");
    };
    AccessControl.assignRole(accessControlState, caller, user, role);
  };

  public query ({ caller }) func isCallerAdmin() : async Bool {
    AccessControl.isAdmin(accessControlState, caller);
  };

  public type UserProfile = {
    name : Text;
    email : Text;
    role : AccessControl.UserRole;
    active : Bool;
  };

  transient let principalMap = OrderedMap.Make<Principal>(Principal.compare);
  var userProfiles = principalMap.empty<UserProfile>();

  private func countUsers() : Nat {
    var count = 0;
    for (_ in principalMap.entries(userProfiles)) {
      count += 1;
    };
    count;
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can view profiles");
    };
    principalMap.get(userProfiles, caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Debug.trap("Unauthorized: Can only view your own profile");
    };
    principalMap.get(userProfiles, user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles := principalMap.put(userProfiles, caller, profile);
  };

  public query ({ caller }) func alleBenutzer() : async [(Principal, UserProfile)] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can view all users");
    };
    Iter.toArray(principalMap.entries(userProfiles));
  };

  public shared ({ caller }) func rolleZuweisen(user : Principal, rolle : AccessControl.UserRole) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can assign roles");
    };

    switch (principalMap.get(userProfiles, user)) {
      case (null) { Debug.trap("Benutzer nicht gefunden") };
      case (?profile) {
        let updatedProfile : UserProfile = {
          name = profile.name;
          email = profile.email;
          role = rolle;
          active = profile.active;
        };
        userProfiles := principalMap.put(userProfiles, user, updatedProfile);
        AccessControl.assignRole(accessControlState, caller, user, rolle);
      };
    };
  };

  public shared ({ caller }) func benutzerDeaktivieren(user : Principal) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can deactivate users");
    };

    switch (principalMap.get(userProfiles, user)) {
      case (null) { Debug.trap("Benutzer nicht gefunden") };
      case (?profile) {
        let updatedProfile : UserProfile = {
          name = profile.name;
          email = profile.email;
          role = profile.role;
          active = false;
        };
        userProfiles := principalMap.put(userProfiles, user, updatedProfile);
      };
    };
  };

  public type Parkplatz = {
    id : Nat;
    host : Principal;
    adresse : Text;
    beschreibung : Text;
    preis : Nat;
    verfuegbarkeit : [Verfuegbarkeit];
    situationsbild : ?Storage.ExternalBlob;
    maxParkdauer : Nat;
    wochentageVerfuegbarkeit : [WochentagVerfuegbarkeit];
    qrCodeUrl : Text;
  };

  public type Verfuegbarkeit = {
    datum : Int;
    istVerfuegbar : Bool;
  };

  public type WochentagVerfuegbarkeit = {
    wochentag : Nat;
    startZeit : Nat;
    endZeit : Nat;
  };

  public type Reservierung = {
    id : Nat;
    parkplatzId : Nat;
    gast : Principal;
    startZeit : Int;
    endZeit : Int;
    status : ReservierungsStatus;
    bezahlt : Bool;
    zahlungsId : ?Text;
    istQrCodeReservierung : Bool;
    kennzeichen : ?Text;
    fahrzeugmarke : ?Text;
  };

  public type ReservierungsStatus = {
    #reserviert;
    #eingecheckt;
    #ausgecheckt;
    #storniert;
  };

  public type ReservierungMitName = {
    id : Nat;
    parkplatzId : Nat;
    gast : Principal;
    startZeit : Int;
    endZeit : Int;
    status : ReservierungsStatus;
    bezahlt : Bool;
    zahlungsId : ?Text;
    name : Text;
    istQrCodeReservierung : Bool;
    kennzeichen : ?Text;
    fahrzeugmarke : ?Text;
  };

  transient let natMap = OrderedMap.Make<Nat>(Nat.compare);
  var parkplaetze = natMap.empty<Parkplatz>();
  var reservierungen = natMap.empty<Reservierung>();
  var nextParkplatzId = 0;
  var nextReservierungsId = 0;

  public shared ({ caller }) func parkplatzAnlegen(adresse : Text, beschreibung : Text, preis : Nat, situationsbild : ?Storage.ExternalBlob, maxParkdauer : Nat, wochentageVerfuegbarkeit : [WochentagVerfuegbarkeit]) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can create parking spots");
    };

    let qrCodeUrl = "https://quiet-bronze-ji1-draft.caffeine.xyz/qr-checkin?parkplatzId=" # Nat.toText(nextParkplatzId);

    let parkplatz : Parkplatz = {
      id = nextParkplatzId;
      host = caller;
      adresse;
      beschreibung;
      preis;
      verfuegbarkeit = [];
      situationsbild;
      maxParkdauer;
      wochentageVerfuegbarkeit;
      qrCodeUrl;
    };

    parkplaetze := natMap.put(parkplaetze, nextParkplatzId, parkplatz);
    nextParkplatzId += 1;
    parkplatz.id;
  };

  public shared ({ caller }) func parkplatzBearbeiten(id : Nat, adresse : Text, beschreibung : Text, preis : Nat, situationsbild : ?Storage.ExternalBlob, maxParkdauer : Nat, wochentageVerfuegbarkeit : [WochentagVerfuegbarkeit]) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can edit parking spots");
    };

    switch (natMap.get(parkplaetze, id)) {
      case (null) { Debug.trap("Parkplatz nicht gefunden") };
      case (?parkplatz) {
        let updatedParkplatz : Parkplatz = {
          id;
          host = parkplatz.host;
          adresse;
          beschreibung;
          preis;
          verfuegbarkeit = parkplatz.verfuegbarkeit;
          situationsbild;
          maxParkdauer;
          wochentageVerfuegbarkeit;
          qrCodeUrl = parkplatz.qrCodeUrl;
        };

        parkplaetze := natMap.put(parkplaetze, id, updatedParkplatz);
      };
    };
  };

  public shared ({ caller }) func parkplatzLoeschen(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can delete parking spots");
    };

    switch (natMap.get(parkplaetze, id)) {
      case (null) { Debug.trap("Parkplatz nicht gefunden") };
      case (?_) {
        parkplaetze := natMap.delete(parkplaetze, id);
      };
    };
  };

  public query ({ caller }) func alleParkplaetze() : async [Parkplatz] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #guest))) {
      Debug.trap("Unauthorized: Only authenticated users can view parking spots");
    };
    Iter.toArray(natMap.vals(parkplaetze));
  };

  public query ({ caller }) func verfuegbareParkplaetze(datum : Int) : async [Parkplatz] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #guest))) {
      Debug.trap("Unauthorized: Only authenticated users can view available parking spots");
    };

    var verfuegbare = List.nil<Parkplatz>();

    for (parkplatz in natMap.vals(parkplaetze)) {
      let istVerfuegbar = switch (List.find<Verfuegbarkeit>(List.fromArray(parkplatz.verfuegbarkeit), func(v) { v.datum == datum })) {
        case (null) { true };
        case (?verf) { verf.istVerfuegbar };
      };

      if (istVerfuegbar) {
        verfuegbare := List.push(parkplatz, verfuegbare);
      };
    };

    List.toArray(verfuegbare);
  };

  public shared ({ caller }) func reservierungAnlegen(parkplatzId : Nat, startZeit : Int, endZeit : Int) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only authenticated users can create reservations");
    };

    switch (natMap.get(parkplaetze, parkplatzId)) {
      case (null) { Debug.trap("Parkplatz nicht gefunden") };
      case (?parkplatz) {
        if (parkplatz.host == caller) {
          Debug.trap("Hosts cannot reserve their own parking spots");
        };

        for (reservierung in natMap.vals(reservierungen)) {
          if (reservierung.parkplatzId == parkplatzId and reservierung.status != #storniert) {
            if ((startZeit < reservierung.endZeit) and (endZeit > reservierung.startZeit)) {
              Debug.trap("Dieser Parkplatz ist im gewählten Zeitraum bereits reserviert.");
            };
          };
        };

        let reservierung : Reservierung = {
          id = nextReservierungsId;
          parkplatzId;
          gast = caller;
          startZeit;
          endZeit;
          status = #reserviert;
          bezahlt = false;
          zahlungsId = null;
          istQrCodeReservierung = false;
          kennzeichen = null;
          fahrzeugmarke = null;
        };

        reservierungen := natMap.put(reservierungen, nextReservierungsId, reservierung);
        nextReservierungsId += 1;
        reservierung.id;
      };
    };
  };

  public shared ({ caller }) func checkIn(reservierungsId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only authenticated users can check in");
    };

    switch (natMap.get(reservierungen, reservierungsId)) {
      case (null) { Debug.trap("Reservierung nicht gefunden") };
      case (?reservierung) {
        if (reservierung.gast != caller) {
          Debug.trap("Unauthorized: Only the guest can check in");
        };

        let updatedReservierung : Reservierung = {
          id = reservierung.id;
          parkplatzId = reservierung.parkplatzId;
          gast = reservierung.gast;
          startZeit = reservierung.startZeit;
          endZeit = reservierung.endZeit;
          status = #eingecheckt;
          bezahlt = reservierung.bezahlt;
          zahlungsId = reservierung.zahlungsId;
          istQrCodeReservierung = reservierung.istQrCodeReservierung;
          kennzeichen = reservierung.kennzeichen;
          fahrzeugmarke = reservierung.fahrzeugmarke;
        };

        reservierungen := natMap.put(reservierungen, reservierungsId, updatedReservierung);
      };
    };
  };

  public shared ({ caller }) func checkOut(reservierungsId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only authenticated users can check out");
    };

    switch (natMap.get(reservierungen, reservierungsId)) {
      case (null) { Debug.trap("Reservierung nicht gefunden") };
      case (?reservierung) {
        if (reservierung.gast != caller) {
          Debug.trap("Unauthorized: Only the guest can check out");
        };

        let updatedReservierung : Reservierung = {
          id = reservierung.id;
          parkplatzId = reservierung.parkplatzId;
          gast = reservierung.gast;
          startZeit = reservierung.startZeit;
          endZeit = reservierung.endZeit;
          status = #ausgecheckt;
          bezahlt = reservierung.bezahlt;
          zahlungsId = reservierung.zahlungsId;
          istQrCodeReservierung = reservierung.istQrCodeReservierung;
          kennzeichen = reservierung.kennzeichen;
          fahrzeugmarke = reservierung.fahrzeugmarke;
        };

        reservierungen := natMap.put(reservierungen, reservierungsId, updatedReservierung);
      };
    };
  };

  public query ({ caller }) func alleReservierungen() : async [ReservierungMitName] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can view all reservations");
    };

    var reservierungenMitNamen = List.nil<ReservierungMitName>();

    for (reservierung in natMap.vals(reservierungen)) {
      let name = if (reservierung.istQrCodeReservierung) {
        "QR-Code Check-in";
      } else {
        switch (principalMap.get(userProfiles, reservierung.gast)) {
          case (null) { "Unbekannt" };
          case (?profile) { profile.name };
        };
      };

      let reservierungMitName : ReservierungMitName = {
        id = reservierung.id;
        parkplatzId = reservierung.parkplatzId;
        gast = reservierung.gast;
        startZeit = reservierung.startZeit;
        endZeit = reservierung.endZeit;
        status = reservierung.status;
        bezahlt = reservierung.bezahlt;
        zahlungsId = reservierung.zahlungsId;
        name;
        istQrCodeReservierung = reservierung.istQrCodeReservierung;
        kennzeichen = reservierung.kennzeichen;
        fahrzeugmarke = reservierung.fahrzeugmarke;
      };

      reservierungenMitNamen := List.push(reservierungMitName, reservierungenMitNamen);
    };

    List.toArray(reservierungenMitNamen);
  };

  public query ({ caller }) func meineReservierungen() : async [Reservierung] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only authenticated users can view their reservations");
    };

    var meine = List.nil<Reservierung>();

    for (reservierung in natMap.vals(reservierungen)) {
      if (reservierung.gast == caller) {
        meine := List.push(reservierung, meine);
      };
    };

    List.toArray(meine);
  };

  public query ({ caller }) func reservierungenFuerHost() : async [ReservierungMitName] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only authenticated users can view host reservations");
    };

    var hostReservierungen = List.nil<ReservierungMitName>();

    for (reservierung in natMap.vals(reservierungen)) {
      switch (natMap.get(parkplaetze, reservierung.parkplatzId)) {
        case (null) {};
        case (?parkplatz) {
          if (parkplatz.host == caller) {
            let name = if (reservierung.istQrCodeReservierung) {
              "QR-Code Check-in";
            } else {
              switch (principalMap.get(userProfiles, reservierung.gast)) {
                case (null) { "Unbekannt" };
                case (?profile) { profile.name };
              };
            };

            let reservierungMitName : ReservierungMitName = {
              id = reservierung.id;
              parkplatzId = reservierung.parkplatzId;
              gast = reservierung.gast;
              startZeit = reservierung.startZeit;
              endZeit = reservierung.endZeit;
              status = reservierung.status;
              bezahlt = reservierung.bezahlt;
              zahlungsId = reservierung.zahlungsId;
              name;
              istQrCodeReservierung = reservierung.istQrCodeReservierung;
              kennzeichen = reservierung.kennzeichen;
              fahrzeugmarke = reservierung.fahrzeugmarke;
            };

            hostReservierungen := List.push(reservierungMitName, hostReservierungen);
          };
        };
      };
    };

    List.toArray(hostReservierungen);
  };

  public shared ({ caller }) func generateInviteCode() : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can generate invite codes");
    };
    let blob = await Random.blob();
    let code = InviteLinksModule.generateUUID(blob);
    InviteLinksModule.generateInviteCode(inviteState, code);
    code;
  };

  public shared func submitRSVP(name : Text, attending : Bool, inviteCode : Text) : async () {
    InviteLinksModule.submitRSVP(inviteState, name, attending, inviteCode);
  };

  public query ({ caller }) func getAllRSVPs() : async [InviteLinksModule.RSVP] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can view RSVPs");
    };
    InviteLinksModule.getAllRSVPs(inviteState);
  };

  public query ({ caller }) func getInviteCodes() : async [InviteLinksModule.InviteCode] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can view invite codes");
    };
    InviteLinksModule.getInviteCodes(inviteState);
  };

  public query func validateInviteCode(code : Text) : async Bool {
    let inviteCodes = InviteLinksModule.getInviteCodes(inviteState);
    switch (List.find<InviteLinksModule.InviteCode>(List.fromArray(inviteCodes), func(invite) { invite.code == code })) {
      case (null) { false };
      case (?invite) { not invite.used };
    };
  };

  public shared ({ caller }) func registerWithInvite(name : Text, email : Text, inviteCode : Text) : async () {
    if (Principal.isAnonymous(caller)) {
      Debug.trap("Unauthorized: Anonymous users cannot register");
    };

    switch (principalMap.get(userProfiles, caller)) {
      case (?_) { Debug.trap("Benutzer ist bereits registriert") };
      case (null) {
        let userCount = countUsers();
        let isFirstUser = userCount == 0;

        if (not isFirstUser) {
          let inviteCodes = InviteLinksModule.getInviteCodes(inviteState);
          switch (List.find<InviteLinksModule.InviteCode>(List.fromArray(inviteCodes), func(invite) { invite.code == inviteCode })) {
            case (null) { Debug.trap("Ungültiger Einladungscode") };
            case (?invite) {
              if (invite.used) {
                Debug.trap("Einladungscode wurde bereits verwendet");
              };
            };
          };
        };

        let assignedRole : AccessControl.UserRole = if (isFirstUser) { #admin } else { #user };

        let profile : UserProfile = {
          name;
          email;
          role = assignedRole;
          active = true;
        };

        userProfiles := principalMap.put(userProfiles, caller, profile);

        if (isFirstUser) {
          AccessControl.initialize(accessControlState, caller);
          isSystemInitialized := true;
        } else {
          InviteLinksModule.submitRSVP(inviteState, name, true, inviteCode);
        };
      };
    };
  };

  public query func getCurrentTime() : async Int {
    Time.now();
  };

  var stripeConfiguration : ?Stripe.StripeConfiguration = null;

  public query ({ caller }) func getStripeConfiguration() : async ?Stripe.StripeConfiguration {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can view Stripe configuration");
    };
    stripeConfiguration;
  };

  public query ({ caller }) func isStripeConfigured() : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only authenticated users can check Stripe configuration status");
    };
    stripeConfiguration != null;
  };

  public shared ({ caller }) func setStripeConfiguration(config : Stripe.StripeConfiguration) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can configure Stripe");
    };
    stripeConfiguration := ?config;
  };

  private func getStripeConfigurationInternal() : Stripe.StripeConfiguration {
    switch (stripeConfiguration) {
      case (null) Debug.trap("Stripe needs to be first configured");
      case (?value) value;
    };
  };

  public query func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  public shared ({ caller }) func getStripeSessionStatus(sessionId : Text) : async Stripe.StripeSessionStatus {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only authenticated users can query session status");
    };
    await Stripe.getSessionStatus(getStripeConfigurationInternal(), sessionId, transform);
  };

  public shared ({ caller }) func createCheckoutSession(items : [Stripe.ShoppingItem], successUrl : Text, cancelUrl : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only authenticated users can create checkout sessions");
    };

    await Stripe.createCheckoutSession(getStripeConfigurationInternal(), caller, items, successUrl, cancelUrl, transform);
  };

  public shared ({ caller }) func updateReservierungZahlungsstatus(reservierungsId : Nat, zahlungsId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can update payment status");
    };

    switch (natMap.get(reservierungen, reservierungsId)) {
      case (null) { Debug.trap("Reservierung nicht gefunden") };
      case (?reservierung) {
        let updatedReservierung : Reservierung = {
          id = reservierung.id;
          parkplatzId = reservierung.parkplatzId;
          gast = reservierung.gast;
          startZeit = reservierung.startZeit;
          endZeit = reservierung.endZeit;
          status = reservierung.status;
          bezahlt = true;
          zahlungsId = ?zahlungsId;
          istQrCodeReservierung = reservierung.istQrCodeReservierung;
          kennzeichen = reservierung.kennzeichen;
          fahrzeugmarke = reservierung.fahrzeugmarke;
        };

        reservierungen := natMap.put(reservierungen, reservierungsId, updatedReservierung);
      };
    };
  };

  public shared ({ caller }) func markReservationAsPaid(reservierungsId : Nat, zahlungsId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Unauthorized: Only admins can manually mark reservations as paid");
    };

    switch (natMap.get(reservierungen, reservierungsId)) {
      case (null) { Debug.trap("Reservierung nicht gefunden") };
      case (?reservierung) {
        let updatedReservierung : Reservierung = {
          id = reservierung.id;
          parkplatzId = reservierung.parkplatzId;
          gast = reservierung.gast;
          startZeit = reservierung.startZeit;
          endZeit = reservierung.endZeit;
          status = reservierung.status;
          bezahlt = true;
          zahlungsId = ?zahlungsId;
          istQrCodeReservierung = reservierung.istQrCodeReservierung;
          kennzeichen = reservierung.kennzeichen;
          fahrzeugmarke = reservierung.fahrzeugmarke;
        };

        reservierungen := natMap.put(reservierungen, reservierungsId, updatedReservierung);
      };
    };
  };

  public shared func qrCheckinOrCheckout(parkplatzId : Nat, kennzeichen : ?Text, fahrzeugmarke : ?Text) : async Text {
    switch (natMap.get(parkplaetze, parkplatzId)) {
      case (null) { Debug.trap("Parkplatz nicht gefunden") };
      case (?parkplatz) {
        let currentTime = Time.now();
        let twoHoursInNanos = 2 * 60 * 60 * 1_000_000_000;

        let activeReservation = List.find<Reservierung>(
          List.fromArray(Iter.toArray(natMap.vals(reservierungen))),
          func(res) {
            res.parkplatzId == parkplatzId and res.istQrCodeReservierung and res.status == #eingecheckt
          },
        );

        switch (activeReservation) {
          case (null) {
            let newReservation : Reservierung = {
              id = nextReservierungsId;
              parkplatzId;
              gast = Principal.fromText("2vxsx-fae");
              startZeit = currentTime;
              endZeit = currentTime + twoHoursInNanos;
              status = #eingecheckt;
              bezahlt = false;
              zahlungsId = null;
              istQrCodeReservierung = true;
              kennzeichen;
              fahrzeugmarke;
            };

            reservierungen := natMap.put(reservierungen, nextReservierungsId, newReservation);
            nextReservierungsId += 1;

            "Check-in erfolgreich für Parkplatz " # Nat.toText(parkplatzId) # ". Reservierung ID: " # Nat.toText(newReservation.id);
          };
          case (?existingReservation) {
            let updatedReservation : Reservierung = {
              id = existingReservation.id;
              parkplatzId = existingReservation.parkplatzId;
              gast = existingReservation.gast;
              startZeit = existingReservation.startZeit;
              endZeit = existingReservation.endZeit;
              status = #ausgecheckt;
              bezahlt = existingReservation.bezahlt;
              zahlungsId = existingReservation.zahlungsId;
              istQrCodeReservierung = existingReservation.istQrCodeReservierung;
              kennzeichen = existingReservation.kennzeichen;
              fahrzeugmarke = existingReservation.fahrzeugmarke;
            };

            reservierungen := natMap.put(reservierungen, existingReservation.id, updatedReservation);

            "Check-out erfolgreich für Parkplatz " # Nat.toText(parkplatzId) # ". Reservierung ID: " # Nat.toText(existingReservation.id);
          };
        };
      };
    };
  };
};
