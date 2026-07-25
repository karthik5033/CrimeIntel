# 🚀 Manual Deployment Guide - Catalyst Web Console

## Why Manual Deployment?

The `catalyst deploy` CLI command keeps timing out. Manual deployment via web console is more reliable and gives you visual feedback.

---

## 📋 Prerequisites

Before starting, make sure you have:
- ✅ Code committed to Git
- ✅ Project built successfully (`npm run build`)
- ✅ Catalyst account logged in
- ✅ Project ID: 55949000000013025

---

## 🎯 Method 1: Deploy via Catalyst Console (RECOMMENDED)

### Step 1: Build Your Project Locally

```bash
# In your project directory
npm run build
```

This creates the `.next` folder with production build.

**⏱️ Wait for it to complete** - shows "Compiled successfully"

---

### Step 2: Create Deployment Package

Create a ZIP file with these contents:
```
crimeintel/
├── .next/                    ← Production build
├── public/                   ← Static assets
├── app/                      ← Source code
├── components/
├── lib/
├── data/
├── package.json
├── package-lock.json
├── next.config.ts
├── tsconfig.json
├── catalyst.json             ← Important!
└── .catalystrc              ← Important!
```

**EXCLUDE:**
- ❌ `node_modules/` (too large)
- ❌ `.git/` (not needed)
- ❌ `.env.local` (secrets)
- ❌ `*.md` documentation files

**Create ZIP:**
```bash
# Windows PowerShell
Compress-Archive -Path .next,public,app,components,lib,data,package.json,package-lock.json,next.config.ts,tsconfig.json,catalyst.json,.catalystrc -DestinationPath crimeintel-deploy.zip
```

---

### Step 3: Upload to Catalyst Console

1. **Go to Catalyst Console**
   - Open: https://console.catalyst.zoho.in
   - Login: kishanshetty.udupika20@gmail.com

2. **Select Project**
   - Click: **Project-Rainfall** (ID: 55949000000013025)

3. **Navigate to Deployments**
   - Look for **"Deploy"** or **"Deployments"** in left sidebar
   - OR go to **Settings → Deployments**

4. **Upload Code**
   - Click **"Deploy from ZIP"** or **"Upload Code"**
   - Select: `crimeintel-deploy.zip`
   - Click **Upload**

5. **Configure Deployment**
   - Environment: **Development**
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Click **Deploy**

6. **Wait for Deployment**
   - ⏱️ Takes 5-10 minutes
   - Watch the progress bar
   - Check logs for errors

7. **Get Deployment URL**
   - Once complete, you'll see: `https://project-rainfall-55949000000013025.development.catalystserverless.in`
   - Click to open your deployed app!

---

## 🎯 Method 2: GitHub Integration (EASIEST)

### Step 1: Push Code to GitHub

```bash
# Make sure all changes are committed
git status
git add .
git commit -m "Prepare for deployment"
git push origin main
```

### Step 2: Connect GitHub to Catalyst

1. **Go to Catalyst Console**
   - https://console.catalyst.zoho.in
   - Select **Project-Rainfall**

2. **Navigate to Settings**
   - Click **Settings** (gear icon)
   - Find **"Source Control"** or **"Integrations"**

3. **Connect GitHub**
   - Click **"Connect GitHub"**
   - Authorize Catalyst to access your repo
   - Select repository: **CrimeIntel**
   - Select branch: **main**

4. **Configure Auto-Deploy**
   - Enable: **"Auto-deploy on push"**
   - Build path: `/crimeintel`
   - Build command: `npm install && npm run build`
   - Start command: `npm start`

5. **Trigger First Deployment**
   - Click **"Deploy Now"**
   - Wait 5-10 minutes
   - Check deployment status

6. **Future Deployments**
   - Every `git push` triggers automatic deployment!
   - View logs in Catalyst Console

---

## 🎯 Method 3: Catalyst CLI (If It Works)

If you want to try CLI again with more verbose output:

```bash
# Clean build first
rm -rf .next
npm run build

# Deploy with verbose logging
catalyst deploy --verbose --log-level debug

# If it fails, check logs
catalyst logs --tail
```

**⚠️ Note:** This keeps timing out for your project, so use Method 1 or 2 instead.

---

## 🔧 Post-Deployment Configuration

### Step 1: Set Environment Variables

1. Go to Catalyst Console → Project-Rainfall
2. Navigate to **Settings → Environment Variables**
3. Add these variables:

```env
CATALYST_PROJECT_ID=55949000000013025
CATALYST_ENV=Development
USE_MOCK_CATALYST=false
NODE_ENV=production
```

### Step 2: Verify Stratus Buckets Exist

1. Go to **Stratus** in left sidebar
2. Check if these buckets exist:
   - ✅ `firdocuments` - for FIR PDFs
   - ✅ `evidencefiles` - for evidence attachments

3. If they don't exist:
   - Click **"Create Bucket"**
   - Name: `firdocuments`
   - Type: **Private**
   - Click **Create**
   - Repeat for `evidencefiles`

### Step 3: Verify DataStore Tables Exist

1. Go to **Data Store** in left sidebar
2. Check if these tables exist:
   - ✅ FIRs
   - ✅ Persons
   - ✅ Vehicles
   - ✅ PhoneRecords
   - ✅ EntityRelationships

3. If they don't exist, run the setup script:
   - Go to **Functions**
   - Run: `SeedFunction` (if it exists)
   - OR manually create tables using the Catalyst Console UI

---

## 🧪 Testing Deployed App

### Step 1: Access Deployed URL

```
https://project-rainfall-55949000000013025.development.catalystserverless.in
```

**Or find it in:**
- Catalyst Console → Project-Rainfall → Settings → Domain

### Step 2: Test Authentication

1. Go to `/login`
2. Login with test credentials
3. Should redirect to `/dashboard`

### Step 3: Test File Upload

1. Go to `/data-ingestion`
2. Upload a test PDF
3. Click **"View FIR Details"**
4. Check if it works!

### Step 4: Verify Real Stratus Upload

1. Go to Catalyst Console → **Stratus** → `firdocuments`
2. **You should see your uploaded PDF!** 🎉
3. This proves real uploads are working!

### Step 5: Verify DataStore

1. Go to Catalyst Console → **Data Store** → `FIRs` table
2. Click **"View Data"**
3. **You should see your FIR record!** 🎉

---

## 🔥 Troubleshooting

### Problem: Build Fails

**Error:** `npm ERR! code ENOENT`

**Solution:**
```bash
# Ensure node_modules are included or installed during deployment
# Update catalyst.json:
{
  "client": {
    "source": ".",
    "buildCommand": "npm install && npm run build",
    "installCommand": "npm install"
  }
}
```

### Problem: "Module not found" errors

**Solution:**
- Make sure all dependencies are in `package.json`
- Check `devDependencies` vs `dependencies`
- TypeScript packages should be in `devDependencies`

### Problem: Environment variables not working

**Solution:**
- Set them in Catalyst Console, not `.env.local`
- `.env.local` is NOT uploaded (in .gitignore)
- Use Catalyst Console → Settings → Environment Variables

### Problem: Deployment takes forever

**Solution:**
- This is normal for Next.js apps (10+ minutes)
- Check deployment logs for progress
- If stuck, cancel and retry

### Problem: 404 errors after deployment

**Solution:**
- Verify `next.config.ts` has correct settings
- Check if dynamic routes are configured
- Restart the deployed app from Catalyst Console

---

## 📊 Deployment Checklist

### Before Deployment:
- [ ] Code committed to Git
- [ ] `npm run build` works locally
- [ ] No TypeScript errors
- [ ] `.gitignore` excludes `.env.local`
- [ ] `catalyst.json` is configured
- [ ] `.catalystrc` exists in project root

### During Deployment:
- [ ] ZIP file created (Method 1) OR GitHub connected (Method 2)
- [ ] Uploaded to Catalyst Console
- [ ] Build command set: `npm install && npm run build`
- [ ] Deployment started
- [ ] Watching logs for errors

### After Deployment:
- [ ] Deployment URL accessible
- [ ] Login works
- [ ] Dashboard loads
- [ ] File upload works
- [ ] Files appear in Stratus console
- [ ] Data appears in DataStore console
- [ ] No console errors in browser

---

## 🎉 Success Indicators

### You'll know it worked when:

1. **Deployment Status: LIVE** ✅
2. **URL opens without errors** ✅
3. **Upload PDF → Check Stratus → File is there!** ✅
4. **Upload PDF → Check DataStore → Record is there!** ✅
5. **No more "MOCK mode" logs** ✅
6. **Real Catalyst services active** ✅

---

## 🚨 If All Else Fails

### Last Resort Option: Use Catalyst Development Server

Instead of deploying, use Catalyst's built-in development server:

```bash
catalyst serve
```

This runs your app in Catalyst environment locally with real authentication!

- URL: http://localhost:3001
- Real Catalyst services work
- No deployment needed
- Perfect for testing

**⚠️ Note:** This also timed out for your project, but worth trying again with a clean build.

---

## 📞 Need Help?

If deployment still fails:

1. **Check Catalyst Status**
   - https://status.catalyst.zoho.com
   - Verify no outages

2. **Contact Catalyst Support**
   - From Console: Help → Support
   - Email: catalyst-support@zohocorp.com

3. **Community Forum**
   - https://help.zoho.com/portal/en/community/catalyst

---

## 🎯 Next Steps After Successful Deployment

1. ✅ Update `.env.local` to point to deployed URL
2. ✅ Set `USE_MOCK_CATALYST=false` in Catalyst Console
3. ✅ Test all features with real services
4. ✅ Continue building Phase 6-15 features
5. ✅ Deploy updates via GitHub auto-deploy

---

**Good luck with deployment! The manual method is much more reliable than CLI.**

