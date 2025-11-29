@echo off
REM PrimusInsights Roofing - API Test Script (Windows)
REM Quick testing tool for local development

setlocal enabledelayedexpansion

if "%API_URL%"=="" set API_URL=http://localhost:10000
if "%ADMIN_KEY%"=="" set ADMIN_KEY=change-me-in-production

echo ========================================
echo PrimusInsights Roofing - API Test Suite
echo ========================================
echo.

REM Test 1: Valid Lead Submission
echo [Test 1] Valid Lead Submission
curl -s -X POST "%API_URL%/lead" ^
  -H "Content-Type: application/json" ^
  -d "{\"phone\":\"+15551234567\",\"name\":\"John Smith\",\"message\":\"I need a roof inspection\",\"solarInterest\":true}"
echo.
echo.

REM Test 2: Missing Fields
echo [Test 2] Validation - Missing Fields (should fail)
curl -s -X POST "%API_URL%/lead" ^
  -H "Content-Type: application/json" ^
  -d "{\"phone\":\"+15551234567\",\"name\":\"Test\"}"
echo.
echo.

REM Test 3: Invalid Phone
echo [Test 3] Validation - Invalid Phone (should fail)
curl -s -X POST "%API_URL%/lead" ^
  -H "Content-Type: application/json" ^
  -d "{\"phone\":\"123\",\"name\":\"Test User\",\"message\":\"Testing invalid phone\"}"
echo.
echo.

REM Test 4: Solar Interest
echo [Test 4] Solar Interest Lead
curl -s -X POST "%API_URL%/lead" ^
  -H "Content-Type: application/json" ^
  -d "{\"phone\":\"+15559876543\",\"name\":\"Solar Customer\",\"message\":\"Interested in solar panels\",\"solarInterest\":true}"
echo.
echo.

REM Test 5: Multiple Leads
echo [Test 5] Submitting 5 Leads
for %%i in (1 2 3 4 5) do (
  curl -s -X POST "%API_URL%/lead" ^
    -H "Content-Type: application/json" ^
    -d "{\"phone\":\"+155512345%%i%%i\",\"name\":\"Customer %%i\",\"message\":\"Test message number %%i\"}" > nul
  echo   Lead %%i submitted
)
echo.
echo.

REM Test 6: Admin Access - Valid Key
echo [Test 6] Admin Dashboard - Valid Key
curl -s -w "%%{http_code}" "%API_URL%/admin?key=%ADMIN_KEY%" > nul
echo.
echo.

REM Test 7: Admin Access - Invalid Key
echo [Test 7] Admin Dashboard - Invalid Key (should return 401)
curl -s -w "%%{http_code}" "%API_URL%/admin?key=wrong-key" > nul
echo.
echo.

REM Test 8: Name Too Short
echo [Test 8] Validation - Name Too Short (should fail)
curl -s -X POST "%API_URL%/lead" ^
  -H "Content-Type: application/json" ^
  -d "{\"phone\":\"+15551234567\",\"name\":\"A\",\"message\":\"Testing short name\"}"
echo.
echo.

REM Test 9: Message Too Short
echo [Test 9] Validation - Message Too Short (should fail)
curl -s -X POST "%API_URL%/lead" ^
  -H "Content-Type: application/json" ^
  -d "{\"phone\":\"+15551234567\",\"name\":\"Test User\",\"message\":\"Hi\"}"
echo.
echo.

echo ========================================
echo Test Suite Complete!
echo ========================================
echo.
echo View admin dashboard:
echo   %API_URL%/admin?key=%ADMIN_KEY%
echo.
echo Check leads.json:
echo   type leads.json
echo.

pause
