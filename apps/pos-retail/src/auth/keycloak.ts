// Keycloak configuration for pos-retail app
import { setKeycloakConfig } from "@monorepo/shared-auth";

// Get environment variables
const getEnvVar = (name: string): string | undefined => {
  if (typeof window !== "undefined" && (window as any).import?.meta?.env) {
    return (window as any).import.meta.env[name];
  }
  return undefined;
};

// Configure Keycloak with environment variables
const configureKeycloak = () => {
  const config = {
    url: getEnvVar("VITE_KEYCLOAK_URL") || "http://localhost:8080",
    realm: getEnvVar("VITE_KEYCLOAK_REALM") || "master",
    clientId: getEnvVar("VITE_KEYCLOAK_CLIENT_ID") || "pos-app",
  };

  console.log("🔧 App configuring Keycloak with:", {
    ...config,
    envVars: {
      VITE_KEYCLOAK_URL: getEnvVar("VITE_KEYCLOAK_URL"),
      VITE_KEYCLOAK_REALM: getEnvVar("VITE_KEYCLOAK_REALM"),
      VITE_KEYCLOAK_CLIENT_ID: getEnvVar("VITE_KEYCLOAK_CLIENT_ID"),
    },
  });

  // Inject configuration into the shared package
  setKeycloakConfig(config);
};

// Auto-configure when this module is imported
configureKeycloak();
