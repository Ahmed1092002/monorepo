#!/bin/bash

echo "🔐 Keycloak Setup for Multi-POS System"
echo "======================================"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

echo "✅ Docker is running"

# Start Keycloak
echo "🚀 Starting Keycloak server..."
docker-compose up -d

# Wait for Keycloak to start
echo "⏳ Waiting for Keycloak to start..."
sleep 10

# Check if Keycloak is running
if curl -s http://localhost:8080/health/ready > /dev/null; then
    echo "✅ Keycloak is running at http://localhost:8080"
else
    echo "⚠️  Keycloak might still be starting. Please wait a moment."
fi

echo ""
echo "📋 Next Steps:"
echo "1. Open http://localhost:8080 in your browser"
echo "2. Login with admin/admin"
echo "3. Create a client with ID: pos-system"
echo "4. Configure redirect URIs:"
echo "   - http://localhost:5173/*"
echo "   - http://localhost:3001/*"
echo "   - http://localhost:3002/*"
echo "5. Set Web origins:"
echo "   - http://localhost:5173"
echo "   - http://localhost:3001"
echo "   - http://localhost:3002"
echo ""
echo "📖 For detailed instructions, see KEYCLOAK_SETUP.md"
echo ""
echo "🎉 Setup complete! You can now start the POS applications."
