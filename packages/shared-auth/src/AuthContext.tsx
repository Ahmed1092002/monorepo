import React, { createContext, useContext, useEffect, useState } from "react";
import keycloak from "./keycloak";

// Define interfaces locally
interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: any;
  login: (redirectUri?: string) => void;
  logout: (redirectUri?: string) => void;
  token: string | null;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const initKeycloak = async () => {
      try {
        const authenticated = await keycloak.init({
          onLoad: "check-sso",
          pkceMethod: "S256",
          checkLoginIframe: false,
          flow: "standard",
          responseMode: "fragment",
          scope: "openid profile email",
        });

        if (authenticated) {
          setIsAuthenticated(true);
          setUser(keycloak.tokenParsed);
          setToken(keycloak.token || null);
        }
      } catch (error) {
        console.error("Failed to initialize Keycloak:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initKeycloak();
  }, []);

  const login = (redirectUri?: string) => {
    const redirectUrl =
      redirectUri ||
      (typeof window !== "undefined" &&
        (window as any).import?.meta?.env?.VITE_API_BASE_URL) ||
      window.location.origin;
    keycloak.login({ redirectUri: redirectUrl });
  };

  const logout = (redirectUri?: string) => {
    const redirectUrl =
      redirectUri ||
      (typeof window !== "undefined" &&
        (window as any).import?.meta?.env?.VITE_API_BASE_URL) ||
      window.location.origin;
    keycloak.logout({ redirectUri: redirectUrl });
  };

  const value: AuthContextType = {
    isAuthenticated,
    isLoading,
    user,
    login,
    logout,
    token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
