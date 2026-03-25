# Modul 04: Matching Engine
## Spezifikation & Requirements

**Verantwortlichkeit:** Match-Score-Berechnung zwischen User-Profil und Produkten  
**Abhängigkeiten:** Modul 01 (User Profile), Modul 02 (Products), Modul 03 (Certificates)  
**Priorität:** HIGH

---

## 1. Überblick

Die Matching Engine berechnet, wie gut ein Produkt zu den Werten eines Users passt. Je höher der Match-Score (0-100), desto besser passt das Produkt zu den Präferenzen des Users.

### Was das Modul macht:

- **Match-Score berechnen** - Vergleicht User-Werteprofil mit Produkt-Zertifikaten
- **Bulk-Berechnung** - Für Produktlisten (effizient)
- **Personalisierte Sortierung** - Produktliste nach Match-Score sortieren
- **Match-Breakdown** - Zeigt User, warum ein Produkt gut/schlecht passt
- **Empfehlungen** - "Das könnte dir gefallen" basierend auf Profil

### Beispiel:

```
User-Profil (Simple):
  Faire Arbeit:      90
  Umwelt:            85
  Tierwohl:          70
  Soziales:          80
  Kreislauf:         60

Produkt: "Bio-T-Shirt"
  Zertifikate: GOTS (Umwelt + Faire Arbeit), Fair Trade (Soziales)

Match-Score: 87/100
  ✓ Umwelt:       100% Match (GOTS)
  ✓ Faire Arbeit: 100% Match (GOTS + Fair Trade)
  ✓ Soziales:     100% Match (Fair Trade)
  ✗ Tierwohl:       0% Match (kein Zertifikat)
  ✗ Kreislauf:      0% Match (kein Zertifikat)
```

### Schnittstellen zu anderen Modulen:

**Benötigt:**
- Modul 01: User-Profil (simple/extended)
- Modul 02: Produktdaten
- Modul 03: Zertifikatsdaten

**Wird genutzt von:**
- Modul 02: Produktliste zeigt Match-Score an
- Frontend: "Für dich empfohlen" Widget

---

## 2. Datenmodell

**Keine eigenen Tabellen!**

Dieses Modul nutzt nur bestehende Daten:
- `user_profile` (aus Modul 01)
- `products` (aus Modul 02)
- `product_certificate` (aus Modul 03)
- `certificate` (aus Modul 03)

**Optional: Caching-Tabelle (für Performance)**

```sql
CREATE TABLE match_score_cache (
  userId UUID,
  productId UUID,
  score INTEGER,
  calculatedAt TIMESTAMP,
  PRIMARY KEY (userId, productId)
);

CREATE INDEX idx_match_score_user ON match_score_cache(userId, score DESC);
```

**Wann invalidieren:**
- User ändert Profil → Alle Scores für diesen User löschen
- Produkt ändert Zertifikate → Alle Scores für dieses Produkt löschen

---

## 3. Wertekategorien & Zertifikats-Mapping

### 3.1 Die 5 Haupt-Kategorien

| Kategorie | Bedeutung | Beispiel-Zertifikate |
|-----------|-----------|----------------------|
| **Faire Arbeit** | Faire Löhne, sichere Arbeitsbedingungen | Fair Trade, SA8000, BSCI |
| **Umwelt** | Umweltschutz, nachhaltige Materialien | GOTS, EU Ecolabel, Bluesign |
| **Tierwohl** | Tierschutz, keine Tierversuche | Leaping Bunny, PETA, Responsible Down |
| **Soziales** | Gemeinwohl, lokale Gemeinschaften | B Corp, Fairtrade, Social Accountability |
| **Kreislauf** | Recycling, Kreislaufwirtschaft | Cradle to Cradle, GRS (Recycled Standard) |

### 3.2 Zertifikats-Kategorien-Mapping

**Welches Zertifikat deckt welche Kategorie ab?**

```json
{
  "GOTS": ["Umwelt", "Faire Arbeit"],
  "FAIR_TRADE": ["Faire Arbeit", "Soziales"],
  "IVN_BEST": ["Umwelt", "Faire Arbeit", "Tierwohl"],
  "EU_ECOLABEL": ["Umwelt"],
  "BLUESIGN": ["Umwelt"],
  "CRADLE_TO_CRADLE": ["Umwelt", "Kreislauf"],
  "PETA_APPROVED": ["Tierwohl"],
  "B_CORP": ["Soziales", "Umwelt"]
}
```

**Wichtig:** Dieses Mapping muss konfigurierbar sein (Admin-Panel oder Config-File).

---

## 4. Match-Score-Algorithmus

### 4.1 Simple Profile

**User-Profil:**

```json
{
  "activeProfileType": "simple",
  "simpleProfile": {
    "Faire Arbeit": 90,
    "Umwelt": 85,
    "Tierwohl": 70,
    "Soziales": 80,
    "Kreislauf": 60
  }
}
```

**Produkt:**

```json
{
  "id": "product-123",
  "certificates": [
    { "type": "GOTS", "status": "VERIFIED" },
    { "type": "FAIR_TRADE", "status": "VERIFIED" }
  ]
}
```

**Berechnung:**

```
1. Für jede Kategorie prüfen:
   Hat Produkt ein Zertifikat, das diese Kategorie abdeckt?
   
   Faire Arbeit (90):
     GOTS deckt ab → Match!
     Fair Trade deckt ab → Match!
     → Score für diese Kategorie: 90

   Umwelt (85):
     GOTS deckt ab → Match!
     → Score für diese Kategorie: 85

   Tierwohl (70):
     Kein Zertifikat → Kein Match
     → Score für diese Kategorie: 0

   Soziales (80):
     Fair Trade deckt ab → Match!
     → Score für diese Kategorie: 80

   Kreislauf (60):
     Kein Zertifikat → Kein Match
     → Score für diese Kategorie: 0

2. Gesamtscore berechnen (Durchschnitt):
   (90 + 85 + 0 + 80 + 0) / 5 = 51

3. Gewichteter Durchschnitt:
   (90*90 + 85*85 + 0*70 + 80*80 + 0*60) / (90 + 85 + 70 + 80 + 60)
   = (8100 + 7225 + 0 + 6400 + 0) / 385
   = 21725 / 385
   = 56.4
   → Match-Score: 56
```

**Wichtig:** Gewichteter Durchschnitt! Kategorien mit höherer User-Präferenz zählen mehr.

---

### 4.2 Extended Profile

**User-Profil:**

```json
{
  "activeProfileType": "extended",
  "extendedProfile": {
    "Faire Arbeit": {
      "Faire Löhne": 95,
      "Arbeitssicherheit": 85,
      "Gewerkschaften": 70
    },
    "Umwelt": {
      "Bio-Material": 90,
      "Wasserverbrauch": 80,
      "CO2-Reduktion": 75
    },
    ...
  }
}
```

**Berechnung:**

```
1. Für jede Haupt-Kategorie:
   - Prüfe ob Zertifikat vorhanden
   - Wenn JA: Durchschnitt der Sub-Kategorien
   - Wenn NEIN: 0

2. Beispiel "Faire Arbeit":
   GOTS + Fair Trade vorhanden
   → (95 + 85 + 70) / 3 = 83.3

3. Gesamtscore: Gewichteter Durchschnitt aller Haupt-Kategorien
```

**Sub-Kategorien-Mapping:**

Dies muss ebenfalls konfigurierbar sein. Beispiel:

```json
{
  "GOTS": {
    "Umwelt": ["Bio-Material", "Wasserverbrauch", "Chemikalien"],
    "Faire Arbeit": ["Faire Löhne", "Arbeitssicherheit"]
  }
}
```

---

### 4.3 Pseudo-Code

```
function calculateMatchScore(userId, productId):
  
  # 1. User-Profil holen
  user = SELECT * FROM user_profile WHERE userId = :userId
  
  if (user.activeProfileType == 'none'):
    return null  # Kein Profil, kein Score
  
  # 2. Produkt-Zertifikate holen
  certificates = SELECT c.certificateType
                 FROM product_certificate pc
                 JOIN certificate c ON pc.certificateId = c.id
                 WHERE pc.productId = :productId
                 AND c.status = 'VERIFIED'
  
  # 3. Match-Score berechnen
  if (user.activeProfileType == 'simple'):
    return calculateSimpleMatch(user.simpleProfile, certificates)
  else:
    return calculateExtendedMatch(user.extendedProfile, certificates)


function calculateSimpleMatch(profile, certificates):
  
  totalWeightedScore = 0
  totalWeight = 0
  
  for (category, userValue) in profile:
    
    # Prüfe ob ein Zertifikat diese Kategorie abdeckt
    hasMatch = false
    for cert in certificates:
      if (CERT_MAPPING[cert].includes(category)):
        hasMatch = true
        break
    
    if (hasMatch):
      totalWeightedScore += userValue * userValue
    else:
      # Kein Match, Score = 0
      totalWeightedScore += 0
    
    totalWeight += userValue
  
  return round(totalWeightedScore / totalWeight)


function calculateExtendedMatch(profile, certificates):
  
  # Ähnlich, aber mit Sub-Kategorien
  # Erst Sub-Kategorien durchschnitt, dann Haupt-Kategorien
  ...
```

---

## 5. API-Endpoints

### 5.1 GET /products/:slug (mit Match-Score)

**Erweiterung zu Modul 02:**

Wenn User eingeloggt ist UND Profil hat:

```json
{
  "status": "success",
  "data": {
    "id": "product-123",
    "name": "Bio-T-Shirt",
    ...,
    "matchScore": 87,
    "matchBreakdown": {
      "Faire Arbeit": {
        "userValue": 90,
        "hasMatch": true,
        "matchedCertificates": ["GOTS", "Fair Trade"]
      },
      "Umwelt": {
        "userValue": 85,
        "hasMatch": true,
        "matchedCertificates": ["GOTS"]
      },
      "Tierwohl": {
        "userValue": 70,
        "hasMatch": false,
        "matchedCertificates": []
      },
      "Soziales": {
        "userValue": 80,
        "hasMatch": true,
        "matchedCertificates": ["Fair Trade"]
      },
      "Kreislauf": {
        "userValue": 60,
        "hasMatch": false,
        "matchedCertificates": []
      }
    }
  }
}
```

**Wenn User NICHT eingeloggt oder kein Profil:**

```json
{
  ...,
  "matchScore": null,
  "matchBreakdown": null
}
```

---

### 5.2 GET /products (Produktliste mit Match-Score)

**Erweiterung zu Modul 02:**

**Query-Parameter:**

```
?sort=match_score  ← NEU!
```

**Response:**

```json
{
  "status": "success",
  "data": {
    "products": [
      {
        "id": "product-1",
        "name": "Bio-T-Shirt",
        "price": 29.99,
        "matchScore": 87
      },
      {
        "id": "product-2",
        "name": "Recycling-Hose",
        "price": 49.99,
        "matchScore": 72
      }
    ]
  }
}
```

**Backend-Logik:**

```
if (user.isLoggedIn && user.hasProfile):
  
  if (sort == 'match_score'):
    # Bulk-Berechnung für alle Produkte
    scores = calculateBulkMatchScores(user.id, productIds)
    
    # Sortiere nach Score
    products.sort(by: score, desc: true)
```

---

### 5.3 GET /recommendations (Personalisierte Empfehlungen)

**NEU:** Dieser Endpoint ist NUR in Modul 04.

Zeigt Produkte, die besonders gut zum User passen.

**Wer darf:** Nur eingeloggte User mit Profil

**Query-Parameter:**

```
?limit=10  # Max. 10 Empfehlungen
```

**Backend-Logik:**

```
1. Berechne Match-Score für ALLE aktiven Produkte
2. Sortiere nach Score (DESC)
3. Filter: Nur Score >= 70
4. Limit: 10
5. Shuffle leicht (nicht immer die gleichen 10)
```

**Response:**

```json
{
  "status": "success",
  "data": {
    "recommendations": [
      {
        "id": "product-1",
        "name": "Bio-T-Shirt",
        "slug": "bio-t-shirt",
        "price": 29.99,
        "mainImage": "https://...",
        "matchScore": 92,
        "matchReason": "Perfekt für dich: Faire Arbeit & Umwelt"
      },
      {
        "id": "product-2",
        "name": "Fair-Trade Jeans",
        "slug": "fair-trade-jeans",
        "price": 79.99,
        "mainImage": "https://...",
        "matchScore": 88,
        "matchReason": "Top Match: Faire Arbeit & Soziales"
      }
    ]
  }
}
```

**Match-Reason generieren:**

```
if (score >= 90):
  "Perfekt für dich: {top 2 matched categories}"
else if (score >= 75):
  "Top Match: {top 2 matched categories}"
else if (score >= 60):
  "Guter Match: {top 1 matched category}"
```

---

## 6. Performance-Optimierung

### 6.1 Bulk-Berechnung

**Problem:** Produktliste mit 100 Produkten → 100 Match-Score-Berechnungen

**Lösung:** Eine Query für alle:

```sql
SELECT 
  p.id,
  p.name,
  -- Alle Zertifikate des Produkts (aggregiert)
  ARRAY_AGG(c.certificateType) AS certificateTypes
FROM products p
LEFT JOIN product_certificate pc ON p.id = pc.productId
LEFT JOIN certificate c ON pc.certificateId = c.id AND c.status = 'VERIFIED'
WHERE p.status = 'ACTIVE'
GROUP BY p.id

-- Dann: Im Application-Code Match-Score für alle berechnen
```

### 6.2 Caching

**Match-Score cachen:**

```
Key: "match:{userId}:{productId}"
TTL: 1 Stunde

Invalidierung:
  - User ändert Profil → DELETE "match:{userId}:*"
  - Produkt ändert Zertifikat → DELETE "match:*:{productId}"
```

**Empfehlungen cachen:**

```
Key: "recommendations:{userId}"
TTL: 6 Stunden

Invalidierung:
  - User ändert Profil
  - Neue Produkte kommen hinzu (täglich refresh)
```

### 6.3 Materialized View (optional)

**Für sehr hohe Last:**

```sql
CREATE MATERIALIZED VIEW user_product_match AS
SELECT 
  up.userId,
  p.id AS productId,
  calculate_match_score(up.simpleProfile, p.certificates) AS score
FROM user_profile up
CROSS JOIN products p
WHERE up.activeProfileType != 'none'
AND p.status = 'ACTIVE';

-- Refresh täglich
REFRESH MATERIALIZED VIEW CONCURRENTLY user_product_match;
```

---

## 7. Wichtige Hinweise für Entwickler

### 7.1 Zertifikats-Mapping pflegen

**Das Mapping (Zertifikat → Kategorien) MUSS konfigurierbar sein:**

```
Option 1: Config-File (JSON)
  /config/certificate-mapping.json

Option 2: Datenbank-Tabelle
  CREATE TABLE certificate_category_mapping (
    certificateType VARCHAR,
    category VARCHAR
  );

Option 3: Admin-Panel
  Admin kann Mappings verwalten
```

**Warum wichtig?**
- Neue Zertifikate kommen hinzu
- Kategorien können sich ändern
- Mapping muss flexibel sein

---

### 7.2 Null-Handling

**User ohne Profil:**

```
if (!user.profile || user.profile.activeProfileType == 'none'):
  matchScore = null
  matchBreakdown = null
```

**Produkt ohne Zertifikat:**

```
matchScore = 0
matchBreakdown = { alle Kategorien: hasMatch = false }
```

---

### 7.3 Performance-Ziele

| Operation | Ziel | Maximum |
|-----------|------|---------|
| Einzelner Score | < 10ms | 50ms |
| Bulk (100 Produkte) | < 200ms | 1s |
| Empfehlungen | < 500ms | 2s |

**Monitoring:**

```
Wenn Berechnung > 100ms:
  → LogWarnung
  → Prüfe ob Caching funktioniert
  → Prüfe ob Indizes vorhanden
```

---

### 7.4 A/B-Testing vorbereiten

**Verschiedene Algorithmen testen:**

```
Algorithmus A: Gewichteter Durchschnitt (aktuell)
Algorithmus B: Quadratische Gewichtung
Algorithmus C: Logarithmische Skala

→ User in Gruppen einteilen
→ Conversion-Rate messen
→ Besten Algorithmus wählen
```

**Vorbereitung:**

```
CREATE TABLE match_algorithm_config (
  userId UUID,
  algorithm VARCHAR,  # 'weighted_avg', 'quadratic', 'logarithmic'
  assignedAt TIMESTAMP
);
```

---

## 8. Zukünftige Erweiterungen (optional)

### 8.1 Machine Learning

**Später:** ML-Modell trainieren:

```
Input:
  - User-Profil
  - Produkt-Features
  - Zertifikate
  - User-Verhalten (Klicks, Käufe)

Output:
  - Predicted Match-Score

Vorteil: Lernt aus echtem User-Verhalten
```

### 8.2 Collaborative Filtering

**Später:** "User, die dir ähnlich sind, mochten auch..."

```
1. Finde ähnliche User (ähnliches Profil)
2. Schau was die gekauft haben
3. Empfehle ähnliche Produkte
```

### 8.3 Zeitliche Faktoren

**Später:** Match-Score ändert sich über Zeit:

```
Neu hochgeladene Produkte → Boost
Saisonale Produkte → Boost zu relevanter Zeit
Ausverkaufte Produkte → Lower Score
```

---

**Der Entwickler entscheidet:**
- Programmiersprache & Framework
- Datenbank (PostgreSQL empfohlen)
- Caching-System (Redis empfohlen)
- Ob Materialized View oder Application-Side
- Match-Algorithmus-Details (Gewichtung)
- A/B-Testing-Framework
- Projektstruktur
