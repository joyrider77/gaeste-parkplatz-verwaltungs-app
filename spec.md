# Gäste Parkplatz Verwaltungs App

## Überblick
Eine Parkplatz-Verwaltungsanwendung, die es Hosts ermöglicht, ihre Parkplätze zu verwalten und Gästen erlaubt, diese zu reservieren und zu nutzen. Die App verfügt über ein einladungsbasiertes Zugriffssystem, eine zentrale Dashboard-Startseite, ein Admin-Benutzerverwaltungssystem, eine integrierte Stripe-Zahlungsabwicklung für kostenpflichtige Reservierungen und ein QR-Code-System für schnelle Check-ins ohne Registrierung.

## Zugriffssystem
- Einladungsbasierte Registrierung: Nur Benutzer mit gültigen Einladungslinks können sich registrieren
- **Erste Benutzer-Initialisierung**: Der erste Benutzer, der sich über `registerWithInvite` registriert, wird automatisch zum Admin und initialisiert das System
- **Bootstrap-Registrierung**: Wenn noch keine Benutzer existieren, erfolgt die erste Registrierung ohne vorherige Admin-Einrichtung
- Einladungslinks enthalten eindeutige Token oder Codes
- Einladungsseite für neue Benutzer zur Profileinrichtung mit Name und E-Mail-Eingabe
- Einladungslinks müssen vor der Kontoerstellung oder dem Zugriff akzeptiert werden
- Internet Identity Login ist nur für gültige Einladungen aktiviert
- Einladungscodes werden von Admins generiert und als verwendet markiert, sobald sich ein Benutzer erfolgreich über den Einladungslink registriert
- Klare Benutzerfeedback für ungültige oder bereits verwendete Einladungen
- Authentifizierungsablauf ist vollständig an das einladungsbasierte Zugangsmodell angepasst
- Vollständiger Registrierungsablauf über `registerWithInvite` Backend-Methode
- **Robuste Fehlerbehandlung**: Umfassende Validierung und Fehlerbehandlung für alle Registrierungsschritte
- **Konsistente Zustandsverwaltung**: Zuverlässige Synchronisation zwischen Frontend- und Backend-Zuständen

## QR-Code-System für anonyme Check-ins
- **QR-Code-Generierung**: Jeder Parkplatz erhält einen eindeutigen QR-Code mit einer spezifischen URL im Format `https://quiet-bronze-ji1-draft.caffeine.xyz/qr-checkin?parkplatzId=<id>`
- **Anonymer Zugriff**: QR-Code-URLs funktionieren ohne Benutzerregistrierung oder Authentifizierung
- **Robuste Frontend-Backend-Verbindung**: QRCheckinPage.tsx extrahiert korrekt den `parkplatzId` Parameter aus der URL und verbindet sich zuverlässig mit dem Backend-Canister-Actor
- **Verbesserte Fehlerbehandlung**: Implementierung von Retry-Logik und umfassender Fehlerbehandlung für Actor-Verbindungsprobleme
- **Klare Statusanzeige**: Deutliche Anzeige von Erfolgs- und Fehlerzuständen auf der QR-Check-in-Seite
- **Fahrzeuginformationen-Erfassung**: Beim ersten Scannen des QR-Codes wird ein Formular angezeigt, das die Eingabe von Kennzeichen und Fahrzeugmarke erfordert
- **Automatische Reservierungserstellung**: Nach Eingabe der Fahrzeugdaten wird automatisch eine Reservierung erstellt mit:
  - Status "#eingecheckt"
  - Startzeit auf aktuelle Systemzeit gesetzt
  - Standarddauer von 2 Stunden
  - Gespeicherte Fahrzeuginformationen (Kennzeichen und Marke)
- **Check-out-Funktionalität**: Beim zweiten Scannen desselben QR-Codes wird der Reservierungsstatus von "#eingecheckt" auf "#ausgecheckt" geändert
- **QR-Code-Anzeige**: Admins können QR-Codes für jeden Parkplatz in der Parkplatzverwaltung anzeigen und ausdrucken
- **Zuverlässige Actor-Initialisierung**: Korrekte Initialisierung des Backend-Actors ohne Authentifizierung für anonyme QR-Code-Zugriffe

## Benutzerrollen

### Admin
- Vollzugriff auf alle Benutzerverwaltungsfunktionen
- Kann alle registrierten Benutzer einsehen
- Kann Benutzerrollen zwischen Admin, User und Guest ändern
- Kann Benutzer deaktivieren
- Kann Einladungscodes über "Benutzer einladen"-Funktion generieren
- Zugriff auf spezielle Benutzerverwaltungs-Registerkarte im Dashboard
- Kann alle generierten Einladungen in der "Einladungen"-Sektion einsehen mit Erstellungszeit und Verwendungsstatus
- **Exklusiver Zugriff auf Parkplatzverwaltung**: Nur Admins können Parkplätze erstellen, bearbeiten und löschen
- **Erweiterte Reservierungsansicht**: Admins sehen bei allen Reservierungen den Namen des Reservierenden und Fahrzeuginformationen
- **Zahlungsübersicht**: Admins können den Zahlungsstatus aller Reservierungen im Dashboard einsehen
- **QR-Code-Verwaltung**: Admins können QR-Codes für Parkplätze anzeigen und verwalten
- **Stripe-Konfigurationsverwaltung**: Nur Admins können Stripe-Einstellungen (Secret Key und erlaubte Länder) einsehen, bearbeiten und speichern

### Host
- Kann verfügbare Parkplätze durchsuchen und ansehen
- Parkplätze für bestimmte Zeiträume reservieren
- Übersicht über alle Reservierungen erhalten
- Benachrichtigungen über neue Buchungen
- Check-in und Check-out durchführen
- **Zahlungsabwicklung**: Muss kostenpflichtige Reservierungen über Stripe bezahlen

### Gast
- Verfügbare Parkplätze durchsuchen und ansehen
- Parkplätze für bestimmte Zeiträume reservieren
- Check-in und Check-out durchführen
- **Zahlungsabwicklung**: Muss kostenpflichtige Reservierungen über Stripe bezahlen

## Hauptfunktionen

### Einladungsseite
- Validierung des Einladungscodes beim Zugriff auf den Einladungslink
- Eingabefelder für Name und E-Mail-Adresse bei gültigen Einladungen
- **Erste Benutzer-Behandlung**: Registrierung über `registerWithInvite` Backend-Methode funktioniert auch für den ersten Benutzer ohne vorherige Admin-Einrichtung
- Internet Identity Login nur für gültige Einladungen aktiviert
- Klare Fehlermeldungen für ungültige oder bereits verwendete Einladungen
- Weiterleitung zur Profileinrichtung nach erfolgreicher Registrierung
- **Korrekte Rolleninitialisierung**: Frontend behandelt erste Benutzerregistrierung ohne Fehler bei der Rollenzuweisung
- **Verbesserte Benutzerführung**: Klare Anweisungen und Feedback während des gesamten Registrierungsprozesses
- Deutsche Benutzeroberfläche

### Anmeldeseite
- Gradient Hero-Bereich mit Parkplatz-Hintergrundbild für visuellen Eindruck
- Große Überschrift zur Einführung der Parkplatz-Verwaltungs-App
- **Aktualisierte Inhalte mit Hauptfunktionen**: Hervorhebung der Kernfunktionen der App:
  - Parkplatzverwaltung (nur für Admins) mit Erstellung, Bearbeitung und Löschung von Parkplätzen
  - Reservierungsübersicht mit farbkodiertem Kalender (grün für reserviert, blau für eingecheckt, grau für ausgecheckt, rot für storniert)
  - Einladungsbasierte Zugriffskontrolle für sichere Benutzerverwaltung
  - Admin-Benutzerverwaltung mit Rollenzuweisung und Einladungsgenerierung
  - Sichere Zahlungsabwicklung über Stripe für kostenpflichtige Parkplätze
  - QR-Code-System für schnelle Check-ins ohne Registrierung
- **Visuelle Feature-Darstellung**: Verwendung der vorhandenen Icons (Auto-, Kalender-, Check-in-, Check-out-, Benutzerverwaltungs-Symbole) mit kurzen, prägnanten Erklärungstexten zu jeder Kernfunktion
- **Konsistente Icon-Darstellung**: Alle Icons haben einheitliche Größe, Schatten, Abrundung und Ausrichtung für visuell harmonisches Erscheinungsbild
- Animierte Icons mit Fade-in-Animationen für dynamische Darstellung
- Moderner Internet Identity Login-Button mit abgerundeten Kanten, Schatten, Hover-Animation und klarem Farbkontrast
- Responsive Layout mit konsistenter Ausrichtung zur Startseite
- Verwendung derselben Schriftarten, Abstände und Gradient-Palette wie die Startseite
- Deutsche Benutzeroberfläche
- Funktionalität bleibt unverändert - Internet Identity Login bei Klick
- **Aktualisierter Haupttitel**: "Intuitive Parkplatzverwaltung für Gäste und Parkplatzanbieter"

### Startseite (Dashboard)
- Zentrale Übersichtsseite mit visuell ansprechendem Layout und Hero-Banner
- Hero-Bereich mit Parkplatz-Hintergrundbild für visuellen Eindruck
- Moderne, schattenbasierte Navigationskarten mit Gradienteneffekten für Hauptfunktionen
- Hauptkarten: "Parkplätze verwalten" (nur für Admins sichtbar), "Reservierungen", "Benutzerverwaltung" (nur für Admins sichtbar) und "Stripe Verwaltung" (nur für Admins sichtbar)
- Verwendung der bereitgestellten Icons (Auto-, Kalender-, Check-in- und Check-out-Symbole) für intuitive Navigation
- **Konsistente Icon-Darstellung**: Alle Icons haben einheitliche Größe, Schatten, Abrundung und Ausrichtung für visuell harmonisches Erscheinungsbild
- Sanfte Übergänge und Hover-Effekte für interaktive Elemente
- Optimierte Layout-Abstände und Ausrichtung für mobile und Desktop-Ansichten
- Sauberes, modernes Design mit verbesserter visueller Hierarchie
- Zusammenfassung der wichtigsten App-Funktionen
- Rollenbasierte UI-Anzeige: Nicht-Admin-Benutzer sehen keine Parkplatzverwaltungs-Optionen
- **Verbesserte Navigation**: Optimierte Benutzerführung zwischen verschiedenen Funktionsbereichen

### Benutzerverwaltung (nur für Admins)
- Spezielle Registerkarte "Benutzerverwaltung" im Dashboard nur für Admin-Benutzer sichtbar
- Tabellenansicht aller registrierten Benutzer mit Name, E-Mail und aktueller Rolle
- Dropdown-Menüs oder Buttons zur Rollenänderung zwischen Admin, User und Guest
- Deaktivieren-Button für jeden Benutzer
- "Benutzer einladen"-Funktion mit Einladungscode-Generierung über `generateInviteCode` Backend-Methode
- Anzeige des generierten Einladungscodes mit Copy-to-Clipboard-Funktionalität
- Optionale Bereitstellung eines direkten Einladungslinks (z.B. `https://quiet-bronze-ji1-draft.caffeine.xyz/invite?code=XYZ`)
- Neue "Einladungen"-Sektion zur Verfolgung aller generierten Einladungscodes
- Anzeige von Erstellungszeit und Verwendungsstatus für jeden Einladungscode
- Bestätigungsdialoge für Rollenänderungen und Benutzerdeaktivierung
- Konsistentes Design mit modernen Karten, Icons und Gradient-Buttons
- Zugriffskontrolle: Nur Admin-Benutzer können diese Funktionen nutzen
- **Verbesserte Datenvalidierung**: Robuste Validierung aller Benutzereingaben und Aktionen

### Stripe-Verwaltung (nur für Admins)
- **Admin-only Stripe-Konfigurationsseite**: Neue Registerkarte "Stripe Verwaltung" im Admin-Dashboard
- **Stripe-Einstellungsformular**: Verwendung der bestehenden `StripeSetupModal.tsx` Komponente für konsistente UI/UX
- **Konfigurationsfelder**: Anzeige, Bearbeitung und Speicherung von:
  - Stripe Secret Key (sicher maskiert in der Anzeige)
  - Erlaubte Länder für Zahlungen
- **Backend-Integration**: 
  - Aufruf von `setStripeConfiguration` zum Speichern der Einstellungen
  - Abruf aktueller Einstellungen über `isStripeConfigured`
- **Benutzerrückmeldung**: Erfolgs- oder Fehlermeldungen nach dem Speichern mit visueller Bestätigung der Aktualisierung
- **Zugriffskontrolle**: Nur Benutzer mit Admin-Rolle können auf die Stripe-Konfiguration zugreifen oder diese ändern
- Deutsche Benutzeroberfläche mit klaren Beschriftungen und Anweisungen

### Parkplatzverwaltung (nur für Admins)
- **Nur Admins** können Parkplätze mit Details wie Adresse, Beschreibung und Preis erstellen
- **Erweiterte Parkplatz-Erstellung**: Formular enthält zusätzliche Felder für:
  - **Maximale Parkdauer** (in Stunden)
  - **Wochentag-Verfügbarkeit** mit erlaubten Zeitbereichen pro Wochentag (z.B. Montag–Freitag 07:00–22:00)
- Upload-Funktion für Situationsbilder beim Erstellen oder Bearbeiten von Parkplätzen (nur für Admins)
- Bearbeitung und Löschung bestehender Parkplätze (nur für Admins)
- Verfügbarkeitskalender pro Parkplatz setzen (nur für Admins)
- **QR-Code-Anzeige**: Anzeige und Verwaltung von QR-Codes für jeden Parkplatz (nur für Admins)
- Klickbare Adressen öffnen Google Maps Navigation in neuem Browser-Tab
- UI-Elemente für Parkplatzverwaltung sind für Nicht-Admins deaktiviert oder ausgeblendet
- Informative Tooltips oder Nachrichten für Nicht-Admins: "Nur Administratoren können Parkplätze verwalten"
- **Strenge Zugriffskontrolle**: Vollständige Validierung der Admin-Berechtigung für alle Parkplatzverwaltungsoperationen
- **Verbesserte Bildverwaltung**: Zuverlässiger Upload und Anzeige von Parkplatzbildern

### Reservierungssystem
- Gäste können verfügbare Parkplätze nach Datum und Zeit filtern
- **Erweiterte Reservierungsanzeige**: 
  - Anzeige des Stundenpreises in CHF für jeden verfügbaren Parkplatz
  - Kostenlose Parkplätze (CHF 0.00) werden als "Kostenlos" gekennzeichnet
  - **Dynamische Kostenberechnung**: Gesamtkosten werden basierend auf Dauer und Stundensatz vor der Bestätigung berechnet und angezeigt
- Einfaches Reservierungsformular mit Datum, Uhrzeit und Dauer
- **Stripe-Zahlungsintegration**:
  - Zahlungsübersicht mit Kostenaufschlüsselung (CHF/Stunde × Dauer = Gesamtbetrag)
  - "Jetzt bezahlen"-Button für kostenpflichtige Reservierungen
  - Stripe Checkout API mit Unterstützung für Kreditkarten, Apple Pay und Google Pay
  - **Kostenlose Parkplätze überspringen Zahlungsschritt**: Reservierungen mit Preis 0 CHF werden direkt bestätigt
  - Reservierungen werden nur nach erfolgreicher Zahlung als bestätigt markiert
- Bestätigungsseite mit Reservierungsdetails und Zahlungsstatus
- **Robuste Reservierungserstellung**: Zuverlässige Reservierungserstellung mit korrekter Backend- und Frontend-Logik
- **Präzise Verfügbarkeitsprüfung**: Verhindert jegliche Terminüberschneidungen bei der Reservierungserstellung
- Korrekte Validierungen und Berechtigungen (AccessControl.hasPermission) ermöglichen die Operation
- **Erweiterte Konfliktbehandlung**: Konfliktierende Zeitslots werden ordnungsgemäß erkannt, blockieren aber keine gültigen Eingaben
- Frontend-Validierung prüft Konflikte lokal vor Backend-Aufruf und zeigt sofortiges Feedback
- Fehlermeldung "Dieser Parkplatz ist im gewählten Zeitraum bereits reserviert" bei Konflikten
- Vorschlag des nächsten verfügbaren Zeitslots bei Konflikten
- Deaktivierung des "Reservieren"-Buttons während der Validierung
- **Vollständige Zahlungsintegration**: Nahtlose Integration zwischen Reservierungserstellung und Stripe-Zahlungsabwicklung

### QR-Code-Check-in/Check-out
- **Anonyme QR-Code-URLs**: Jeder Parkplatz hat eine eindeutige QR-Code-URL für direkten Zugriff im Format `https://quiet-bronze-ji1-draft.caffeine.xyz/qr-checkin?parkplatzId=<id>`
- **Zuverlässige Frontend-Implementierung**: QRCheckinPage.tsx extrahiert korrekt den `parkplatzId` Parameter aus der URL
- **Fahrzeuginformationen-Formular**: Beim ersten Scannen wird ein einfaches Formular angezeigt mit Eingabefeldern für:
  - Kennzeichen (Pflichtfeld)
  - Fahrzeugmarke (Pflichtfeld)
- **Robuste Actor-Verbindung**: Implementierung von Retry-Logik und verbesserter Fehlerbehandlung für Actor-Verbindungsprobleme
- **Klare Benutzerrückmeldung**: Deutliche Anzeige von Erfolgs- und Fehlerzuständen mit deutschen Meldungen
- **Automatische Reservierungserstellung**: Nach Eingabe der Fahrzeugdaten wird eine 2-Stunden-Reservierung mit Status "#eingecheckt" erstellt
- **Check-out-Funktionalität**: Beim zweiten Scannen wird der Status auf "#ausgecheckt" geändert (ohne erneute Fahrzeugdaten-Eingabe)
- **Smartphone-optimiert**: QR-Code-URLs sind für mobile Geräte optimiert
- **Statusverfolgung**: System verfolgt aktive QR-Code-Reservierungen pro Parkplatz
- **Anonymer Zugriff**: Funktioniert ohne Authentifizierung oder Identity-Delegation

### Reservierungsübersicht
- Erweiterte Kalenderansicht zur visuellen Darstellung von Reservierungen
- UI-Kalenderkomponente für Hosts und Gäste
- **Funktionsfähige ReservierungCalendar-Komponente** mit korrekter Datenabfrage und -darstellung
- **Vollständige Reservierungsdaten-Integration**: Korrekte Zusammenführung von "meineReservierungen" und "reservierungenFuerHost" Abfragen
- **Farbkodierte Reservierungseinträge nach Status**:
  - **Grün** für "#reserviert"
  - **Blau** für "#eingecheckt"
  - **Grau** für "#ausgecheckt"
  - **Rot** für "#storniert"
- **Sichtbare Legende** unterhalb oder neben dem Kalender zur Erklärung der Farbcodes
- **Korrekte Kalenderpositionierung**: Reservierungen werden im richtigen Tag/Zeitslot mit ordnungsgemäßer Ausrichtung im Kalendergitter angezeigt
- **Responsive Layout**: Kalenderansicht passt sich verschiedenen Bildschirmgrößen an
- Dynamische Farbaktualisierung bei Statusänderungen von Reservierungen
- Kalendereinträge zeigen Reservierungsdatum/-zeit und Parkplatzinformationen
- Wöchentliche und tägliche Ansicht der Parkplatzbelegung
- **Hover-Tooltips mit vollständigen Details**: Anzeige von Zeit, Parkplatzstandort, Gast-/Host-Name und Fahrzeuginformationen bei Hover über Reservierungseinträge
- **Admin-spezifische Anzeige**: Admins sehen zusätzlich den Namen des Reservierenden und Fahrzeugdaten in Kalendereinträgen und Tooltips
- **Zahlungsstatusanzeige**: Admins sehen den Zahlungsstatus (bezahlt/ausstehend) in der Reservierungsübersicht
- **QR-Code-Reservierungen**: Anonyme QR-Code-Reservierungen werden als "QR-Code Check-in" gekennzeichnet mit Fahrzeuginformationen
- Nahtlose Integration mit bestehender Reservierungsübersicht und Host/Benutzer-Unterscheidung
- **Verbesserte Datenaktualisierung**: Echtzeit-Updates der Kalenderansicht bei Statusänderungen
- **Klickbare Kalendertage**: Beim Klick auf einen Tag im Reservierungskalender öffnet sich automatisch das "Parkplatz reservieren" Formular oder Modal mit dem angeklickten Datum als vorausgewähltes Startdatum

### Reservierungsdetails
- Detailansicht mit Parkplatzbildern (falls verfügbar)
- **Zuverlässige Bildanzeige**: Anzeige von hochgeladenen Situationsbildern neben Reservierungsdetails
- Vollständige Reservierungsinformationen inklusive Fahrzeugdaten (Kennzeichen und Marke)
- **Fahrzeuginformationen für Hosts**: Hosts sehen in der Reservierungsdetailansicht die Fahrzeuginformationen (Kennzeichen und Fahrzeugmarke) klar angezeigt neben den bestehenden Informationen wie Gastname, Zeitraum und Status
- **Admin-Ansicht**: Admins sehen den Namen des Reservierenden und Fahrzeuginformationen in den Reservierungsdetails
- **Zahlungsstatusanzeige**: Anzeige des Zahlungsstatus und Zahlungsdetails
- **QR-Code-Kennzeichnung**: Reservierungen über QR-Code werden entsprechend gekennzeichnet mit Fahrzeuginformationen
- **Verbesserte Bildverwaltung**: Optimierte Anzeige und Ladezeiten für Parkplatzbilder

### Check-in/Check-out System
- Check-in-Funktion für Gäste bei Parkplatzankunft
- Check-out-Funktion bei Abfahrt
- Status-Updates in Echtzeit
- **QR-Code-Integration**: Unterstützung für QR-Code-basierte Check-ins und Check-outs mit Fahrzeuginformationen
- **Verbesserte Statusverfolgung**: Zuverlässige Aktualisierung des Reservierungsstatus

## Benutzeroberfläche
- Große, gut sichtbare Buttons für alle Hauptaktionen
- Klare Icons für Navigation und Funktionen
- Blaues UI-Design als Hauptthema mit konsistenter Farbgebung und Typografie
- Moderne Gradienteneffekte und schattenbasierte Karten
- Sanfte Übergänge und Animationen für bessere Benutzererfahrung
- Farbkontraste zur Unterscheidung von Verfügbarkeit und Status
- Responsive Design für mobile und Desktop-Nutzung
- Deutsche Benutzeroberfläche
- Klickbare Parkplatz-Adressen für Google Maps Navigation
- Hero-Banner mit Parkplatz-Hintergrundbild auf der Startseite und Anmeldeseite
- Optimierte Abstände und Ausrichtung für Klarheit auf allen Geräten
- Bestätigungsdialoge für kritische Aktionen in der Benutzerverwaltung
- Copy-to-Clipboard-Funktionalität für Einladungscodes
- **Rollenbasierte UI-Kontrollen**: Parkplatzverwaltungs-Elemente sind nur für Admins sichtbar und aktiviert
- Informative Nachrichten für Nicht-Admins über eingeschränkte Berechtigungen
- **Fallback-Behandlung**: Anzeige von "Unbekannt" wenn Benutzername nicht verfügbar ist
- **Preisanzeige**: Klare Darstellung von Stundenpreisen und Gesamtkosten in CHF
- **Kostenlos-Kennzeichnung**: Spezielle Kennzeichnung für kostenlose Parkplätze
- **Stripe-Zahlungsintegration**: Moderne, sichere Zahlungsschnittstelle mit "Jetzt bezahlen"-Button
- **Zahlungsstatusanzeige**: Visuelle Indikatoren für bezahlte und ausstehende Zahlungen
- **QR-Code-Anzeige**: Klare Darstellung von QR-Codes für Parkplätze in der Admin-Ansicht
- **Mobile QR-Code-Seiten**: Optimierte mobile Ansichten für QR-Code-Check-ins mit klaren Erfolgs- und Fehlermeldungen
- **Fahrzeuginformationen-Formular**: Einfaches, benutzerfreundliches Formular für Kennzeichen und Fahrzeugmarke auf der QR-Check-in-Seite
- **Fahrzeuginformationen in Reservierungsdetails**: Klare Anzeige von Kennzeichen und Fahrzeugmarke in der Reservierungsdetailansicht für Hosts und Admins, positioniert neben bestehenden Informationen wie Gastname, Zeitraum und Status
- **Stripe-Konfigurationsseite**: Konsistente UI/UX mit bestehender StripeSetupModal-Komponente für Admin-Stripe-Einstellungen
- **Konsistente Icon-Darstellung**: Alle Icons haben einheitliche Größe, Schatten, Abrundung und Ausrichtung für visuell harmonisches Erscheinungsbild
- **Verbesserte Fehlerbehandlung**: Benutzerfreundliche Fehlermeldungen und Validierungshinweise
- **Optimierte Performance**: Schnellere Ladezeiten und flüssigere Interaktionen
- **Interaktive Kalenderintegration**: Klickbare Kalendertage öffnen das Reservierungsformular mit vorausgewähltem Datum für nahtlose Benutzerführung

## Backend-Datenspeicherung
Das Backend speichert folgende Daten persistent:
- Benutzerprofile (Admins, Hosts und Gäste) mit Rollenzuweisungen
- Einladungstoken mit Gültigkeitsstatus, Verwendungsstatus, Erstellungszeit und Tracking-Informationen
- RSVP-Einträge für akzeptierte Einladungen
- **Erweiterte Parkplätze** mit Details, Verfügbarkeitskalendern, Situationsbildern, **maximaler Parkdauer**, **Wochentag-Verfügbarkeit mit Zeitbereichen** und **QR-Code-URLs mit korrekter Domain `https://quiet-bronze-ji1-draft.caffeine.xyz`**
- Hochgeladene Situationsbilder über Caffeine Blob Storage
- Reservierungen mit Status, **Zahlungsinformationen**, **QR-Code-Kennzeichnung** und **Fahrzeuginformationen (Kennzeichen und Marke)**
- **QR-Code-Reservierungen**: Anonyme Reservierungen erstellt über QR-Code-Scans mit Fahrzeugdaten
- **Stripe-Zahlungsdaten**: Zahlungs-IDs, Zahlungsstatus, Transaktionsdetails
- **Stripe-Konfigurationsdaten**: Secret Key und erlaubte Länder für Zahlungsabwicklung (nur für Admins zugänglich)
- Check-in/Check-out-Protokolle
- Benutzeraktivitätsstatus (aktiv/deaktiviert)

## Backend-Operationen
- **Erste Benutzer-Initialisierung**: `AccessControl.initialize` weist dem ersten Aufrufer automatisch die Admin-Rolle zu ohne einladungsbasierte Registrierung zu blockieren
- **Bootstrap-Registrierung**: `registerWithInvite` funktioniert für den ersten Benutzer auch ohne vorherige Admin-Einrichtung oder verwendete Einladungscodes
- Einladungstoken-Verwaltung, -Validierung und -Generierung über `generateInviteCode`
- Einladungslink-Verarbeitung mit korrekter Statusaktualisierung (verwendet-Flag setzen, RSVP-Eintrag erstellen)
- Vollständige Benutzerregistrierung über `registerWithInvite` mit Name und E-Mail
- Verbindung des invite-links-Moduls mit dem Registrierungsablauf
- Tracking und Abruf aller generierten Einladungscodes mit Metadaten
- **Admin-only Parkplatz-CRUD-Operationen**: `parkplatzAnlegen`, `parkplatzBearbeiten`, und `parkplatzLoeschen` prüfen auf Admin-Berechtigung mit `AccessControl.hasPermission(..., #admin)`
- **Erweiterte Parkplatz-Datenmodell**: Speicherung von `maxParkdauer`, `wochentageVerfuegbarkeit` mit Start-/Endzeiten und **QR-Code-URLs mit korrekter Domain `https://quiet-bronze-ji1-draft.caffeine.xyz/qr-checkin?parkplatzId=<id>`** im Parkplatz-Modell
- **Erweiterte QR-Code-Endpoint**: `qrCheckinOrCheckout(parkplatzId : Nat, kennzeichen : ?Text, fahrzeugmarke : ?Text)` für anonyme QR-Code-basierte Check-ins und Check-outs mit Fahrzeuginformationen
- **QR-Code-Reservierungslogik**: 
  - Beim ersten Aufruf: Erstelle neue Reservierung mit Status "#eingecheckt", Startzeit = aktuelle Zeit, Dauer = 2 Stunden, gespeicherte Fahrzeuginformationen
  - Beim zweiten Aufruf: Ändere Status der aktiven Reservierung von "#eingecheckt" zu "#ausgecheckt"
- **Korrekte QR-Code-URL-Generierung**: Backend generiert QR-Code-URLs mit der festen Domain `https://quiet-bronze-ji1-draft.caffeine.xyz/qr-checkin?parkplatzId=<id>`
- **Verbesserte Actor-Verfügbarkeit**: Optimierte Actor-Initialisierung und -Verfügbarkeit für anonyme QR-Code-Zugriffe
- Situationsbild-Upload und -Verwaltung über Caffeine Blob Storage (nur für Admins)
- **Robuste Reservierungsverwaltung**: Zuverlässige Reservierungsverwaltung mit korrekter Überschneidungsprüfung inklusive exakter Start- und Endzeiten
- **Kostenberechnung**: Backend-Logik zur Berechnung der Gesamtkosten basierend auf Dauer und Stundensatz
- **Vollständige Stripe-Integration**: 
  - Erstellung von Stripe Checkout Sessions für kostenpflichtige Reservierungen
  - Webhook-Verarbeitung für Zahlungsbestätigungen
  - Aktualisierung des Reservierungsstatus nach erfolgreicher Zahlung
  - Verwaltung von Zahlungs-IDs und Transaktionsdetails
  - Fehlerbehandlung für fehlgeschlagene Zahlungen
- **Stripe-Konfigurationsverwaltung**:
  - `setStripeConfiguration` zum Speichern von Secret Key und erlaubten Ländern (nur für Admins)
  - `isStripeConfigured` zum Abrufen aktueller Stripe-Einstellungen (nur für Admins)
  - Sichere Speicherung und Validierung der Stripe-Konfigurationsdaten
- Korrekte Validierungen und Berechtigungen für Reservierungserstellung
- Verfügbarkeitsprüfung und Kalenderaktualisierung
- Check-in/Check-out-Verarbeitung mit Fahrzeuginformationen
- Erweiterte Zeitraum-Validierung für neue Reservierungen gegen alle bestehenden Reservierungen mit inklusiver Überschneidungserkennung
- Admin-Benutzerverwaltung: `alleBenutzer()` zur Anzeige aller Benutzer
- Rollenverwaltung: `rolleZuweisen(user, rolle)` zur Änderung von Benutzerrollen
- Benutzerdeaktivierung: `benutzerDeaktivieren(user)` zur Deaktivierung von Benutzern
- Zugriffskontrolle für Admin-Funktionen über AccessControl-System
- **Autorisierungsfehler**: "Unauthorized" trap message für Nicht-Admins bei Parkplatzverwaltungsversuchen
- **Erweiterte Reservierungsdaten für Admins**: Backend-Methoden `alleReservierungen` und `reservierungenFuerHost` fügen für Admin-Benutzer den Namen des Reservierenden (`UserProfile.name`), Zahlungsstatus und Fahrzeuginformationen zu den zurückgegebenen Reservierungsdaten hinzu
- **Fallback-Behandlung**: Backend liefert "Unbekannt" als Reservierenden-Namen wenn das Benutzerprofil fehlt oder unvollständig ist
- **QR-Code-Reservierungen-Kennzeichnung**: QR-Code-basierte Reservierungen werden als "QR-Code Check-in" gekennzeichnet mit Fahrzeuginformationen
- **Verbesserte Datenintegrität**: Umfassende Validierung und Konsistenzprüfungen für alle Datenoperationen inklusive Fahrzeuginformationen
- **Optimierte Performance**: Effiziente Datenbankabfragen und Caching-Strategien
