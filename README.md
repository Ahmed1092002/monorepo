# Multi-Type POS Monorepo with Keycloak Authentication

This monorepo contains a comprehensive Point of Sale (POS) system with multiple POS types (Retail and Restaurant), shared authentication via Keycloak, and full offline capabilities with PWA support.

## 🏗️ Project Structure

```
monorepo/
├── apps/
│   ├── react-app/              # Main authentication app (port 5173)
│   ├── pos-retail/             # Retail POS application (port 3001)
│   └── pos-restaurant/         # Restaurant POS application (port 3002)
├── packages/
│   ├── shared-ui/             # Shared UI components
│   ├── shared-utils/          # Shared utilities
│   ├── shared-pos/            # Shared POS components and forms
│   ├── shared-pwa/            # PWA utilities and offline management
│   └── shared-auth/           # Shared Keycloak authentication
├── package.json               # Root package.json with workspace config
├── docker-compose.yml         # Keycloak server setup
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Docker (for Keycloak server)

### Installation

1. Clone the repository and install dependencies:

   ```bash
   npm install
   ```

2. Set up environment variables:

   ```bash
   cd apps/react-app
   cp env.example .env
   ```

   Edit `.env` with your Keycloak configuration:

   ```env
   VITE_KEYCLOAK_URL=http://localhost:8080
   VITE_KEYCLOAK_REALM=master
   VITE_KEYCLOAK_CLIENT_ID=pos-system
   ```

### Keycloak Setup

1. Start Keycloak server:

   ```bash
   docker-compose up -d
   ```

2. Access Keycloak admin console at `http://localhost:8080`
   - Username: `admin`
   - Password: `admin`

3. Create a new client:
   - Client ID: `pos-system`
   - Client Protocol: `openid-connect`
   - Access Type: `public`
   - Valid Redirect URIs:
     - `http://localhost:5173/*`
     - `http://localhost:3001/*`
     - `http://localhost:3002/*`
   - Web Origins:
     - `http://localhost:5173`
     - `http://localhost:3001`
     - `http://localhost:3002`

### Development

Start all applications:

```bash
# Start main auth app
npm run dev

# Start retail POS (in separate terminal)
npm run dev:retail

# Start restaurant POS (in separate terminal)
npm run dev:restaurant
```

## 🔄 Application Flow

### Authentication Flow

1. **Login**: User visits `http://localhost:5173` and logs in via Keycloak
2. **POS Selection**: After authentication, user sees available POS locations
3. **POS Navigation**: User selects a location and is redirected to the appropriate POS app:
   - Retail: `http://localhost:3001?type=retail&locationId=<id>`
   - Restaurant: `http://localhost:3002?type=restaurant&locationId=<id>`

### URL-Based Routing

The system uses URL parameters to determine POS type and location:

- `?type=retail` - Opens retail POS interface
- `?type=restaurant` - Opens restaurant POS interface
- `?locationId=<id>` - Specifies the POS location

## 📦 Available Scripts

### Root Level Scripts

- `npm run dev` - Start main auth app
- `npm run dev:retail` - Start retail POS app
- `npm run dev:restaurant` - Start restaurant POS app
- `npm run build` - Build all applications
- `npm run build:retail` - Build retail POS app
- `npm run build:restaurant` - Build restaurant POS app
- `npm run preview:retail` - Preview retail POS build
- `npm run preview:restaurant` - Preview restaurant POS build

## 🔐 Authentication Features

- **Single Sign-On**: One Keycloak instance serves all POS applications
- **Shared Authentication**: Login state is maintained across all apps
- **Automatic Token Refresh**: Tokens are refreshed automatically
- **Offline Authentication**: Cached authentication for offline use

## 🛒 POS Features

### Retail POS (`pos-retail`)

- **Product Catalog**: Browse and search products
- **Shopping Cart**: Add/remove items with quantity management
- **Transaction Processing**: Complete sales with offline support
- **Inventory Management**: Track product availability

### Restaurant POS (`pos-restaurant`)

- **Menu Management**: Organized by categories (appetizers, mains, desserts)
- **Table Management**: Track table status (available, occupied, reserved)
- **Order Processing**: Place orders for specific tables
- **Kitchen Integration**: Send orders to kitchen systems

## 📱 PWA Features

### Offline Capabilities

- **Service Worker**: Caches app resources for offline use
- **IndexedDB Storage**: Stores transactions, menu items, and settings locally
- **Background Sync**: Syncs data when connection is restored
- **Offline Indicators**: Visual feedback for connection status

### Progressive Web App

- **Installable**: Can be installed on mobile devices
- **App-like Experience**: Full-screen, standalone interface
- **Push Notifications**: Real-time updates (configurable)
- **Responsive Design**: Works on desktop, tablet, and mobile

## 🗄️ Data Management

### IndexedDB Schema

```typescript
interface POSDatabase {
  "pos-locations": POSLocation[]; // Available POS locations
  "pos-transactions": Transaction[]; // Sales transactions
  "pos-settings": Settings[]; // App settings per location
}
```

### Offline Data Flow

1. **Online**: Data is fetched from API and cached in IndexedDB
2. **Offline**: Data is served from IndexedDB cache
3. **Sync**: When online, unsynced transactions are uploaded to server

## 🎨 UI Components

### Shared Components (`@monorepo/shared-ui`)

- **Button**: Configurable button with variants
- **Card**: Reusable card container
- **LoadingSpinner**: Loading indicators

### POS Components (`@monorepo/shared-pos`)

- **POSSelector**: Location selection interface
- **RetailPOSForm**: Retail transaction interface
- **RestaurantPOSForm**: Restaurant order interface
- **OfflineIndicator**: Connection status indicator

## 🛠️ Utilities

### API Client (`@monorepo/shared-utils`)

- HTTP client with automatic token handling
- Request/response interceptors
- Error handling and retry logic

### PWA Manager (`@monorepo/shared-pwa`)

- Service worker management
- IndexedDB operations
- Offline/online status detection
- Background sync coordination

### Authentication (`@monorepo/shared-auth`)

- **Keycloak Integration**: Centralized authentication configuration
- **AuthProvider**: React context for authentication state
- **Auth Components**: LoginButton, LogoutButton, UserProfile, LoadingSpinner
- **Single Configuration**: One Keycloak setup for all applications
- **No Code Duplication**: Shared authentication logic across all apps

## 🔧 Configuration

### Environment Variables

| Variable                  | Description         | Default                 |
| ------------------------- | ------------------- | ----------------------- |
| `VITE_KEYCLOAK_URL`       | Keycloak server URL | `http://localhost:8080` |
| `VITE_KEYCLOAK_REALM`     | Keycloak realm      | `master`                |
| `VITE_KEYCLOAK_CLIENT_ID` | Keycloak client ID  | `pos-system`            |

### Port Configuration

- **Main App**: `http://localhost:5173` (authentication)
- **Retail POS**: `http://localhost:3001` (retail interface)
- **Restaurant POS**: `http://localhost:3002` (restaurant interface)

## 🚀 Deployment

### Production Build

1. Build all applications:

   ```bash
   npm run build
   ```

2. Deploy each app to appropriate servers:
   - Main app: Authentication gateway
   - Retail POS: Retail-specific server
   - Restaurant POS: Restaurant-specific server

### Environment Setup

Configure production environment variables:

```env
VITE_KEYCLOAK_URL=https://your-keycloak-server.com
VITE_KEYCLOAK_REALM=production
VITE_KEYCLOAK_CLIENT_ID=pos-system-prod
```

## 🔄 API Integration

### Expected API Endpoints

The system expects these API endpoints:

```
GET  /api/pos-locations          # Get available POS locations
GET  /api/retail-items          # Get retail products
GET  /api/restaurant-menu       # Get restaurant menu
GET  /api/tables                # Get restaurant tables
POST /api/transactions          # Submit retail transactions
POST /api/orders                # Submit restaurant orders
```

## 📊 Monitoring and Analytics

- **Offline Usage**: Track offline transaction counts
- **Sync Status**: Monitor data synchronization success
- **Performance**: Service worker cache hit rates
- **User Activity**: POS usage patterns

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test offline functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.
