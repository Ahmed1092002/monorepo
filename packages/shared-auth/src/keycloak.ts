import Keycloak from "keycloak-js";
import type { KeycloakInitOptions } from "keycloak-js";
import { offlineManager } from "@monorepo/shared-utils";
import * as db from "@monorepo/shared-utils";

// Configuration interface for Keycloak
export interface KeycloakConfig {
  url: string;
  realm: string;
  clientId: string;
  initOptions?: KeycloakInitOptions;
}

// Default configuration
const defaultConfig: KeycloakConfig = {
  url: "http://localhost:8080",
  realm: "master",
  clientId: "pos-app",
  initOptions: {
    onLoad: "check-sso",
    pkceMethod: "S256",
    checkLoginIframe: false,
    flow: "standard",
    responseMode: "fragment",
    scope: "openid profile email",
  },
};

// Global Keycloak instance
let globalKeycloakInstance: Keycloak | null = null;

// Enhanced function to get environment variables with better error handling
const getEnvVar = (name: string): string | undefined => {
  try {
    // Method 1: Vite environment variables (works in app context)
    if (typeof window !== "undefined" && (window as any).import?.meta?.env) {
      const value = (window as any).import.meta.env[name];
      if (value) {
        console.log(`🔧 Found env var ${name}:`, value);
        return value;
      }
    }

    // Method 2: Process.env (works in Node.js context)
    if (typeof process !== "undefined" && process.env) {
      const value = process.env[name];
      if (value) {
        console.log(`🔧 Found env var ${name} in process.env:`, value);
        return value;
      }
    }

    // Method 3: Global window object (for custom injection)
    if (typeof window !== "undefined" && (window as any).__ENV__) {
      const value = (window as any).__ENV__[name];
      if (value) {
        console.log(`🔧 Found env var ${name} in window.__ENV__:`, value);
        return value;
      }
    }

    console.log(`⚠️ Environment variable ${name} not found`);
    return undefined;
  } catch (error) {
    console.error(`❌ Error reading environment variable ${name}:`, error);
    return undefined;
  }
};

// Global Keycloak instance
let globalKeycloakInstance: Keycloak | null = null;

// Global configuration store
let globalConfig: Partial<KeycloakConfig> = {};

// Function to set configuration from app level
export const setKeycloakConfig = (config: Partial<KeycloakConfig>) => {
  globalConfig = { ...globalConfig, ...config };
  console.log("🔧 Keycloak config updated:", globalConfig);

  // Reset global instance if config changed
  if (globalKeycloakInstance) {
    console.log("🔄 Resetting Keycloak instance due to config change");
    globalKeycloakInstance = null;
  }
};

// Function to get configuration with priority: injected config > env vars > defaults
const getEffectiveConfig = (
  config: Partial<KeycloakConfig> = {}
): KeycloakConfig => {
  // Start with defaults
  let effectiveConfig: KeycloakConfig = { ...defaultConfig };

  // Apply global config (injected from app)
  effectiveConfig = { ...effectiveConfig, ...globalConfig };

  // Apply environment variables
  const envConfig: Partial<KeycloakConfig> = {
    url: getEnvVar("VITE_KEYCLOAK_URL") || effectiveConfig.url,
    realm: getEnvVar("VITE_KEYCLOAK_REALM") || effectiveConfig.realm,
    clientId: getEnvVar("VITE_KEYCLOAK_CLIENT_ID") || effectiveConfig.clientId,
  };
  effectiveConfig = { ...effectiveConfig, ...envConfig };

  // Apply passed config (highest priority)
  effectiveConfig = { ...effectiveConfig, ...config };

  return effectiveConfig;
};

// Function to create Keycloak instance with configuration
export const createKeycloakInstance = (
  config: Partial<KeycloakConfig> = {}
): Keycloak => {
  const keycloakConfig = getEffectiveConfig(config);

  console.log("🔧 Creating Keycloak instance with config:", {
    ...keycloakConfig,
    envVars: {
      VITE_KEYCLOAK_URL: getEnvVar("VITE_KEYCLOAK_URL"),
      VITE_KEYCLOAK_REALM: getEnvVar("VITE_KEYCLOAK_REALM"),
      VITE_KEYCLOAK_CLIENT_ID: getEnvVar("VITE_KEYCLOAK_CLIENT_ID"),
    },
  });

  const keycloak = new Keycloak({
    url: keycloakConfig.url,
    realm: keycloakConfig.realm,
    clientId: keycloakConfig.clientId,
  });

  // Add error handling
  keycloak.onAuthError = (error) => {
    console.error("Keycloak Auth Error:", error);
  };

  keycloak.onAuthLogout = () => {
    console.log("Keycloak Logout");
  };

  keycloak.onAuthRefreshError = () => {
    console.error("Keycloak Refresh Error");
  };

  // Test Keycloak server accessibility
  const testKeycloakServer = async () => {
    try {
      const testUrl = `${keycloakConfig.url}/realms/${keycloakConfig.realm}`;
      console.log(`🔍 Testing Keycloak server at: ${testUrl}`);

      const response = await fetch(testUrl, {
        method: "HEAD",
        mode: "cors",
      });

      if (response.ok) {
        console.log("✅ Keycloak server is accessible");
      } else {
        console.warn(`⚠️ Keycloak server returned status: ${response.status}`);
      }
    } catch (error) {
      console.error("❌ Keycloak server is not accessible:", error);
    }
  };

  // Test server accessibility after a short delay
  setTimeout(testKeycloakServer, 1000);

  return keycloak;
};

// Function to get or create global Keycloak instance
export const getKeycloakInstance = (
  config?: Partial<KeycloakConfig>
): Keycloak => {
  if (!globalKeycloakInstance) {
    globalKeycloakInstance = createKeycloakInstance(config);
  }
  return globalKeycloakInstance;
};

// Function to reset global instance (useful for testing or config changes)
export const resetKeycloakInstance = () => {
  globalKeycloakInstance = null;
};

// Simplified offline handling
const blockIfOffline = (methodName: string) => {
  // Temporarily disable offline blocking to debug Keycloak initialization
  console.log(
    `🌐 Allowing Keycloak ${methodName} - offline blocking disabled for debugging`
  );
  return false;
};

// Enhanced Keycloak initialization wrapper
export const initializeKeycloak = async (
  keycloak: Keycloak,
  config?: Partial<KeycloakConfig>
): Promise<boolean> => {
  const originalInit = keycloak.init.bind(keycloak);
  let hasInitialized = false;
  let initPromise: Promise<boolean> | null = null;

  const guardedInit = async (
    options?: KeycloakInitOptions
  ): Promise<boolean> => {
    if (initPromise) {
      return initPromise;
    }

    if (hasInitialized && navigator.onLine) {
      return Promise.resolve(Boolean(keycloak.authenticated));
    }

    console.log(
      `Keycloak: Proceeding with initialization - navigator: ${navigator.onLine}`
    );

    initPromise = (async () => {
      try {
        console.log("Keycloak: Initializing...");
        const initOptions = {
          ...defaultConfig.initOptions,
          ...config?.initOptions,
          ...options,
        };
        const result = await originalInit(initOptions);
        hasInitialized = true;
        console.log("Keycloak: Initialization result:", result);
        return result;
      } catch (error) {
        console.error("Keycloak: Initialization failed:", error);
        hasInitialized = true;
        return false;
      } finally {
        initPromise = null;
      }
    })();

    return initPromise;
  };

  // Override the init method
  (keycloak as any).init = guardedInit;

  return guardedInit();
};

// PWA-aware authentication utilities
export const pwaAuthUtils = {
  async checkAuthStatus(): Promise<boolean> {
    if (offlineManager.getStatus().isOffline) {
      return this.checkOfflineAuth();
    }
    return Boolean(globalKeycloakInstance?.authenticated);
  },

  async checkOfflineAuth(): Promise<boolean> {
    try {
      const tokenMetadata = await db.get<{
        authenticated?: boolean;
        exp?: number;
      }>("keycloak-token");

      if (tokenMetadata?.authenticated) {
        const now = Date.now() / 1000;
        if (tokenMetadata.exp && tokenMetadata.exp > now) {
          return true;
        }
      }
      return false;
    } catch {
      return false;
    }
  },

  async cacheTokens(): Promise<void> {
    try {
      if (
        globalKeycloakInstance?.authenticated &&
        globalKeycloakInstance.tokenParsed
      ) {
        const tokenMetadata = {
          authenticated: true,
          exp: globalKeycloakInstance.tokenParsed.exp,
          iat: globalKeycloakInstance.tokenParsed.iat,
          sub: globalKeycloakInstance.tokenParsed.sub,
        };
        await db.set("keycloak-token", tokenMetadata);
      }
    } catch (error) {
      console.error("Failed to cache authentication metadata:", error);
    }
  },
};

// Export default instance (for backward compatibility)
export default getKeycloakInstance();
