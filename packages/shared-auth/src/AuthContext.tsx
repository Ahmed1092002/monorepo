import React, {
  createContext,
  useContext,
  ReactNode,
  useEffect,
  useState,
} from "react";
import { useKeycloak } from "@react-keycloak/web";
import { pwaAuthUtils } from "./keycloak";
import { useOfflineStatus } from "@monorepo/shared-utils";

export interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: any;
  token: string | undefined;
  isOffline: boolean;
  isOnline: boolean;
  login: (options?: { redirectUri?: string }) => void;
  logout: (options?: { redirectUri?: string }) => void;
  register: (options?: { redirectUri?: string }) => void;
  accountManagement: () => void;
  checkAuthStatus: () => Promise<boolean>;
  cacheTokens: () => Promise<void>;
  clearCachedTokens: () => Promise<void>;
  getCachedUserInfo: () => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { keycloak, initialized } = useKeycloak();
  const { isOffline, isOnline } = useOfflineStatus();
  const [cachedUser, setCachedUser] = useState<any>(null);

  // Load cached user info when offline
  useEffect(() => {
    if (isOffline && !keycloak?.authenticated) {
      pwaAuthUtils.getCachedUserInfo().then(setCachedUser);
    } else if (isOnline && keycloak?.authenticated) {
      setCachedUser(null);
    }
  }, [isOffline, isOnline, keycloak?.authenticated]);

  // Cache tokens when authenticated and online
  useEffect(() => {
    if (keycloak?.authenticated && isOnline) {
      pwaAuthUtils.cacheTokens();
    }
  }, [keycloak?.authenticated, isOnline]);

  const authValue: AuthContextType = {
    isAuthenticated:
      keycloak?.authenticated || (isOffline && cachedUser !== null) || false,
    isLoading: !initialized,
    user: keycloak?.tokenParsed || cachedUser || null,
    token: keycloak?.token,
    isOffline,
    isOnline,
    login: (options?: { redirectUri?: string }) => keycloak?.login(options),
    logout: async (options?: { redirectUri?: string }) => {
      await pwaAuthUtils.clearCachedTokens();
      setCachedUser(null);
      keycloak?.logout(options);
    },
    register: (options?: { redirectUri?: string }) =>
      keycloak?.register(options),
    accountManagement: () => keycloak?.accountManagement(),
    checkAuthStatus: pwaAuthUtils.checkAuthStatus,
    cacheTokens: pwaAuthUtils.cacheTokens,
    clearCachedTokens: async () => {
      await pwaAuthUtils.clearCachedTokens();
      setCachedUser(null);
    },
    getCachedUserInfo: pwaAuthUtils.getCachedUserInfo,
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
