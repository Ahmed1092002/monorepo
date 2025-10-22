// Export all authentication-related components and utilities
// export { AuthProvider, useAuth as useLegacyAuth } from "./AuthContext";
// export { MockAuthProvider, useMockAuth } from "./MockAuth";
export { KeycloakAuthProvider, useAuth } from "./KeycloakAuthProvider";
// export { SSOProvider, useSSO } from "./SSOProvider";
// export {
//   LoginButton,
//   LogoutButton,
//   UserProfile,
//   LoadingSpinner,
// } from "./AuthComponents";
export { pwaAuthUtils, default as keycloak } from "./keycloak";
export { useKeycloak } from "@react-keycloak/web";
// export type { AuthContextType, AuthProviderProps } from "./keycloak";
// export type { SSOContextType, IUserData } from "./SSOProvider";
