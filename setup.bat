@echo off
echo 🚀 Setting up Monorepo with Vite React App and Keycloak Authentication
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js ^>= 18.0.0
    pause
    exit /b 1
)

echo ✅ Node.js version:
node --version

REM Install dependencies
echo 📦 Installing dependencies...
npm install

REM Create environment file if it doesn't exist
if not exist "apps\react-app\.env" (
    echo 📝 Creating environment file...
    copy "apps\react-app\env.example" "apps\react-app\.env"
    echo ✅ Environment file created at apps\react-app\.env
    echo    Please edit it with your Keycloak configuration
) else (
    echo ✅ Environment file already exists
)

echo.
echo 🎉 Setup complete!
echo.
echo Next steps:
echo 1. Start Keycloak server:
echo    docker-compose up -d
echo    OR
echo    docker run -p 8080:8080 -e KEYCLOAK_ADMIN=admin -e KEYCLOAK_ADMIN_PASSWORD=admin quay.io/keycloak/keycloak:latest start-dev
echo.
echo 2. Configure Keycloak client (see README.md for details)
echo.
echo 3. Start the development server:
echo    npm run dev
echo.
echo 4. Open http://localhost:5173 in your browser
pause
