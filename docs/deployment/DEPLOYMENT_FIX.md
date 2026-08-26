# 🔧 Deployment HTTP 400 Error - Fix Guide

## Error: "Failed to extract Zip file: HTTP status 400"

This error occurs when Catalyst can't extract the deployment package. Here's how to fix it.

---

## ✅ What We Fixed:

1. ✅ Created `.catalystignore` - Excludes unnecessary files
2. ✅ Created `catalyst.json` - Proper deployment configuration
3. ✅ Build is working - No TypeScript errors
4. ✅ Created helper scripts - Automated deployment

---

## 🎯 Quick Fix - Try These in Order:

### Fix #1: Clean Deploy (Most Common Solution)

```powershell
# Run the automated fix script
.\deploy-fix.ps1
```

**What it does:**
- Cleans all build artifacts
- Rebuilds the project
- Verifies required files
- Attempts deployment

---

### Fix #2: Update Catalyst CLI

```powershell
# Update to latest version
npm uninstall -g zcatalyst-cli
npm install -g zcatalyst-cli@latest

# Re-login
catalyst logout
catalyst login

# Try deploying again
catalyst deploy --verbose
```

---

### Fix #3: Manual ZIP Upload (Most Reliable)

```powershell
# Create deployment ZIP
.\create-deploy-zip.ps1

# This creates: crimeintel-deploy.zip
```

**Then upload manually:**

1. Go to: https://console.catalyst.zoho.in
2. Select: **Project-Rainfall**
3. Navigate to: **Client** or **Deployments** section
4. Click: **Upload ZIP** or **Deploy from Archive**
5. Select: `crimeintel-deploy.zip`
6. Configure:
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
7. Click: **Deploy**
8. Wait: 5-10 minutes ⏱️

---

### Fix #4: Deploy Specific Project

```powershell
catalyst deploy --project 55949000000013025 --verbose
```

---

### Fix #5: Check Quota Limits

The HTTP 400 might be due to quota limits:

1. Go to: https://console.catalyst.zoho.in
2. Select: **Project-Rainfall**
3. Check: **Settings → Quotas**
4. Verify:
   - ✅ Storage quota not exceeded
   - ✅ Deployment quota available
   - ✅ No rate limits hit

---

## 🔍 Root Causes of HTTP 400:

| Cause | Solution |
|-------|----------|
| **Too many files** | Use `.catalystignore` ✅ (we created this) |
| **Files too large** | Check `data/` folder, exclude CSVs |
| **Missing config** | Need `catalyst.json` ✅ (we created this) |
| **Corrupt cache** | Clean `.next` and `.catalyst` folders |
| **Outdated CLI** | Update: `npm install -g zcatalyst-cli@latest` |
| **Network timeout** | Use manual ZIP upload instead |
| **Quota exceeded** | Check Catalyst Console quotas |
| **Invalid project** | Verify project ID in `.catalystrc` |

---

## 📊 Files Created to Fix This:

```
✅ .catalystignore     - Excludes large/unnecessary files
✅ catalyst.json       - Proper deployment configuration  
✅ deploy-fix.ps1      - Automated deployment script
✅ create-deploy-zip.ps1 - Manual ZIP creation script
```

---

## 🧪 Test Your Setup:

```powershell
# 1. Verify build works
npm run build

# 2. Check file sizes
Get-ChildItem -Recurse | Where-Object {!$_.PSIsContainer} | Measure-Object -Property Length -Sum

# 3. Verify .catalystignore is working
# node_modules should NOT be in deployment

# 4. Check Catalyst CLI version
catalyst --version

# 5. Verify authentication
catalyst status
```

---

## 🎯 Recommended Approach:

**Try in this order:**

1. **Run `.\deploy-fix.ps1`** ← Start here
   - Automated, handles most issues
   
2. **If CLI times out → Use manual ZIP**
   - Run `.\create-deploy-zip.ps1`
   - Upload via web console
   
3. **If ZIP fails → Check quotas**
   - Go to Catalyst Console
   - Verify limits not exceeded
   
4. **If all fails → Contact support**
   - File size might be the issue
   - May need larger quota

---

## 📦 What Gets Deployed:

### ✅ Included (via .catalystignore):
- `.next/` - Production build
- `app/` - Source code
- `components/` - UI components
- `lib/` - Utilities
- `public/` - Static assets
- `package.json` - Dependencies
- `catalyst.json` - Config

### ❌ Excluded (via .catalystignore):
- `node_modules/` - Too large
- `.env.local` - Secrets
- `*.md` - Documentation
- `*.log` - Log files
- `.next-dev.log` - Dev logs
- `data/` - Large CSV files

---

## 🚨 If Error Persists:

### Option A: GitHub Deployment (Easiest)

1. Push code to GitHub:
   ```bash
   git add .
   git commit -m "Fix deployment configuration"
   git push origin main
   ```

2. Connect GitHub in Catalyst Console:
   - Settings → Integrations → GitHub
   - Enable auto-deploy

3. Benefits:
   - ✅ No CLI needed
   - ✅ Automatic deployments
   - ✅ Better error messages
   - ✅ Version control

### Option B: Reduce Package Size

If your ZIP is too large:

```powershell
# Check data folder size
Get-ChildItem -Path data -Recurse | Measure-Object -Property Length -Sum

# Move large CSV files out temporarily
mkdir ../temp-data
Move-Item data/*.csv ../temp-data/

# Try deploying again
.\create-deploy-zip.ps1
```

### Option C: Catalyst Serve (Development)

Use Catalyst's local development mode:

```powershell
catalyst serve
```

- Runs locally with real Catalyst authentication
- No deployment needed
- Good for testing

---

## 📞 Need More Help?

### Check Catalyst Status:
- https://status.catalyst.zoho.com

### Contact Support:
- From Console: Help → Support
- Email: catalyst-support@zohocorp.com

### Community Forum:
- https://help.zoho.com/portal/en/community/catalyst

---

## ✅ Success Indicators:

You'll know deployment worked when:

1. **No HTTP 400 error** ✅
2. **Deployment status: LIVE** ✅
3. **URL accessible**: https://project-rainfall-60078981781.development.catalystserverless.in ✅
4. **Can upload files → they appear in Stratus** ✅
5. **No more "MOCK mode" logs** ✅

---

## 🎉 After Successful Deployment:

1. Test the deployed URL
2. Upload a PDF → Check Stratus bucket
3. Verify DataStore has records
4. Update environment variables:
   ```env
   USE_MOCK_CATALYST=false
   NODE_ENV=production
   ```

---

**Good luck! The automated scripts should make this much easier.** 🚀
