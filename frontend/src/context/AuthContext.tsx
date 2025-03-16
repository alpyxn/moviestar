import { ReactNode, useState, useCallback, createContext, useContext } from "react";
import { ReactKeycloakProvider } from "@react-keycloak/web";
import type { AuthClientEvent, AuthClientError, AuthClientTokens } from "@react-keycloak/core";
import keycloak from "../auth/keycloak";

interface AuthProviderProps {
  children: ReactNode;
  LoadingComponent?: ReactNode;
}

const eventLogger = (event: AuthClientEvent, error?: AuthClientError) => {
  console.log("Keycloak event:", event, error);
  if (error) {
    console.error("Keycloak error:", error);
  }
};

const initOptions: Keycloak.KeycloakInitOptions = {
  onLoad: "check-sso",
  silentCheckSsoRedirectUri: window.location.origin + "/silent-check-sso.html",
  checkLoginIframe: false, 
  pkceMethod: "S256" 
};

type AuthContextType = {
  isAuthenticated: boolean;
  hasRole: (role: string) => boolean; 
  login: () => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  hasRole: (_: string) => false, 
  login: () => {},
  logout: () => {},
});

export const AuthProvider = ({ 
  children, 
  LoadingComponent = <div className="flex items-center justify-center h-screen">Loading...</div> 
}: AuthProviderProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [roles, setRoles] = useState<string[]>([]);
  
  const login = () => {
    keycloak.login();
  };

  const logout = () => {
    keycloak.logout();
  };

  const hasRole = (role: string) => roles.includes(role);

  const handleOnEvent = useCallback((event: AuthClientEvent, error?: AuthClientError) => {
    eventLogger(event, error);
    
    if (event === 'onAuthSuccess' || event === 'onAuthRefreshSuccess') {
      setIsAuthenticated(true);
      setRoles(keycloak.tokenParsed?.realm_access?.roles || []);
    } else if (event === 'onAuthLogout' || event === 'onAuthError') {
      setIsAuthenticated(false);
      setRoles([]);
    }
  }, []);

  const handleTokens = useCallback((tokens: AuthClientTokens) => {
    if (tokens.token) {
      console.log('Token refreshed');
    }
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, hasRole, login, logout }}>
      <ReactKeycloakProvider
        authClient={keycloak}
        initOptions={initOptions}
        onEvent={handleOnEvent}
        onTokens={handleTokens}
        LoadingComponent={LoadingComponent as any as JSX.Element}
      >
        {children}
      </ReactKeycloakProvider>
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export default AuthProvider;