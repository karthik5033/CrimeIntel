# Ensure we have the standalone build
if (-not (Test-Path ".next\standalone")) {
    Write-Host "Error: .next\standalone not found!"
    exit 1
}

$standalone = ".next\standalone"

# Copy static assets
Write-Host "Copying static assets..."
if (Test-Path "public") {
    robocopy "public" "$standalone\public" /E /NJH /NJS /NDL /NC /NS /NP /NFL | Out-Null
}
if (Test-Path ".next\static") {
    robocopy ".next\static" "$standalone\.next\static" /E /NJH /NJS /NDL /NC /NS /NP /NFL | Out-Null
}

# Inject Catalyst Port Binding into Next.js server.js
$serverJsPath = "$standalone\server.js"
if (Test-Path $serverJsPath) {
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
}

# Create app-config.json inside standalone
$appConfig = '{
    "command": "node server.js",
    "stack": "node22",
    "memory": 2048,
    "env_variables": {
        "NODE_ENV": "production",
        "HOSTNAME": "0.0.0.0"
    }
}'
[System.IO.File]::WriteAllText("$standalone\app-config.json", $appConfig)
Write-Host "Created app-config.json in standalone"

# Remove root app-config.json so CLI does not get confused
Remove-Item -Force app-config.json -ErrorAction SilentlyContinue

# Copy Linux SWC binary if it exists
$linuxSwc = "node_modules\@next\swc-linux-x64-gnu"
if (Test-Path $linuxSwc) {
    robocopy $linuxSwc "$standalone\node_modules\@next\swc-linux-x64-gnu" /E /NJH /NJS /NDL /NC /NS /NP /NFL | Out-Null
}

Write-Host "Standalone directory is fully prepared for AppSail."
