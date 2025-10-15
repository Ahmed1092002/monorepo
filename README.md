# 🚀 Multi-POS Monorepo with Turborepo

A modern monorepo for multi-type Point of Sale (POS) systems with Keycloak authentication, built with **Turborepo** for optimal performance and developer experience.

## 🏗️ **Architecture**

```
monorepo/
├── apps/
│   ├── react-app/          # Main app with POS selector
│   ├── pos-retail/         # Retail POS application
│   └── pos-restaurant/     # Restaurant POS application
├── packages/
│   ├── shared-auth/        # Keycloak authentication
│   ├── shared-pos/         # POS components & logic
│   ├── shared-ui/          # UI components
│   ├── shared-utils/       # Utility functions
│   └── shared-pwa/         # PWA capabilities
└── turbo.json              # Turborepo configuration
```

## ⚡ **Turborepo Benefits**

- **🚀 Faster Builds**: Intelligent caching and parallel execution
- **🔄 Smart Dependencies**: Only rebuild what changed
- **📦 Better DX**: Unified commands across all packages
- **🎯 Task Orchestration**: Optimized task execution order
- **📊 Build Analytics**: Detailed performance insights

## 🛠️ **Available Commands**

### **Development**

```bash
# Start all apps in development mode
npm run dev

# Start specific apps
npm run dev:retail        # Retail POS only
npm run dev:restaurant    # Restaurant POS only
npm run dev:main          # Main app only

# Start with Turborepo
npx turbo dev
npx turbo dev --filter=pos-retail
npx turbo dev --filter=pos-restaurant
```

### **Building**

```bash
# Build all packages and apps
npm run build

# Build specific apps
npm run build:retail
npm run build:restaurant
npm run build:main

# Build with Turborepo (with caching)
npx turbo build
npx turbo build --filter=pos-retail
```

### **Preview**

```bash
# Preview all built apps
npm run preview

# Preview specific apps
npm run preview:retail
npm run preview:restaurant
npm run preview:main
```

### **Code Quality**

```bash
# Lint all packages
npm run lint

# Type check all packages
npm run type-check

# Format code
npm run format

# Clean all build artifacts
npm run clean
```

## 🚀 **Quick Start**

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Start development**

   ```bash
   npm run dev:retail
   # or
   npx turbo dev --filter=pos-retail
   ```

3. **Open your browser**
   - Retail POS: http://localhost:3002
   - Restaurant POS: http://localhost:3002
   - Main App: http://localhost:5173

## 🔐 **Authentication Setup**

1. **Configure Keycloak**

   ```bash
   # Copy environment files
   cp apps/pos-retail/env.example apps/pos-retail/.env
   cp apps/pos-restaurant/env.example apps/pos-restaurant/.env
   cp apps/react-app/env.example apps/react-app/.env
   ```

2. **Update environment variables**

   ```env
   VITE_KEYCLOAK_URL=https://your-keycloak-url/
   VITE_KEYCLOAK_REALM=your-realm
   VITE_KEYCLOAK_CLIENT_ID=your-client-id
   ```

3. **Start Keycloak server** (if using Docker)
   ```bash
   # Using provided script
   ./setup-keycloak.sh
   # or
   setup-keycloak.bat
   ```

## 📱 **PWA Features**

- **Offline Support**: Works without internet connection
- **Service Workers**: Automatic caching and updates
- **IndexedDB**: Local data storage
- **Background Sync**: Sync when connection restored
- **Installable**: Can be installed as native app

## 🎯 **Turborepo Commands**

### **Filtering**

```bash
# Run tasks for specific packages
npx turbo dev --filter=pos-retail
npx turbo build --filter=@monorepo/shared-*

# Run tasks for packages that depend on shared-auth
npx turbo build --filter=...@monorepo/shared-auth

# Run tasks for packages that shared-auth depends on
npx turbo build --filter=@monorepo/shared-auth...
```

### **Caching**

```bash
# Clear Turborepo cache
npx turbo prune

# Build with fresh cache
npx turbo build --force

# Check cache status
npx turbo build --dry-run
```

### **Parallel Execution**

```bash
# Run multiple tasks in parallel
npx turbo dev --parallel
npx turbo build --parallel

# Limit parallel tasks
npx turbo build --concurrency=2
```

## 🔧 **Configuration**

### **turbo.json**

```json
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", "!.next/cache/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

### **Package Dependencies**

- **Shared packages** build first
- **Apps** depend on shared packages
- **Turborepo** automatically handles build order

## 📊 **Performance**

### **Build Times** (with Turborepo)

- **First build**: ~46s (all packages)
- **Incremental build**: ~5s (only changed packages)
- **Cache hit**: ~1s (no changes)

### **Development**

- **Hot reload**: <1s
- **Type checking**: Parallel across packages
- **Linting**: Parallel execution

## 🚀 **Deployment**

### **Production Build**

```bash
# Build all packages
npm run build

# Deploy specific apps
npm run build:retail
npm run preview:retail
```

### **Docker** (if needed)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "preview"]
```

## 🛠️ **Development Workflow**

1. **Start development**

   ```bash
   npm run dev:retail
   ```

2. **Make changes** to any package
   - Turborepo automatically rebuilds dependencies
   - Hot reload updates the UI instantly

3. **Test changes**

   ```bash
   npm run lint
   npm run type-check
   ```

4. **Build for production**
   ```bash
   npm run build
   ```

## 🎯 **Best Practices**

### **Package Structure**

- Keep shared packages focused and small
- Use proper TypeScript types
- Export only what's needed

### **Turborepo Usage**

- Use filters for specific packages
- Leverage caching for faster builds
- Run tasks in parallel when possible

### **Development**

- Use `npm run dev` for all apps
- Use `npm run dev:retail` for specific apps
- Use `npx turbo` for advanced filtering

## 🐛 **Troubleshooting**

### **Common Issues**

1. **Build fails**

   ```bash
   # Clear cache and rebuild
   npx turbo prune
   npm run build
   ```

2. **Type errors**

   ```bash
   # Check types across all packages
   npm run type-check
   ```

3. **Cache issues**
   ```bash
   # Force rebuild without cache
   npx turbo build --force
   ```

### **Debug Commands**

```bash
# Verbose output
npx turbo build --verbose

# Dry run to see what would be executed
npx turbo build --dry-run

# Check cache status
npx turbo build --dry-run --verbose
```

## 📚 **Resources**

- [Turborepo Documentation](https://turbo.build/repo/docs)
- [Vite Documentation](https://vitejs.dev/)
- [Keycloak Documentation](https://www.keycloak.org/documentation)
- [PWA Documentation](https://web.dev/progressive-web-apps/)

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 **License**

MIT License - see LICENSE file for details.

---

**Built with ❤️ using Turborepo, Vite, React, and TypeScript**
