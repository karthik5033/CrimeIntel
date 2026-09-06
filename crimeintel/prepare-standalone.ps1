# PowerShell script to prepare .next/standalone for Zoho Catalyst AppSail deployment

Write-Host "Preparing clean AppSail standalone deployment package..."

$standalone = ".next\standalone"

if (-not (Test-Path $standalone)) {
    Write-Host "Error: $standalone not found! Run 'npm run build' first."
    exit 1
}

# 1. Copy static assets
Write-Host "Copying static assets to $standalone..."
if (Test-Path "public") {
    robocopy "public" "$standalone\public" /E /NJH /NJS /NDL /NC /NS /NP /NFL | Out-Null
}
if (Test-Path ".next\static") {
    robocopy ".next\static" "$standalone\.next\static" /E /NJH /NJS /NDL /NC /NS /NP /NFL | Out-Null
}
if (Test-Path ".env.local") {
    Copy-Item -Path ".env.local" -Destination "$standalone\.env.local" -Force
}

# 2. Inject Catalyst AppSail Port Binding into server.js
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

# 3. Copy Linux SWC binary for cross-platform deployment
$targetNodeModules = "$standalone\node_modules"
$linuxSwc = "node_modules\@next\swc-linux-x64-gnu"
$targetLinuxSwc = "$targetNodeModules\@next\swc-linux-x64-gnu"
if (Test-Path $linuxSwc) {
    robocopy $linuxSwc $targetLinuxSwc /E /NJH /NJS /NDL /NC /NS /NP /NFL | Out-Null
    Write-Host "Copied Linux SWC binary"
}

# 4. Clean junk files traced into standalone
$removeItems = @(
    "$standalone\*.zip",
    "$standalone\backend",
    "$standalone\tests",
    "$standalone\scripts",
    "$standalone\appsail-build",
    "$standalone\appsail-deploy-temp",
    "$standalone\appsail-pkg",
    "$standalone\functions",
    "$standalone\data",
    "$standalone\*.bat",
    "$standalone\*.ps1",
    "$standalone\package-lock.json",
    "$standalone\api-key"
)
foreach ($pattern in $removeItems) {
    Get-ChildItem -Path $pattern -Recurse -Force -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
}
Write-Host "Cleaned standalone package"

Write-Host "AppSail standalone package ready!"
