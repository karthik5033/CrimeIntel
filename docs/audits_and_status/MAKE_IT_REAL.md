# 🚀 Make CrimeIntel Use REAL Catalyst Services

## Current Problem
- System is running in **MOCK MODE** ⚠️
- Files DON'T upload to Stratus ❌
- Data DON'T save to real DataStore ❌
- Everything stays in memory only 💨

## Solution: 3 Simple Steps

### ✅ Step 1: Get Catalyst Token
Follow the detailed guide:
```bash
# Open this file and follow instructions:
GET_CATALYST_TOKEN.md
```

**Quick Summary:**
1. Go to: https://console.catalyst.zoho.in
2. Login with: kishanshetty.udupika20@gmail.com
3. Settings → API Tokens → Generate New Token
4. Copy the token (looks like: `1000.xxxxx.yyyyy`)

### ✅ Step 2: Add Token to .env.local
Open `.env.local` and add this line:
```env
CATALYST_TOKEN=paste_your_token_here
```

**Example of complete .env.local:**
```env
NEXT_PUBLIC_CATALYST_PROJECT_ID=55949000000013025
NEXT_PUBLIC_CATALYST_ENV=Development
CATALYST_PROJECT_ID=55949000000013025
CATALYST_ENV=Development
USE_MOCK_CATALYST=false

# Your Catalyst token (get from console.catalyst.zoho.in)
CATALYST_TOKEN=1000.abc123xyz789.yourActualTokenHere
```

⚠️ **IMPORTANT:** 
- NO spaces before or after the =
- NO quotes around the token
- Token should be one long string

### ✅ Step 3: Restart Server & Verify

```bash
# 1. Stop current server
# Press Ctrl+C in the terminal running npm run dev

# 2. Verify connection (optional but recommended)
node verify-catalyst-connection.js

# 3. Start server again
npm run dev
```

---

## 🎯 How to Know It's Working

### ❌ BEFORE (Mock Mode):
When you start the server, you'll see:
```
⚠️ Using MOCK Catalyst instance
⚠️ Falling back to MOCK mode for development
📤 MOCK: File uploaded
💾 MOCK: Inserting rows
```

### ✅ AFTER (Real Catalyst):
When you start the server, you'll see:
```
🔧 Initializing Catalyst SDK...
🔑 Using token authentication
✅ Token authentication successful
```

When you upload files:
```
📤 File uploaded to Stratus: firdocuments
💾 Data saved to Catalyst DataStore
✅ FIR created successfully
```

---

## 🧪 Test It Works

### Test 1: Upload a PDF
1. Go to: http://localhost:3000/upload
2. Upload a test PDF
3. Check Catalyst Console → Stratus → firdocuments bucket
4. **Your file should be there!** ✅

### Test 2: Check Data
1. Go to Catalyst Console → Data Store → FIRs table
2. **Your new FIR should be there!** ✅

### Test 3: View FIR Details
1. After upload, click "View Details" button
2. Should show FIR data (not 404 error) ✅

---

## 🔧 Troubleshooting

### Problem: Token doesn't work
```bash
# Run verification script to see detailed error:
node verify-catalyst-connection.js
```

Common fixes:
1. Regenerate token from Catalyst Console
2. Make sure no spaces in .env.local
3. Restart server completely (Ctrl+C then npm run dev)
4. Check token hasn't expired

### Problem: Still seeing "MOCK mode"
1. Check .env.local has correct token
2. Check USE_MOCK_CATALYST=false (not true)
3. Make sure you restarted server after adding token
4. Clear any cached environment variables

### Problem: "Bucket not found"
Your Stratus bucket might have a different name:
1. Go to Catalyst Console → Stratus
2. Note the exact bucket name
3. Update `lib/catalyst/index.ts` if needed

---

## 📊 What Happens After This

Once working, you'll have:

✅ **Real File Storage**
- PDFs uploaded to Stratus bucket
- Persistent across server restarts
- Accessible from Catalyst Console
- Can download/view from console

✅ **Real Database**
- FIRs saved to Catalyst DataStore
- Can query via Catalyst Console
- Data persists permanently
- Proper SQL queries work

✅ **Production-Ready**
- Same setup works in deployed environment
- No code changes needed for production
- All Catalyst services fully functional

---

## 🎉 Success Checklist

- [ ] Token obtained from Catalyst Console
- [ ] Token added to .env.local
- [ ] Server restarted
- [ ] Verification script passes
- [ ] Upload test file successfully
- [ ] File visible in Stratus bucket
- [ ] FIR visible in DataStore
- [ ] No more "MOCK" messages in logs

---

## 📝 Files Created

1. **GET_CATALYST_TOKEN.md** - Detailed token guide
2. **verify-catalyst-connection.js** - Connection test script
3. **MAKE_IT_REAL.md** - This file (overview)

---

## 🆘 Still Stuck?

If nothing works:
1. Share screenshot of Catalyst Console Settings page
2. Run: `node verify-catalyst-connection.js` and share output
3. Share the error messages from terminal

**Remember:** The token is the ONLY way to make uploads work with real Catalyst services!
