# PowerShell build script for AppSail deployment ZIP

Write-Host "Building Next.js project..."
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed!"
    exit 1
}

$temp = "appsail-deploy-temp"
if (Test-Path $temp) { Remove-Item -Recurse -Force $temp }
New-Item -ItemType Directory -Path $temp | Out-Null

Write-Host "Packaging standalone build..."
Copy-Item -Path ".next\standalone\*" -Destination $temp -Recurse -Force

Write-Host "Copying root node_modules..."
if (Test-Path "node_modules") {
    if (-not (Test-Path "$temp\node_modules")) { New-Item -ItemType Directory -Path "$temp\node_modules" | Out-Null }
    Copy-Item -Path "node_modules\*" -Destination "$temp\node_modules" -Recurse -Force -ErrorAction SilentlyContinue
}

Write-Host "Copying static assets..."
if (-not (Test-Path "$temp\.next\static")) {
    New-Item -ItemType Directory -Path "$temp\.next\static" | Out-Null
}
if (Test-Path "public") {
    Copy-Item -Path "public\*" -Destination "$temp\.next\static" -Recurse -Force -ErrorAction SilentlyContinue
    Copy-Item -Path "public" -Destination $temp -Recurse -Force -ErrorAction SilentlyContinue
}
if (Test-Path ".next\static") {
    Copy-Item -Path ".next\static\*" -Destination "$temp\.next\static" -Recurse -Force -ErrorAction SilentlyContinue
}

Write-Host "Adding Catalyst port handler to server.js..."
$serverJsPath = "$temp\server.js"
if (Test-Path $serverJsPath) {
    $content = [System.IO.File]::ReadAllText($serverJsPath)
    $catalystPortHeader = "if (process.env.X_ZOHO_CATALYST_LISTEN_PORT) { process.env.PORT = process.env.X_ZOHO_CATALYST_LISTEN_PORT; }" + [Environment]::NewLine
    $newContent = $catalystPortHeader + $content
    [System.IO.File]::WriteAllText($serverJsPath, $newContent)
}

Write-Host "Copying app-config.json and .env.local..."
Copy-Item -Path "app-config.json" -Destination "$temp\app-config.json" -Force
if (Test-Path ".env.local") {
    Copy-Item -Path ".env.local" -Destination "$temp\.env.local" -Force
}

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$zipName = "crimeintel-appsail-COMPLETE-$timestamp.zip"
$zipPath = Join-Path ".." $zipName

Write-Host "Creating COMPLETE ZIP archive: $zipName..."
Compress-Archive -Path "$temp\*" -DestinationPath $zipPath -Force

Remove-Item -Recurse -Force $temp

Write-Host ""
Write-Host "========================================"
Write-Host "COMPLETE AppSail Package Created!"
Write-Host "Location: $zipPath"
Write-Host "========================================"
