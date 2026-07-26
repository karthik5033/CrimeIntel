# Create Deployment ZIP for Catalyst Manual Upload
Write-Host "Creating Deployment ZIP for Catalyst" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Check if build exists
if (-not (Test-Path ".next")) {
    Write-Host "No .next folder found. Building project first..." -ForegroundColor Yellow
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Build failed! Fix errors before creating ZIP." -ForegroundColor Red
        exit 1
    }
}

# Define what to include
$itemsToInclude = @(
    ".next",
    "app",
    "components",
    "lib",
    "hooks",
    "stores",
    "types",
    "data",
    "public",
    "styles",
    "catalyst",
    "functions",
    "scripts",
    "package.json",
    "package-lock.json",
    "next.config.ts",
    "tsconfig.json",
    "catalyst.json",
    ".catalystrc",
    ".catalystignore",
    "postcss.config.mjs",
    "components.json"
)

# Remove old ZIP if exists
if (Test-Path "crimeintel-deploy.zip") {
    Remove-Item crimeintel-deploy.zip
    Write-Host "Removed old deployment ZIP" -ForegroundColor Green
}

Write-Host "Compressing files..." -ForegroundColor Yellow
Write-Host ""

# Create the ZIP
$existingItems = $itemsToInclude | Where-Object { Test-Path $_ }

foreach ($item in $existingItems) {
    Write-Host "   Adding: $item" -ForegroundColor Gray
}

Compress-Archive -Path $existingItems -DestinationPath "crimeintel-deploy.zip" -Force

if (Test-Path "crimeintel-deploy.zip") {
    $zipSize = (Get-Item "crimeintel-deploy.zip").Length / 1MB
    Write-Host ""
    Write-Host "Deployment ZIP created successfully!" -ForegroundColor Green
    Write-Host "   File: crimeintel-deploy.zip" -ForegroundColor Cyan
    Write-Host "   Size: $([math]::Round($zipSize, 2)) MB" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Go to: https://console.catalyst.zoho.in" -ForegroundColor White
    Write-Host "2. Select: Project-Rainfall" -ForegroundColor White
    Write-Host "3. Go to: Deployments or Client" -ForegroundColor White
    Write-Host "4. Click: Upload ZIP or Deploy from Archive" -ForegroundColor White
    Write-Host "5. Select: crimeintel-deploy.zip" -ForegroundColor White
    Write-Host "6. Wait for deployment to complete (5-10 minutes)" -ForegroundColor White
    Write-Host ""
    
    if ($zipSize -gt 50) {
        Write-Host "Warning: ZIP file is large ($([math]::Round($zipSize, 2)) MB)" -ForegroundColor Red
        Write-Host "   This may cause upload issues. Consider:" -ForegroundColor Yellow
        Write-Host "   - Removing unnecessary files from data/ folder" -ForegroundColor White
        Write-Host "   - Checking .catalystignore is working" -ForegroundColor White
    }
} else {
    Write-Host "Failed to create deployment ZIP" -ForegroundColor Red
    exit 1
}
