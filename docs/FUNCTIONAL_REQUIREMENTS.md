# Funktionale Anforderungen

## Nachhaltigkeits-Zertifikat-Plattform

**Version:** 1.0  
**Datum:** 09.02.2026

---

## Module-Übersicht

Die Plattform besteht aus 6 Hauptmodulen:

1. **Nutzerverwaltung** — Rollen, Auth, Profile, Werteprofil-System
2. **Produktverwaltung** — CRUD, Varianten, Kategorien, Suche
3. **Zertifikatverwaltung** — Upload, Verifizierung, Ablauf-Management
4. **Bestellsystem** — Warenkorb, Checkout, Tracking, Stornierung
5. **Zahlungsabwicklung** — Provisionen, Auszahlungen
6. **Empfehlungssystem** — Matching-Algorithmus, Personalisierung

---

## 1. Nutzerverwaltung

### 1.1 Rollen & Berechtigungen

| Rolle         | Beschreibung           | Kern-Rechte                                 |
| ------------- | ---------------------- | ------------------------------------------- |
| **Gast**      | Nicht registriert      | Produkte ansehen, eingeschränkter Kauf      |
| **Käufer**    | Registrierter Endkunde | + Werteprofil, Wunschliste, Bestellhistorie |
| **Verkäufer** | Produzent/Händler      | Produkte/Zertifikate verwalten, Analytics   |
| **Admin**     | Plattformbetreiber     | Verifizierung, Account-Management           |

### 1.2 Authentifizierung

- **Registrierung:** E-Mail + Passwort, Double-Opt-In
- **Login:** JWT (Access-Token 1h, Refresh-Token 30d)
- **Passwort:** Min. 8 Zeichen, 1 Großbuchstabe, 1 Zahl
- **Verkäufer:** Erweiterte Daten (Firma, USt-ID, IBAN) + Admin-Freigabe

### 1.3 Werteprofil-System ⭐ (Kernfeature)

**Stufe 0: Kein Profil**

- Alle Produkte unsortiert
- Keine Personalisierung

**Stufe 1: Einfaches Profil (MVP)**

- 7 Hauptkategorien:
  1. Faire Arbeitsbedingungen
  2. Umweltfreundliche Produktion
  3. Tierwohl
  4. Lokale Produktion
  5. Ressourcenschonung
  6. Chemikalienfreiheit
  7. Soziale Verantwortung
- Pro Kategorie: Schieberegler 0–100 %
- Auto-Save, Match-Scores werden berechnet

**Stufe 2: Erweitertes Profil (Phase 2)**

- Jede Hauptkategorie hat 2-3 Unterpunkte
- Beispiel „Faire Arbeitsbedingungen":
  - Existenzsichernder Lohn
  - Gewerkschaftsfreiheit
  - Keine Kinderarbeit

---

## 2. Produktverwaltung

### 2.1 Produkt-CRUD (Verkäufer)

**Pflichtfelder:**

- Name, Beschreibung (50–2000 Zeichen)
- Kategorie (hierarchisch: Kleidung → Damen → Oberteile)
- Preis, MwSt-Satz
- Mind. 1 Bild (max. 10, je 5 MB)
- Zertifikat-Zuordnung
- Shop-Zuordnung

**Optionale Felder:**

- SKU, Gewicht, Lieferzeit, Material, Pflegehinweise

**Varianten:**

- Größe (XS–XXL), Farbe, Custom
- Pro Variante: eigener Lagerbestand, optional eigener Preis

**Status:**

- `DRAFT` — Zertifikat nicht verifiziert → nicht öffentlich
- `ACTIVE` — Zertifikat verifiziert → öffentlich sichtbar
- `PAUSED` — Vom Verkäufer manuell pausiert → nicht öffentlich
- `DELETED` — Soft-Delete (in Bestellhistorie erhalten)

### 2.2 Multi-Shop-Support

- Verkäufer kann mehrere Marken/Shops führen
- Pro Shop: Name, Logo, Beschreibung, Slug
- Produkte werden Shop zugeordnet

### 2.3 Suche & Filter (Käufer)

**Volltextsuche:**

- Felder: Produktname, Beschreibung, Marke, Material
- Auto-Complete, Fuzzy-Matching

**Filter:**

- Kategorie, Preis (Min–Max), Marke/Shop
- Zertifikate, Verfügbarkeit, Größe, Farbe, Material
- **Mit Profil:** Min. Match-Score

**Sortierung:**

- Beste Übereinstimmung (Match-Score)
- Neueste, Preis ↑↓, Beliebtheit

### 2.4 Lagerverwaltung

- **Automatisch:** Bei Bestellung → reserviert, bei Versand → abgezogen
- **Verfügbarkeits-Status:** Auf Lager / Wenige verfügbar (1–5) / Ausverkauft
- **Nachbestellschwelle:** Warnung an Verkäufer per E-Mail

---

## 3. Zertifikatverwaltung

### 3.1 Zertifikatstypen

| Phase   | Zertifikate                      |
| ------- | -------------------------------- |
| Phase 1 | IVN BEST, IVN Naturleder         |
| Phase 2 | GOTS                             |
| Phase 3 | Fair Trade, EU Ecolabel, weitere |

### 3.2 Upload-Prozess (Verkäufer)

**Formular:**

- Typ, Nummer, Ausstellungs-/Ablaufdatum
- PDF-Upload (max. 10 MB)
- Gültig für: Einzelprodukt / Produktserie / Alle Produkte

**Nach Upload:**

- Status: `PENDING` → Admin wird benachrichtigt

### 3.3 Verifizierung (Admin)

**SLA: 24 Stunden**

**Aktionen:**

- **Freigeben:** Status → `VERIFIED`, Produkte → `ACTIVE`
- **Ablehnen:** Status → `REJECTED`, Grund angeben
- **Nachfrage:** Kommentar an Verkäufer

**Cascade-Aktivierung ⭐:**

- Bei Verifizierung werden alle zugeordneten Produkte automatisch aktiviert

### 3.4 Ablauf-Management

**E-Mail-Erinnerungen:**

- 30 / 14 / 7 Tage vor Ablauf

**Bei Ablauf:**

- Status → `EXPIRED`
- Alle verknüpften Produkte → `DRAFT`

---

## 4. Bestellsystem

### 4.1 Warenkorb

- Session-basiert (Gast: Cookie/SessionID, Registriert: Datenbank)
- Artikel hinzufügen/entfernen, Menge ändern (1–10)
- Bei Login: Gast-Warenkorb wird zusammengeführt

### 4.2 Checkout-Flow (5 Schritte)

1. **Login/Gast:** Einloggen, Registrieren oder „Als Gast fortfahren"
2. **Lieferadresse:** Eingabe oder gespeicherte Adressen
3. **Versandart:** Standard, Express, Versandkostenfrei (ab X EUR)
4. **Zahlung:** Kreditkarte, SEPA, etc.
5. **Bestätigung:** Übersicht, AGB-Checkbox, Bestellung aufgeben

### 4.3 Bestellverwaltung (Käufer)

**Bestellhistorie:**

- Alle Bestellungen, Filter nach Status/Zeitraum
- Details: Artikel, Adresse, Tracking, Rechnung (PDF)

**Aktionen:**

- **Stornieren:** Nur wenn Status = `PAID` (noch nicht versendet)
- **Rücksendung:** Innerhalb 14 Tage nach Zustellung

### 4.4 Bestellverwaltung (Verkäufer)

**Dashboard:**

- Neue Bestellungen (Status: `PAID`)
- In Bearbeitung / Versendet / Abgeschlossen

**Aktionen:**

- **Als versendet markieren:** Tracking-Nummer eingeben → Status → `SHIPPED`
- **Rücksendungen bearbeiten:** Genehmigen/Ablehnen

### 4.5 Versandoptionen

- Verkäufer definiert: Name, Preis, Lieferzeit
- Freiversand-Schwelle konfigurierbar (z.B. ab 50 EUR)
- Bei mehreren Verkäufern: separate Versandkosten

---

## 5. Zahlungsabwicklung

### 5.1 Zahlungsmethoden

- Kreditkarte (Visa, Mastercard, Amex)
- SEPA-Lastschrift
- Weitere Methoden (Phase 2)

### 5.2 Provisionsmodell

```
Verkaufs-Brutto    = Produktpreis + MwSt
Provision-Netto    = Verkaufs-Netto × 15 %   (initial)
Auszahlung         = Verkaufs-Brutto − Provision-Brutto
```

**Beispiel:**

```
Netto:         100 EUR
MwSt (19 %):    19 EUR
Brutto:        119 EUR

Provision (15 %): 15 EUR + 2,85 MwSt = 17,85 EUR
Auszahlung:    119 − 17,85 = 101,15 EUR
```

### 5.3 Auszahlungen

**Rhythmus:** Wöchentlich (montags)

**Bedingungen:**

- Mindestbetrag: 10 EUR
- Nur Bestellungen mit Status „Zugestellt"
- Keine offenen Rücksendungen

### 5.4 Rechnungen

**Käufer:** Automatische PDF-Rechnung nach Bestellung  
**Verkäufer:** Gutschrift bei Auszahlung (zeigt Provision als Abzug)

---

## 6. Empfehlungssystem (Matching)

### 6.1 Algorithmus

**Phase 1 — Einfacher Algorithmus (MVP):**

```
Score = Summe(Gewichtung × Erfüllungsgrad) / Summe(Gewichtungen)

Erfüllungsgrad:
  100 % → Zertifikat deckt Kategorie ab
    0 % → nicht abgedeckt
```

**Beispiel:**

```
Profil:       Faire Arbeit 90 % | Umwelt 80 % | Lokal 50 %
Zertifikat:   deckt Faire Arbeit + Umwelt ab

Score = (90 + 80 + 0) / (90 + 80 + 50) = 170/220 = 77 %
```

**Phase 2 — Komplexer Algorithmus:**

- Von Nachhaltigkeitsexperten definiert
- Unterpunkte & Teilerfüllungen berücksichtigt
- Modularer Austausch ohne Frontend-Änderungen

**Technisch:**

- Interface: `calculateMatch(userId, productId) → score`
- Caching für Performance

### 6.2 Produktempfehlungen

- Top-Produkte nach Match-Score auf Startseite
- Filter: „Min. Match-Score" Schieberegler
- **Matching-Breakdown:** „Warum passt das?" — zeigt erfüllte/nicht erfüllte Kategorien

### 6.3 Verkäufer-Insights (Phase 2)

- Durchschnittlicher Match-Score pro Produkt
- Optimierungs-Hinweis: „Zertifikat X würde Score um Y % verbessern"

---

## Nicht-funktionale Anforderungen

### Performance

- Seitenladezeit: < 2 s (Desktop), < 3 s (Mobile)
- API-Response: < 500 ms (95. Perzentil)
- Matching: < 100 ms pro Produkt (gecacht)

### Sicherheit

- HTTPS erzwungen
- DSGVO-konform, Privacy by Design
- Input-Validierung serverseitig
- Rate-Limiting: 100 Req/Min/IP

### Skalierbarkeit

| Phase     | Produkte | Verkäufer | Bestellungen/Monat |
| --------- | -------- | --------- | ------------------ |
| MVP       | 10.000   | 100       | 1.000              |
| Phase 2–3 | 100.000  | 1.000     | 10.000             |

---

## Priorisierung (MoSCoW)

### MUST — Phase 1 (MVP)

- Authentifizierung & Rollen
- Produkt-CRUD
- Einfaches Werteprofil (7 Kategorien)
- Matching (Placeholder)
- Warenkorb & Checkout (registriert)
- Zahlungen
- Zertifikatsverwaltung (IVN)
- Bestellverwaltung
- E-Mail-Benachrichtigungen
- Basis-Auszahlungen

### SHOULD — Phase 2

- Erweitertes Werteprofil
- Gast-Checkout
- Wunschliste
- Verkäufer-Analytics
- GOTS-Zertifikat

### COULD — Phase 3

- Admin-Dashboard
- Review-System
- Weitere Zertifikate
- Mobile App

### WON'T (initial)

- Mehrsprachigkeit
- Multi-Currency
- B2B-Funktionen

---

**Details:** Datenmodell → Dokument 03 | API-Specs → Dokument 06 | Use Cases → Dokument 04
