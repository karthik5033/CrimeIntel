# Upload Troubleshooting Guide

## Issue
Upload failing with error "Failed to upload FIR" on the `/data-ingestion` page.

## Root Cause Analysis

### Possible Causes:
1. **Catalyst SDK Initialization Failure**
   - Environment variables not loaded correctly
   - SDK authentication issues
   - Missing Catalyst credentials

2. **Stratus Bucket Not Created**
   - Bucket `fir_documents` doesn't exist in Catalyst Console
   - Need to create bucket manually

3. **Network/Permission Issues**
   - Firewall blocking Catalyst API calls
   - Insufficient permissions in Catalyst project

4. **Next.js 15 App Router Compatibility**
   - Catalyst SDK needs specific initialization for App Router

## Diagnostic Steps

### Step 1: Check Environment Variables
```bash
# In your terminal, check if env vars are loaded:
echo $CATALYST_PROJECT_ID
echo $CATALYST_ENV
```

Expected values:
- CATALYST_PROJECT_ID: `55949000000013025`
- CATALYST_ENV: `Development`

### Step 2: Check Catalyst Console

1. **Login to Catalyst Console**: https://console.catalyst.zoho.com
2. **Navigate to** → Project "Project-Rainfall"
3. **Go to File Store** → Check if `fir_documents` bucket exists
4. **If not**, create it:
   - Name: `fir_documents`
   - Access: Private
   - Region: Same as your project

### Step 3: Check Server Logs

Look for these logs in your Next.js terminal:
```
📥 Upload API called
📋 Form data received: {...}
📤 Uploading FIR PDF: filename.pdf (XXX KB)
🔧 Initializing Catalyst SDK with config: {...}
✅ Uploaded to Stratus: file_id
💾 Creating FIR record: FIR-XXXX
✅ FIR record created in Data Store
```

If you see errors like:
- `❌ Stratus upload failed:` → Bucket doesn't exist or SDK issue
- `❌ DataStore insert failed:` → Table schema issue (non-blocking)
- `❌ Catalyst SDK Server Initialization failed:` → Configuration issue

### Step 4: Test Catalyst SDK Directly

Create a test file `test-catalyst.js`:
```javascript
const catalyst = require('zcatalyst-sdk-node');

const app = catalyst.initialize({
  project_id: '55949000000013025',
  environment: 'Development'
});

const filestore = app.filestore();
console.log('✅ Catalyst SDK initialized successfully');
console.log('Filestore available:', !!filestore);

filestore.getAllBuckets()
  .then(buckets => {
    console.log('Available buckets:', buckets.map(b => b.bucket_name));
  })
  .catch(err => {
    console.error('❌ Failed to get buckets:', err.message);
  });
```

Run it:
```bash
cd crimeintel
node test-catalyst.js
```

## Solutions

### Solution 1: Create Stratus Bucket

1. Go to Catalyst Console → File Store
2. Click "Create Bucket"
3. Name: `fir_documents`
4. Access: Private
5. Click Create

### Solution 2: Check Catalyst Authentication

Catalyst SDK needs either:
1. **Environment Variables** (for local development)
2. **Catalyst CLI** authentication (`catalyst login`)

To authenticate:
```bash
npm install -g zcatalyst-cli
catalyst login
```

### Solution 3: Use Development Mode (Mock Data)

If Catalyst is not available, enable mock mode:

Update `.env.local`:
```env
USE_MOCK_CATALYST=true
```

This will use local filesystem instead of Stratus for testing.

### Solution 4: Verify Package Installation

```bash
cd crimeintel
npm list zcatalyst-sdk-node
# Should show: zcatalyst-sdk-node@3.4.0

# If not installed:
npm install zcatalyst-sdk-node@latest
```

### Solution 5: Check Next.js Build

Clear Next.js cache and rebuild:
```bash
cd crimeintel
Remove-Item -Recurse -Force .next
npm run dev
```

## Enhanced Error Display

I've updated the upload API to show detailed errors:
- Exact error messages from Catalyst
- Stack traces in development mode
- Separate errors for Stratus vs DataStore failures

To see the full error:
1. Open browser DevTools (F12)
2. Go to Network tab
3. Click the failed `/api/upload` request
4. Check the Response tab for `details` field

## Testing Workflow

### Test 1: Basic Upload
1. Navigate to http://localhost:3000/data-ingestion
2. Upload a sample PDF (under 10MB)
3. Fill FIR details
4. Click "Process FIR Document"
5. Check browser console and server logs

### Test 2: Server Logs
Look for these specific log messages:
```
📥 Upload API called
📋 Form data received: { fileName: 'xxx.pdf', fileSize: XXX, ... }
🔧 Initializing Catalyst SDK with config: { project_id: '...', environment: '...' }
📤 Uploading FIR PDF: xxx.pdf (XXX KB)
✅ Uploaded to Stratus: file_id_here
💾 Creating FIR record: FIR-1234567890
✅ FIR record created in Data Store
```

### Test 3: Network Request
Check the actual API request in DevTools:
- Method: POST
- URL: http://localhost:3000/api/upload
- Headers: Content-Type: multipart/form-data
- Body: Should contain file + metadata
- Response: Should have `success: true` and `data` object

## Common Errors

### Error: "Catalyst SDK cannot be used on the client"
**Cause**: Trying to use Catalyst SDK in browser code
**Solution**: This should not happen with our implementation - check if getCatalystApp() is called from client component

### Error: "Failed to initialize Catalyst SDK"
**Cause**: Missing environment variables or invalid configuration
**Solution**: Check .env.local file has CATALYST_PROJECT_ID and CATALYST_ENV

### Error: "Bucket not found"
**Cause**: fir_documents bucket doesn't exist in Catalyst
**Solution**: Create the bucket in Catalyst Console

### Error: "Network request failed"
**Cause**: Cannot connect to Catalyst servers
**Solution**: Check internet connection, firewall, VPN

## Quick Fix: Mock Upload

If you need to test the UI without Catalyst working, create a mock endpoint:

`app/api/upload-mock/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get('file') as File;
  
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return NextResponse.json({
    success: true,
    message: 'FIR uploaded successfully (MOCK)',
    data: {
      fileId: 'mock-file-' + Date.now(),
      fileName: file.name,
      fileUrl: `/mock/files/${file.name}`,
      firNumber: `FIR-${Date.now()}`,
      ocrStatus: 'pending',
      uploadTime: new Date().toISOString(),
      fileSize: file.size
    }
  }, { status: 201 });
}
```

Then update data-ingestion page to use `/api/upload-mock` instead of `/api/upload` for testing.

## Need More Help?

1. Share the complete error from browser console
2. Share server terminal logs (look for emoji indicators 📥📋📤✅❌)
3. Verify Catalyst Console access and bucket creation
4. Check if other Catalyst features (DataStore queries) are working

---
**Last Updated**: ${new Date().toLocaleString()}
