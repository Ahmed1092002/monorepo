import React, { createContext, useContext, ReactNode } from "react";
import { useKeycloak } from "@react-keycloak/web";
import { pwaAuthUtils } from "./keycloak";

export interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: any;
  token: string | undefined;
  login: (options?: { redirectUri?: string }) => void;
  logout: (options?: { redirectUri?: string }) => void;
  register: (options?: { redirectUri?: string }) => void;
  accountManagement: () => void;
  checkAuthStatus: () => Promise<boolean>;
  cacheTokens: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { keycloak, initialized } = useKeycloak();

  const authValue: AuthContextType = {
    isAuthenticated: keycloak?.authenticated || false,
    isLoading: !initialized,
    user: keycloak?.tokenParsed || null,
    token: keycloak?.token,
    login: (options?: { redirectUri?: string }) => keycloak?.login(options),
    logout: (options?: { redirectUri?: string }) => keycloak?.logout(options),
    register: (options?: { redirectUri?: string }) =>
      keycloak?.register(options),
    accountManagement: () => keycloak?.accountManagement(),
    checkAuthStatus: pwaAuthUtils.checkAuthStatus,
    cacheTokens: pwaAuthUtils.cacheTokens,
  };

  return (
    <AuthContext.Provider value={authValue}>{children}</AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
