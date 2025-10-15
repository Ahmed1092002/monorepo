import React, { createContext, useContext, useEffect, useState } from "react";
import {
  createKeycloakInstance,
  keycloakInitOptions,
  AuthContextType,
  AuthProviderProps,
} from "./keycloak";

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
        // Create a new Keycloak instance for this provider
        const keycloak = createKeycloakInstance();

        const authenticated = await keycloak.init(keycloakInitOptions);

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

  const login = () => {
    // This will be handled by the KeycloakAuthProvider
    console.log("Login should be handled by KeycloakAuthProvider");
  };

  const logout = () => {
    // This will be handled by the KeycloakAuthProvider
    console.log("Logout should be handled by KeycloakAuthProvider");
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
