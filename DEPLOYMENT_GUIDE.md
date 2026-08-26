# 🚀 CrimeIntel Deployment & Update Guide (Zoho Catalyst AppSail)

## 🌐 Live Production / Development URL
- **Live Deployed AppSail URL:**  
  [https://crimeintel-50044146268.development.catalystappsail.in/](https://crimeintel-50044146268.development.catalystappsail.in/)

---

## 📌 How CrimeIntel is Deployed

CrimeIntel is built as a **Next.js 15 (App Router)** full-stack application and deployed to **Zoho Catalyst AppSail** using a **Node.js 20.x Catalyst-Managed Runtime**.

### Key Deployment Architecture Components:
1. **Standalone Build:** `next.config.ts` has `output: 'standalone'` and `outputFileTracingRoot: path.join(__dirname)`, which bundles minimal dependencies and generates `.next/standalone`.
2. **AppSail Server Wrapper (`server.js`):**
   - Reads the dynamic listening port provided by Catalyst via `process.env.X_ZOHO_CATALYST_LISTEN_PORT` (falls back to port `3000`).
   - Delegates request handling to `.next/standalone/server.js`.
3. **Static Asset Layout:** The `public/` directory and `.next/static/` are packaged alongside the standalone build so static files and client chunks are served correctly.

---

## 🛠️ Step-by-Step: How to Add Changes & Re-Deploy

Follow these exact steps whenever you make changes in the code and want to deploy an updated version to AppSail.

### Step 1: Make Your Code Changes
Edit files in the `crimeintel/` folder (e.g. components, API routes, database integrations).

### Step 2: Build the Next.js Application Locally
Open PowerShell or Terminal in the `crimeintel/` directory:
```powershell
cd "c:\Users\Kishan Shetty\Downloads\DATATHON KSP\CrimeIntel\crimeintel"
npm run build
```
Ensure the build completes successfully and generates the `.next/standalone` folder.

---

### Step 3: Package the AppSail Deployment ZIP

Run the packaging script or create the bundle using PowerShell:

#### Using PowerShell:
```powershell
cd "c:\Users\Kishan Shetty\Downloads\DATATHON KSP\CrimeIntel\crimeintel"

# Run the packaging commands
$TEMP_DIR = "appsail-deploy-temp"
if (Test-Path $TEMP_DIR) { Remove-Item -Recurse -Force $TEMP_DIR }
New-Item -ItemType Directory -Path $TEMP_DIR | Out-Null

# 1. Copy standalone build
Copy-Item -Recurse -Force .next\standalone\* $TEMP_DIR

# 2. Copy static files into .next\static
New-Item -ItemType Directory -Force -Path "$TEMP_DIR\.next\static" | Out-Null
Copy-Item -Recurse -Force .next\static\* "$TEMP_DIR\.next\static"

# 3. Copy public folder
if (Test-Path "public") {
    Copy-Item -Recurse -Force public "$TEMP_DIR\public"
}

# 4. Copy server.js entry point
Copy-Item -Force server.js "$TEMP_DIR\server.js"

# 5. Create deployment ZIP
$ZIP_NAME = "..\crimeintel-appsail-deploy.zip"
if (Test-Path $ZIP_NAME) { Remove-Item -Force $ZIP_NAME }
Compress-Archive -Path "$TEMP_DIR\*" -DestinationPath $ZIP_NAME -Force

# Cleanup temp directory
Remove-Item -Recurse -Force $TEMP_DIR
Write-Host "✅ Deployment package created: crimeintel-appsail-deploy.zip" -ForegroundColor Green
```

---

### Step 4: Upload and Deploy via Zoho Catalyst Console

1. Open **[Zoho Catalyst Console](https://console.catalyst.zoho.in/)** (or `.com` based on your account).
2. Select your project: **`Project-Rainfall`** (Project ID: `50044146268` / `55949000000013025`).
3. In the left navigation menu, click **AppSail**.
4. Click on your active service: **`crimeintel`** (or click **Add Service / Deploy New Version**).
5. Configure the deployment settings:
   - **Stack / Runtime:** `Node.js 20`
   - **Startup Command:** `node server.js`
   - **Port:** `3000` (Catalyst automatically routes to `X_ZOHO_CATALYST_LISTEN_PORT`)
   - **Memory:** `2048 MB` (2 GB recommended)
6. Click **Browse / Upload File** and select:
   ```
   crimeintel-appsail-deploy.zip
   ```
7. Click **Deploy** and wait 3–5 minutes for extraction, dependency validation, and service boot.

---

## 🔑 Environment Variables Configuration in AppSail

In the Catalyst AppSail console under **Configuration / Environment Variables**, ensure the following variables are configured:

| Variable Name | Value | Purpose |
|---|---|---|
| `NODE_ENV` | `production` | Enables production optimizations |
| `CATALYST_PROJECT_ID` | `50044146268` | Catalyst Project Reference |
| `CATALYST_ENV` | `Development` (or `Production`) | Target Catalyst Environment |
| `QUICKML_ENDPOINT_KEY` | *(Your QuickML Key)* | Enables Catalyst Zia/QuickML LLM inference |
| `GROQ_API_KEY` | *(Optional)* | Fallback LLM acceleration |

---

## ✅ Post-Deployment Verification Checklist

Once deployment completes, verify the following endpoints on the live URL:

1. **Root & Authentication:**
   - `https://crimeintel-50044146268.development.catalystappsail.in/`
2. **Main Dashboard:**
   - `https://crimeintel-50044146268.development.catalystappsail.in/dashboard`
3. **Data & Analytics:**
   - `https://crimeintel-50044146268.development.catalystappsail.in/analytics`
4. **Chat & Intelligence:**
   - `https://crimeintel-50044146268.development.catalystappsail.in/chat`
5. **App Logs:**
   - Check the **Logs** tab in AppSail console to monitor server output and verify `✅ Found standalone server at: ...`.
