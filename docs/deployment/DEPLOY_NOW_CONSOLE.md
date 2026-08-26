# 🚀 Deploy CrimeIntel to AppSail - Console Method

**Status:** ✅ All files configured and ready  
**Time Required:** 5 minutes  
**Method:** Catalyst Console (Web Interface)

---

## ⚠️ Why Console Instead of CLI?

The Catalyst CLI (`catalyst appsail:add`) requires **interactive input** that cannot be automated:
- Runtime selection (Catalyst-Managed vs Docker)
- Node.js version selection
- Memory allocation
- Service name input

The **Console web interface is faster and easier** for initial deployment.

---

## 📋 Step-by-Step Instructions

### Step 1: Open Catalyst Console
1. Go to: **https://console.catalyst.zoho.com**
2. Login with your Zoho account
3. You should see: **"Project-Rainfall"**

### Step 2: Navigate to AppSail
1. Click on **"Project-Rainfall"**
2. In the left sidebar, click **"AppSail"**
3. Click the **"+ Add Service"** button (top right)

### Step 3: Choose Runtime Type
1. Select: **"Catalyst-Managed Runtime"**
   *(NOT "Docker Image")*
2. Click **"Next"** or **"Continue"**

### Step 4: Configure Service
Fill in the following details:

**Basic Configuration:**
- **Service Name:** `crimeintel` (or any name you prefer)
- **Runtime Stack:** Select **"Node.js"**
- **Runtime Version:** Select **"Node.js 22"** (or latest available)

**Resource Allocation:**
- **Memory:** `2048 MB` (2 GB)
- **Timeout:** `60` seconds (default is fine)

### Step 5: Connect Repository
Choose one of these methods:

#### Option A: GitHub Integration (Recommended)
1. **Deployment Source:** Select **"Git Repository"**
2. **Git Provider:** Choose **"GitHub"**
3. If not connected yet:
   - Click **"Connect GitHub"**
   - Authorize Catalyst to access your repositories
4. **Select Repository:**
   - Owner: `karthik5033`
   - Repository: `CrimeIntel`
5. **Branch:** `main`
6. **Build Path:** Enter `crimeintel`
   *(This is the subfolder where the Next.js app is located)*

#### Option B: Manual Upload (Alternative)
1. **Deployment Source:** Select **"Upload Files"**
2. Create a zip file of the `crimeintel` folder (excluding `node_modules`)
3. Upload the zip file

### Step 6: Build Configuration
The system should **auto-detect** from `app-config.json`:

```json
{
  "runtime": "node22",
  "memory": "2048",
  "command": "node server.js"
}
```

If not auto-detected, manually enter:
- **Build Command:** `npm install && npm run build`
- **Start Command:** `node server.js`
- **Port:** Leave empty (auto-configured via `X_ZOHO_CATALYST_LISTEN_PORT`)

### Step 7: Environment Variables (Optional)
If you need to add environment variables:
- Click **"Add Environment Variable"**
- Add any required variables from `.env.local`
- **Note:** Database and auth env vars should already be in your `.env.local`

### Step 8: Review and Deploy
1. Review all settings:
   - ✅ Service Name: `crimeintel`
   - ✅ Runtime: Node.js 22
   - ✅ Memory: 2048 MB
   - ✅ Repository: `karthik5033/CrimeIntel`
   - ✅ Branch: `main`
   - ✅ Build Path: `crimeintel`
   - ✅ Start Command: `node server.js`
2. Click **"Create & Deploy"** or **"Deploy"**

---

## 📊 Deployment Progress

You'll see these stages:

```
1. ⏳ Initializing environment
2. ⏳ Cloning repository from GitHub
3. ⏳ Installing dependencies (npm install)
   Expected time: 2-3 minutes
4. ⏳ Building application (npm run build)
   Expected time: 1-2 minutes
5. ⏳ Starting server (node server.js)
   Expected time: 5-10 seconds
6. ✅ Deployment successful!
```

**Total Time:** ~5-7 minutes

---

## 🎯 Expected Deployment URL

After successful deployment, you'll get a URL like:

**Format:**
```
https://crimeintel-60078981781.development.project-rainfall-60078981781.catalyst.zoho.com/
```

Or if custom domain configured:
```
https://crimeintel.catalyst.zoho.com/
```

---

## ✅ Verification Steps

### 1. Check Homepage
- **URL:** `https://your-deployment-url/`
- **Expected:** Login page with KSP branding
- **Status:** Should load without errors

### 2. Test Health API
- **URL:** `https://your-deployment-url/api/health`
- **Expected Response:**
  ```json
  {
    "status": "ok",
    "timestamp": "2025-01-25T10:30:00.000Z"
  }
  ```

### 3. Test Login
1. Click **"Sign In"**
2. Enter credentials:
   - **Email:** `admin@ksp.gov.in`
   - **Password:** `admin123`
3. **Expected:** Redirect to dashboard

### 4. Load Seed Data
1. Navigate to: `/admin/data-loader`
2. Click **"Load Seed Data"** button
3. Wait for success message
4. Go to dashboard - should see data loaded

### 5. Check Logs
In Catalyst Console:
1. AppSail → **crimeintel** service
2. Click **"Logs"** tab
3. Verify server started successfully:
   ```
   ✅ Server listening on port 9000
   ✅ Next.js started
   ```

---

## 🛠 Troubleshooting

### Issue: "Build Failed"

**Symptoms:**
- Deployment stops at "Building application" stage
- Error message in logs

**Solutions:**
1. **Check build locally:**
   ```bash
   cd "c:\Users\Kishan Shetty\Downloads\DATATHON KSP\CrimeIntel\crimeintel"
   npm run build
   ```
2. **Check package.json scripts:**
   - Verify `"build": "next build"` exists
3. **Increase timeout:**
   - Console → Service Settings → Build Timeout → Increase to 300 seconds

---

### Issue: "Server Won't Start"

**Symptoms:**
- Build succeeds but server fails to start
- 502 Bad Gateway errors

**Solutions:**
1. **Check Start Command:**
   - Should be: `node server.js`
   - NOT: `npm start` or `next start`

2. **Check server.js file:**
   - Verify it exists in `crimeintel/` folder
   - Check it reads `X_ZOHO_CATALYST_LISTEN_PORT` correctly

3. **View Logs:**
   - AppSail → Logs → Look for startup errors

---

### Issue: "Out of Memory"

**Symptoms:**
- Build succeeds but crashes during runtime
- "JavaScript heap out of memory" errors

**Solutions:**
1. **Increase Memory:**
   - AppSail → Service → Settings
   - Change memory from 2048 MB to 4096 MB
2. **Redeploy** the service

---

### Issue: "Cannot Connect to Database"

**Symptoms:**
- App loads but shows database connection errors
- 500 errors on API routes

**Solutions:**
1. **Add Environment Variables:**
   - AppSail → Service → Environment Variables
   - Add all vars from `.env.local`:
     ```
     DATABASE_URL=your_database_url
     AUTH_SECRET=your_secret
     NEXT_PUBLIC_API_URL=https://your-deployment-url
     ```
2. **Redeploy** after adding env vars

---

### Issue: "404 Not Found"

**Symptoms:**
- Deployment succeeds but homepage shows 404
- All routes return 404

**Solutions:**
1. **Check Build Path:**
   - Should be set to `crimeintel` (the subfolder)
   - NOT empty or root `/`
2. **Verify Repository Structure:**
   - Ensure `package.json` is in `crimeintel/` folder
3. **Redeploy** with correct build path

---

## 📝 Configuration Files Summary

These files are already in your repository and will be used automatically:

### ✅ `app-config.json`
```json
{
  "runtime": "node22",
  "memory": "2048",
  "command": "node server.js"
}
```
**Purpose:** Tells Catalyst how to run your app

### ✅ `server.js`
```javascript
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const port = process.env.X_ZOHO_CATALYST_LISTEN_PORT || 
             process.env.PORT || 
             3000;
// ... server setup
```
**Purpose:** Custom server that reads Catalyst's port environment variable

### ✅ `.catalystignore`
```
node_modules/
.next/
.git/
*.log
*.md
```
**Purpose:** Excludes unnecessary files from deployment package

### ✅ `next.config.ts`
```typescript
{
  output: 'standalone',
  // ... optimizations
}
```
**Purpose:** Configures Next.js for standalone deployment

### ✅ `package.json`
```json
{
  "scripts": {
    "start": "node server.js",
    "build": "next build"
  }
}
```
**Purpose:** Defines build and start commands

---

## 🎯 Current Repository State

**Latest Commit:** `ed9dc2b`  
**Commit Message:** "docs: Add comprehensive deployment guides"

**All Required Files:**
- ✅ `app-config.json` - AppSail configuration
- ✅ `server.js` - Custom server
- ✅ `.catalystignore` - Deployment exclusions
- ✅ `next.config.ts` - Standalone output enabled
- ✅ `package.json` - Correct scripts
- ✅ All source code and dependencies

**Build Status:**
- ✅ No TypeScript errors
- ✅ No build errors (modularizeImports fixed in commit `efde5df`)
- ✅ All dependencies properly configured

---

## 🚀 Ready to Deploy!

**You're all set!** Just follow the steps above in the Catalyst Console.

**Expected Result:**
- ✅ Deployment completes in ~5-7 minutes
- ✅ App accessible at Catalyst URL
- ✅ Login works
- ✅ All features functional

---

## 📞 Support Resources

- **Catalyst Documentation:** https://docs.catalyst.zoho.com/en/appSail/
- **Console:** https://console.catalyst.zoho.com
- **CLI Reference:** `catalyst help deploy appsail`
- **Community Forum:** https://help.zoho.com/portal/en/community/catalyst

---

## ✅ Deployment Checklist

Before you start, verify:

- [x] Catalyst CLI installed (`catalyst --version` = 1.27.0)
- [x] Project linked to Catalyst (`.catalystrc` exists)
- [x] All code pushed to GitHub main branch
- [x] `app-config.json` configured
- [x] `server.js` created
- [x] Build errors fixed (commit `efde5df`)
- [ ] **NOW: Follow console deployment steps above** 👆

---

**Good luck with deployment! 🎉**

