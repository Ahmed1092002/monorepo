# 🚀 **New SSOProvider Implementation**

## ✅ **Production-Ready Keycloak Integration**

I've implemented a comprehensive SSOProvider based on your production code pattern. This provides:

- **🔄 Automatic Token Refresh**: Handles token expiration automatically
- **💾 Local Storage Management**: Stores tokens and expiry times
- **🛡️ Error Handling**: Robust error handling with fallbacks
- **⚡ Performance Optimized**: Uses useMemo and useCallback for optimal performance
- **🔧 Global Singleton**: Prevents multiple Keycloak instances

## 📁 **Usage Examples**

### **Method 1: Using SSOProvider (Recommended)**

```tsx
// apps/pos-retail/src/main.tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { SSOProvider } from "@monorepo/shared-auth";
import "./index.css";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <SSOProvider>
      <App />
    </SSOProvider>
  </StrictMode>
);
```

### **Method 2: Using SSOProvider with Additional Providers**

```tsx
// apps/pos-retail/src/main.tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "./store/store";
import { I18nextProvider } from "react-i18next";
import i18n from "@/i18n.ts";
import { SSOProvider } from "@monorepo/shared-auth";
import { LocalizationProvider } from "@/providers/LanguageProvider";
import "./index.css";
import "./styles/tenant-themes.css";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider store={store}>
      <I18nextProvider i18n={i18n}>
        <SSOProvider>
          <LocalizationProvider>
            <App />
          </LocalizationProvider>
        </SSOProvider>
      </I18nextProvider>
    </Provider>
  </StrictMode>
);
```

### **Method 3: Direct ReactKeycloakProvider (Your Original Pattern)**

```tsx
// apps/pos-retail/src/main.tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ReactKeycloakProvider } from "@react-keycloak/web";
import { keycloak, keycloakInitOptions } from "@monorepo/shared-auth";
import "./index.css";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ReactKeycloakProvider
      authClient={keycloak}
      initOptions={keycloakInitOptions}
    >
      <App />
    </ReactKeycloakProvider>
  </StrictMode>
);
```

## 🎯 **Using the SSO Hook in Components**

```tsx
// apps/pos-retail/src/App.tsx
import { useSSO } from "@monorepo/shared-auth";

function App() {
  const {
    authenticated,
    loading,
    user,
    token,
    login,
    logout,
    subscriptionStatus,
    keyCloackData,
  } = useSSO();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!authenticated) {
    return (
      <div>
        <h1>Please Login</h1>
        <button onClick={login}>Login</button>
      </div>
    );
  }

  return (
    <div>
      <h1>Welcome, {user?.preferred_username}</h1>
      <p>Subscription: {subscriptionStatus}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

## 🔧 **Available Context Properties**

The `useSSO()` hook provides:

- `authenticated`: boolean - Authentication status
- `loading`: boolean - Loading state
- `user`: object - User data from token
- `token`: string - Current access token
- `login()`: function - Trigger login
- `logout()`: function - Trigger logout
- `subscriptionStatus`: string - User subscription status
- `keyCloackData`: object - Full Keycloak instance data
- `tokenAddedToCach`: boolean - Token cache status
- `isSSOCheck`: boolean - SSO check status

## 🚀 **What's Updated**

1. **✅ SSOProvider**: Production-ready provider with token management
2. **✅ Automatic Token Refresh**: Handles token expiration seamlessly
3. **✅ Local Storage**: Stores tokens and expiry times
4. **✅ Error Handling**: Robust error handling with fallbacks
5. **✅ Performance**: Optimized with useMemo and useCallback
6. **✅ Global Singleton**: Prevents multiple Keycloak instances
7. **✅ TypeScript**: Full TypeScript support with proper types

## 🎉 **Ready to Use!**

Your POS applications now use the production-ready SSOProvider pattern. Visit:

- **Retail POS**: http://localhost:3008
- **Restaurant POS**: http://localhost:3009

The authentication system is now robust, production-ready, and follows your preferred implementation pattern! 🚀
