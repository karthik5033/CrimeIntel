# Automated Next.js Standalone Deployment for Catalyst AppSail
# This script handles the Next.js standalone build extraction and Catalyst CLI quirks
Write-Host "Building Next.js for production..."
npm run build

Write-Host "Cleaning up previous temporary deployment folder..."
Remove-Item -Recurse -Force appsail-deploy-temp -ErrorAction SilentlyContinue

Write-Host "Preparing AppSail standalone container..."
Copy-Item -Path .next\standalone -Destination appsail-deploy-temp -Recurse -Force
if (Test-Path public) { Copy-Item -Path public -Destination appsail-deploy-temp\public -Recurse -Force }
if (Test-Path .next\static) { Copy-Item -Path .next\static -Destination appsail-deploy-temp\.next\static -Recurse -Force }

# Create app-config.json for the container runtime
$appConfig = '{
    "command": "node server.js",
    "stack": "node22",
    "memory": 2048,
    "env_variables": {
        "NODE_ENV": "production",
        "HOSTNAME": "0.0.0.0"
    }
}'
[System.IO.File]::WriteAllText("appsail-deploy-temp\app-config.json", $appConfig)

# Also update the root app-config.json because the Catalyst CLI requires it to exist at the root
# specifically to read the 'build_path' metadata (CLI quirk).
$rootAppConfig = '{
    "command": "node server.js",
    "build_path": "appsail-deploy-temp",
    "stack": "node22",
    "memory": 2048,
    "env_variables": {
        "NODE_ENV": "production",
        "HOSTNAME": "0.0.0.0"
    }
}'
[System.IO.File]::WriteAllText("app-config.json", $rootAppConfig)

# Inject Catalyst Port Binding into the standalone server.js
$serverJsPath = "appsail-deploy-temp\server.js"
$originalServer = Get-Content $serverJsPath -Raw
$portBindingCode = @"
// --- CATALYST APPSAIL PORT BINDING ---
if (process.env.X_ZOHO_CATALYST_LISTEN_PORT) {
    process.env.PORT = process.env.X_ZOHO_CATALYST_LISTEN_PORT;
    console.log('✅ Catalyst Listen Port Bound:', process.env.PORT);
}
process.env.HOSTNAME = '0.0.0.0';
// -------------------------------------

"@
if (-not $originalServer.Contains("CATALYST APPSAIL PORT BINDING")) {
    $newServer = $portBindingCode + $originalServer
    [System.IO.File]::WriteAllText($serverJsPath, $newServer)
    Write-Host "Injected Catalyst port binding into server.js"
}

# Deploy to AppSail
Write-Host "Deploying to Catalyst AppSail..."
catalyst deploy appsail --name crimeintel

Write-Host "Done! Deployment successful."
