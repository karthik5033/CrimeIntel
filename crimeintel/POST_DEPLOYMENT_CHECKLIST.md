# 📋 Post-Deployment Checklist

## ⏰ Do These While Deployment Is Running (15-20 min wait)

---

## ✅ Step 1: Verify Stratus Buckets (CRITICAL)

### Go to Catalyst Console:
1. Navigate to: **Stratus** (left sidebar under "Storage")
2. Check if these buckets exist:

| Bucket Name | Purpose | Status |
|-------------|---------|--------|
| **firdocuments** | FIR PDF storage | ☐ Exists / ☐ Create |
| **evidencefiles** | Evidence attachments | ☐ Exists / ☐ Create |

### If They Don't Exist, Create Them:

**For `firdocuments`:**
1. Click: **"Create Bucket"**
2. Bucket Name: `firdocuments`
3. Type: **Private**
4. Description: "FIR PDF documents storage"
5. Click: **Create**

**For `evidencefiles`:**
1. Click: **"Create Bucket"**
2. Bucket Name: `evidencefiles`
3. Type: **Private**
4. Description: "Case evidence files"
5. Click: **Create**

---

## ✅ Step 2: Verify DataStore Tables

### Go to: Data Store (left sidebar)

Check if these tables exist:

| Table Name | Purpose | Status |
|------------|---------|--------|
| **FIRs** | FIR records | ☐ Exists / ☐ Will auto-create |
| **Persons** | Person profiles | ☐ Exists / ☐ Will auto-create |
| **Vehicles** | Vehicle records | ☐ Exists / ☐ Will auto-create |
| **PhoneRecords** | Phone data | ☐ Exists / ☐ Will auto-create |
| **EntityRelationships** | Graph connections | ☐ Exists / ☐ Will auto-create |

**Note:** Tables may auto-create on first data insert, but verify they exist.

### If You Need to Create Them Manually:

For each table, you'd need to define columns. **But wait for deployment first** - they might auto-create.

---

## ✅ Step 3: Configure Table Permissions (IMPORTANT)

Once tables exist, set permissions:

### For Each Table (FIRs, Persons, etc.):

1. Click on the table name
2. Go to: **"Scopes and Permissions"**
3. For **"Application Users"** (authenticated users):
   - ✅ **Select** (read access)
   - ✅ **Insert** (for uploads)
   - ✅ **Update** (for OCR updates)
   - ⚠️ **Delete** (optional - only for admins)
4. Click: **Save**

**Why?** Your app needs permission to read/write data!

---

## ✅ Step 4: Whitelist Your Deployment URL

### After Deployment Completes:

1. Copy your deployment URL (e.g., `https://project-rainfall-...catalystserverless.in`)
2. Go to: **Authentication → Whitelisting**
3. Click: **"Add Domain"**
4. Paste: Your deployment URL
5. Enable: ✅ **"Enable CORS"**
6. Click: **Save**

**Why?** Frontend-backend communication requires CORS enabled.

---

## ✅ Step 5: Test Deployment URL

### Once Deployment Shows "Live":

1. Click on the deployment URL
2. You should see: **Login page** ✅
3. Try logging in with test credentials

### Expected Result:
```
✅ Login page loads
✅ Dashboard appears after login
✅ No console errors
```

---

## ✅ Step 6: Test File Upload (THE BIG TEST)

### Upload a Test FIR PDF:

1. Login to deployed app
2. Go to: `/data-ingestion`
3. Upload a test PDF file
4. Fill in:
   - FIR Number: `TEST-001`
   - Description: `Test upload from deployment`
   - Crime Type: `Theft`
   - Police Station: `Test PS`
5. Click: **"Process FIR Document"**
6. Wait for processing...

### Expected Result:
```
✓ Upload successful
✓ OCR processing started
✓ Entities extracted
✓ Success message shown
```

---

## ✅ Step 7: Verify Real Stratus Upload (CRITICAL)

### Check if File is in Real Stratus:

1. Go back to: **Catalyst Console**
2. Navigate to: **Stratus → firdocuments**
3. Click: **"View Files"**

### ✅ SUCCESS if you see:
- Your uploaded PDF file listed
- Filename with timestamp
- File size shown

### ❌ FAILED if:
- Bucket is empty
- No files listed
- Still in mock mode

---

## ✅ Step 8: Verify DataStore Record

### Check if FIR Saved to Database:

1. Go to: **Data Store → FIRs table**
2. Click: **"View Data"**
3. Look for your test FIR: `TEST-001`

### ✅ SUCCESS if you see:
- FIR record with your data
- OCR text populated
- All fields filled

---

## ✅ Step 9: Check Deployment Logs

### Review for Any Errors:

1. Go to: **Slate → Deployments**
2. Click on your deployment
3. Click: **"View Logs"**

### Look for:
- ✅ `✅ Token authentication successful` (good!)
- ❌ `⚠️ Using MOCK Catalyst instance` (bad - means auth failed)
- ✅ `📤 File uploaded to Stratus` (good!)
- ❌ `📤 MOCK: File uploaded` (bad - still mock mode)

---

## ✅ Step 10: Configure Environment Variables (If Needed)

### If Deployment Logs Show Issues:

1. Go to: **Settings → Environment Variables**
2. Verify these are set:
   ```env
   CATALYST_PROJECT_ID=55949000000013025
   CATALYST_ENV=Development
   USE_MOCK_CATALYST=false
   NODE_ENV=production
   ```
3. If missing, add them
4. **Redeploy** if you changed anything

---

## 🔥 Troubleshooting Common Issues

### Issue 1: "Files Not Uploading to Stratus"

**Symptoms:**
- Upload works but Stratus bucket is empty
- Logs show "MOCK: File uploaded"

**Solution:**
1. Check `USE_MOCK_CATALYST=false` in environment variables
2. Verify buckets exist and are named exactly `firdocuments`
3. Check deployment logs for authentication errors
4. Redeploy if needed

---

### Issue 2: "DataStore Permission Denied"

**Symptoms:**
- Error: "Permission denied" when uploading
- Can't insert records

**Solution:**
1. Go to DataStore table
2. Check Scopes and Permissions
3. Enable Insert/Update for Application Users
4. Save and test again

---

### Issue 3: "CORS Error"

**Symptoms:**
- Console error: "blocked by CORS policy"
- API calls fail

**Solution:**
1. Go to Authentication → Whitelisting
2. Add your deployment URL
3. Enable CORS checkbox
4. Save and refresh app

---

### Issue 4: "Still Using Mock Mode"

**Symptoms:**
- Logs show "Using MOCK Catalyst instance"
- No real uploads happening

**Solution:**
1. Check Catalyst SDK authentication in deployed environment
2. In Catalyst Console, verify project is active
3. Check environment variables are set correctly
4. May need to deploy to Production environment instead of Development

---

## 📊 Success Checklist Summary

### Deployment is SUCCESSFUL if:

- ✅ URL is accessible
- ✅ Login works
- ✅ Dashboard loads
- ✅ Upload PDF → Success message
- ✅ PDF appears in Stratus console
- ✅ FIR appears in DataStore console
- ✅ No "MOCK" in deployment logs
- ✅ No CORS errors
- ✅ All features work end-to-end

---

## 🎯 What's Next After Everything Works?

### 1. **Seed More Data** (Optional)
- Upload 10-20 test FIRs
- Build out the knowledge graph
- Test search and analytics

### 2. **Configure Production Settings**
- Set up proper authentication
- Configure user roles
- Enable security features

### 3. **Performance Testing**
- Test with larger PDFs
- Verify OCR performance
- Check dashboard load times

### 4. **Documentation**
- Document API endpoints
- Create user guide
- Prepare demo flow

### 5. **Presentation Prep**
- Prepare demo script
- Test all features work
- Screenshot key features
- Prepare talking points

---

## 📞 Need Help?

If any step fails:
1. Check the specific troubleshooting section above
2. Review deployment logs carefully
3. Verify all prerequisites are met
4. Contact Catalyst support if needed

---

## ⏱️ Timeline

**While Waiting for Deployment (15-20 min):**
- ✅ Verify buckets (2 min)
- ✅ Check tables (2 min)
- ✅ Review documentation (5 min)
- ✅ Prepare test data (5 min)
- ☕ Get coffee (5 min)

**After Deployment (5-10 min):**
- ✅ Whitelist URL (1 min)
- ✅ Configure permissions (2 min)
- ✅ Test upload (3 min)
- ✅ Verify Stratus (2 min)
- ✅ Check DataStore (2 min)

**Total: 30 minutes to fully verified deployment!**

---

**Your deployment is running now. Use this checklist to prepare everything else!** 🚀

