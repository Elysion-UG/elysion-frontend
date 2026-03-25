# Modul 08: File Upload & Storage
## Spezifikation & Requirements

**Verantwortlichkeit:** Datei-Upload, Speicherung, CDN-Verwaltung  
**Abhängigkeiten:** Modul 01 (Auth)  
**Priorität:** HIGH

---

## 1. Überblick

Dieses Modul verwaltet alle Datei-Uploads der Plattform: Produktbilder, Zertifikats-PDFs, Profilbilder, etc.

### Was das Modul macht:

- **Upload-Handling** - Multipart-Form-Data verarbeiten
- **Validierung** - Dateityp, Größe, Sicherheit
- **Speicherung** - Lokal, S3, Cloudinary, etc.
- **URL-Generierung** - Öffentliche URLs für Frontend
- **CDN-Integration** - Schnelle Auslieferung weltweit
- **Bildoptimierung** - Thumbnails, Kompression, WebP-Konvertierung
- **Löschung** - Aufräumen nicht mehr benötigter Dateien

### Unterstützte Dateitypen:

| Kategorie | Formate | Max. Größe | Verwendung |
|-----------|---------|------------|------------|
| **Produktbilder** | JPEG, PNG, WEBP | 5 MB | Modul 02 |
| **Zertifikate** | PDF, JPEG, PNG | 10 MB | Modul 03 |
| **Profilbilder** | JPEG, PNG | 2 MB | Modul 01 |
| **Shop-Logos** | JPEG, PNG, SVG | 1 MB | Modul 02 |

### Schnittstellen zu anderen Modulen:

**Wird genutzt von:**
- Modul 01: Profilbilder
- Modul 02: Produktbilder, Shop-Logos
- Modul 03: Zertifikats-Dokumente

**Bereitstellt:**
- `uploadFile(file, options)` → URL
- `deleteFile(url)` → Boolean
- `getPublicUrl(filename)` → URL

---

## 2. Datenmodell

### 2.1 File (Optional - für Tracking)

**Hinweis:** Nicht zwingend erforderlich. URLs können direkt in anderen Modulen gespeichert werden.

Wenn Tracking gewünscht:

| Feld | Typ | Pflicht | Bedeutung |
|------|-----|---------|-----------|
| **id** | UUID | Ja | Primärschlüssel |
| **filename** | String | Ja | Original-Dateiname |
| **storedFilename** | String | Ja | Tatsächlicher Dateiname (UUID-basiert) |
| **mimeType** | String | Ja | "image/jpeg", "application/pdf", etc. |
| **size** | Integer | Ja | Dateigröße in Bytes |
| **url** | String | Ja | Öffentliche URL |
| **storageProvider** | Enum | Ja | LOCAL / S3 / CLOUDINARY / GCS |
| **category** | String | Ja | "product_image", "certificate", "profile", etc. |
| **uploadedBy** | UUID | Nein | Welcher User (falls relevant) |
| **relatedEntityType** | String | Nein | "product", "certificate", etc. |
| **relatedEntityId** | UUID | Nein | ID der zugehörigen Entität |
| **isDeleted** | Boolean | Ja | Soft-Delete |
| **createdAt** | Timestamp | Ja | |

**Indizes:**

```sql
CREATE INDEX idx_file_related ON file(relatedEntityType, relatedEntityId);
CREATE INDEX idx_file_uploaded_by ON file(uploadedBy);
```

---

## 3. API-Endpoints

### 3.1 POST /files/upload (Datei hochladen)

**Wer darf:** Jeder eingeloggte User (je nach Kategorie)

**Request (Multipart Form-Data):**

```
file: [Binary File]
category: "product_image" | "certificate" | "profile" | "shop_logo"
relatedEntityId: "uuid" (optional)
```

**Validierung:**

```
1. User authentifiziert:
   if (!req.user):
     throw 401 Unauthorized

2. Kategorie-Permissions:
   if (category == 'product_image' || category == 'shop_logo'):
     if (req.user.role != 'SELLER'):
       throw 403 Forbidden
   
   if (category == 'certificate'):
     if (req.user.role != 'SELLER'):
       throw 403 Forbidden

3. Dateityp validieren:
   allowedTypes = {
     'product_image': ['image/jpeg', 'image/png', 'image/webp'],
     'certificate': ['application/pdf', 'image/jpeg', 'image/png'],
     'profile': ['image/jpeg', 'image/png'],
     'shop_logo': ['image/jpeg', 'image/png', 'image/svg+xml']
   }
   
   if (file.mimeType not in allowedTypes[category]):
     throw 400 Bad Request "Dateityp nicht erlaubt"

4. Dateigröße validieren:
   maxSizes = {
     'product_image': 5 * 1024 * 1024,    # 5 MB
     'certificate': 10 * 1024 * 1024,     # 10 MB
     'profile': 2 * 1024 * 1024,          # 2 MB
     'shop_logo': 1 * 1024 * 1024         # 1 MB
   }
   
   if (file.size > maxSizes[category]):
     throw 400 Bad Request "Datei zu groß"

5. Malware-Scan (optional, aber empfohlen):
   if (scanFile(file) == 'MALICIOUS'):
     throw 400 Bad Request "Datei wurde blockiert"
```

**Workflow:**

```
1. Eindeutigen Dateinamen generieren:
   fileExtension = getExtension(file.originalFilename)
   storedFilename = generateUUID() + fileExtension
   # Beispiel: "a3f7c9e1-4b2d-4e8f-9a1c-7f3e5d8b2c4f.jpg"

2. Datei speichern (je nach Provider):
   
   if (STORAGE_PROVIDER == 'LOCAL'):
     filepath = `/uploads/${category}/${storedFilename}`
     saveToFilesystem(file, filepath)
     url = `${BASE_URL}/uploads/${category}/${storedFilename}`
   
   else if (STORAGE_PROVIDER == 'S3'):
     key = `${category}/${storedFilename}`
     s3.upload(bucket, key, file)
     url = `https://${bucket}.s3.amazonaws.com/${key}`
   
   else if (STORAGE_PROVIDER == 'CLOUDINARY'):
     result = cloudinary.uploader.upload(file, {
       folder: category,
       public_id: storedFilename
     })
     url = result.secure_url

3. Bild optimieren (wenn Bild):
   if (file.mimeType.startsWith('image/')):
     
     # Thumbnails generieren
     if (category == 'product_image'):
       generateThumbnail(file, 200, 200)  # Klein
       generateThumbnail(file, 800, 800)  # Mittel
     
     # WebP-Variante erstellen (bessere Kompression)
     convertToWebP(file)

4. File-Record erstellen (optional):
   INSERT INTO file (
     filename, storedFilename, mimeType, size, url,
     storageProvider, category, uploadedBy, relatedEntityId
   ) VALUES (...)

5. URL zurückgeben:
   return url
```

**Response (201 Created):**

```json
{
  "status": "success",
  "data": {
    "fileId": "file-123",
    "url": "https://cdn.example.com/product_image/a3f7c9e1.jpg",
    "thumbnails": {
      "small": "https://cdn.example.com/product_image/a3f7c9e1_200x200.jpg",
      "medium": "https://cdn.example.com/product_image/a3f7c9e1_800x800.jpg"
    },
    "webp": "https://cdn.example.com/product_image/a3f7c9e1.webp",
    "size": 245678,
    "mimeType": "image/jpeg"
  }
}
```

---

### 3.2 DELETE /files/:id (Datei löschen)

**Wer darf:** User der hochgeladen hat, oder Admin

**Workflow:**

```
1. File holen & validieren:
   file = SELECT * FROM file WHERE id = :id
   
   if (!file):
     throw 404 Not Found
   
   if (file.uploadedBy != req.user.userId && req.user.role != 'ADMIN'):
     throw 403 Forbidden

2. Aus Storage löschen:
   
   if (file.storageProvider == 'LOCAL'):
     deleteFromFilesystem(file.url)
   
   else if (file.storageProvider == 'S3'):
     s3.deleteObject(bucket, key)
   
   else if (file.storageProvider == 'CLOUDINARY'):
     cloudinary.uploader.destroy(file.storedFilename)

3. Thumbnails & WebP löschen (falls vorhanden)

4. Soft-Delete in DB:
   UPDATE file SET isDeleted = true WHERE id = :id
```

**Response (200 OK):**

```json
{
  "status": "success",
  "message": "Datei gelöscht"
}
```

---

### 3.3 GET /files/:id (Datei-Metadaten)

**Wer darf:** Jeder (wenn öffentlich), sonst nur Uploader/Admin

**Response:**

```json
{
  "status": "success",
  "data": {
    "id": "file-123",
    "filename": "produkt-foto.jpg",
    "url": "https://cdn.example.com/product_image/a3f7c9e1.jpg",
    "mimeType": "image/jpeg",
    "size": 245678,
    "createdAt": "2024-02-19T10:00:00Z"
  }
}
```

---

## 4. Storage-Provider

### 4.1 Local Filesystem (Entwicklung)

**Vorteile:**
- Einfach
- Keine Kosten
- Kein Setup

**Nachteile:**
- Nicht skalierbar
- Kein CDN
- Backup manuell

**Verwendung:**

```
Speicherort: /var/www/uploads/
URL: https://example.com/uploads/product_image/a3f7c9e1.jpg

Nginx-Konfiguration:
  location /uploads/ {
    alias /var/www/uploads/;
    expires 1y;
    add_header Cache-Control "public, immutable";
  }
```

---

### 4.2 AWS S3 (Production - empfohlen)

**Vorteile:**
- Unbegrenzt skalierbar
- Günstig (~0.023 USD/GB)
- Hoch verfügbar
- CloudFront CDN
- Backup automatisch

**Setup:**

```
1. S3-Bucket erstellen: "myplatform-uploads"
2. Bucket-Policy (Public Read):
   {
     "Version": "2012-10-17",
     "Statement": [{
       "Sid": "PublicRead",
       "Effect": "Allow",
       "Principal": "*",
       "Action": "s3:GetObject",
       "Resource": "arn:aws:s3:::myplatform-uploads/*"
     }]
   }

3. IAM-User mit Upload-Rechten
4. CloudFront Distribution (CDN)
```

**Code (konzeptionell):**

```
# Upload
s3.putObject({
  Bucket: 'myplatform-uploads',
  Key: 'product_image/a3f7c9e1.jpg',
  Body: fileBuffer,
  ContentType: 'image/jpeg',
  ACL: 'public-read'
})

# URL
url = `https://myplatform-uploads.s3.amazonaws.com/product_image/a3f7c9e1.jpg`

# Mit CloudFront CDN:
url = `https://d123abc.cloudfront.net/product_image/a3f7c9e1.jpg`
```

---

### 4.3 Cloudinary (Alternative)

**Vorteile:**
- Automatische Bild-Optimierung
- On-the-fly Transformationen
- CDN inklusive
- Einfache API

**Nachteile:**
- Teurer als S3
- Vendor Lock-in

**Code:**

```
# Upload
result = cloudinary.uploader.upload(file, {
  folder: 'product_images',
  transformation: [
    { width: 800, crop: 'limit' },
    { quality: 'auto' },
    { fetch_format: 'auto' }
  ]
})

# URL mit on-the-fly Transformation
url = cloudinary.url('a3f7c9e1.jpg', {
  width: 200,
  height: 200,
  crop: 'fill',
  gravity: 'auto'
})
# → https://res.cloudinary.com/.../w_200,h_200,c_fill,g_auto/a3f7c9e1.jpg
```

---

### 4.4 Google Cloud Storage (Alternative)

Ähnlich wie S3, aber Google-Ökosystem.

---

## 5. Bild-Optimierung

### 5.1 Thumbnail-Generierung

**Warum?**

```
Original: 4000×3000px, 3.5 MB
  → Zu groß für Produktliste
  → Lange Ladezeiten

Thumbnails:
  - Klein: 200×200px, 15 KB (Liste)
  - Mittel: 800×800px, 120 KB (Details)
```

**Implementierung:**

```
# Sharp (Node.js Library)
await sharp(inputFile)
  .resize(200, 200, {
    fit: 'cover',
    position: 'center'
  })
  .jpeg({ quality: 80 })
  .toFile('a3f7c9e1_200x200.jpg')

# Oder: ImageMagick
convert input.jpg -resize 200x200^ -gravity center -extent 200x200 output.jpg
```

---

### 5.2 WebP-Konvertierung

**Warum?**

```
JPEG: 245 KB
WebP: 180 KB (26% kleiner, gleiche Qualität!)

Browser-Support: 95%+
```

**Implementierung:**

```
# Sharp
await sharp(inputFile)
  .webp({ quality: 80 })
  .toFile('a3f7c9e1.webp')

# Frontend nutzt dann:
<picture>
  <source srcset="a3f7c9e1.webp" type="image/webp">
  <img src="a3f7c9e1.jpg" alt="...">
</picture>
```

---

### 5.3 Lazy-Loading

**Frontend-Optimierung:**

```html
<img 
  src="placeholder.jpg" 
  data-src="a3f7c9e1.jpg" 
  loading="lazy"
  alt="Produkt"
>
```

---

## 6. Sicherheit

### 6.1 Dateityp-Validierung

**NIEMALS nur auf Dateiendung verlassen!**

```
FALSCH:
  if (filename.endsWith('.jpg')):
    # UNSICHER! .jpg.php möglich

RICHTIG:
  # MIME-Type prüfen (aus Header)
  if (file.mimeType != 'image/jpeg'):
    throw Error
  
  # Magic Bytes prüfen (Datei-Inhalt)
  if (readFirstBytes(file) != JPEG_MAGIC_BYTES):
    throw Error
```

**Magic Bytes:**

```
JPEG: FF D8 FF
PNG:  89 50 4E 47
PDF:  25 50 44 46
```

---

### 6.2 Malware-Scan

**Empfohlen:** ClamAV oder Cloud-Service

```
# ClamAV (Open Source)
scan_result = clamav.scan(file)

if (scan_result == 'FOUND'):
  # Malware detected!
  deleteFile(file)
  logSecurityEvent('malware_upload', user, file)
  throw Error "Datei wurde blockiert"
```

---

### 6.3 Filename-Sanitization

```
Original: "../../etc/passwd.jpg"
  → Path Traversal Attack!

Lösung: UUID-basierte Dateinamen
  storedFilename = generateUUID() + extension
  # a3f7c9e1-4b2d-4e8f-9a1c-7f3e5d8b2c4f.jpg
```

---

### 6.4 Rate-Limiting

```
Max. Uploads pro User:
  - 100 Dateien / Tag
  - 10 Dateien / Stunde
  - 500 MB / Tag (gesamt)

Bei Überschreitung:
  → 429 Too Many Requests
```

---

## 7. Performance

### 7.1 CDN-Integration

**Warum?**

```
User in Tokyo lädt Bild:
  Ohne CDN: Server in Frankfurt → 250ms
  Mit CDN: Edge-Server in Tokyo → 15ms

16× schneller!
```

**Setup:**

```
S3 + CloudFront:
  1. S3-Bucket: myplatform-uploads
  2. CloudFront Distribution: d123abc.cloudfront.net
  3. Custom Domain: cdn.myplatform.com
  
URLs:
  Statt: https://s3.../product_image/a3f7c9e1.jpg
  Nutze: https://cdn.myplatform.com/product_image/a3f7c9e1.jpg
```

---

### 7.2 Cache-Headers

```
# Nginx
location /uploads/ {
  expires 1y;
  add_header Cache-Control "public, immutable";
  add_header Vary "Accept-Encoding";
}

# S3
s3.putObject({
  CacheControl: 'public, max-age=31536000, immutable'
})
```

---

### 7.3 Kompression

```
# Gzip für SVG, PDF
# Brotli für moderne Browser
```

---

## 8. Cleanup & Maintenance

### 8.1 Orphaned Files (Cronjob)

**Problem:** Dateien hochgeladen, aber nie referenziert.

```
Beispiel:
  User lädt Produktbild hoch → URL zurück
  User speichert Produkt NICHT ab
  → Bild existiert, aber wird nirgends genutzt

Lösung: Cleanup-Job (wöchentlich)
```

**Workflow:**

```
1. Finde alle Dateien älter als 7 Tage:
   orphanedFiles = SELECT * FROM file
                   WHERE createdAt < NOW() - INTERVAL '7 days'
                   AND relatedEntityId IS NULL

2. Oder: Finde Dateien die nicht referenziert sind:
   productImageUrls = SELECT url FROM product_images
   certificateUrls = SELECT document_url FROM certificate
   allReferencedUrls = UNION(productImageUrls, certificateUrls, ...)
   
   orphanedFiles = SELECT * FROM file
                   WHERE url NOT IN (allReferencedUrls)
                   AND createdAt < NOW() - INTERVAL '7 days'

3. Löschen:
   for file in orphanedFiles:
     deleteFromStorage(file.url)
     DELETE FROM file WHERE id = file.id
```

---

### 8.2 Soft-Delete Recovery

**Bei versehentlicher Löschung:**

```
# Soft-Deleted Dateien 30 Tage aufbewahren
SELECT * FROM file
WHERE isDeleted = true
AND createdAt < NOW() - INTERVAL '30 days'

# Dann permanent löschen
```

---

## 9. Monitoring

### 9.1 Metriken

```
- Upload-Rate (Dateien/Stunde)
- Fehlgeschlagene Uploads
- Storage-Verbrauch (GB)
- Bandbreite (GB/Tag)
- Durchschnittliche Dateigröße
```

### 9.2 Alerts

```
Wenn:
  - Upload-Fehlerrate > 5%
  - Storage > 80% voll
  - Bandbreite > Budget
  
→ Alert an Admin
```

---

## 10. Kosten-Kalkulation

### AWS S3 (Beispiel)

```
Storage: 100 GB × $0.023/GB = $2.30/Monat
GET-Requests: 1 Mio. × $0.0004/1000 = $0.40/Monat
Transfer: 200 GB × $0.09/GB = $18.00/Monat

CloudFront CDN:
  1 TB Transfer: $85/Monat

Gesamt: ~$105/Monat (bei 1 TB Traffic)
```

### Cloudinary (Beispiel)

```
Free Tier: 25 GB Storage, 25 GB Bandwidth
Plus Plan: $89/Monat (100 GB Storage, 100 GB Bandwidth)
```

---

## 11. Wichtige Hinweise für Entwickler

### 11.1 Streaming-Upload

**Für große Dateien (> 10 MB):**

```
Nicht: Komplette Datei in RAM laden
Sondern: Stream direkt zu S3

# Node.js Beispiel
const stream = fs.createReadStream(file)
s3.upload({
  Bucket: '...',
  Key: '...',
  Body: stream
})
```

### 11.2 Multipart-Upload

**Für sehr große Dateien (> 100 MB):**

```
S3 Multipart Upload:
  - Datei in Chunks (5 MB) aufteilen
  - Parallel hochladen
  - Zusammensetzen

Vorteil: Schneller, Resume bei Fehler
```

### 11.3 Error-Handling

```
try:
  url = uploadToS3(file)
  saveToDatabase(url)
except S3Error:
  # Upload fehlgeschlagen
  throw Error "Upload failed"
except DatabaseError:
  # DB-Fehler → Datei wieder löschen!
  deleteFromS3(url)
  throw Error
```

---

**Der Entwickler entscheidet:**
- Storage-Provider (Local, S3, Cloudinary, GCS)
- Bild-Processing-Library (Sharp, ImageMagick, Pillow)
- CDN-Strategie
- Malware-Scanner (ClamAV, VirusTotal API)
- Cleanup-Strategie
- Projektstruktur
