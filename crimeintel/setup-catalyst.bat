@echo off
echo ========================================
echo Catalyst Authentication Setup
echo ========================================
echo.

echo Step 1: Installing Catalyst CLI...
call npm install -g zcatalyst-cli
echo.

echo Step 2: Authenticating with Catalyst...
echo This will open your browser for login.
call catalyst login
echo.

echo Step 3: Verifying authentication...
call catalyst whoami
echo.

echo Step 4: Listing available projects...
call catalyst project:list
echo.

echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Restart your Next.js server: npm run dev
echo 2. Visit http://localhost:3000/test-upload
echo 3. Try uploading a PDF file
echo.
pause
