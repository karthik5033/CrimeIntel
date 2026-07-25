# Catalyst Authentication Guide

## Problem
Catalyst SDK initialization failing with error:
```
Failed to initialize Catalyst SDK: Unable to find the type of initialization. Kindly specify one
```

## Root Cause
The Catalyst SDK requires proper authentication to access Zoho Catalyst services. Next.js App Router (server-side) needs credentials to initialize the SDK.

## Solution: Authenticate with Catalyst CLI

### Step 1: Install Catalyst CLI

```bash
npm install -g zcatalyst-cli
```

### Step 2: Login to Catalyst

```bash
catalyst login
```

This will:
1. Open your browser to Zoho login page
2. Ask you to authenticate
3. Store credentials locally in `~/.zcatalyst` directory
4. Allow SDK to use these credentials automatically

### Step 3: Verify Login

```bash
# List your projects
catalyst project:list

# Should show "Project-Rainfall" (ID: 55949000000013025)
```

### Step 4: Link Project (Optional)

If your current directory is not linked to the project:

```bash
cd "c:\Users\Kishan Shetty\Downloads\DATATHON KSP\CrimeIntel\crimeintel"
catalyst link
# Select "Project-Rainfall" from the list
```

### Step 5: Restart Next.js Server

```bash
# Stop current server (Ctrl+C)
npm run dev
```

### Step 6: Test Upload

Visit http://localhost:3000/test-upload and try uploading a file.

## Alternative: Environment Variable Authentication

If CLI login doesn't work, use environment variables:

### Option A: Using Catalyst Token

1. **Generate Token in Catalyst Console:**
   - Go to https://console.catalyst.zoho.com
   - Select "Project-Rainfall"
   - Settings → API Access → Generate Token
   - Copy the token

2. **Add to `.env.local`:**
   ```env
   CATALYST_TOKEN=your_token_here
   CATALYST_PROJECT_ID=55949000000013025
   CATALYST_ENV=Development
   ```

3. **Restart server:**
   ```bash
   npm run dev
   ```

### Option B: Using OAuth Credentials

1. **Create OAuth Client in Catalyst Console:**
   - Go to https://console.catalyst.zoho.com
   - Select "Project-Rainfall"
   - Settings → OAuth → Create Client
   - Copy Client ID and Client Secret

2. **Add to `.env.local`:**
   ```env
   CATALYST_CLIENT_ID=your_client_id
   CATALYST_CLIENT_SECRET=your_client_secret
   CATALYST_PROJECT_ID=55949000000013025
   CATALYST_ENV=Development
   ```

3. **Restart server:**
   ```bash
   npm run dev
   ```

## Verification Steps

### 1. Check Authentication Status

Visit: http://localhost:3000/api/catalyst-status

Should show:
```json
{
  "status": "ok",
  "checks": {
    "sdkInit": { "status": "ok" },
    "filestore": { "status": "ok" },
    "buckets": { "status": "ok", "hasFirBucket": true }
  }
}
```

### 2. Test Bucket Access

Visit: http://localhost:3000/api/test-bucket

Should show:
```json
{
  "success": true,
  "message": "fir_documents bucket is ready",
  "bucketName": "fir_documents"
}
```

### 3. Test File Upload

1. Go to http://localhost:3000/test-upload
2. Select a PDF file
3. Click "1. Check Catalyst Status" → Should show ✅
4. Click "2. Test Bucket Existence" → Should show ✅
5. Click "4. Test Upload" → Should show ✅ Upload successful

## Current Implementation

The SDK now tries **3 initialization strategies** in order:

### Strategy 1: Automatic (Preferred)
```typescript
catalyst.initialize()
```
Uses `catalyst.json` + CLI credentials automatically.

**Requirements:**
- ✅ `catalyst.json` exists in project root
- ✅ User authenticated via `catalyst login`

### Strategy 2: Token-based
```typescript
catalyst.initialize({
  type: 'token',
  token: process.env.CATALYST_TOKEN,
  project_id: '55949000000013025',
  environment: 'Development'
})
```

**Requirements:**
- ✅ `CATALYST_TOKEN` in `.env.local`
- ✅ Token generated from Catalyst Console

### Strategy 3: OAuth-based
```typescript
catalyst.initialize({
  type: 'oauth',
  client_id: process.env.CATALYST_CLIENT_ID,
  client_secret: process.env.CATALYST_CLIENT_SECRET,
  project_id: '55949000000013025',
  environment: 'Development'
})
```

**Requirements:**
- ✅ `CATALYST_CLIENT_ID` and `CATALYST_CLIENT_SECRET` in `.env.local`
- ✅ OAuth client created in Catalyst Console

## Recommended Approach

### For Development (Local Machine):
✅ **Use CLI Authentication** (`catalyst login`)
- Easy one-time setup
- Credentials managed automatically
- Works across all Catalyst projects

### For Production/CI/CD:
✅ **Use Environment Variables** (Token or OAuth)
- Secure credential storage
- Easy to rotate
- Works in serverless environments

## Troubleshooting

### Error: "Unable to find the type of initialization"

**Cause:** No authentication method configured.

**Solutions:**
1. Run `catalyst login` in terminal
2. OR add `CATALYST_TOKEN` to `.env.local`
3. OR add OAuth credentials to `.env.local`

### Error: "Invalid credentials"

**Cause:** Expired or incorrect credentials.

**Solutions:**
1. Run `catalyst logout` then `catalyst login` again
2. Generate new token in Catalyst Console
3. Verify project ID matches: `55949000000013025`

### Error: "Project not found"

**Cause:** Not authenticated to access this project.

**Solutions:**
1. Verify you have access to "Project-Rainfall" in Catalyst Console
2. Check your Zoho account has correct permissions
3. Try linking project: `catalyst link`

### Error: "Bucket 'fir_documents' not found"

**Cause:** Bucket doesn't exist (but authentication is working!).

**Solution:**
1. Go to https://console.catalyst.zoho.com
2. Select "Project-Rainfall"
3. File Store → Create Bucket
4. Name: `fir_documents`, Access: Private

## Quick Commands Reference

```bash
# Install CLI
npm install -g zcatalyst-cli

# Login
catalyst login

# Check auth status
catalyst whoami

# List projects
catalyst project:list

# Link project
catalyst link

# Logout
catalyst logout

# Check installed version
catalyst --version
```

## Files Modified

| File | Purpose |
|------|---------|
| `lib/catalyst/index.ts` | Multi-strategy SDK initialization |
| `CATALYST_AUTH_GUIDE.md` | This authentication guide |

## Expected Server Logs After Fix

### Success:
```
🔧 Initializing Catalyst SDK...
Environment: { projectId: '55949000000013025', environment: 'Development', ... }
📋 Attempting automatic initialization with catalyst.json...
✅ Automatic initialization successful
```

### Or with Token:
```
🔧 Initializing Catalyst SDK...
⚠️ Automatic initialization failed: ...
🔑 Attempting token-based initialization...
✅ Token-based initialization successful
```

## Next Steps

1. **Authenticate:**
   ```bash
   catalyst login
   ```

2. **Restart Server:**
   ```bash
   npm run dev
   ```

3. **Test Upload:**
   - Visit http://localhost:3000/test-upload
   - Run all tests
   - Verify all show ✅

4. **Use Production Upload:**
   - Go to http://localhost:3000/data-ingestion
   - Upload FIR PDFs
   - Complete pipeline should work

## Support

If still having issues after authentication:

1. Check Catalyst service status: https://status.zoho.com
2. Verify project access in Console: https://console.catalyst.zoho.com
3. Run status check: http://localhost:3000/api/catalyst-status
4. Share the output of: `catalyst whoami` and `catalyst project:list`

---
**Created:** ${new Date().toLocaleString()}
**Quick Start:** Run `catalyst login` then `npm run dev`
