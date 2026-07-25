# 🔑 How to Get Catalyst API Token

## Method 1: Web Console (RECOMMENDED - Works Best)

### Step 1: Login to Catalyst Console
1. Open browser: **https://console.catalyst.zoho.in**
2. Login with: **kishanshetty.udupika20@gmail.com**

### Step 2: Navigate to Your Project
1. You should see your project: **Project-Rainfall** (ID: 55949000000013025)
2. Click on the project to enter it

### Step 3: Access Settings
1. Look for **"Settings"** in the left sidebar OR top-right menu
2. Click on **"Settings"**

### Step 4: Generate Token
Option A - If you see "API Tokens" section:
1. Find **"API Tokens"** or **"Personal Access Tokens"**
2. Click **"Generate New Token"** or **"Create Token"**
3. Name: `CrimeIntel-Dev`
4. Expiration: Choose **90 days** or **Never** (for development)
5. Click **Generate**
6. **COPY THE TOKEN IMMEDIATELY** (shown only once!)

Option B - If you see "Authentication" section:
1. Go to **Settings → Authentication**
2. Look for **"Personal Access Tokens"** or **"API Keys"**
3. Click **"Generate Token"**
4. Follow same steps as above

### Step 5: What to Look For
The token will look like this:
```
1000.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.yyyyyyyyyyyyyyyyyyyyyyyyyyyy
```
It's a long string with dots separating sections.

---

## Method 2: CLI Method (Currently Timing Out)

⚠️ **This method is NOT working currently** - times out waiting for verification

```bash
catalyst token:generate
```

Then visit: https://accounts.zoho.in/oauth/v3/device
Enter code: ONXN-5915

**Status**: Keeps timing out - use Method 1 instead!

---

## After You Get the Token

### Step 1: Add Token to .env.local
Open `.env.local` file and add:
```env
CATALYST_TOKEN=your_copied_token_here
```

Example:
```env
NEXT_PUBLIC_CATALYST_PROJECT_ID=55949000000013025
NEXT_PUBLIC_CATALYST_ENV=Development
CATALYST_PROJECT_ID=55949000000013025
CATALYST_ENV=Development
USE_MOCK_CATALYST=false

# Add your token here (replace the example)
CATALYST_TOKEN=1000.abc123xyz789.longTokenString
```

### Step 2: Restart Dev Server
```bash
# Stop current server (Ctrl+C)
npm run dev
```

### Step 3: Verify It Works
You should see in the terminal:
```
✅ Token authentication successful
```

Instead of:
```
⚠️ Falling back to MOCK mode
```

---

## Troubleshooting

### If you don't see "API Tokens" option:
1. Try looking under different sections:
   - Settings → Security
   - Settings → Developer Options
   - Settings → Integrations
   - Settings → API Management

2. Alternative: Use Zoho Accounts directly
   - Go to: https://accounts.zoho.in/home#security/personal_access_tokens
   - Generate token there
   - Make sure to select **Catalyst** in the scope

### If token doesn't work:
1. Make sure there are NO spaces in the .env.local file
2. Make sure there are NO quotes around the token
3. Restart the dev server completely (Ctrl+C then npm run dev)
4. Check terminal logs for authentication errors

---

## What Changes After Adding Token

### ✅ Before (Mock Mode):
```
⚠️ Using MOCK Catalyst instance
📤 MOCK: File uploaded
💾 MOCK: Inserting rows
```

### ✅ After (Real Catalyst):
```
✅ Token authentication successful
📤 File uploaded to Stratus: firdocuments
💾 Data saved to Catalyst DataStore
```

### Real Benefits:
- ✅ Files upload to **real Stratus bucket** "firdocuments"
- ✅ Data saves to **real Catalyst DataStore**
- ✅ Can view files in Catalyst Console → Stratus
- ✅ Can query data via Catalyst Console → Data Store
- ✅ Persistent across server restarts

---

## Security Note ⚠️

**IMPORTANT:** 
- ✅ .env.local is in .gitignore (safe)
- ❌ NEVER commit the token to git
- ❌ NEVER share the token publicly
- ✅ Revoke and regenerate if exposed

The token gives full access to your Catalyst project!

---

## Need Help?

If still stuck, provide:
1. Screenshot of Catalyst Console Settings page
2. What options you see under Settings
3. Any error messages

Token is the ONLY way to make real uploads work!
