import { useEffect } from 'react';
import { useKeycloak } from '@react-keycloak/web';
import { Loader2 } from 'lucide-react';

export const LoginCheck: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { keycloak, initialized } = useKeycloak();
  
  useEffect(() => {
    const validateToken = async () => {
      try {
        if (initialized && keycloak.authenticated) {
          await keycloak.updateToken(50);
        } else if (initialized) {
          keycloak.login({ redirectUri: window.location.href });
        }
      } catch (error) {
        console.error("Failed to refresh token:", error);
        keycloak.logout();
      }
    };
    
    validateToken();
  }, [keycloak, initialized]);

  if (!initialized) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-rose-600" />
        <span className="ml-2">Initializing authentication...</span>
      </div>
    );
  }
  
  if (!keycloak.authenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-rose-600" />
        <p className="mt-2">Authenticating...</p>
        <p className="text-sm text-gray-500">You will be redirected to login.</p>
      </div>
    );
  }
  
  return <>{children}</>;
};