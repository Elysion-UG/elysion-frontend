# User Stories & Use Cases
## Nachhaltigkeits-Zertifikat-Plattform

**Version:** 1.0  
**Datum:** 05.02.2026

---

## Inhaltsverzeichnis
1. [User Stories - Käufer](#1-user-stories---käufer)
2. [User Stories - Verkäufer](#2-user-stories---verkäufer)
3. [User Stories - Admin](#3-user-stories---admin)
4. [Use Cases - Detailliert](#4-use-cases---detailliert)
5. [User Journeys](#5-user-journeys)

---

## 1. User Stories - Käufer

### 1.1 Registrierung & Profil

**US-B-001: Als neuer Nutzer möchte ich mich registrieren**
- **Akzeptanzkriterien:**
  - Ich kann E-Mail und Passwort eingeben
  - Ich erhalte eine Bestätigungs-E-Mail
  - Nach Klick auf den Link ist mein Account aktiv
- **Priorität:** MUST
- **Story Points:** 3

**US-B-002: Als Käufer möchte ich mein Werteprofil erstellen**
- **Akzeptanzkriterien:**
  - Ich kann zwischen einfachem und erweitertem Profil wählen
  - Einfach: 7 Kategorien mit Schiebereglern
  - Erweitert: Zusätzlich Unterpunkte pro Kategorie
  - Änderungen werden sofort gespeichert
  - Ich sehe sofort aktualisierte Produktempfehlungen
- **Priorität:** MUST
- **Story Points:** 8

**US-B-003: Als Käufer möchte ich zwischen Profil-Stufen wechseln**
- **Akzeptanzkriterien:**
  - Ich kann jederzeit von einfach zu erweitert wechseln
  - Meine Einstellungen bleiben erhalten
  - Ich werde gewarnt, wenn ich das Profil deaktiviere
- **Priorität:** SHOULD
- **Story Points:** 3

### 1.2 Produktsuche & Filter

**US-B-004: Als Käufer möchte ich nach Produkten suchen**
- **Akzeptanzkriterien:**
  - Suchfeld ist prominent platziert
  - Auto-Complete zeigt Vorschläge
  - Suche funktioniert über Produktname, Beschreibung, Marke
  - Ergebnisse erscheinen in < 500ms
- **Priorität:** MUST
- **Story Points:** 5

**US-B-005: Als Käufer möchte ich Produkte filtern**
- **Akzeptanzkriterien:**
  - Filter: Kategorie, Preis, Zertifikate, Marke, Verfügbarkeit
  - Mehrfach-Auswahl möglich
  - Aktive Filter werden als Tags angezeigt
  - "Alle Filter zurücksetzen" Button vorhanden
- **Priorität:** MUST
- **Story Points:** 5

**US-B-006: Als Käufer mit Profil möchte ich Produkte nach Matching-Score filtern**
- **Akzeptanzkriterien:**
  - Schieberegler für Min. Match-Score
  - Produkte zeigen Match-Prozent
  - Standard-Sortierung nach Match-Score
- **Priorität:** MUST
- **Story Points:** 5

**US-B-007: Als Käufer möchte ich verstehen, warum ein Produkt zu mir passt**
- **Akzeptanzkriterien:**
  - "Warum passt das?" Link auf Produktseite
  - Aufschlüsselung pro Kategorie (✓ erfüllt, ✗ nicht erfüllt)
  - Zertifikate werden erklärt
- **Priorität:** MUST
- **Story Points:** 5

### 1.3 Warenkorb & Checkout

**US-B-008: Als Käufer möchte ich Produkte in den Warenkorb legen**
- **Akzeptanzkriterien:**
  - "In den Warenkorb" Button klar sichtbar
  - Varianten-Auswahl (Größe, Farbe) vor dem Hinzufügen
  - Bestätigungs-Feedback (Toastr, Mini-Warenkorb)
  - Menge kann im Warenkorb geändert werden
- **Priorität:** MUST
- **Story Points:** 3

**US-B-009: Als Gast möchte ich ohne Registrierung bestellen**
- **Akzeptanzkriterien:**
  - "Als Gast fortfahren" Option im Checkout
  - Nur E-Mail und Lieferadresse erforderlich
  - Bestellbestätigung per E-Mail
  - Nach Kauf: Hinweis auf Account-Erstellung
- **Priorität:** SHOULD
- **Story Points:** 5

**US-B-010: Als registrierter Käufer möchte ich schnell bestellen**
- **Akzeptanzkriterien:**
  - Gespeicherte Adressen auswählbar
  - Gespeicherte Zahlungsmethoden (optional)
  - Checkout in max. 3 Klicks
- **Priorität:** SHOULD
- **Story Points:** 5

**US-B-011: Als Käufer möchte ich sicher bezahlen**
- **Akzeptanzkriterien:**
  - Mehrere Zahlungsmethoden (Kreditkarte, PayPal, SEPA)
  - SSL-verschlüsselt (Schloss-Symbol im Browser)
  - Klare Kosten-Übersicht vor Zahlung
- **Priorität:** MUST
- **Story Points:** 8

### 1.4 Bestellverwaltung

**US-B-012: Als Käufer möchte ich meine Bestellhistorie sehen**
- **Akzeptanzkriterien:**
  - Übersicht aller vergangenen Bestellungen
  - Filter nach Status, Zeitraum
  - Bestelldetails aufrufbar
- **Priorität:** MUST
- **Story Points:** 3

**US-B-013: Als Käufer möchte ich eine Bestellung verfolgen**
- **Akzeptanzkriterien:**
  - Tracking-Nummer sichtbar
  - Link zur Sendungsverfolgung
  - Status-Updates (Bezahlt → Versendet → Zugestellt)
- **Priorität:** SHOULD
- **Story Points:** 3

**US-B-014: Als Käufer möchte ich eine Bestellung stornieren**
- **Akzeptanzkriterien:**
  - Stornierung möglich, solange nicht versendet
  - Bestätigungs-Dialog mit Warnung
  - Rückerstattung wird automatisch initiiert
  - E-Mail-Bestätigung
- **Priorität:** MUST
- **Story Points:** 5

**US-B-015: Als Käufer möchte ich ein Produkt zurücksenden**
- **Akzeptanzkriterien:**
  - "Rücksendung anfordern" Button (14 Tage nach Zustellung)
  - Grund auswählen
  - Rücksende-Anweisungen per E-Mail
  - Status-Tracking der Rücksendung
- **Priorität:** MUST
- **Story Points:** 8

### 1.5 Wunschliste

**US-B-016: Als Käufer möchte ich eine Wunschliste haben**
- **Akzeptanzkriterien:**
  - Herz-Icon auf Produktkarte
  - Wunschliste-Seite mit allen gespeicherten Produkten
  - Schnell in Warenkorb verschieben
  - Benachrichtigung bei Preissenkung (Phase 2)
- **Priorität:** SHOULD
- **Story Points:** 5

---

## 2. User Stories - Verkäufer

### 2.1 Registrierung & Onboarding

**US-S-001: Als Verkäufer möchte ich mich registrieren**
- **Akzeptanzkriterien:**
  - Erweitertes Formular mit Geschäftsdaten
  - USt-ID wird validiert
  - IBAN wird validiert
  - Hinweis auf Admin-Freigabe (24-48h)
- **Priorität:** MUST
- **Story Points:** 5

**US-S-002: Als Verkäufer möchte ich mehrere Shops verwalten**
- **Akzeptanzkriterien:**
  - Kann beliebig viele Shops anlegen
  - Jeder Shop hat eigenen Namen, Logo, Beschreibung
  - Produkte werden Shops zugeordnet
  - Kann zwischen Shops wechseln im Dashboard
- **Priorität:** SHOULD
- **Story Points:** 5

### 2.2 Produktverwaltung

**US-S-003: Als Verkäufer möchte ich ein Produkt anlegen**
- **Akzeptanzkriterien:**
  - Formular mit allen Pflicht- und optionalen Feldern
  - Bis zu 10 Bilder hochladen (Drag & Drop)
  - Varianten anlegen (Größe, Farbe)
  - Zertifikat zuordnen
  - Produkt ist sofort aktiv, wenn Zertifikat verifiziert
- **Priorität:** MUST
- **Story Points:** 8

**US-S-004: Als Verkäufer möchte ich Produkte in Masse bearbeiten**
- **Akzeptanzkriterien:**
  - Mehrfach-Auswahl von Produkten
  - Bulk-Aktionen: Preis ändern, Kategorie ändern, Shop wechseln
  - Bestätigung vor Ausführung
- **Priorität:** COULD
- **Story Points:** 5

**US-S-005: Als Verkäufer möchte ich Lagerbestände verwalten**
- **Akzeptanzkriterien:**
  - Lagerbestand pro Variante einsehbar/editierbar
  - Warnung bei Nachbestellschwelle
  - CSV-Import/Export für Bulk-Updates
  - Automatische Reservierung bei Bestellung
- **Priorität:** MUST
- **Story Points:** 5

### 2.3 Zertifikatsverwaltung

**US-S-006: Als Verkäufer möchte ich ein Zertifikat hochladen**
- **Akzeptanzkriterien:**
  - Formular mit Zertifikatstyp, Nummer, Datum
  - PDF-Upload (max. 10MB)
  - Produkt-Zuordnung (einzeln oder alle)
  - Status "Ausstehend" wird angezeigt
  - Benachrichtigung nach Verifizierung (24h)
- **Priorität:** MUST
- **Story Points:** 5

**US-S-007: Als Verkäufer möchte ich über ablaufende Zertifikate informiert werden**
- **Akzeptanzkriterien:**
  - E-Mail 30/14/7 Tage vor Ablauf
  - Dashboard-Warnung bei kritischen Zertifikaten
  - Produkte werden automatisch deaktiviert bei Ablauf
- **Priorität:** MUST
- **Story Points:** 3

### 2.4 Bestellverwaltung

**US-S-008: Als Verkäufer möchte ich neue Bestellungen sehen**
- **Akzeptanzkriterien:**
  - Dashboard zeigt "Neue Bestellungen" prominent
  - E-Mail-Benachrichtigung bei neuer Bestellung
  - Bestelldetails: Kunde, Artikel, Lieferadresse
- **Priorität:** MUST
- **Story Points:** 3

**US-S-009: Als Verkäufer möchte ich eine Bestellung als versendet markieren**
- **Akzeptanzkriterien:**
  - Formular: Versanddienstleister, Tracking-Nummer
  - Kunde erhält E-Mail mit Tracking-Info
  - Status ändert sich zu "Versendet"
  - Lagerbestand wird endgültig abgezogen
- **Priorität:** MUST
- **Story Points:** 5

**US-S-010: Als Verkäufer möchte ich Rücksendungen bearbeiten**
- **Akzeptanzkriterien:**
  - Übersicht offener Rücksendeanfragen
  - Kann genehmigen oder ablehnen (mit Begründung)
  - Nach Wareneingang: Rückerstattung auslösen
  - Lagerbestand wird wieder erhöht
- **Priorität:** MUST
- **Story Points:** 8

### 2.5 Analytics & Reporting

**US-S-011: Als Verkäufer möchte ich meine Verkaufszahlen sehen**
- **Akzeptanzkriterien:**
  - Dashboard mit KPIs: Umsatz, Bestellungen, Conversion
  - Zeitraum-Filter (7/30 Tage, Monat, Jahr)
  - Diagramme: Umsatzverlauf, Top-Produkte
  - Export als CSV/PDF
- **Priorität:** SHOULD
- **Story Points:** 8

**US-S-012: Als Verkäufer möchte ich Matching-Insights sehen**
- **Akzeptanzkriterien:**
  - Durchschnittlicher Match-Score pro Produkt
  - Verteilung: Wie viele Nutzer sehen welchen Score?
  - Tipps zur Optimierung (z.B. "Zertifikat X würde Score verbessern")
- **Priorität:** COULD
- **Story Points:** 8

### 2.6 Auszahlungen

**US-S-013: Als Verkäufer möchte ich meine Auszahlungen nachvollziehen**
- **Akzeptanzkriterien:**
  - Übersicht aller Auszahlungen (wöchentlich/monatlich)
  - Details: Zeitraum, Anzahl Bestellungen, Provision, Netto
  - Download als PDF für Buchhaltung
  - Transparente Provisions-Berechnung
- **Priorität:** MUST
- **Story Points:** 5

---

## 3. User Stories - Admin

### 3.1 Nutzer-Verwaltung

**US-A-001: Als Admin möchte ich Verkäufer freigeben**
- **Akzeptanzkriterien:**
  - Übersicht ausstehender Verkäufer-Registrierungen
  - Details: Geschäftsdaten, USt-ID, IBAN
  - Kann freigeben oder ablehnen (mit Begründung)
  - Verkäufer wird per E-Mail benachrichtigt
- **Priorität:** MUST
- **Story Points:** 5

**US-A-002: Als Admin möchte ich Accounts suspendieren**
- **Akzeptanzkriterien:**
  - Kann Käufer oder Verkäufer suspendieren
  - Grund muss angegeben werden
  - Nutzer wird informiert
  - Login wird blockiert
  - Bei Verkäufern: Produkte werden deaktiviert
  - Reaktivierung möglich
- **Priorität:** MUST
- **Story Points:** 5

### 3.2 Zertifikats-Verifizierung

**US-A-003: Als Admin möchte ich Zertifikate verifizieren**
- **Akzeptanzkriterien:**
  - Dashboard mit offenen Zertifikaten (SLA: 24h)
  - PDF inline ansehen
  - Checkliste zur Prüfung
  - Kann freigeben, ablehnen, oder Nachfrage stellen
  - Bei Freigabe: Alle zugeordneten Produkte werden aktiviert
- **Priorität:** MUST
- **Story Points:** 8

**US-A-004: Als Admin möchte ich SLA-Verstöße vermeiden**
- **Akzeptanzkriterien:**
  - Farbcodierte Warnung (Rot > 20h, Gelb > 16h)
  - Benachrichtigung wenn Zertifikat > 20h offen
  - Dashboard zeigt durchschnittliche Bearbeitungszeit
- **Priorität:** SHOULD
- **Story Points:** 3

### 3.3 Plattform-Verwaltung

**US-A-005: Als Admin möchte ich Kategorien verwalten**
- **Akzeptanzkriterien:**
  - Kann Kategorien anlegen, bearbeiten, löschen
  - Hierarchie verwalten (Parent-Child)
  - Drag & Drop für Reihenfolge
- **Priorität:** SHOULD
- **Story Points:** 5

**US-A-006: Als Admin möchte ich Plattform-Statistiken sehen**
- **Akzeptanzkriterien:**
  - KPIs: Nutzer, Bestellungen, Umsatz, Provision
  - Wachstums-Diagramme
  - Top-Verkäufer, Top-Produkte
  - Export-Funktion
- **Priorität:** COULD (Phase 3)
- **Story Points:** 8

---

## 4. Use Cases - Detailliert

### 4.1 UC-001: Käufer erstellt erweitertes Werteprofil

**Akteure:** Registrierter Käufer  
**Vorbedingungen:** Nutzer ist eingeloggt  
**Nachbedingungen:** Werteprofil ist gespeichert, Produktempfehlungen aktualisiert

**Hauptszenario:**
1. Nutzer navigiert zu "Mein Profil" > "Werteprofil"
2. System zeigt aktuelles Profil (falls vorhanden) oder leere Vorlage
3. Nutzer wählt "Erweitertes Profil"
4. System zeigt 7 Hauptkategorien mit Accordion
5. Nutzer setzt Hauptkategorie "Faire Arbeitsbedingungen" auf 90%
6. System expandiert Accordion und zeigt 3 Unterpunkte
7. Nutzer setzt:
   - "Existenzsichernder Lohn": 100%
   - "Gewerkschaftsfreiheit": 80%
   - "Keine Kinderarbeit": 100%
8. System speichert automatisch (Auto-Save nach 1s Inaktivität)
9. Nutzer wiederholt für alle Kategorien
10. System berechnet Match-Scores für alle Produkte neu (async)
11. Nutzer navigiert zu Startseite
12. System zeigt personalisierte Empfehlungen basierend auf Profil

**Alternative Szenarios:**
- **4a:** Nutzer hatte bereits einfaches Profil
  - System übernimmt Hauptkategorie-Gewichtungen
  - Unterpunkte werden auf gleichen Wert initialisiert
- **8a:** Netzwerkfehler beim Auto-Save
  - System zeigt "Speichern fehlgeschlagen, bitte erneut versuchen"
  - Nutzer kann manuell speichern

**Nicht-funktionale Anforderungen:**
- Auto-Save Response-Zeit: < 200ms
- Match-Score Neuberechnung: < 5s (im Hintergrund)

---

### 4.2 UC-002: Verkäufer lädt Zertifikat hoch und ordnet Produkte zu

**Akteure:** Verkäufer  
**Vorbedingungen:** Verkäufer ist freigeschaltet, hat mind. 1 Produkt angelegt  
**Nachbedingungen:** Zertifikat hochgeladen, Status "Ausstehend", Admin benachrichtigt

**Hauptszenario:**
1. Verkäufer navigiert zu "Zertifikate" > "Neues Zertifikat"
2. System zeigt Formular
3. Verkäufer wählt Zertifikatstyp: "IVN BEST"
4. Verkäufer gibt Zertifikatsnummer ein: "IVN-12345-2026"
5. Verkäufer wählt Ausstellungsdatum: 15.01.2026
6. Verkäufer wählt Ablaufdatum: 14.01.2027
7. Verkäufer uploaded PDF-Datei (Drag & Drop)
8. System validiert:
   - PDF lesbar ✓
   - Größe < 10MB ✓
   - Ablaufdatum in Zukunft ✓
9. Verkäufer wählt Gültigkeitsbereich: "Einzelne Produkte"
10. System zeigt Liste aller Produkte des Verkäufers
11. Verkäufer wählt 5 Produkte per Checkbox
12. Verkäufer klickt "Zertifikat hochladen"
13. System:
    - Speichert Zertifikat in DB (Status: PENDING)
    - Uploaded PDF zu S3
    - Verknüpft mit 5 Produkten
    - Sendet E-Mail an Admin
    - Zeigt Erfolgs-Nachricht: "Zertifikat wird innerhalb 24h geprüft"
14. Verkäufer sieht Zertifikat in Liste mit Status "Ausstehend"

**Alternative Szenarios:**
- **8a:** PDF größer als 10MB
  - System zeigt Fehler: "Datei zu groß (max. 10MB)"
  - Verkäufer muss Datei komprimieren
- **8b:** Ablaufdatum in Vergangenheit
  - System zeigt Fehler: "Zertifikat bereits abgelaufen"
- **12a:** Keine Produkte ausgewählt
  - System zeigt Fehler: "Bitte mind. 1 Produkt auswählen"

**Nachbedingungen bei Verifizierung:**
1. Admin verifiziert Zertifikat (innerhalb 24h)
2. System:
   - Setzt Status auf VERIFIED
   - Aktiviert alle 5 verknüpften Produkte (DRAFT → ACTIVE)
   - Sendet E-Mail an Verkäufer: "Zertifikat verifiziert"
3. Produkte sind nun öffentlich sichtbar

---

### 4.3 UC-003: Käufer bestellt als Gast

**Akteure:** Gast-Nutzer  
**Vorbedingungen:** Keine  
**Nachbedingungen:** Bestellung erstellt, Zahlung erfolgt, E-Mail versendet

**Hauptszenario:**
1. Gast legt 3 Produkte in Warenkorb
2. Gast klickt "Zur Kasse"
3. System zeigt Login-Optionen:
   - Einloggen
   - Registrieren
   - **Als Gast fortfahren** ← Gast wählt dies
4. System zeigt E-Mail-Eingabe
5. Gast gibt E-Mail ein: gast@example.com
6. System validiert E-Mail-Format ✓
7. System zeigt Lieferadress-Formular
8. Gast füllt aus:
   - Vorname: Max
   - Nachname: Mustermann
   - Straße: Musterstraße 1
   - PLZ: 10115
   - Stadt: Berlin
   - Land: Deutschland
9. Gast wählt Checkbox: "Rechnungsadresse = Lieferadresse"
10. System zeigt Versandoptionen:
    - Standard (4,90 EUR, 3-5 Tage)
    - Express (9,90 EUR, 1-2 Tage)
11. Gast wählt Standard
12. System zeigt Zahlungsmethoden
13. Gast wählt "Kreditkarte"
14. System zeigt Stripe Payment Element
15. Gast gibt Kartendaten ein
16. System zeigt Bestellübersicht:
    ```
    Zwischensumme:   89,70 EUR
    Versand:          4,90 EUR
    ---------------------------
    Gesamt:          94,60 EUR
    ```
17. Gast setzt Haken bei AGB & Datenschutz
18. Gast klickt "Zahlungspflichtig bestellen"
19. System:
    - Erstellt Payment Intent (Stripe)
    - Zahlung wird autorisiert ✓
    - Bestellung wird in DB erstellt (Status: PAID)
    - Bestellnummer generiert: 2026-000042
    - Lagerbestand wird reserviert
    - E-Mail an Gast: Bestellbestätigung
    - E-Mail an Verkäufer: Neue Bestellung
20. System zeigt Erfolgsseite:
    "Vielen Dank! Bestellnummer: 2026-000042"
21. System zeigt CTA: "Jetzt Account erstellen und Bestellung verfolgen"

**Alternative Szenarios:**
- **15a:** 3D Secure erforderlich
  - System öffnet 3D Secure Modal (Stripe)
  - Gast authentifiziert sich bei Bank
  - Weiter bei Schritt 19
- **19a:** Zahlung fehlgeschlagen (z.B. Kartenlimit)
  - System zeigt Fehler: "Zahlung fehlgeschlagen: [Grund]"
  - Gast kann neue Karte eingeben oder Methode wechseln
- **19b:** Produkt zwischenzeitlich ausverkauft
  - System zeigt Fehler: "Produkt X nicht mehr verfügbar"
  - Warenkorb wird aktualisiert
  - Gast muss Checkout neu starten

---

### 4.4 UC-004: Admin verifiziert Zertifikat

**Akteure:** Admin  
**Vorbedingungen:** Mind. 1 Zertifikat mit Status PENDING  
**Nachbedingungen:** Zertifikat verifiziert ODER abgelehnt, Verkäufer benachrichtigt

**Hauptszenario (Freigabe):**
1. Admin loggt sich ein
2. System zeigt Dashboard mit Benachrichtigung: "3 Zertifikate ausstehend"
3. Admin navigiert zu "Zertifikate" > "Ausstehend"
4. System zeigt Liste:
   ```
   | Verkäufer | Typ     | Upload-Zeit | SLA | Aktion |
   |-----------|---------|-------------|-----|--------|
   | EcoKids   | IVN BEST| vor 5h      | 🟢  | Prüfen |
   | GreenCo   | GOTS    | vor 18h     | 🟡  | Prüfen |
   | BioCorp   | IVN BEST| vor 22h     | 🔴  | Prüfen |
   ```
5. Admin klickt "Prüfen" bei BioCorp (höchste Priorität wg. SLA)
6. System zeigt Prüf-Interface:
   - PDF-Viewer (inline)
   - Verkäufer-Daten
   - Formular-Daten (Nummer, Datum)
   - Zugeordnete Produkte (12 Stück)
7. Admin prüft Checkliste:
   - [x] Dokument lesbar
   - [x] Zertifikatsnummer korrekt (abgeglichen auf ivn.de)
   - [x] Datum plausibel
   - [x] Firmenname stimmt überein
   - [x] Produkt-Zuordnung sinnvoll
8. Admin klickt "Freigeben"
9. System zeigt Bestätigung: "Zertifikat verifizieren? 12 Produkte werden aktiviert."
10. Admin bestätigt
11. System:
    - Setzt Status auf VERIFIED
    - Setzt verifiedAt = jetzt
    - Setzt verifiedBy = admin.id
    - Aktiviert 12 Produkte (DRAFT → ACTIVE)
    - Sendet E-Mail an Verkäufer
    - Zeigt Erfolg: "Zertifikat verifiziert"
12. Admin wird zurück zur Liste geleitet (BioCorp ist verschwunden)

**Alternative Szenarios:**
- **7a:** Zertifikatsnummer auf ivn.de nicht gefunden
  - Admin klickt "Nachfrage"
  - Admin gibt Kommentar ein: "Bitte Zertifikatsnummer prüfen"
  - System sendet E-Mail an Verkäufer
  - Status bleibt PENDING
  - Admin kann später erneut prüfen

- **7b:** Firmennname stimmt nicht überein
  - Admin klickt "Ablehnen"
  - Admin gibt Grund ein: "Firmenname auf Zertifikat weicht ab"
  - System:
    - Setzt Status auf REJECTED
    - Speichert Grund
    - Sendet E-Mail an Verkäufer mit Grund
    - Produkte bleiben DRAFT
  - Verkäufer kann neues Zertifikat hochladen

**SLA-Tracking:**
- Zeit gemessen: Upload-Zeitpunkt → Entscheidung
- Wenn > 24h: SLA-Verstoß wird geloggt (für Reporting)

---

## 5. User Journeys

### 5.1 Journey: Neuer Käufer findet passendes Produkt

```
📍 Startpunkt: Nutzer hört von Plattform, besucht Website zum ersten Mal

1. [Landingpage]
   - Nutzer sieht Hero: "Nachhaltige Mode, die zu dir passt"
   - CTA: "Jetzt Werteprofil erstellen" + "Produkte durchstöbern"
   
2. [Entscheidung: Profil erstellen ODER direkt stöbern]
   
   PATH A: Mit Profil
   ----------------
   3a. [Registrierung]
       - Schnelles Formular (nur E-Mail, Passwort, Name)
       - "Weiter zum Werteprofil"
   
   4a. [Werteprofil - Einfach]
       - 7 Kategorien mit Erklärungen
       - Schieberegler (spielerisch)
       - "Speichern & Produkte entdecken"
   
   5a. [Startseite - Personalisiert]
       - "Diese Produkte passen zu 87% zu Ihnen"
       - Produkte mit Match-Score
       
   PATH B: Ohne Profil
   -------------------
   3b. [Produktübersicht]
       - Alle Produkte (Standard-Sortierung)
       - Banner: "Erstelle Profil für Empfehlungen"

3. [Produktdetails]
   - Klick auf interessantes Produkt
   - Bilder, Beschreibung, Preis
   - Zertifikate prominente
   - (Mit Profil: Match-Breakdown)
   
4. [In den Warenkorb]
   - Größe/Farbe wählen
   - "In den Warenkorb"
   - Bestätigung: "✓ Zum Warenkorb hinzugefügt"
   
5. [Weiter einkaufen oder Checkout]
   - Nutzer stöbert weiter, legt 2 weitere Produkte in Warenkorb
   
6. [Warenkorb]
   - 3 Produkte, Gesamtsumme
   - "Zur Kasse"
   
7. [Checkout]
   - Login (falls registriert) ODER Gast-Option
   - Lieferadresse
   - Versandart
   - Zahlung
   - Bestellen
   
8. [Bestellbestätigung]
   - Erfolgsseite mit Bestellnummer
   - E-Mail erhalten
   
9. [Nachkauf]
   - Tage später: Tracking-E-Mail "Bestellung versendet"
   - Produkt kommt an
   - (Optional) Review hinterlassen
   
📍 Endpunkt: Zufriedener Kunde, wahrscheinlich wiederkehrend

⏱️ Dauer: 10-15 Minuten (Erster Kauf)
💡 Optimierungspotential: Onboarding für Werteprofil, Checkout-Optimierung
```

### 5.2 Journey: Verkäufer onboarded Produkte

```
📍 Startpunkt: Textilhersteller erfährt von Plattform, möchte Produkte verkaufen

1. [Landingpage - Seller]
   - Separate Landing für Verkäufer
   - "Verkaufen Sie auf unserer Plattform"
   - CTA: "Jetzt registrieren"
   
2. [Registrierung]
   - Erweitertes Formular
   - Geschäftsdaten, USt-ID, IBAN
   - "Registrierung einreichen"
   - Hinweis: "Freigabe innerhalb 48h"
   
3. [Warten auf Freigabe]
   - E-Mail: "Registrierung erhalten, wird geprüft"
   - (Admin prüft im Hintergrund)
   - E-Mail nach 24h: "Account freigegeben!"
   
4. [Erster Login]
   - Dashboard: "Willkommen! Legen Sie Ihr erstes Produkt an"
   - Onboarding-Tour (optional)
   
5. [Zertifikat hochladen]
   - "Bevor Sie Produkte anlegen, laden Sie Ihr Zertifikat hoch"
   - Formular ausfüllen
   - PDF hochladen
   - "Wird innerhalb 24h geprüft"
   
6. [Warten auf Zertifikats-Verifizierung]
   - E-Mail nach 8h: "Zertifikat verifiziert!"
   
7. [Produkt anlegen]
   - Formular: Name, Beschreibung, Preis, Bilder
   - Kategorie wählen
   - Zertifikat zuordnen (dropdown mit verifizierten)
   - Varianten anlegen (S, M, L, XL)
   - "Produkt veröffentlichen"
   - ✓ Produkt ist sofort live (weil Zertifikat verified)
   
8. [Weitere Produkte]
   - CSV-Import für Bulk-Upload (optional)
   - Verkäufer legt 50 Produkte an
   
9. [Erste Bestellung]
   - E-Mail: "Neue Bestellung #2026-000123"
   - Dashboard: Bestellung sichtbar
   - Artikel verpacken & versenden
   - "Als versendet markieren" mit Tracking
   
10. [Auszahlung]
    - Wöchentliche E-Mail: "Auszahlung über 850 EUR erfolgt"
    - Dashboard: Detaillierte Aufschlüsselung
    
11. [Optimierung]
    - Analytics nutzen: "Produkt X läuft gut, Produkt Y weniger"
    - Matching-Insights: "85% Match im Schnitt - sehr gut!"
    
📍 Endpunkt: Etablierter Verkäufer mit regelmäßigen Verkäufen

⏱️ Dauer: 
  - Registrierung → Freigabe: 24-48h
  - Zertifikat → Verifizierung: < 24h
  - Gesamt bis erster Verkauf: 3-7 Tage
💡 Optimierungspotential: Automatische Zertifikats-Prüfung, Bulk-Upload Tools
```

### 5.3 Journey: Admin managed Plattform

```
📍 Startpunkt: Admin loggt sich ein für tägliche Aufgaben

1. [Dashboard]
   - Übersicht: Heute 5 neue Bestellungen, 2 Verkäufer ausstehend, 3 Zertifikate
   - Priorität: Zertifikate (SLA!)
   
2. [Zertifikate verifizieren]
   - 3 offene Zertifikate
   - Sortiert nach SLA (ältestes zuerst)
   - Jedes prüfen (15 Min/Zertifikat)
   - 2 freigeben, 1 Nachfrage
   
3. [Verkäufer freigeben]
   - 2 ausstehende Registrierungen
   - Geschäftsdaten prüfen, USt-ID validieren
   - Beide freigeben
   
4. [Support-Anfragen] (Phase 2)
   - 3 Tickets: Fragen zu Retouren, technisches Problem
   - Bearbeiten & beantworten
   
5. [Kategorien verwalten]
   - Neue Kategorie "Schuhe" anlegen (Vendor requested)
   
6. [Statistiken prüfen]
   - Wöchentlicher Report: Wachstum, GMV, Provisionen
   - Alles im grünen Bereich
   
📍 Endpunkt: Plattform läuft stabil, alle kritischen Tasks erledigt

⏱️ Dauer: 1-2 Stunden/Tag (bei 100 Verkäufern)
```

---

**Ende User Stories & Use Cases**

Dieses Dokument bietet Entwicklern konkrete Szenarien, um die Anforderungen zu verstehen und zu implementieren. Jede User Story kann direkt in ein Ticket-System (Jira, GitHub Issues) übertragen werden.
