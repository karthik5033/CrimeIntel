@echo off
setlocal enabledelayedexpansion

echo ========================================
echo Creating AppSail Deployment Package
echo ========================================
echo.

:: Get timestamp
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set datetime=%%I
set TIMESTAMP=%datetime:~0,8%-%datetime:~8,6%
set ZIP_NAME=crimeintel-appsail-%TIMESTAMP%.zip
set TEMP_DIR=deploy-temp-%TIMESTAMP%

:: Create temp directory
echo [1/8] Creating temporary directory...
if exist %TEMP_DIR% rmdir /s /q %TEMP_DIR%
mkdir %TEMP_DIR%

:: Copy standalone build contents (NOT the standalone folder itself)
echo [2/8] Copying standalone build...
xcopy /E /I /Y /Q ".next\standalone\*" "%TEMP_DIR%\"

:: Ensure package.json is in root
echo [3/8] Ensuring package.json in root...
if not exist "%TEMP_DIR%\package.json" (
    copy /Y "package.json" "%TEMP_DIR%\package.json"
)

:: Copy public assets
echo [4/8] Copying public assets...
if exist "public" (
    xcopy /E /I /Y /Q "public" "%TEMP_DIR%\public"
)

:: Copy static files to .next/static
echo [5/8] Copying Next.js static files...
if exist ".next\static" (
    xcopy /E /I /Y /Q ".next\static" "%TEMP_DIR%\.next\static"
)

:: Ensure server.js is in root
echo [6/8] Ensuring server.js in root...
if not exist "%TEMP_DIR%\server.js" (
    copy /Y ".next\standalone\server.js" "%TEMP_DIR%\server.js"
)

:: Create ZIP using PowerShell
echo [7/8] Creating ZIP file...
powershell -Command "Compress-Archive -Path '%TEMP_DIR%\*' -DestinationPath '%ZIP_NAME%' -Force"

:: Cleanup
echo [8/8] Cleaning up...
rmdir /s /q %TEMP_DIR%

:: Get file size
for %%F in (%ZIP_NAME%) do set SIZE=%%~zF
set /a SIZE_MB=%SIZE% / 1048576

echo.
echo ========================================
echo ✅ DEPLOYMENT PACKAGE CREATED
echo ========================================
echo.
echo File: %ZIP_NAME%
echo Size: %SIZE_MB% MB
echo.
echo MANUAL DEPLOYMENT REQUIRED:
echo.
echo 1. Open Catalyst Console:
echo    https://console.catalyst.zoho.com
echo.
echo 2. Navigate to:
echo    Project-Rainfall ^> AppSail ^> Add Service
echo.
echo 3. Configure:
echo    - Name: crimeintel
echo    - Stack: Node 20
echo    - Upload: %ZIP_NAME%
echo    - Command: node server.js
echo    - Port: 3000
echo    - Memory: 2048 MB
echo.
echo 4. Click Deploy and wait ~4 minutes
echo.
echo ========================================
