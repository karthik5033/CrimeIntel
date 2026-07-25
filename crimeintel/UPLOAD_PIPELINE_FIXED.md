# FIR Upload Pipeline - Integrated Stratus + NoSQL + Data Store

## Issue Fixed

**Problem:** Uploaded PDFs to Stratus bucket "firdocuments" were not updating metadata in NoSQL/Data Store.

**Root Causes:**
1. Bucket name mismatch - code used `fir_documents` (with underscore), actual bucket is `firdocuments` (no underscore - Catalyst doesn't allow underscores)
2. NoSQL metadata table didn't exist
3. Upload route wasn't saving to all three locations

**Solution:** Complete 3-tier integration:
- ✅ Stratus (file storage)
- ✅ DocumentMetadata table (metadata tracking)
- ✅ FIRs table (case records)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     FIR Upload Flow                         │
└─────────────────────────────────────────────────────────────┘

   User uploads PDF via /api/upload
            ↓
┌───────────────────────────────────────────────────────────┐
│  Step 1: Upload to Catalyst Stratus                       │
│  - Bucket: firdocuments (no underscore)                   │
│  - Returns: fileId, fileUrl, fileName                     │
│  - File stored in Stratus object storage                  │
└───────────────────────────────────────────────────────────┘
            ↓
┌───────────────────────────────────────────────────────────┐
│  Step 2: Save Metadata to DocumentMetadata Table          │
│  - Location: Catalyst Data Store                          │
│  - Stores: file_id, file_url, ocr_status, etc.           │
│  - Purpose: Track OCR status, extracted entities          │
└───────────────────────────────────────────────────────────┘
            ↓
┌───────────────────────────────────────────────────────────┐
│  Step 3: Create FIR Record in FIRs Table                  │
│  - Location: Catalyst Data Store                          │
│  - Links: pdf_file_id → Stratus file                     │
│  - Purpose: Criminal case record                          │
└───────────────────────────────────────────────────────────┘
            ↓
      Success Response
```

---

## Setup Instructions

### 1. Verify Stratus Bucket

Go to Catalyst Console → Cloud Scale → Stratus and confirm:
- ✅ Bucket name: `firdocuments` (exactly, no underscore)
- ✅ Bucket created and accessible

If not exists, create it:
```bash
# In Catalyst Console UI:
# Cloud Scale → Stratus → Create Bucket → Name: firdocuments
```

### 2. Create DocumentMetadata Table

Run the setup script:

```bash
cd crimeintel
node scripts/create-document-metadata-table.js
```

This creates a new table in Catalyst Data Store with columns:
- `file_id` - Stratus file identifier
- `file_name` - Original filename
- `file_url` - Public URL to access file
- `bucket_name` - Always "firdocuments"
- `fir_number` - Associated FIR number
- `upload_time` - ISO timestamp
- `file_size` - File size in bytes
- `ocr_status` - pending/processing/completed/failed
- `ocr_text` - Extracted text (populated by OCR pipeline)
- `extracted_entities` - JSON of extracted persons, vehicles, etc.
- `crime_type` - Crime classification
- `police_station` - Station ID
- `description` - Brief description
- `created_at`, `updated_at` - Audit timestamps

### 3. Verify FIRs Table Exists

Check that the `FIRs` table exists (should already be created):
```bash
# Catalyst Console → Data Store → Tables → FIRs
```

---

## Code Changes Made

### 1. Fixed Stratus Bucket Name

**File:** `lib/catalyst/stratus.ts`

```typescript
// OLD (broken):
const FIR_BUCKET_NAME = 'fir_documents';

// NEW (fixed):
const FIR_BUCKET_NAME = 'firdocuments';
```

### 2. Added NoSQL Document Metadata Functions

**File:** `lib/catalyst/nosql.ts`

Added new functions:
- `saveDocumentMetadata()` - Save file metadata after upload
- `updateDocumentOCRStatus()` - Update OCR processing status
- `getDocumentMetadata()` - Retrieve metadata by file ID
- `listDocuments()` - List all uploaded documents

### 3. Updated Upload Route

**File:** `app/api/upload/route.ts`

Now performs **3-step upload**:
1. Upload file to Stratus → get fileId, fileUrl
2. Save metadata to DocumentMetadata table
3. Create FIR record in FIRs table

All three linked by `file_id` and `fir_number`.

---

## API Usage

### Upload FIR PDF

```bash
POST http://localhost:3000/api/upload
Content-Type: multipart/form-data

Body (form-data):
- file: [PDF file]
- firNumber: "FIR-2025-001" (optional)
- description: "Vehicle theft case" (optional)
- crimeType: "Vehicle Theft" (optional)
- policeStation: "Whitefield PS" (optional)
```

**Response:**
```json
{
  "success": true,
  "message": "FIR uploaded successfully to all three locations",
  "data": {
    "fileId": "123456789",
    "fileName": "FIR_FIR-2025-001_2025-01-25T12-30-00.pdf",
    "fileUrl": "https://firdocuments-development.zohostratus.in/...",
    "bucketName": "firdocuments",
    "firNumber": "FIR-2025-001",
    "ocrStatus": "pending",
    "uploadTime": "2025-01-25T12:30:00.000Z",
    "fileSize": 245678
  },
  "storageStatus": {
    "stratus": "✅ Uploaded",
    "metadata": "✅ Saved to DocumentMetadata table",
    "dataStore": "✅ Saved to FIRs table"
  }
}
```

### Get File Metadata

```bash
GET http://localhost:3000/api/upload?fileId=123456789
```

### Delete File

```bash
DELETE http://localhost:3000/api/upload?fileId=123456789
```

---

## Data Flow Verification

### Check File in Stratus
1. Catalyst Console → Cloud Scale → Stratus → firdocuments
2. You should see uploaded files with timestamps

### Check Metadata in Data Store
1. Catalyst Console → Data Store → Tables → DocumentMetadata
2. Query rows to see uploaded file metadata

### Check FIR Records
1. Catalyst Console → Data Store → Tables → FIRs
2. Filter by `pdf_file_id` or `fir_no` to see linked records

### Verify Links
All three should be linked:
- `DocumentMetadata.file_id` = Stratus file ID
- `DocumentMetadata.fir_number` = `FIRs.fir_no`
- `FIRs.pdf_file_id` = Stratus file ID
- `FIRs.pdf_url` = `DocumentMetadata.file_url`

---

## OCR Processing Pipeline (Next Phase)

Once files are uploaded, OCR processing can be triggered:

```typescript
// After upload completes:
const fileId = uploadResult.fileId;

// 1. Update status to "processing"
await CatalystNoSQL.updateDocumentOCRStatus(fileId, 'processing');

// 2. Call OCR API (Catalyst Zia or external)
const ocrText = await performOCR(fileUrl);

// 3. Extract entities (persons, vehicles, etc.)
const entities = await extractEntities(ocrText);

// 4. Update with results
await CatalystNoSQL.updateDocumentOCRStatus(
  fileId, 
  'completed', 
  ocrText, 
  entities
);

// 5. Update FIR record in Data Store
await CatalystDataStore.updateFIR(firNumber, {
  ocr_text: ocrText,
  ocr_status: 'completed'
});
```

---

## Testing

### Test Upload Flow

1. Start dev server:
```bash
npm run dev
```

2. Navigate to upload page:
```
http://localhost:3000/admin/data-loader
```

3. Upload a test PDF

4. Check browser console for logs:
```
📥 Upload API called
✅ FormData parsed successfully
📤 Uploading to Stratus...
✅ Uploaded to Stratus: 123456789
💾 Saving document metadata to NoSQL/DataStore...
✅ Document metadata saved
💾 Creating FIR record in Data Store...
✅ FIR record created in Data Store
```

5. Verify in Catalyst Console:
   - Stratus → firdocuments → see uploaded file
   - Data Store → DocumentMetadata → see metadata row
   - Data Store → FIRs → see FIR record

### Test with cURL

```bash
curl -X POST http://localhost:3000/api/upload \
  -F "file=@test-fir.pdf" \
  -F "firNumber=TEST-001" \
  -F "crimeType=Vehicle Theft" \
  -F "policeStation=Whitefield PS" \
  -F "description=Test upload"
```

---

## Troubleshooting

### Issue: "Bucket not found"

**Solution:** Verify bucket name exactly matches:
```typescript
// In stratus.ts:
const FIR_BUCKET_NAME = 'firdocuments'; // Must match Catalyst Console
```

### Issue: "Table DocumentMetadata doesn't exist"

**Solution:** Run the setup script:
```bash
node scripts/create-document-metadata-table.js
```

### Issue: "File uploaded but no metadata"

**Check:**
1. Browser console for error logs
2. Server logs: `npm run dev` output
3. Catalyst Console → Data Store → check if row inserted

**Common cause:** NoSQL client using wrong table name

### Issue: "Catalyst SDK not initialized"

**Solution:**
1. Check `.env.local` has Catalyst credentials
2. Verify `catalyst.json` project ID matches
3. Run `catalyst login` if needed

---

## Files Modified

| File | Change |
|------|--------|
| `lib/catalyst/stratus.ts` | Fixed bucket name: `fir_documents` → `firdocuments` |
| `lib/catalyst/nosql.ts` | Added `DocumentMetadata` CRUD functions |
| `app/api/upload/route.ts` | Integrated 3-step upload (Stratus + Metadata + FIRs) |
| `scripts/create-document-metadata-table.js` | **NEW** - Table creation script |
| `UPLOAD_PIPELINE_FIXED.md` | **NEW** - This documentation |

---

## Next Steps

### Immediate (Done)
- [x] Fix bucket name mismatch
- [x] Create DocumentMetadata table
- [x] Integrate 3-tier upload pipeline
- [x] Test upload flow

### Next Phase (OCR Pipeline - Phase 20)
- [ ] Integrate Catalyst Zia OCR API
- [ ] Build OCR processing function
- [ ] Extract entities from OCR text
- [ ] Auto-create Person/Vehicle records
- [ ] Link extracted entities to FIR
- [ ] Build OCR review UI

### Future (Advanced Features)
- [ ] Batch upload (multiple PDFs)
- [ ] Progress tracking for large files
- [ ] Image evidence upload (photos)
- [ ] Video evidence upload
- [ ] Audio evidence upload
- [ ] Unified evidence gallery per case

---

## Summary

✅ **Problem Solved:** Upload pipeline now correctly integrates all three Catalyst services:

1. **Stratus** - File storage in `firdocuments` bucket
2. **DocumentMetadata** - OCR status tracking and metadata
3. **FIRs** - Case records with PDF links

All linked by `file_id` and `fir_number` for full traceability.

**Test it:** Upload a PDF and verify it appears in all three locations!

---

**Last Updated:** January 26, 2025  
**Status:** ✅ FIXED AND TESTED
