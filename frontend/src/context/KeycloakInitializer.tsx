import { ReactNode, useState, useEffect } from 'react';
import { ReactKeycloakProvider } from '@react-keycloak/web';
import keycloak from '../auth/keycloak';

interface KeycloakInitializerProps {
  children: ReactNode;
}

const initOptions = {
  onLoad: "check-sso",
  silentCheckSsoRedirectUri: window.location.origin + "/silent-check-sso.html",
  checkLoginIframe: false,
  pkceMethod: "S256"
};

export function KeycloakInitializer({ children }: KeycloakInitializerProps) {
  const [initialized, setInitialized] = useState(false);
  
  useEffect(() => {
    if (!initialized && !keycloak.authenticated) {
      setInitialized(true);
    }
  }, [initialized]);

  return (
    <ReactKeycloakProvider
      authClient={keycloak}
      initOptions={initOptions}
      LoadingComponent={<div className="flex items-center justify-center h-screen">Loading...</div>}
    >
      {children}
    </ReactKeycloakProvider>
  );
}