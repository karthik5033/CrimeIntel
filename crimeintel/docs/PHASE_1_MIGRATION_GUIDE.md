# Phase 1 Migration Guide
## Intelligence Data Ingestion Pipeline Setup

This guide walks you through adding OCR capabilities to your existing CrimeIntel system.

---

## Overview

**What's Being Added:**
- PDF upload and storage via Catalyst Stratus
- OCR text extraction using Catalyst Zia
- Entity extraction from OCR text
- Knowledge graph relationships
- Full-text search capabilities

**Impact:**
- ✅ **Non-breaking**: Existing FIRs continue to work
- ✅ **Backward compatible**: Old records have NULL in new fields
- ✅ **Progressive**: New uploads get full pipeline processing

---

## Step 1: Add OCR Columns to FIRs Table

### Option A: Via Catalyst Console (Recommended)

1. **Login to Catalyst Console**
   - Go to: https://console.catalyst.zoho.com
   - Select your project: "Project-Rainfall"

2. **Navigate to Data Store**
   - Left sidebar → Data Store
   - Click on "FIRs" table

3. **Add Each Column**

Click "Edit Schema" or "Add Column" button, then add:

#### Column 1: pdf_url
```
Name:        pdf_url
Type:        VARCHAR
Max Length:  500
Mandatory:   NO (unchecked)
Default:     (leave empty)
Description: Stratus storage URL for FIR PDF
```

#### Column 2: pdf_file_id
```
Name:        pdf_file_id
Type:        VARCHAR
Max Length:  100
Mandatory:   NO
Description: Stratus file ID for retrieval
```

#### Column 3: ocr_text
```
Name:        ocr_text
Type:        TEXT
Mandatory:   NO
Description: Full extracted text from OCR
```

#### Column 4: ocr_status
```
Name:        ocr_status
Type:        VARCHAR
Max Length:  20
Mandatory:   NO
Default:     pending
Description: OCR processing status
```

#### Column 5: upload_time
```
Name:        upload_time
Type:        TIMESTAMP
Mandatory:   NO
Description: When PDF was uploaded
```

#### Column 6: ocr_confidence
```
Name:        ocr_confidence
Type:        DECIMAL
Precision:   4
Scale:       2
Mandatory:   NO
Description: OCR confidence score (0.00 to 1.00)
```

4. **Save Changes**
   - Click "Save" or "Update Schema"
   - Wait for confirmation

---

### Option B: Using Helper Script

Run the documentation script:

```bash
cd crimeintel
node scripts/add-ocr-columns.js
```

This will print detailed instructions but **cannot add columns automatically** (Catalyst limitation).

---

## Step 2: Create Stratus Buckets

### Via Catalyst Console

1. **Navigate to File Store**
   - Left sidebar → File Store (Stratus)

2. **Create FIR Documents Bucket**
   ```
   Bucket Name:  fir_documents
   Description:  Storage for uploaded FIR PDFs
   Access:       Private (default)
   ```

3. **Create Evidence Files Bucket** (optional, for future)
   ```
   Bucket Name:  evidence_files
   Description:  Storage for case evidence files
   Access:       Private
   ```

4. **Note the Bucket IDs** (you'll see them in the console)

---

## Step 3: Verify Zia Services

1. **Check Zia Status**
   - Catalyst Console → Zia Services
   - Ensure "OCR" is enabled
   - Check available credits/quota

2. **Test OCR (Optional)**
   - Upload a sample PDF
   - Test OCR extraction
   - Verify text quality

---

## Step 4: Update Environment Variables

Add to `.env.local` (if needed):

```bash
# Catalyst Configuration (already set in .catalystrc)
CATALYST_PROJECT_ID=55949000000013025

# Stratus Buckets
STRATUS_FIR_BUCKET=fir_documents
STRATUS_EVIDENCE_BUCKET=evidence_files

# OCR Settings
ZIA_OCR_ENABLED=true
ZIA_OCR_LANGUAGE=eng,kan,hin
```

---

## Step 5: Deploy New Code

### Already Deployed Files:
- ✅ `lib/catalyst/stratus.ts` - Stratus integration
- ✅ `lib/catalyst/zia-ocr.ts` - OCR extraction
- ✅ `app/api/upload/route.ts` - Upload API
- ✅ `app/api/ocr/route.ts` - OCR processing API

### Install Dependencies (if needed):
```bash
npm install
```

### Restart Development Server:
```bash
npm run dev
```

---

## Step 6: Test the Pipeline

### 6.1 Test Upload

```bash
# Create a test FIR PDF (or use existing)
curl -X POST http://localhost:3000/api/upload \
  -F "file=@sample_fir.pdf" \
  -F "firNumber=TEST001" \
  -F "description=Test upload" \
  -F "policeStation=PS_146" \
  -F "crimeType=Robbery"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "FIR uploaded successfully",
  "data": {
    "fileId": "8472638472364",
    "fileName": "FIR_TEST001_2026-07-25.pdf",
    "fileUrl": "fir_documents/FIR_TEST001_2026-07-25.pdf",
    "firNumber": "TEST001",
    "ocrStatus": "pending",
    "uploadTime": "2026-07-25T14:30:00Z"
  }
}
```

### 6.2 Verify in Data Store

Check Catalyst Console → Data Store → FIRs:
- ✅ New row exists
- ✅ `pdf_url` has value
- ✅ `pdf_file_id` has value
- ✅ `ocr_status` = 'pending'
- ✅ `upload_time` is set

### 6.3 Test OCR Extraction

```bash
curl -X POST http://localhost:3000/api/ocr \
  -H "Content-Type: application/json" \
  -d '{
    "firId": "TEST001",
    "fileId": "8472638472364"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "OCR completed successfully",
  "data": {
    "firId": "TEST001",
    "textLength": 1847,
    "confidence": 0.94,
    "language": "en",
    "pageCount": 2
  }
}
```

### 6.4 Verify OCR Results

Check Data Store again:
- ✅ `ocr_status` = 'completed'
- ✅ `ocr_text` contains extracted text
- ✅ `ocr_confidence` = 0.94

---

## Step 7: Integration Checklist

Use this checklist to verify everything works:

```
□ OCR columns added to FIRs table
□ Stratus buckets created (fir_documents, evidence_files)
□ Zia OCR services enabled
□ Code deployed and server running
□ Upload API works (POST /api/upload)
□ PDF stored in Stratus
□ FIR record created with pdf_url
□ OCR API works (POST /api/ocr)
□ OCR text extracted successfully
□ ocr_status updates correctly
□ Can query ocr_text via ZCQL
```

---

## Troubleshooting

### Issue: "Catalyst Stratus not initialized"
**Solution:**
- Verify `.catalystrc` has correct project ID
- Check Stratus is enabled in Catalyst Console
- Ensure buckets are created

### Issue: "Bucket not found"
**Solution:**
- Create buckets via Console (Step 2)
- Check bucket name spelling: `fir_documents` (not `FIR_Documents`)

### Issue: "Zia OCR failed"
**Solution:**
- Enable Zia Services in Console
- Check OCR credits/quota
- Verify PDF is valid (not password-protected)
- Check file size (< 10MB recommended)

### Issue: "Column does not exist"
**Solution:**
- Verify columns added (Step 1)
- Check exact column names (lowercase: `ocr_text` not `OCR_Text`)
- Refresh table schema in console

### Issue: "OCR returns empty text"
**Solution:**
- Check PDF quality (scanned images vs text PDF)
- Try different language settings
- Verify PDF is not corrupted

---

## Rollback Plan

If something goes wrong:

1. **Code Rollback**
   ```bash
   git revert HEAD
   npm run dev
   ```

2. **Keep New Columns** (data safe)
   - New columns with NULL won't affect existing queries
   - Old code ignores new fields

3. **Remove Columns** (if absolutely necessary)
   - Catalyst Console → FIRs table → Edit Schema
   - Delete: `pdf_url`, `pdf_file_id`, `ocr_text`, `ocr_status`, `upload_time`, `ocr_confidence`

---

## Next Phase Preview

After Phase 1 is stable, Phase 2 will add:

1. **Entity Extraction** (POST /api/extract)
   - Extract: Persons, Vehicles, Phones, Locations
   - Auto-populate related tables
   - Link entities to FIRs

2. **Knowledge Graph** (POST /api/graph)
   - Build relationships
   - Create EntityRelationships records
   - Graph visualization data

3. **Embeddings & Search** (GET /api/search)
   - Generate vector embeddings
   - Full-text + semantic search
   - Similarity matching

4. **Upload UI** (/upload page)
   - Drag & drop interface
   - Progress tracking
   - OCR status display

---

## Support

If you encounter issues:

1. Check logs: `crimeintel/.next-dev.log`
2. Verify Catalyst Console status
3. Review schema documentation: `docs/FIR_TABLE_SCHEMA.md`
4. Test APIs individually using curl/Postman

---

**Migration completed successfully? Mark Step 4 as done and proceed to Step 5 (Entity Extraction)! 🎉**
