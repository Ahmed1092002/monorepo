#!/bin/bash

echo "🚀 Setting up Monorepo with Vite React App and Keycloak Authentication"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js >= 18.0.0"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version $NODE_VERSION is not supported. Please install Node.js >= 18.0.0"
    exit 1
fi

echo "✅ Node.js version $(node -v) is supported"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create environment file if it doesn't exist
if [ ! -f "apps/react-app/.env" ]; then
    echo "📝 Creating environment file..."
    cp apps/react-app/env.example apps/react-app/.env
    echo "✅ Environment file created at apps/react-app/.env"
    echo "   Please edit it with your Keycloak configuration"
else
    echo "✅ Environment file already exists"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Start Keycloak server:"
echo "   docker-compose up -d"
echo "   OR"
echo "   docker run -p 8080:8080 -e KEYCLOAK_ADMIN=admin -e KEYCLOAK_ADMIN_PASSWORD=admin quay.io/keycloak/keycloak:latest start-dev"
echo ""
echo "2. Configure Keycloak client (see README.md for details)"
echo ""
echo "3. Start the development server:"
echo "   npm run dev"
echo ""
echo "4. Open http://localhost:5173 in your browser"
