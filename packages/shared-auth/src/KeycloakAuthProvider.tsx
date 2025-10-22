import React, { createContext, useContext } from "react";
import { ReactKeycloakProvider, useKeycloak } from "@react-keycloak/web";
import {
  getKeycloakInstance,
  initializeKeycloak,
  type KeycloakConfig,
} from "./keycloak";

// Define the AuthContextType interface locally
interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: any;
  login: (redirectUri?: string) => void;
  logout: (redirectUri?: string) => void;
  token: string | null;
}

// Custom hook that wraps useKeycloak with our interface
const useKeycloakAuth = (): AuthContextType => {
  const { keycloak: kc, initialized } = useKeycloak();

  return {
    isAuthenticated: kc?.authenticated || false,
    isLoading: !initialized,
    user: kc?.tokenParsed || null,
    login: (redirectUri?: string) => {
      if (!kc?.authenticated) {
        const redirectUrl =
          redirectUri ||
          (typeof window !== "undefined" &&
            (window as any).import?.meta?.env?.VITE_API_BASE_URL) ||
          window.location.origin;
        kc?.login({ redirectUri: redirectUrl });
      }
    },
    logout: (redirectUri?: string) => {
      const redirectUrl =
        redirectUri ||
        (typeof window !== "undefined" &&
          (window as any).import?.meta?.env?.VITE_API_BASE_URL) ||
        window.location.origin;
      kc?.logout({ redirectUri: redirectUrl });
    },
    token: kc?.token || null,
  };
};

// Context for our custom auth interface
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within a KeycloakAuthProvider");
  }
  return context;
};

// Provider component that wraps ReactKeycloakProvider
export const KeycloakAuthProvider: React.FC<{
  children: React.ReactNode;
  config?: Partial<KeycloakConfig>;
}> = ({ children, config }) => {
  // Get Keycloak instance with optional config
  const keycloak = getKeycloakInstance(config);

  const onKeycloakEvent = (event: string, error?: any) => {
    console.log("🔑 Keycloak Event:", event, error);

    // Handle specific events
    switch (event) {
      case "onReady":
        console.log("Keycloak: Ready");
        break;
      case "onInitError":
        console.error("Keycloak: Initialization Error", error);
        break;
      case "onAuthSuccess":
        console.log("Keycloak: Authentication Success");
        break;
      case "onAuthError":
        console.error("Keycloak: Authentication Error", error);
        break;
      case "onAuthRefreshSuccess":
        console.log("Keycloak: Token Refresh Success");
        break;
      case "onAuthRefreshError":
        console.error("Keycloak: Token Refresh Error", error);
        break;
      case "onAuthLogout":
        console.log("Keycloak: Logout");
        break;
      default:
        console.log("Keycloak: Unknown Event", event, error);
    }
  };

  const onKeycloakTokens = (tokens: any) => {
    console.log("🎫 Keycloak Tokens Updated:", {
      token: tokens.token ? "Present" : "Missing",
      refreshToken: tokens.refreshToken ? "Present" : "Missing",
      idToken: tokens.idToken ? "Present" : "Missing",
    });
  };

  return (
    <ReactKeycloakProvider
      authClient={keycloak}
      LoadingComponent={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading Keycloak...</p>
          </div>
        </div>
      }
      onEvent={onKeycloakEvent}
      onTokens={onKeycloakTokens}
      initOptions={config?.initOptions}
    >
      <AuthContextProvider>{children}</AuthContextProvider>
    </ReactKeycloakProvider>
  );
};

// Internal provider that provides our custom auth interface
const AuthContextProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const auth = useKeycloakAuth();

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
};
