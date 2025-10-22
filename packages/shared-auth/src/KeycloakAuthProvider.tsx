import React, { createContext, useContext } from "react";
import { ReactKeycloakProvider, useKeycloak } from "@react-keycloak/web";
import keycloak from "./keycloak";

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
export const KeycloakAuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const onKeycloakEvent = (event: string, error?: any) => {
    console.log("🔑 Keycloak Event:", event, error);
  };

  const onKeycloakTokens = (tokens: any) => {
    console.log("🎫 Keycloak Tokens:", tokens);
  };

  return (
    <ReactKeycloakProvider
      authClient={keycloak}
      LoadingComponent={<div>Loading Keycloak...</div>}
      onEvent={onKeycloakEvent}
      onTokens={onKeycloakTokens}
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
