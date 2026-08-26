# 🚀 GitHub Integration Deployment Guide

## Based on Official Catalyst Datathon Documentation

This follows the **exact steps** from the Datathon 2026 deployment guide for connecting GitHub to Catalyst Slate.

---

## ✅ Prerequisites (Already Done)

- [x] Catalyst project created: **Project-Rainfall** (ID: 55949000000013025)
- [x] Code committed to Git
- [x] Production build works: `npm run build` ✅
- [x] GitHub repository exists: **CrimeIntel**

---

## 📋 Step-by-Step Deployment

### Step 1: Push Code to GitHub

```bash
# Ensure all changes are committed
git status

# Add any uncommitted files
git add .

# Commit
git commit -m "Ready for Catalyst deployment via GitHub integration"

# Push to GitHub
git push origin main
```

**Verify:** Go to your GitHub repository and confirm the latest code is there.

---

### Step 2: Access Catalyst Console

1. Open: **https://console.catalyst.zoho.in**
2. Login: **kishanshetty.udupika20@gmail.com**
3. Select: **Project-Rainfall** (55949000000013025)

---

### Step 3: Navigate to Slate (Frontend Hosting)

From the left sidebar:
1. Click: **"Slate"** (under WEB section)
2. You should see your client deployment configuration

---

### Step 4: Connect GitHub Repository

According to the guide: *"You can connect your GitHub repository directly to Catalyst Slate"*

1. Look for: **"Source Control"** or **"GitHub Integration"** button
2. Click: **"Connect GitHub"** or **"Link Repository"**
3. Authorize: **Catalyst** to access your GitHub account
4. Select Repository: **CrimeIntel**
5. Select Branch: **main**
6. Build Path: `/crimeintel` (since your app is in a subdirectory)

---

### Step 5: Configure Build Settings

Based on your `catalyst.json`, configure:

**Build Command:**
```bash
npm install && npm run build
```

**Build Directory:** 
```
crimeintel
```

**Output Directory:**
```
.next
```

**Install Command:**
```bash
npm install
```

**Start Command:**
```bash
npm start
```

---

### Step 6: Configure Environment Variables

In the Slate configuration, add these environment variables:

```env
CATALYST_PROJECT_ID=55949000000013025
CATALYST_ENV=Development
USE_MOCK_CATALYST=false
NODE_ENV=production
NEXT_PUBLIC_CATALYST_PROJECT_ID=55949000000013025
NEXT_PUBLIC_CATALYST_ENV=Development
```

**IMPORTANT:** Do NOT add:
- ❌ `CATALYST_CLIENT_ID` (not needed in deployed environment)
- ❌ `CATALYST_CLIENT_SECRET` (security risk)
- ❌ Any secrets from `.env.local`

---

### Step 7: Enable Auto-Deploy (Optional)

Check the option:
- ✅ **"Auto-deploy on push"**

This means every `git push` to main will trigger automatic deployment.

---

### Step 8: Trigger First Deployment

1. Click: **"Deploy Now"** or **"Trigger Build"**
2. Watch the deployment logs in real-time
3. Wait: **10-15 minutes** for first deployment

**What happens:**
```
→ Cloning repository from GitHub
→ Installing dependencies (npm install)
→ Building Next.js app (npm run build)  
→ Deploying to Catalyst infrastructure
→ Generating deployment URL
✓ Deployment complete!
```

---

### Step 9: Access Deployed App

Once complete, you'll get a URL like:
```
https://project-rainfall-55949000000013025.development.catalystserverless.in
```

Or check in:
- **Slate → Deployments → Live URL**

---

## 🔧 Post-Deployment Configuration

### 1. Whitelist Frontend Domain

According to the guide: *"You must copy your frontend URL and add it to Authentication > Whitelisting"*

1. Copy your deployment URL
2. Go to: **Authentication → Whitelisting**
3. Add: Your deployment URL
4. Enable: **"Enable CORS"**

This allows frontend-backend communication.

---

### 2. Verify Stratus Buckets

Go to: **Stratus** (File Store)

Check these buckets exist:
- ✅ **firdocuments**
- ✅ **evidencefiles**

If missing, create them:
- **Type:** Private
- **Permissions:** Authenticated users only

---

### 3. Verify DataStore Tables

Go to: **Data Store**

Check these tables exist:
- ✅ **FIRs**
- ✅ **Persons**
- ✅ **Vehicles**
- ✅ **PhoneRecords**
- ✅ **EntityRelationships**

**Note:** According to the guide, you may need to temporarily enable "Update" and "Insert" permissions for seeding data.

---

### 4. Configure Table Permissions

For each table in DataStore:

1. Go to: **Scopes and Permissions**
2. For **Application Users**:
   - ✅ Select (read)
   - ✅ Insert (for uploads)
   - ✅ Update (for OCR updates)
3. Click: **Save**

---

## 🧪 Testing Deployed App

### Test 1: Access URL
```
https://your-deployment-url.development.catalystserverless.in
```

Should show your login page ✅

---

### Test 2: Upload FIR PDF

1. Login to deployed app
2. Go to: `/data-ingestion`
3. Upload a test PDF
4. Click: **"Process FIR Document"**

---

### Test 3: Verify Real Stratus Upload

1. Go to: **Catalyst Console**
2. Navigate to: **Stratus → firdocuments bucket**
3. **Your uploaded file should be there!** 🎉

---

### Test 4: Verify DataStore

1. Go to: **Data Store → FIRs table**
2. Click: **"View Data"**
3. **Your FIR record should be there!** 🎉

---

## 🔍 Troubleshooting

### Issue: Build Fails

**Check deployment logs for:**
- Missing dependencies
- Build errors
- Environment variable issues

**Solution:**
- Ensure `package.json` has all dependencies
- Verify build works locally first
- Check environment variables are set

---

### Issue: "Failed to Parse URL" Errors

**Cause:** Frontend trying to call `/api/*` routes

**Solution:**
- Ensure CORS is enabled
- Check whitelist includes deployment URL
- Verify authentication is configured

---

### Issue: Files Not Uploading to Stratus

**Check:**
1. Stratus bucket exists and is named correctly
2. Authentication is working
3. `USE_MOCK_CATALYST=false` is set
4. No mock mode logs in deployment logs

**Solution:**
- Verify bucket permissions
- Check Catalyst SDK authentication in deployed environment
- Review deployment logs for authentication errors

---

### Issue: Deployment Takes Forever

**Normal:** First deployment takes 10-15 minutes

**If stuck:**
- Cancel and retry
- Check GitHub repository is accessible
- Verify build command is correct
- Contact Catalyst support if persists

---

## 🎯 Expected Results

### Before Deployment (Local):
```
⚠️ Using MOCK Catalyst instance
📤 MOCK: File uploaded
💾 MOCK: Inserting rows
```

### After Deployment (Live):
```
✅ Catalyst SDK authenticated
📤 File uploaded to Stratus: firdocuments
💾 Data saved to Catalyst DataStore
```

---

## 📊 Deployment Checklist

### Pre-Deployment:
- [ ] Code pushed to GitHub
- [ ] `npm run build` works locally
- [ ] `catalyst.json` configured correctly
- [ ] No `.env.local` in repository

### During Deployment:
- [ ] GitHub connected to Catalyst
- [ ] Build settings configured
- [ ] Environment variables set
- [ ] Deployment triggered

### Post-Deployment:
- [ ] Deployment URL accessible
- [ ] Login works
- [ ] Upload test file
- [ ] File appears in Stratus bucket
- [ ] Data appears in DataStore
- [ ] Whitelist configured
- [ ] CORS enabled

---

## 🚀 Continuous Deployment

Once GitHub integration is set up:

```bash
# Make changes locally
git add .
git commit -m "Add new feature"
git push origin main

# ✨ Automatic deployment triggers!
# Wait 5-10 minutes
# Changes live on deployment URL
```

---

## 💡 Alternative: AppSail (If Needed)

According to the guide, if you have issues with standard deployment:

**AppSail** is for existing applications built in:
- Java
- Python  
- Docker images

Your Next.js app should work with **Slate** (standard web hosting), but if you encounter issues, AppSail is an alternative.

---

## 📝 Important Notes from Guide

1. **Functions Timeout:** Standard functions have **30-second timeout**
   - For long OCR/AI processing, use **Job Functions** (15-minute timeout)

2. **CORS Required:** Frontend and backend on different domains
   - Must whitelist frontend URL
   - Must enable CORS checkbox

3. **Permissions:** For data seeding
   - Temporarily enable "Insert" and "Update"
   - Disable after seeding for security

4. **QuickML/AI:** If using LLM features
   - Create Connection with `quickml.deployment.read` scope
   - Store Document IDs in `catalyst-config.json`

---

## 🆘 Need Help?

**Catalyst Support:**
- Email: catalyst-support@zohocorp.com
- Community: https://help.zoho.com/portal/en/community/catalyst
- Documentation: https://catalyst.zoho.com/help/

**Deployment Status:**
- Check: Catalyst Console → Slate → Deployments
- View Logs: Click on deployment to see detailed logs

---

## ✅ Success Criteria

Your deployment is successful when:

1. ✅ Deployment status shows "LIVE"
2. ✅ URL is accessible
3. ✅ Login works
4. ✅ Upload PDF → File appears in Stratus console
5. ✅ Upload PDF → Record appears in DataStore console
6. ✅ No "MOCK mode" messages in logs
7. ✅ All features work end-to-end

---

**Follow this guide exactly as documented in the official Datathon guide for best results!**

