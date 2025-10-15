import React, {
  createContext,
  useEffect,
  useContext,
  useState,
  useRef,
  useMemo,
  useCallback,
} from "react";
import Keycloak from "keycloak-js";
import type { KeycloakInitOptions } from "keycloak-js";

// Global singleton pattern to prevent multiple Keycloak instances
declare global {
  interface Window {
    __keycloakInstance?: Keycloak;
  }
}

// User data interface
export interface IUserData {
  userId: string;
  company: string;
  firstName: string;
  lastName: string;
  email: string;
  planId: number;
  numOfUsers: number;
}

// SSO Context interface
export interface SSOContextType {
  subscriptionStatus: string | null;
  initKeyCloakLogin: () => Promise<void>;
  isSSOCheck: boolean;
  setIsSSOCheck: (value: boolean) => void;
  keyCloackData: any;
  setKeyCloackData: (data: any) => void;
  authenticated: boolean;
  tokenAddedToCach: boolean;
  setSubscriptionStatus: (status: string | null) => void;
  kc: Keycloak;
  loading: boolean;
  login: (redirectUri?: string) => void;
  logout: (redirectUri?: string) => void;
  user: any;
  token: string | null;
}

export const SSOContext = createContext<SSOContextType | null>(null);

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

  const initOptions = {
    url: getEnvVar(
      "VITE_KEYCLOAK_URL",
      "https://keycloak.internal.130.107.181.14.nip.io/"
    ),
    realm: getEnvVar("VITE_KEYCLOAK_REALM", "myRealm"),
    clientId: getEnvVar("VITE_KEYCLOAK_CLIENT_ID", "react-client"),
  };

  // Debug logging
  console.log("🔧 Keycloak Configuration:", initOptions);
  console.log("🔧 Creating new global Keycloak instance");

  // Create and store globally
  window.__keycloakInstance = new Keycloak(initOptions);
  return window.__keycloakInstance;
};

// Enhanced Keycloak configuration for PWA
export const keycloakInitOptions: KeycloakInitOptions = {
  onLoad: "check-sso",
  pkceMethod: "S256",
  checkLoginIframe: false,
  flow: "standard",
  responseMode: "fragment",
  scope: "openid profile email",
  silentCheckSsoRedirectUri: window.location.origin + "/silent-check-sso.html",
};

// SSO Provider Component
export function SSOProvider({ children }: { children: React.ReactNode }) {
  const kc: Keycloak = useMemo(() => createKeycloakInstance(), []);
  const isRun = useRef(false);

  const [loading, setLoading] = useState(true);
  const [tokenAddedToCach, setTokenAddedToCach] = useState(false);
  const [isSSOCheck, setIsSSOCheck] = useState(false);
  const [keyCloackData, setKeyCloackData] = useState<any>();
  const [authenticated, setAuthenticated] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(
    localStorage.getItem("SubscriptionStatus")
  );

  // Refresh token in localStorage
  async function refreshTokenInLocalStorage() {
    await kc.updateToken(-1);
    localStorage.setItem("token", kc.token || "");
    localStorage.setItem("refreshToken", kc.refreshToken || "");
    localStorage.setItem("tokenExpiry", kc.tokenParsed?.exp?.toString() || "");
    localStorage.setItem(
      "refreshTokenExpiry",
      kc.refreshTokenParsed?.exp?.toString() || ""
    );
  }

  // Clear localStorage
  function clearLocalStorage() {
    localStorage.setItem("token", "");
    localStorage.setItem("refreshToken", "");
    localStorage.setItem("tokenExpiry", "");
    localStorage.setItem("refreshTokenExpiry", "");
  }

  // Initialize Keycloak
  async function initKeyCloakLogin() {
    try {
      const authenticated = await kc.init({
        onLoad: "check-sso",
        pkceMethod: "S256",
        // KeycloakResponseType: "code",
        checkLoginIframe: false,
      });

      setAuthenticated(authenticated);

      if (!authenticated) {
        clearLocalStorage();
        setLoading(false);
        // If not authenticated, redirect to login
        // kc.login();
      } else {
        setLoading(false);
        setKeyCloackData(kc);
        refreshTokenInLocalStorage();
        checkTokenExpiry();
      }
    } catch (error) {
      console.error("Keycloak initialization failed:", error);
      clearLocalStorage();
      setLoading(false);
    }
  }

  // Check token expiry
  const checkTokenExpiry = useCallback(() => {
    kc.onTokenExpired = async () => {
      if (kc.refreshToken) {
        try {
          const refreshed = await kc.updateToken(-1);
          if (refreshed) {
            // Token Refreshed
            setKeyCloackData(kc);
            localStorage.setItem("token", kc.token || "");
            localStorage.setItem("refreshToken", kc.refreshToken || "");
            localStorage.setItem(
              "tokenExpiry",
              kc.tokenParsed?.exp?.toString() || ""
            );
            localStorage.setItem(
              "refreshTokenExpiry",
              kc.refreshTokenParsed?.exp?.toString() || ""
            );
            setLoading(false);
          } else {
            // Token Still Valid
            setKeyCloackData(kc);
            clearLocalStorage();
            setLoading(false);
          }
        } catch (error) {
          // Failed to refresh the token
          console.error("Token refresh failed:", error);
          clearLocalStorage();
          setLoading(false);
        }
      } else {
        // Token Not Exist
        clearLocalStorage();
        setLoading(false);
      }
    };
  }, [kc]);

  // Login function
  const login = useCallback(
    (redirectUri?: string) => {
      const redirectUrl =
        redirectUri ||
        (typeof window !== "undefined" &&
          (window as any).import?.meta?.env?.VITE_API_BASE_URL) ||
        window.location.origin;
      kc.login({ redirectUri: redirectUrl });
    },
    [kc]
  );

  // Logout function
  const logout = useCallback(
    (redirectUri?: string) => {
      console.log("🚪 Logout called with redirectUri:", redirectUri);
      clearLocalStorage();
      const redirectUrl =
        redirectUri ||
        (typeof window !== "undefined" &&
          (window as any).import?.meta?.env?.VITE_API_BASE_URL) ||
        window.location.origin;
      console.log("🚪 Final redirect URL:", redirectUrl);
      console.log("🚪 Calling kc.logout with:", { redirectUri: redirectUrl });
      kc.logout({ redirectUri: redirectUrl });
    },
    [kc]
  );

  // Initialize on mount
  useEffect(() => {
    if (isRun.current) return;
    isRun.current = true;
    initKeyCloakLogin();
  }, [kc]);

  const contextValue = useMemo(
    () => ({
      subscriptionStatus,
      initKeyCloakLogin,
      isSSOCheck,
      setIsSSOCheck,
      keyCloackData,
      setKeyCloackData,
      authenticated,
      tokenAddedToCach,
      setSubscriptionStatus,
      kc,
      loading,
      login,
      logout,
      user: kc?.tokenParsed || null,
      token: kc?.token || null,
    }),
    [
      subscriptionStatus,
      isSSOCheck,
      keyCloackData,
      authenticated,
      tokenAddedToCach,
      kc,
      loading,
      login,
      logout,
    ]
  );

  return (
    <SSOContext.Provider value={contextValue}>
      {loading ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        children
      )}
    </SSOContext.Provider>
  );
}

// Hook to use SSO context
export function useSSO() {
  const context = useContext(SSOContext);
  if (context === null) {
    throw new Error("useSSO must be used within a SSOProvider");
  }
  return context;
}

// Export the keycloak instance directly for direct usage
export const keycloak = createKeycloakInstance();
