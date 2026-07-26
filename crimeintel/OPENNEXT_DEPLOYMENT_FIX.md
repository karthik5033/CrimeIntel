# OpenNext Deployment Fix for Catalyst Slate

## 🔍 ROOT CAUSE IDENTIFIED

From the Catalyst Console logs, the deployment was failing with:
```
Error [ERR_MODULE_NOT_FOUND]: Cannot find package '@zcatalyst/nextjs-plugin' 
imported from /catalyst/default/open
```

**The Issue:**
- Catalyst Slate changed build path from `.next` to `.open-next` (visible in audit logs at 06:34)
- Our Next.js app was configured with `output: 'standalone'` (Docker mode)
- Catalyst expects **serverless deployment** using OpenNext adapter
- The console logs showed it was looking in `/catalyst/default/open` directory

## ✅ FIXES APPLIED

### 1. Installed OpenNext Package
```bash
npm install --save-dev open-next
```
**What it does:** Converts Next.js standalone builds to serverless-compatible format

### 2. Updated `next.config.ts`
**Removed:**
```typescript
output: 'standalone',  // ❌ This is for Docker/container deployments
```

**Why:** OpenNext handles the output transformation automatically

### 3. Fixed Missing Dependency
```bash
npm install @radix-ui/react-tabs
```
**Error fixed:** `Module not found: Can't resolve '@radix-ui/react-tabs'`
**Affected file:** `components/ui/tabs.tsx` (used in entity-review page)

### 4. Updated Build Scripts
**In `package.json`:**
```json
{
  "scripts": {
    "build": "next build",                    // ← Standard Next.js build
    "build:open-next": "next build && open-next build"  // ← For local testing
  }
}
```

**Why separate scripts:**
- Catalyst runs `npm run build` automatically
- OpenNext is applied by Catalyst's build system, not manually
- Prevents infinite recursion loop (build → open-next → build → open-next...)

## 📊 BUILD VERIFICATION

Local build succeeded with OpenNext:
```bash
✓ Compiled successfully in 9.4s
✅ Loaded 1006 FIRs into mock store
✅ Loaded 2461 Persons into mock store
✅ Loaded 150 Vehicles into mock store
✓ Generating static pages (49/49)
✓ Finalizing page optimization

OpenNext v3.1.3
┌─────────────────────────────────┐
│ OpenNext — Building Next.js app │
└─────────────────────────────────┘
```

**Output created:**
- ✅ `.next` directory (standard Next.js build)
- ✅ `.open-next` directory (serverless-compatible format)

## 🚀 DEPLOYMENT STEPS

### Current Status
- ✅ Latest commit: `0b96ee8` - "fix: add OpenNext support for Catalyst Slate deployment"
- ✅ Pushed to GitHub: https://github.com/karthik5033/CrimeIntel
- ✅ Previous commit: `c9a1c94` - "fix: enable MOCK mode in production via .env.production"

### What You Need To Do Now

1. **Go to Catalyst Console** 
   https://console.catalyst.zoho.in/

2. **Navigate to Slate → CrimeIntel**

3. **Click "Sync Now"** button (top right, blue button)
   - This will pull commit `0b96ee8` from GitHub
   - Catalyst will run `npm run build`
   - Catalyst will apply OpenNext transformation automatically
   - Build output will go to `.open-next` directory

4. **Wait 3-5 minutes** for deployment

5. **Check Deployment Status**
   - Should change from "In Progress" to "Success"
   - Commit ID should update to `0b96ee8`
   - Commit message should show: "fix: add OpenNext support for Catalyst Slate deployment"

6. **Test the Site**
   - URL: https://crimeintel-ksp.onslate.in/
   - Should load the Data Ingestion page (login page)
   - No more 503 errors!

7. **If Still Fails:**
   - Click "View Logs"
   - Change log type to "Runtime" or "Application"
   - Screenshot the new error
   - Send to me for further diagnosis

## 📝 TECHNICAL NOTES

### Why OpenNext?

**OpenNext** is an adapter that transforms Next.js applications for serverless environments:

- **Without OpenNext:** Next.js builds for Node.js servers or Docker containers
- **With OpenNext:** Next.js builds for AWS Lambda, Cloudflare Workers, or Zoho Catalyst
- **Key transformation:** Splits app into separate functions (SSR, API routes, static assets)

### Catalyst's Build Process

1. Pull code from GitHub
2. Run `npm install` (installs dependencies including `open-next`)
3. Run `npm run build` (builds Next.js app)
4. **Catalyst applies OpenNext internally** (transforms .next → .open-next)
5. Deploy to Slate infrastructure

### Environment Variables

Already configured in `.env.production`:
```env
USE_MOCK_CATALYST=true     # ← Enables mock Catalyst SDK
NODE_ENV=production
PORT=3000
```

Next.js automatically reads `.env.production` during build, so no console configuration needed!

## 🎯 EXPECTED OUTCOME

After "Sync Now" completes successfully:

✅ **Deployment Status:** Success (green)
✅ **Build Path:** .open-next
✅ **Commit:** 0b96ee8
✅ **Site:** https://crimeintel-ksp.onslate.in/ loads successfully
✅ **Features Working:**
  - Login page loads
  - Data Ingestion page accessible
  - Mock Catalyst data (1006 FIRs, 2461 Persons, 150 Vehicles)
  - All 49 pages built and accessible

## 📊 WHAT WE'VE LEARNED

1. **Catalyst Slate requires OpenNext** for Next.js apps
2. **`.env.production` is auto-read** by Next.js (no console config needed)
3. **Audit logs are gold** - they showed the build path change to `.open-next`
4. **Console logs reveal the real errors** - showed missing `@zcatalyst/nextjs-plugin`

## 🔄 COMMIT HISTORY

```
0b96ee8 (HEAD -> main, origin/main) fix: add OpenNext support for Catalyst Slate deployment
c9a1c94 fix: enable MOCK mode in production via .env.production
e06e7a0 Merge main and keep simplified ZCQL WHERE clause fix
bd35341 fix: simplify ZCQL WHERE clause parsing for universal field matching
```

---

**Next:** Click "Sync Now" and monitor the deployment! 🚀
