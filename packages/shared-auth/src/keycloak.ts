import Keycloak from "keycloak-js";
import type { KeycloakInitOptions } from "keycloak-js";
import { offlineManager, useOfflineStatus } from "@monorepo/shared-utils";
import * as db from "@monorepo/shared-utils";

// Initialize Keycloak instance
const keycloak = new Keycloak({
  url:
    (import.meta as any).env?.VITE_KEYCLOAK_URL ||
    process.env.VITE_KEYCLOAK_URL,
  realm:
    (import.meta as any).env?.VITE_KEYCLOAK_REALM ||
    process.env.VITE_KEYCLOAK_REALM,
  clientId:
    (import.meta as any).env?.VITE_KEYCLOAK_CLIENT_ID ||
    process.env.VITE_KEYCLOAK_CLIENT_ID,
});

// Enhanced Keycloak configuration for PWA
const keycloakConfig: KeycloakInitOptions = {
  onLoad: "check-sso",
  pkceMethod: "S256",
  checkLoginIframe: false,
  flow: "standard",
  responseMode: "fragment",
  scope: "openid profile email",
};

// Use the advanced offline manager from shared-utils

// 🔥 CRITICAL: Override Keycloak's redirect methods to prevent redirects when offline
const originalLogin = keycloak.login.bind(keycloak);
const originalRegister = keycloak.register?.bind(keycloak);
const originalLogout = keycloak.logout?.bind(keycloak);
const originalAccountManagement = keycloak.accountManagement?.bind(keycloak);

const blockIfOffline = (methodName: string) => {
  const status = offlineManager.getStatus();
  const isOffline = status.isOffline || status.isChecking;
  if (isOffline) {
    console.error(`🔥 BLOCKED Keycloak ${methodName} redirect while offline`);
    return true;
  }
  return false;
};

keycloak.login = function (options?: Record<string, unknown>) {
  if (blockIfOffline("login")) return Promise.resolve();
  return originalLogin(options);
};

if (originalRegister) {
  keycloak.register = function (options?: Record<string, unknown>) {
    if (blockIfOffline("register")) return Promise.resolve();
    return originalRegister(options);
  };
}

if (originalLogout) {
  keycloak.logout = function (options?: Record<string, unknown>) {
    if (blockIfOffline("logout")) return Promise.resolve();
    return originalLogout(options);
  };
}

if (originalAccountManagement) {
  keycloak.accountManagement = function () {
    if (blockIfOffline("accountManagement")) return Promise.resolve();
    return originalAccountManagement();
  };
}

// Enhanced Keycloak initialization with better offline/online handling
(() => {
  const originalInit = keycloak.init.bind(keycloak) as (
    options?: KeycloakInitOptions
  ) => Promise<boolean>;
  let hasInitialized = false;
  let wasOffline = false;
  let initPromise: Promise<boolean> | null = null;
  let lastInitAttempt = 0;
  const INIT_COOLDOWN = 5000; // 5 seconds cooldown between init attempts

  const guardedInit = async (
    options?: KeycloakInitOptions
  ): Promise<boolean> => {
    const now = Date.now();

    if (initPromise) {
      return initPromise;
    }

    if (hasInitialized && now - lastInitAttempt < INIT_COOLDOWN) {
      return Promise.resolve(Boolean(keycloak.authenticated));
    }

    const offlineStatus = offlineManager.getStatus();
    const isCurrentlyOffline = offlineStatus.isOffline;

    if (offlineStatus.isChecking) {
      return new Promise((resolve) => {
        setTimeout(() => {
          const recheckStatus = offlineManager.getStatus();
          const recheckOffline = recheckStatus.isOffline;

          if (recheckOffline) {
            hasInitialized = true;
            wasOffline = true;
            lastInitAttempt = Date.now();
            resolve(false);
          } else {
            guardedInit(options)
              .then(resolve)
              .catch(() => resolve(false));
          }
        }, 1000);
      });
    }

    if (wasOffline && !isCurrentlyOffline) {
      hasInitialized = false;
      wasOffline = false;
    }

    if (hasInitialized && !isCurrentlyOffline) {
      return Promise.resolve(Boolean(keycloak.authenticated));
    }

    if (isCurrentlyOffline) {
      hasInitialized = true;
      wasOffline = true;
      lastInitAttempt = now;
      return Promise.resolve(false);
    }
    initPromise = (async () => {
      try {
        lastInitAttempt = now;
        const initOptions = { ...keycloakConfig, ...options };
        const result = await originalInit(initOptions);
        hasInitialized = true;
        wasOffline = false;
        return result;
      } catch {
        hasInitialized = true;
        return false;
      } finally {
        initPromise = null;
      }
    })();

    return initPromise;
  };

  (
    keycloak as unknown as {
      init: (options?: KeycloakInitOptions) => Promise<boolean>;
    }
  ).init = guardedInit;

  offlineManager.subscribe((status) => {
    if (status.isOnline && wasOffline) {
      hasInitialized = false;
      wasOffline = false;
    } else if (status.isOffline) {
      wasOffline = true;
    }
  });

  (
    keycloak as Keycloak & { resetInitialization?: () => void }
  ).resetInitialization = () => {
    hasInitialized = false;
    wasOffline = false;
    initPromise = null;
    lastInitAttempt = 0;
  };
})();

// PWA-aware authentication utilities with advanced offline detection and database storage
export const pwaAuthUtils = {
  async checkAuthStatus(): Promise<boolean> {
    const status = offlineManager.getStatus();
    if (status.isOffline || status.isChecking) {
      return this.checkOfflineAuth();
    }
    return Boolean(keycloak.authenticated);
  },

  async checkOfflineAuth(): Promise<boolean> {
    try {
      // Use IndexedDB for offline auth check
      const tokenMetadata = await db.get("keycloak-token");
      if (tokenMetadata && typeof tokenMetadata === "object") {
        const parsed = tokenMetadata as {
          authenticated: boolean;
          exp: number;
          iat: number;
          sub: string;
        };
        if (parsed.authenticated) {
          const now = Date.now() / 1000;
          if (parsed.exp && parsed.exp > now) {
            return true;
          }
        }
      }
      return false;
    } catch (error) {
      console.error("Failed to check offline auth:", error);
      return false;
    }
  },

  async cacheTokens(): Promise<void> {
    try {
      if (keycloak.authenticated && keycloak.tokenParsed) {
        const tokenMetadata = {
          authenticated: true,
          exp: keycloak.tokenParsed.exp,
          iat: keycloak.tokenParsed.iat,
          sub: keycloak.tokenParsed.sub,
          name: keycloak.tokenParsed.name,
          email: keycloak.tokenParsed.email,
          preferred_username: keycloak.tokenParsed.preferred_username,
          cachedAt: Date.now(),
        };

        // Store in IndexedDB for better offline support
        await db.set("keycloak-token", tokenMetadata);

        // Also store in localStorage as fallback
        localStorage.setItem("keycloak-token", JSON.stringify(tokenMetadata));
      }
    } catch (error) {
      console.error("Failed to cache authentication metadata:", error);
    }
  },

  async clearCachedTokens(): Promise<void> {
    try {
      await db.del("keycloak-token");
      localStorage.removeItem("keycloak-token");
    } catch (error) {
      console.error("Failed to clear cached tokens:", error);
    }
  },

  async getCachedUserInfo(): Promise<any> {
    try {
      const tokenMetadata = await db.get("keycloak-token");
      if (tokenMetadata && typeof tokenMetadata === "object") {
        const parsed = tokenMetadata as {
          authenticated: boolean;
          exp: number;
          name?: string;
          email?: string;
          preferred_username?: string;
        };
        if (parsed.authenticated) {
          const now = Date.now() / 1000;
          if (parsed.exp && parsed.exp > now) {
            return {
              name: parsed.name,
              email: parsed.email,
              preferred_username: parsed.preferred_username,
            };
          }
        }
      }
      return null;
    } catch (error) {
      console.error("Failed to get cached user info:", error);
      return null;
    }
  },
};

export default keycloak;
