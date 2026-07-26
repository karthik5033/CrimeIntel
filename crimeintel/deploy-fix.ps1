# CrimeIntel Deployment Fix Script
# This script cleans and redeploys your Catalyst app

Write-Host "CrimeIntel Deployment Fix" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Clean previous builds
Write-Host "Step 1: Cleaning previous builds..." -ForegroundColor Yellow
if (Test-Path ".next") {
    Remove-Item -Recurse -Force .next
    Write-Host "   Removed .next directory" -ForegroundColor Green
}
if (Test-Path ".catalyst") {
    Remove-Item -Recurse -Force .catalyst
    Write-Host "   Removed .catalyst directory" -ForegroundColor Green
}
if (Test-Path "node_modules\.cache") {
    Remove-Item -Recurse -Force node_modules\.cache
    Write-Host "   Removed node cache" -ForegroundColor Green
}
Write-Host ""

# Step 2: Build the project
Write-Host "Step 2: Building the project..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "   Build failed! Fix errors before deploying." -ForegroundColor Red
    exit 1
}
Write-Host "   Build successful!" -ForegroundColor Green
Write-Host ""

# Step 3: Verify important files exist
Write-Host "Step 3: Verifying deployment files..." -ForegroundColor Yellow
$requiredFiles = @(
    ".catalystrc",
    "catalyst.json",
    ".catalystignore",
    "package.json",
    "next.config.ts"
)

foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "   $file exists" -ForegroundColor Green
    } else {
        Write-Host "   $file missing!" -ForegroundColor Red
    }
}
Write-Host ""

# Step 4: Deploy
Write-Host "Step 4: Deploying to Catalyst..." -ForegroundColor Yellow
Write-Host "This may take 5-10 minutes. Please be patient..." -ForegroundColor Yellow
Write-Host ""

# Try deployment
catalyst deploy --verbose

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Deployment successful!" -ForegroundColor Green
    Write-Host "Your app should be available at:" -ForegroundColor Cyan
    Write-Host "https://project-rainfall-60078981781.development.catalystserverless.in" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "Deployment failed" -ForegroundColor Red
    Write-Host ""
    Write-Host "Common fixes:" -ForegroundColor Yellow
    Write-Host "1. Update Catalyst CLI: npm install -g zcatalyst-cli" -ForegroundColor White
    Write-Host "2. Re-login: catalyst login" -ForegroundColor White
    Write-Host "3. Try manual deployment via web console" -ForegroundColor White
    Write-Host "4. Check project quotas in Catalyst Console" -ForegroundColor White
    Write-Host ""
    Write-Host "To create manual ZIP, run: .\create-deploy-zip.ps1" -ForegroundColor Cyan
}
