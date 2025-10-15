@echo off
echo 🔐 Keycloak Setup for Multi-POS System
echo ======================================
echo.

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not running. Please start Docker first.
    pause
    exit /b 1
)

echo ✅ Docker is running

REM Start Keycloak
echo 🚀 Starting Keycloak server...
docker-compose up -d

REM Wait for Keycloak to start
echo ⏳ Waiting for Keycloak to start...
timeout /t 10 /nobreak >nul

REM Check if Keycloak is running
curl -s http://localhost:8080/health/ready >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Keycloak is running at http://localhost:8080
) else (
    echo ⚠️  Keycloak might still be starting. Please wait a moment.
)

echo.
echo 📋 Next Steps:
echo 1. Open http://localhost:8080 in your browser
echo 2. Login with admin/admin
echo 3. Create a client with ID: pos-system
echo 4. Configure redirect URIs:
echo    - http://localhost:5173/*
echo    - http://localhost:3001/*
echo    - http://localhost:3002/*
echo 5. Set Web origins:
echo    - http://localhost:5173
echo    - http://localhost:3001
echo    - http://localhost:3002
echo.
echo 📖 For detailed instructions, see KEYCLOAK_SETUP.md
echo.
echo 🎉 Setup complete! You can now start the POS applications.
pause
