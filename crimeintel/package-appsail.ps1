# PowerShell script to build and package Next.js AppSail correctly
Write-Host "[*] Building Next.js project..." -ForegroundColor Cyan
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "[X] Build failed!" -ForegroundColor Red
    exit 1
}

$temp = "appsail-pkg"
if (Test-Path $temp) { 
    Remove-Item -Recurse -Force $temp -ErrorAction SilentlyContinue
}
New-Item -ItemType Directory -Path $temp | Out-Null

Write-Host "[*] Copying standalone build..." -ForegroundColor Cyan
Copy-Item -Path ".next\standalone\*" -Destination $temp -Recurse -Force

Write-Host "[*] Copying static files and assets..." -ForegroundColor Cyan
if (-not (Test-Path "$temp\.next\static")) {
    New-Item -ItemType Directory -Path "$temp\.next\static" | Out-Null
}
if (Test-Path "public") {
    Copy-Item -Path "public\*" -Destination "$temp\public" -Recurse -Force -ErrorAction SilentlyContinue
}
if (Test-Path ".next\static") {
    Copy-Item -Path ".next\static\*" -Destination "$temp\.next\static" -Recurse -Force -ErrorAction SilentlyContinue
}

Write-Host "[*] Injecting Catalyst Port Binding..." -ForegroundColor Cyan
$serverJsPath = "$temp\server.js"
if (Test-Path $serverJsPath) {
    $originalServer = Get-Content $serverJsPath -Raw
    $portBindingCode = @(
        '// --- CATALYST APPSAIL PORT BINDING ---',
        'if (process.env.X_ZOHO_CATALYST_LISTEN_PORT) {',
        '    process.env.PORT = process.env.X_ZOHO_CATALYST_LISTEN_PORT;',
        '    console.log("[OK] Catalyst Listen Port Bound:", process.env.PORT);',
        '}',
        'process.env.HOSTNAME = "0.0.0.0";',
        '// -------------------------------------',
        ''
    ) -join "`n"
    if (-not $originalServer.Contains("CATALYST APPSAIL PORT BINDING")) {
        $newServer = $portBindingCode + $originalServer
        [System.IO.File]::WriteAllText($serverJsPath, $newServer)
        Write-Host "[OK] Port binding injected successfully." -ForegroundColor Green
    }
}

Write-Host "[*] Setting up app-config.json..." -ForegroundColor Cyan
$appConfig = '{
    "command": "node server.js",
    "stack": "node20",
    "memory": 1024,
    "env_variables": {
        "NODE_ENV": "production",
        "HOSTNAME": "0.0.0.0"
    }
}'
[System.IO.File]::WriteAllText("$temp\app-config.json", $appConfig)

$zipName = "crimeintel-appsail.zip"
if (Test-Path $zipName) { Remove-Item -Force $zipName }

Write-Host "[*] Creating ZIP archive: $zipName..." -ForegroundColor Cyan
Compress-Archive -Path "$temp\*" -DestinationPath $zipName -Force

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "[OK] AppSail ZIP Created Successfully!" -ForegroundColor Green
Write-Host "File: $zipName" -ForegroundColor Yellow
Write-Host "To deploy, go to Catalyst Console -> AppSail -> crimeintel -> Upload this ZIP!"
Write-Host "========================================" -ForegroundColor Green
