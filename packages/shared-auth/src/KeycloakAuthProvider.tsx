import React, { ReactNode } from "react";
import { ReactKeycloakProvider } from "@react-keycloak/web";
import keycloak from "./keycloak";

export interface KeycloakAuthProviderProps {
  children: ReactNode;
  loadingComponent?: ReactNode;
}

export const KeycloakAuthProvider: React.FC<KeycloakAuthProviderProps> = ({
  children,
  loadingComponent = <div>Loading...</div>,
}) => {
  return (
    <ReactKeycloakProvider
      authClient={keycloak}
      initOptions={{
        onLoad: "check-sso",
        pkceMethod: "S256",
        checkLoginIframe: false,
        flow: "standard",
        responseMode: "fragment",
        scope: "openid profile email",
      }}
      LoadingComponent={loadingComponent}
    >
      {children}
    </ReactKeycloakProvider>
  );
};

export default KeycloakAuthProvider;
