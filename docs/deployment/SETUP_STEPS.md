# 🚀 Setup Steps - Get Upload Working

## ✅ Fixed Issues
- Bucket name corrected: `fir_documents` → `firdocuments`
- 3-tier integration: Stratus + Metadata + FIRs table
- All code updated and pushed to GitHub

## 📋 Next Steps (Do These in Order)

### Step 1: Create DocumentMetadata Table

Open terminal in `crimeintel/` folder and run:

```bash
node scripts/create-document-metadata-table.js
```

**Expected Output:**
```
🔧 Initializing Catalyst SDK...
📋 Creating DocumentMetadata table...
✅ DocumentMetadata table created successfully!
Table ID: 123456789
✨ Upload pipeline now ready
```

**If you see an error:**
- "Already exists" → Perfect! Table exists, continue to Step 2
- "Authentication failed" → Run `catalyst login` first
- "Project not found" → Check `catalyst.json` project ID

---

### Step 2: Verify Stratus Bucket

Go to Catalyst Console:
1. Open: https://console.catalyst.zoho.in
2. Navigate: **Cloud Scale → Stratus → File Store**
3. Confirm bucket exists: `firdocuments`
4. Click on bucket → should show empty (ready for uploads)

**Bucket Settings:**
- Name: `firdocuments` (exactly)
- Type: File Store
- Access: Private (default)

**Screenshot from your browser shows this is CORRECT ✅**

---

### Step 3: Test Upload

1. Start dev server:
```bash
npm run dev
```

2. Open browser: http://localhost:3000/admin/data-loader

3. Upload a test PDF file

4. Watch browser console (F12) for logs:
```
📥 Upload API called
✅ FormData parsed successfully
📤 Uploading to Stratus...
✅ Uploaded to Stratus: 123456789
💾 Saving document metadata...
✅ Document metadata saved
💾 Creating FIR record...
✅ FIR record created in Data Store
```

5. Check response JSON:
```json
{
  "success": true,
  "message": "FIR uploaded successfully to all three locations",
  "storageStatus": {
    "stratus": "✅ Uploaded",
    "metadata": "✅ Saved to DocumentMetadata table",
    "dataStore": "✅ Saved to FIRs table"
  }
}
```

---

### Step 4: Verify Data Saved

#### Check Stratus (File Storage)
1. Catalyst Console → Cloud Scale → Stratus → firdocuments
2. You should see: `FIR_[your-fir-number]_[timestamp].pdf`
3. Click file → "Download" button should work

#### Check DocumentMetadata (Metadata Table)
1. Catalyst Console → Data Store → Tables → DocumentMetadata
2. Click "View Data" or "Select Rows"
3. Should see 1 row with:
   - `file_id` = Stratus file ID
   - `file_url` = Full URL to file
   - `fir_number` = Your FIR number
   - `ocr_status` = "pending"

#### Check FIRs (Case Records Table)
1. Catalyst Console → Data Store → Tables → FIRs
2. Click "View Data"
3. Should see 1 row with:
   - `fir_no` = Your FIR number
   - `pdf_url` = Same URL as DocumentMetadata
   - `pdf_file_id` = Same as DocumentMetadata file_id
   - `ocr_status` = "pending"

**All 3 should be linked!**

---

## 🔧 Quick Fix Commands

### If Table Creation Fails

```bash
# Login to Catalyst CLI
catalyst login

# List your projects
catalyst project:list

# Switch to correct project
catalyst project:select
```

### If Upload Fails with "Bucket Not Found"

Double-check `lib/catalyst/stratus.ts` line 11:
```typescript
const FIR_BUCKET_NAME = 'firdocuments'; // Must match exactly
```

### If NoSQL Save Fails

Check Data Store access:
1. Catalyst Console → Settings → Access Control
2. Ensure Data Store is enabled
3. Check table permissions

### Clear All Test Data

```bash
# In Catalyst Console:
# Data Store → DocumentMetadata → Delete all rows
# Data Store → FIRs → Delete all rows  
# Stratus → firdocuments → Delete all files
```

---

## 📊 Upload Flow Diagram

```
User uploads PDF
       ↓
┌──────────────────────┐
│  POST /api/upload    │
└──────────────────────┘
       ↓
┌──────────────────────┐
│ 1️⃣ Upload to Stratus  │
│    → firdocuments    │
│    ✅ Get fileId      │
└──────────────────────┘
       ↓
┌──────────────────────┐
│ 2️⃣ Save Metadata      │
│    → DocumentMetadata│
│    ✅ Track status    │
└──────────────────────┘
       ↓
┌──────────────────────┐
│ 3️⃣ Create FIR Record │
│    → FIRs table      │
│    ✅ Link to file    │
└──────────────────────┘
       ↓
    Success! 🎉
```

---

## ✅ Success Checklist

After completing all steps, you should have:

- [ ] DocumentMetadata table created in Data Store
- [ ] firdocuments bucket visible in Stratus
- [ ] Test PDF uploaded successfully
- [ ] File visible in Stratus bucket
- [ ] Metadata row in DocumentMetadata table
- [ ] FIR record in FIRs table
- [ ] All three linked by file_id and fir_number

**If all checked → Upload pipeline is working! 🚀**

---

## 📖 Full Documentation

See `UPLOAD_PIPELINE_FIXED.md` for:
- Complete architecture diagram
- API usage examples
- Troubleshooting guide
- Next steps (OCR processing)

---

## 🆘 Need Help?

Common issues and solutions:

| Issue | Solution |
|-------|----------|
| Table already exists | ✅ Good! Skip to Step 2 |
| Bucket not found | Check name: `firdocuments` (no underscore) |
| Authentication error | Run `catalyst login` |
| NoSQL save fails | Check Data Store permissions in Console |
| File uploads but no metadata | Check browser/server console logs |

Still stuck? Check server logs in terminal where `npm run dev` is running.

---

**Ready? Start with Step 1! 🎯**
