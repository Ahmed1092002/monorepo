import Keycloak from "keycloak-js";
import type { KeycloakInitOptions } from "keycloak-js";

// Global singleton pattern to prevent multiple Keycloak instances
declare global {
  interface Window {
    __keycloakInstance?: Keycloak;
    __keycloakInitialized?: boolean;
  }
}

// Function to create a new Keycloak instance for each app
export const createKeycloakInstance = () => {
  // Return existing instance from global scope if it exists
  if (window.__keycloakInstance) {
    console.log("🔧 Reusing global Keycloak instance");
    return window.__keycloakInstance;
  }

  // Get environment variables from the current app
  const getEnvVar = (key: string, defaultValue: string) => {
    if (typeof window !== "undefined" && (window as any).import?.meta?.env) {
      return (window as any).import.meta.env[key] || defaultValue;
    }
    return defaultValue;
  };

  const config = {
    url: getEnvVar(
      "VITE_KEYCLOAK_URL",
      "https://keycloak.internal.130.107.181.14.nip.io/"
    ),
    realm: getEnvVar("VITE_KEYCLOAK_REALM", "myRealm"),
    clientId: getEnvVar("VITE_KEYCLOAK_CLIENT_ID", "react-client"),
  };

  // Debug logging
  console.log("🔧 Keycloak Configuration:", config);
  console.log("🔧 Creating new global Keycloak instance");

  // Create and store globally
  const keycloakInstance = new Keycloak(config);
  window.__keycloakInstance = keycloakInstance;
  window.__keycloakInitialized = false;
  return keycloakInstance;
};

// Export the keycloak instance directly for direct usage (lazy creation)
export const keycloak = createKeycloakInstance();

// Safe initialization function
export const safeKeycloakInit = async (initOptions: KeycloakInitOptions) => {
  const instance = createKeycloakInstance();

  // If already initialized, return the current state
  if (window.__keycloakInitialized) {
    console.log("🔧 Keycloak already initialized, returning current state");
    return instance.authenticated;
  }

  try {
    console.log("🔧 Initializing Keycloak...");
    const authenticated = await instance.init(initOptions);
    window.__keycloakInitialized = true;
    console.log("🔧 Keycloak initialization successful:", authenticated);
    return authenticated;
  } catch (error) {
    console.error("🔧 Keycloak initialization failed:", error);
    throw error;
  }
};

// Enhanced Keycloak configuration for PWA
export const keycloakInitOptions: KeycloakInitOptions = {
  onLoad: "check-sso",
  pkceMethod: "S256",
  // KeycloakResponseType: "code",
  checkLoginIframe: false,
};

// Export types
export interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: any;
  login: (redirectUri?: string) => void;
  logout: (redirectUri?: string) => void;
  token: string | null;
}

export interface AuthProviderProps {
  children: React.ReactNode;
}
