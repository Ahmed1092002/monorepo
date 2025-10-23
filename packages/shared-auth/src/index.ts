// Main Keycloak instance and utilities
export { default as keycloak, pwaAuthUtils } from "./keycloak";

// React Keycloak Provider
export { default as KeycloakAuthProvider } from "./KeycloakAuthProvider";
export type { KeycloakAuthProviderProps } from "./KeycloakAuthProvider";

// Authentication Context and Hook
export { default as AuthContext, AuthProvider, useAuth } from "./AuthContext";
export type { AuthContextType, AuthProviderProps } from "./AuthContext";

// Authentication Components
export {
  LoginButton,
  LogoutButton,
  RegisterButton,
  AccountManagementButton,
  ProtectedRoute,
  AuthStatus,
  UserInfo,
} from "./AuthComponents";

export type {
  LoginButtonProps,
  LogoutButtonProps,
  RegisterButtonProps,
  AccountManagementButtonProps,
  ProtectedRouteProps,
  AuthStatusProps,
  UserInfoProps,
} from "./AuthComponents";

// Re-export React Keycloak hooks for convenience
export { useKeycloak } from "@react-keycloak/web";
