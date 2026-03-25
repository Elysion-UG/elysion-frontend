# Inkonsistenzen-Report & Aktionsplan
## Stand: 02.03.2026

---

## 1. Aktuelle Dokumenten-Übersicht

| Dokument | Status | Technologie-agnostisch? | Anmerkungen |
|----------|--------|------------------------|-------------|
| **00_Module_Uebersicht** | ❌ ALT | Nein | Enthält Prisma, TypeScript, Zeit-Schätzungen |
| **Modul_01_Authentication** | ✅ NEU | Ja | Komplett überarbeitet |
| **Modul_02_Product_Management** | ✅ NEU | Ja | 12 kritische Punkte korrigiert |
| **Modul_03_Certificate_Management** | ❌ ALT | Nein | Enthält Prisma, Code-Beispiele |
| **Modul_04_Matching_Engine** | ❌ ALT | Nein | Enthält Prisma, Code-Beispiele |
| **Modul_05_Shopping_Cart_Checkout** | ❌ ALT | Nein | Enthält Prisma, Code-Beispiele |
| **Modul_06_Order_Management** | ❌ FEHLT | — | Nur in Kombidokument |
| **Modul_07_Payment_Processing** | ❌ FEHLT | — | Nur in Kombidokument |
| **Modul_08_File_Upload** | ❌ FEHLT | — | Nur in Kombidokument |
| **Modul_09_Admin_Panel** | ❌ FEHLT | — | Nur in Kombidokument |
| **Modul_10_Email_Service** | ❌ FEHLT | — | Nur in Kombidokument |

---

## 2. Gefundene Inkonsistenzen

### 2.1 Modul-Übersicht (00_Module_Uebersicht.md)

**Probleme:**
1. ❌ Enthält Prisma-Schema-Beispiele
2. ❌ Enthält Zeit-Schätzungen (360-460h)
3. ❌ Template mit technologie-spezifischen Abschnitten (DTOs, Hooks, etc.)
4. ❌ Schnittstellen-Beschreibung zu technisch

**Muss korrigiert werden zu:**
- Nur Business-Anforderungen
- Technologie-neutrale Schnittstellen
- Kein Template (Entwickler entscheidet)

---

### 2.2 Modul 01 vs. Modul 02 (Datenmodell-Unterschiede)

**Modul 01:**
- ✅ User-Tabelle korrekt
- ✅ Status-System vorhanden
- ✅ Technologie-agnostisch

**Modul 02:**
- ✅ Product-Tabelle korrekt
- ✅ Status-Maschine definiert
- ✅ Referenziert Modul 01 korrekt

**Inkonsistenz:**
- ⚠️ Modul 02 referenziert `sellerId` → muss `User.id` sein (Modul 01)
- ✅ Passt zusammen

---

### 2.3 Modul 02 vs. Modul 03 (Zertifikats-Verknüpfung)

**Modul 02 erwartet:**
- `verifiedCertificateCount` auf Produkt
- Status ACTIVE nur wenn >= 1 Zertifikat verifiziert
- Zertifikat-Ablauf → Produkt INACTIVE

**Modul 03 (alt) bietet:**
- ❌ Wahrscheinlich noch alte Struktur
- ❌ Muss geprüft werden

**Zu überprüfen:**
- Product-Certificate Mapping
- Verifizierungs-Workflow
- Ablauf-Handling

---

### 2.4 Modul 02 vs. Modul 05 (Warenkorb-Reservierung)

**Modul 02 definiert:**
- Atomare Reservierung mit `UPDATE ... WHERE (stock - reserved) >= X`
- Varianten-Struktur: `variant` + `variant_option`
- SKU auf Varianten-Ebene

**Modul 05 (alt) erwartet:**
- ❌ Wahrscheinlich alte Varianten-Struktur
- ❌ Reservierungs-Logik muss angepasst werden

**Zu korrigieren:**
- Warenkorb muss neue Varianten-Struktur nutzen
- Reservierung muss atomar sein

---

### 2.5 Modul 02 vs. Modul 08 (Bild-Upload)

**Modul 02 erwartet:**
- File-Upload über Modul 08
- Rückgabe: URL
- Speicherung in `product_images`

**Modul 08:**
- ❌ Muss geprüft werden
- ❌ Wahrscheinlich zu technisch

**Zu überprüfen:**
- Schnittstelle klar?
- Technologie-agnostisch?

---

## 3. Aktionsplan

### Phase 1: Kern-Dokumente korrigieren (JETZT)

1. ✅ **Modul 01** - Bereits korrigiert
2. ✅ **Modul 02** - Bereits korrigiert
3. 🔄 **00_Module_Uebersicht** - Neu erstellen (technologie-agnostisch)
4. 🔄 **Modul 03** - Komplett neu (angepasst an Modul 02)
5. 🔄 **Modul 05** - Komplett neu (angepasst an Modul 02)

### Phase 2: Weitere Module erstellen

6. 🔄 **Modul 04** - Neu erstellen
7. 🔄 **Modul 06** - Neu erstellen
8. 🔄 **Modul 07** - Neu erstellen
9. 🔄 **Modul 08** - Neu erstellen
10. 🔄 **Modul 09** - Neu erstellen (optional)
11. 🔄 **Modul 10** - Neu erstellen

### Phase 3: Konsistenz-Prüfung

- Alle Schnittstellen prüfen
- Datenmodell-Referenzen prüfen
- API-Endpoints abstimmen

---

## 4. Kritische Abhängigkeiten

```
Modul 01 (User)
  ↓
Modul 02 (Product) ← benötigt User.id als sellerId
  ↓
Modul 03 (Certificate) ← muss Product.verifiedCertificateCount updaten
  ↓
Modul 04 (Matching) ← nutzt Product + UserProfile
  ↓
Modul 05 (Cart) ← nutzt Variant (neue Struktur!)
  ↓
Modul 06 (Orders) ← nutzt Cart
  ↓
Modul 07 (Payment) ← nutzt Order

Parallel:
Modul 08 (Files) ← wird von 02, 03 genutzt
Modul 10 (Email) ← wird von allen genutzt
```

---

## 5. Zu klärende Punkte

### 5.1 Modul-Reihenfolge

**Frage:** Sollen wir ALLE Module jetzt dokumentieren oder nur die kritischen (01-05)?

**Empfehlung:**
- ✅ Module 01-05: JETZT (kritisch für MVP)
- ⏸️ Module 06-10: SPÄTER (nach Feedback)

### 5.2 Modul 09 (Admin Panel)

**Frage:** Wie detailliert? Frontend-Design oder nur Backend-Endpoints?

**Empfehlung:**
- Nur Backend-Endpoints
- Frontend-Entscheidungen beim Entwickler

### 5.3 Externe API-Integration (Modul 02)

**Frage:** Wann umsetzen? MVP oder später?

**Status:**
- Datenmodell bereits vorbereitet
- Adapter-Pattern definiert
- MVP: Nur manueller Lagerbestand
- Phase 2: API-Integration aktivieren

---

## 6. Nächste Schritte (Priorität)

1. **00_Module_Uebersicht** neu erstellen ← JETZT
2. **Modul_03** neu erstellen (angepasst an 02) ← JETZT
3. **Modul_05** neu erstellen (angepasst an 02) ← JETZT
4. **Modul_04** neu erstellen ← DANN
5. **Module_06-10** einzeln erstellen ← SPÄTER

---

**Soll ich jetzt alle fehlenden/falschen Module neu erstellen?**
