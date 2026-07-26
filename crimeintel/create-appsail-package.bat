@echo off
echo Creating AppSail deployment package...

:: Create temp directory
set TEMP_DIR=appsail-deploy-temp
if exist %TEMP_DIR% rmdir /s /q %TEMP_DIR%
mkdir %TEMP_DIR%

:: Copy standalone build
echo Copying standalone build...
xcopy /E /I /Y .next\standalone %TEMP_DIR%

:: Copy public folder to standalone/.next/standalone
echo Copying public assets...
if exist public (
    xcopy /E /I /Y public %TEMP_DIR%\.next\static
    xcopy /E /I /Y public %TEMP_DIR%\public
)

:: Copy static files
echo Copying Next.js static files...
if exist .next\static (
    xcopy /E /I /Y .next\static %TEMP_DIR%\.next\static
)

:: Copy server.js to root
echo Copying server.js...
copy /Y server.js %TEMP_DIR%\server.js

:: Copy app-config.json
echo Copying app-config.json...
copy /Y app-config.json %TEMP_DIR%\app-config.json

:: Copy .env.local if exists
if exist .env.local (
    echo Copying .env.local...
    copy /Y .env.local %TEMP_DIR%\.env.local
)

:: Create zip
set ZIP_NAME=crimeintel-appsail-fixed-%date:~-4%%date:~3,2%%date:~0,2%-%time:~0,2%%time:~3,2%%time:~6,2%.zip
set ZIP_NAME=%ZIP_NAME: =0%
echo Creating zip: %ZIP_NAME%

:: Use PowerShell to create zip
powershell -command "Compress-Archive -Path '%TEMP_DIR%\*' -DestinationPath '..\%ZIP_NAME%' -Force"

:: Cleanup
echo Cleaning up...
rmdir /s /q %TEMP_DIR%

echo.
echo ========================================
echo Deployment package created successfully!
echo Location: ..\%ZIP_NAME%
echo ========================================
echo.
echo Next steps:
echo 1. Go to Catalyst Console AppSail
echo 2. Upload this zip file
echo 3. Set Startup Command: node server.js
echo 4. Set Memory: 2048 MB
echo 5. Click Deploy
echo.
pause
