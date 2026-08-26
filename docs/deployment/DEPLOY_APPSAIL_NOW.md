# 🚀 Deploy to Catalyst AppSail - Step by Step

**Time Required:** 5-10 minutes  
**Current Commit:** `d473d2e` (Latest with AppSail config)

---

## Method 1: Deploy via Catalyst Console (Easiest) ⭐

### Step 1: Open Catalyst Console
1. Go to: https://console.catalyst.zoho.com
2. Select your project: **"Project-Rainfall"**

### Step 2: Navigate to AppSail
1. Click on **"AppSail"** in the left sidebar
2. Click **"+ Add Service"** button

### Step 3: Configure the Service
1. **Service Name:** `crimeintel` (or any name you prefer)
2. **Runtime:** Select **"Catalyst Managed Runtime"**
3. **Stack:** Choose **"Node.js 22"**

### Step 4: Connect Repository
1. **Deployment Source:** Select **"Git Repository"**
2. **Git Provider:** Choose **"GitHub"**
3. **Repository:** `karthik5033/CrimeIntel`
4. **Branch:** `main`
5. **Build Path:** `crimeintel/` (the subfolder)

### Step 5: Review Auto-Detected Config
The system should auto-detect from `app-config.json`:
```json
{
  "runtime": "node22",
  "memory": "2048",
  "command": "node server.js"
}
```

If not auto-detected, enter manually:
- **Memory:** `2048 MB`
- **Startup Command:** `node server.js`

### Step 6: Deploy
1. Click **"Create & Deploy"**
2. Monitor the deployment stages:
   - ✅ Cloning repository
   - ✅ Installing dependencies (`npm install`)
   - ✅ Building application (`npm run build`)
   - ✅ Starting server (`node server.js`)

### Step 7: Get Your URL
Once deployed, you'll get a URL like:
- `https://crimeintel-development.catalyst.zoho.com/`
- Or custom domain if configured

---

## Method 2: Deploy via Catalyst CLI (Advanced)

### Step 1: Install Catalyst CLI
```bash
npm install -g zcatalyst-cli
```

### Step 2: Login to Catalyst
```bash
catalyst login
```
This will open a browser for authentication.

### Step 3: Navigate to Project
```bash
cd "c:\Users\Kishan Shetty\Downloads\DATATHON KSP\CrimeIntel\crimeintel"
```

### Step 4: Initialize Catalyst Project
```bash
catalyst init
```
Select your project when prompted: **Project-Rainfall**

### Step 5: Add AppSail Service
```bash
catalyst appsail:add
```
Follow the prompts:
- **Service Name:** `crimeintel`
- **Runtime:** `Node.js 22`
- **Memory:** `2048 MB`

### Step 6: Deploy
```bash
catalyst deploy
```

### Step 7: View Logs
```bash
catalyst logs:appsail --service crimeintel
```

---

## Method 3: Manual File Upload (If Git Fails)

### Step 1: Create Deployment Package
```bash
cd "c:\Users\Kishan Shetty\Downloads\DATATHON KSP\CrimeIntel\crimeintel"

# Build the app
npm run build

# Create a zip excluding unnecessary files
# (Use .catalystignore to guide what to exclude)
```

### Step 2: Upload to Console
1. AppSail → Add Service → Upload Files
2. Upload the zip
3. Configure runtime and memory
4. Deploy

---

## 🔍 Verification After Deployment

### 1. Check Homepage
Visit: `https://your-app.catalyst.zoho.com/`
- Should show the login page
- No 404 or server errors

### 2. Test API Health
Visit: `https://your-app.catalyst.zoho.com/api/health`
Expected response:
```json
{"status": "ok", "timestamp": "2025-01-25T05:00:00.000Z"}
```

### 3. Test Login
1. Go to login page
2. Enter credentials:
   - **Username:** `admin@ksp.gov.in`
   - **Password:** `admin123`
3. Should redirect to dashboard

### 4. Load Seed Data
1. Navigate to: `/admin/data-loader`
2. Click **"Load Seed Data"**
3. Wait for success message
4. Verify data appears in dashboard

---

## 🛠 Troubleshooting

### Issue: "Build Failed"
**Check:**
```bash
# Verify build works locally
npm run build
```
**Fix:** Ensure all dependencies are in `dependencies` not `devDependencies`

### Issue: "Server Won't Start"
**Check Logs:**
- Console → AppSail → Service → Logs
- Look for port binding errors

**Fix:**
- Verify `server.js` exists
- Check `package.json` has `"start": "node server.js"`

### Issue: "502 Bad Gateway"
**Cause:** Server crashed or port mismatch

**Fix:**
1. Check environment variables are set
2. Verify `X_ZOHO_CATALYST_LISTEN_PORT` is being used
3. Restart service

### Issue: "Out of Memory"
**Fix:**
1. Edit `app-config.json`:
   ```json
   {
     "memory": "4096"
   }
   ```
2. Redeploy

---

## 📊 Expected Deployment Time

- **Clone:** ~30 seconds
- **Install:** ~2-3 minutes (all npm packages)
- **Build:** ~1-2 minutes (`next build`)
- **Start:** ~5-10 seconds
- **Total:** ~5 minutes

---

## 🎯 Current Configuration Summary

### Files Committed:
✅ `app-config.json` - AppSail runtime config  
✅ `server.js` - Custom server with Catalyst port  
✅ `.catalystignore` - Exclude unnecessary files  
✅ `package.json` - Has `"start": "node server.js"`  
✅ `next.config.ts` - Has `output: 'standalone'`  

### Environment:
- **Runtime:** Node.js 22
- **Memory:** 2048 MB (2 GB)
- **Port:** Auto-configured via `X_ZOHO_CATALYST_LISTEN_PORT`
- **Build Output:** `.next/standalone` directory

### GitHub:
- **Repository:** `github.com/karthik5033/CrimeIntel`
- **Branch:** `main`
- **Latest Commit:** `d473d2e`

---

## ✅ Ready to Deploy!

Choose **Method 1** (Console) for easiest deployment, or **Method 2** (CLI) for more control.

All configurations are in place. Just follow the steps above and your CrimeIntel app will be live on Catalyst AppSail! 🚀

---

**Need Help?**
- Catalyst Docs: https://docs.catalyst.zoho.com/en/appSail/
- CLI Reference: `catalyst help appsail`
- Console: https://console.catalyst.zoho.com/

