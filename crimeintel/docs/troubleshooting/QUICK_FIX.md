# 🚀 Quick Fix: File Upload Not Working

## The Problem
```
❌ Upload failed: Failed to upload to Stratus storage
📝 Details: Failed to initialize Catalyst SDK: 
    Unable to find the type of initialization. Kindly specify one
```

## The Solution (2 Minutes)

### Option 1: Automatic Setup (Recommended) ⭐

**Windows:**
1. Open terminal in project folder
2. Run: `.\setup-catalyst.bat`
3. Follow the prompts to login
4. Restart server: `npm run dev`
5. Test: http://localhost:3000/test-upload

**Manual:**
```bash
# 1. Install CLI
npm install -g zcatalyst-cli

# 2. Login (opens browser)
catalyst login

# 3. Verify
catalyst whoami

# 4. Restart server
npm run dev
```

### Option 2: Use Environment Token

1. **Get Token:**
   - Go to https://console.catalyst.zoho.com
   - Select "Project-Rainfall"
   - Settings → API Access → Generate Token

2. **Add to `.env.local`:**
   ```env
   CATALYST_TOKEN=your_token_here_paste_from_console
   ```

3. **Restart:**
   ```bash
   npm run dev
   ```

## Verify It Works

1. Visit: http://localhost:3000/test-upload
2. Click "1. Check Catalyst Status"
3. Should show: ✅ SDK Init: ok
4. Click "4. Test Upload" with a PDF
5. Should show: ✅ Upload successful!

## What Was Fixed

✅ **File handling** - Proper Buffer conversion
✅ **SDK initialization** - 3 authentication strategies
✅ **Error handling** - Detailed logs
✅ **Debug tools** - Test page created

## Common Issues

### "catalyst: command not found"
```bash
npm install -g zcatalyst-cli
```

### "Invalid credentials"
```bash
catalyst logout
catalyst login
```

### "Bucket not found" (but SDK works!)
1. Go to https://console.catalyst.zoho.com
2. File Store → Create Bucket
3. Name: `fir_documents`, Access: Private

## Files Created

- ✅ `CATALYST_AUTH_GUIDE.md` - Detailed authentication guide
- ✅ `FILE_UPLOAD_FIX.md` - Technical implementation details
- ✅ `setup-catalyst.bat` - Automated setup script (Windows)
- ✅ `/test-upload` page - Interactive debug interface

## Support Links

- Test Page: http://localhost:3000/test-upload
- Status Check: http://localhost:3000/api/catalyst-status
- Catalyst Console: https://console.catalyst.zoho.com
- Catalyst Docs: https://docs.catalyst.zoho.com

---
**TL;DR:** Run `catalyst login` then restart your server!
