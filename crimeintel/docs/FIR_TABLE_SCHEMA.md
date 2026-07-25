# FIR Table Schema - Phase 1 Enhanced

## Core Fields (Existing)
| Column | Type | Description |
|--------|------|-------------|
| `id` | VARCHAR(50) | Primary key (e.g., "FIR_1") |
| `fir_no` | VARCHAR(100) | Unique FIR number (e.g., "200120146202400001") |
| `case_no` | VARCHAR(100) | Associated case number |
| `crime_type_id` | VARCHAR(50) | Crime type identifier |
| `crime_type_en` | VARCHAR(200) | Crime type in English |
| `crime_type_kn` | VARCHAR(200) | Crime type in Kannada |
| `police_station_id` | VARCHAR(50) | Police station ID |
| `district_id` | VARCHAR(50) | District identifier |
| `date` | DATE | Date of incident |
| `status_en` | VARCHAR(100) | Status (Under Investigation, Pending Trial, Closed, etc.) |
| `description` | TEXT | Brief description/narrative |
| `lat` | DECIMAL(10,6) | Latitude coordinate |
| `lng` | DECIMAL(10,6) | Longitude coordinate |

---

## Phase 1 OCR Fields (NEW)

These fields enable the Intelligence Data Ingestion Pipeline:

| Column | Type | Description | Default |
|--------|------|-------------|---------|
| `pdf_url` | VARCHAR(500) | Stratus URL where FIR PDF is stored | NULL |
| `pdf_file_id` | VARCHAR(100) | Stratus file ID for retrieval | NULL |
| `ocr_text` | TEXT | Full extracted text from OCR | NULL |
| `ocr_status` | VARCHAR(20) | OCR processing status | 'pending' |
| `upload_time` | TIMESTAMP | When PDF was uploaded | NULL |
| `ocr_confidence` | DECIMAL(4,2) | OCR confidence score (0.00-1.00) | NULL |

### OCR Status Values
- `pending` - PDF uploaded, OCR not started
- `processing` - OCR in progress
- `completed` - OCR successfully extracted text
- `failed` - OCR extraction failed

---

## Phase 1 Pipeline Flow

```
1. Officer uploads FIR.pdf
   ↓
2. POST /api/upload
   - Stores PDF in Stratus
   - Creates FIR record with:
     * pdf_url = "stratus://bucket/file"
     * ocr_status = 'pending'
     * upload_time = NOW()
   ↓
3. POST /api/ocr (triggered automatically or manually)
   - Updates ocr_status = 'processing'
   - Downloads PDF from pdf_url
   - Runs Zia OCR
   - Updates:
     * ocr_text = extracted text
     * ocr_status = 'completed'
     * ocr_confidence = 0.95
   ↓
4. POST /api/extract (entity extraction)
   - Reads ocr_text
   - Extracts: Persons, Vehicles, Phones, etc.
   ↓
5. Knowledge Graph & Search Index built
```

---

## Data Store Table Creation (Catalyst Console)

**Note**: Catalyst Data Store tables must be created via the Catalyst Console. Use these definitions:

### Add New Columns to Existing FIRs Table

```sql
-- Via Catalyst Console > Data Store > FIRs Table > Edit Schema
-- Add these columns:

pdf_url           VARCHAR(500)    NULL
pdf_file_id       VARCHAR(100)    NULL
ocr_text          TEXT            NULL
ocr_status        VARCHAR(20)     DEFAULT 'pending'
upload_time       TIMESTAMP       NULL
ocr_confidence    DECIMAL(4,2)    NULL
```

---

## Sample Record (After Phase 1)

```json
{
  "id": "FIR_1001",
  "fir_no": "200120146202600001",
  "case_no": "202600001",
  "crime_type_en": "Armed Robbery",
  "police_station_id": "PS_146",
  "date": "2026-07-25",
  "status_en": "Under Investigation",
  "description": "Armed robbery reported at Whitefield",
  "lat": 12.9698,
  "lng": 77.7499,
  
  // Phase 1 Fields
  "pdf_url": "fir_documents/FIR_200120146202600001_2026-07-25.pdf",
  "pdf_file_id": "8472638472364",
  "ocr_text": "FIRST INFORMATION REPORT\n\nFIR No: 200120146202600001\nDate: 25/07/2026\nStation: Whitefield PS\n\nComplainant: Rahul Kumar\nMobile: 9876543210\nAddress: 123 Main Road, Bengaluru\n\nIncident Description:\nOn 25th July 2026 at approximately 10:30 PM, the complainant was robbed at gunpoint near the ITPL junction. The accused was wearing a black mask and fled on a motorcycle bearing registration number KA03AB4567...",
  "ocr_status": "completed",
  "upload_time": "2026-07-25T14:30:00Z",
  "ocr_confidence": 0.94
}
```

---

## ZCQL Query Examples

### Get pending OCR tasks
```sql
SELECT fir_no, pdf_url, upload_time 
FROM FIRs 
WHERE ocr_status = 'pending' 
ORDER BY upload_time DESC
```

### Get FIRs with low OCR confidence
```sql
SELECT fir_no, ocr_confidence, ocr_status 
FROM FIRs 
WHERE ocr_confidence < 0.80 AND ocr_status = 'completed'
```

### Full-text search in OCR text
```sql
SELECT fir_no, crime_type_en, date 
FROM FIRs 
WHERE ocr_text LIKE '%KA03AB4567%'
```

### Get FIRs uploaded today
```sql
SELECT fir_no, police_station_id, upload_time 
FROM FIRs 
WHERE DATE(upload_time) = CURDATE()
ORDER BY upload_time DESC
```

---

## Migration Steps

1. **Backup existing data** (export from Catalyst Console)
2. **Add new columns** via Catalyst Console > Data Store > FIRs table
3. **Run seed data loader** (will populate new fields as NULL for old records)
4. **Upload new FIRs** via `/api/upload` to test the pipeline

---

## Phase 2 Preview

Future enhancements will add:
- `extracted_entities` (JSON) - Quick reference to linked entities
- `embedding_id` (VARCHAR) - Link to vector embeddings
- `sentiment_score` (DECIMAL) - Narrative sentiment analysis
- `priority_score` (INT) - Auto-calculated investigation priority
