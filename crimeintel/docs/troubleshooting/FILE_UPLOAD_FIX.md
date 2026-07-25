# File Upload Fix - Detailed Guide

## Problem
Upload failing with "Failed to upload to Stratus storage" error on the data-ingestion page.

## Root Causes Identified
1. **File conversion issue** - File object not properly converted to Buffer
2. **Missing bucket** - `fir_documents` bucket may not exist in Catalyst
3. **Insufficient logging** - Hard to debug without detailed logs

## Solutions Implemented

### 1. Enhanced File Handling (`lib/catalyst/stratus.ts`)

**Changes:**
✅ Added detailed logging at each step:
- 🔧 Starting upload
- 📝 Filename generation
- 📦 Bucket access
- 🔄 File-to-Buffer conversion
- 📤 Upload progress
- ✅ Success confirmation

✅ Improved file conversion:
```typescript
// Before: Simple conversion
const buffer = Buffer.from(await file.arrayBuffer());

// After: Proper conversion with verification
const arrayBuffer = await file.arrayBuffer();
const fileBuffer = Buffer.from(arrayBuffer);
if (!fileBuffer || fileBuffer.length === 0) {
  throw new Error('File buffer is empty');
}
```

✅ Better filename handling:
- Sanitizes original filename
- Preserves original name in generated filename
- Adds timestamp for uniqueness

### 2. Enhanced Upload API (`app/api/upload/route.ts`)

**Changes:**
✅ Added request validation:
- FormData parsing with error handling
- File object type verification
- Request headers logging

✅ Improved error messages:
- Separate errors for each failure point
- Full error details in response
- Stack traces in development mode

### 3. Created Diagnostic Tools

#### A. Bucket Test Endpoint (`/api/test-bucket`)
Tests if the `fir_documents` bucket exists and is accessible.

**Usage:**
```bash
curl http://localhost:3000/api/test-bucket
```

**Response:**
```json
{
  "success": true,
  "message": "fir_documents bucket is ready",
  "availableBuckets": ["fir_documents", "evidence_files"],
  "bucketName": "fir_documents"
}
```

#### B. Catalyst Status Endpoint (`/api/catalyst-status`)
Comprehensive system health check.

**Usage:**
```bash
curl http://localhost:3000/api/catalyst-status
```

#### C. Test Upload Page (`/test-upload`)
Interactive debug page with step-by-step testing.

**Features:**
- File selection and validation
- Catalyst status check
- Bucket existence test
- File reading test
- Full upload test
- Real-time debug logs
- JSON result viewer

## How to Fix Your Upload Issue

### Step 1: Access Test Upload Page
Navigate to: **http://localhost:3000/test-upload**

### Step 2: Run Diagnostic Tests

1. **Select a PDF file** (under 10MB)

2. **Run Test 1: Check Catalyst Status**
   - Click "1. Check Catalyst Status"
   - Verify all checks show "ok" status
   - Look for environment variables, SDK init, filestore, buckets

3. **Run Test 2: Test Bucket Existence**
   - Click "2. Test Bucket Existence"
   - Should show: "fir_documents bucket is ready"
   - If not, see "Creating the Bucket" below

4. **Run Test 3: Test File Reading**
   - Click "3. Test File Reading"
   - Should show file size, header (%PDF), valid PDF confirmation
   - If fails, file may be corrupted

5. **Run Test 4: Test Upload**
   - Click "4. Test Upload"
   - Watch debug logs for detailed progress
   - Should show: "✅ Upload successful!"

### Step 3: Check Debug Logs

Look for these log messages:

**Success Pattern:**
```
✅ File selected: document.pdf
📊 Size: 52341 bytes
📤 Starting upload test...
📨 Sending request...
📬 Response status: 201 Created
✅ Upload successful!
📄 File ID: 12345...
```

**Failure Pattern:**
```
✅ File selected: document.pdf
📤 Starting upload test...
❌ Upload failed: Failed to upload to Stratus storage
📝 Details: Bucket 'fir_documents' not found
```

## Creating the fir_documents Bucket

If the bucket doesn't exist:

### Via Catalyst Console (Recommended):
1. Go to https://console.catalyst.zoho.com
2. Select your project: **Project-Rainfall** (ID: 55949000000013025)
3. Navigate to **File Store** in left sidebar
4. Click **"Create Bucket"** button
5. Enter:
   - **Bucket Name:** `fir_documents`
   - **Access:** Private
   - **Region:** Same as your project
6. Click **Create**
7. Repeat for `evidence_files` bucket

### Via Catalyst CLI:
```bash
# Install CLI if not installed
npm install -g zcatalyst-cli

# Login
catalyst login

# Create bucket (if supported by your CLI version)
catalyst bucket:create fir_documents --private
```

## Understanding the Upload Flow

### Normal Upload Flow:
```
1. Frontend: User selects PDF file
   ↓
2. Frontend: Creates FormData with file
   ↓
3. Backend: Receives FormData in /api/upload
   ↓
4. Backend: Validates file (type, size)
   ↓
5. Backend: Converts File → ArrayBuffer → Buffer
   ↓
6. Backend: Gets Catalyst filestore
   ↓
7. Backend: Gets fir_documents bucket
   ↓
8. Backend: Uploads buffer to Stratus
   ↓
9. Backend: Creates FIR record in DataStore
   ↓
10. Backend: Returns success response
    ↓
11. Frontend: Shows success, continues pipeline
```

### Where Failures Occur:

**At Step 3:** FormData parsing fails
- **Symptom:** "Failed to parse form data"
- **Fix:** Check request headers, ensure Content-Type is multipart/form-data

**At Step 5:** File conversion fails
- **Symptom:** "File conversion failed"
- **Fix:** File may be corrupted or not a valid File object

**At Step 7:** Bucket not found
- **Symptom:** "Bucket 'fir_documents' not found"
- **Fix:** Create bucket in Catalyst Console

**At Step 8:** Upload to Stratus fails
- **Symptom:** "Failed to upload FIR to Stratus"
- **Fix:** Check Catalyst authentication, network connection

**At Step 9:** DataStore insert fails (non-critical)
- **Symptom:** "DataStore insert failed" (but upload continues)
- **Fix:** Check FIRs table schema, non-blocking error

## Viewing Server Logs

### In Your Terminal:
Look for emoji indicators:
- 📥 = API request received
- 📋 = Form data parsed
- 🔧 = Initializing
- 🔄 = Converting
- 📤 = Uploading
- ✅ = Success
- ❌ = Error

### Example Success Log:
```
📥 Upload API called
Request method: POST
✅ FormData parsed successfully
📋 Form data received: { hasFile: true, fileName: 'doc.pdf', ... }
🔧 Starting uploadFIR...
File type: File
File size: 52341
📝 Generated filename: FIR_TEST-123_2026-07-25T...pdf
📦 Got bucket: fir_documents
🔄 Converting File to Buffer...
✅ Got ArrayBuffer, size: 52341
✅ Converted to Buffer, size: 52341
📤 Uploading to Stratus...
✅ Upload successful!
File ID: 55949000000123456
💾 Creating FIR record: FIR-TEST-123
✅ FIR record created in Data Store
```

### Example Failure Log:
```
📥 Upload API called
✅ FormData parsed successfully
📋 Form data received: { hasFile: true, ... }
🔧 Starting uploadFIR...
📦 Got bucket: fir_documents
❌ Stratus upload error: Error: Bucket 'fir_documents' does not exist
```

## Quick Fixes

### Issue: "Bucket not found"
```bash
# Check available buckets
curl http://localhost:3000/api/test-bucket

# If missing, create in Catalyst Console
# Or use test-upload page to see recommendations
```

### Issue: "File conversion failed"
```bash
# Test file reading
# Go to /test-upload
# Select file
# Click "Test File Reading"
# Check if file header shows "%PDF"
```

### Issue: "SDK initialization failed"
```bash
# Check environment variables
curl http://localhost:3000/api/catalyst-status

# Verify .env.local has:
# CATALYST_PROJECT_ID=55949000000013025
# CATALYST_ENV=Development

# Restart server
# Stop: Ctrl+C
# Start: npm run dev
```

## Testing After Fix

### Test 1: Upload via Test Page
1. Go to http://localhost:3000/test-upload
2. Select a sample PDF
3. Run all 4 tests in order
4. Verify all show ✅ success

### Test 2: Upload via Data Ingestion Page
1. Go to http://localhost:3000/data-ingestion
2. Drag & drop or select a PDF
3. Fill in FIR details
4. Click "Process FIR Document"
5. Watch progress bar go from 0% → 100%

### Test 3: Verify in Catalyst Console
1. Go to https://console.catalyst.zoho.com
2. Navigate to File Store → fir_documents bucket
3. Should see your uploaded file(s)

### Test 4: Check DataStore
1. In Catalyst Console, go to Data Store
2. Open FIRs table
3. Should see FIR record with pdf_url and pdf_file_id

## Files Modified

| File | Purpose |
|------|---------|
| `lib/catalyst/stratus.ts` | Enhanced file handling and logging |
| `app/api/upload/route.ts` | Better error handling and validation |
| `app/api/test-bucket/route.ts` | Bucket existence test |
| `app/(auth)/test-upload/page.tsx` | Interactive debug interface |
| `FILE_UPLOAD_FIX.md` | This guide |

## Still Having Issues?

### 1. Check Catalyst Service Status
Visit: https://status.zoho.com
Verify Catalyst services are operational

### 2. Verify Project Access
- Login to https://console.catalyst.zoho.com
- Verify you can access "Project-Rainfall"
- Check if you have admin/owner permissions

### 3. Try Mock Mode
If Catalyst is unavailable, use mock data for testing:
```typescript
// In .env.local
USE_MOCK_CATALYST=true
```

### 4. Share Diagnostic Results
Run these commands and share the output:
```bash
# 1. Catalyst status
curl http://localhost:3000/api/catalyst-status > status.json

# 2. Bucket test
curl http://localhost:3000/api/test-bucket > bucket.json

# 3. Share these files + terminal logs
```

---
**Created:** ${new Date().toLocaleString()}
**Status:** Ready for testing
**Test Page:** http://localhost:3000/test-upload
