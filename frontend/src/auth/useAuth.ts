import { useKeycloak } from "@react-keycloak/web";

export function useAuth() {
  const { keycloak, initialized } = useKeycloak();

  return {
    initialized,
    isAuthenticated: initialized ? keycloak.authenticated : false,
    user: keycloak.tokenParsed,
    login: () => keycloak.login(),
    logout: () => keycloak.logout(),
    register: () => keycloak.register(),
    token: keycloak.token,
    hasRole: (roles: string | string[]) => {
      if (!initialized || !keycloak.authenticated) return false;
      
      if (typeof roles === "string") {
        return keycloak.hasRealmRole(roles);
      }
      
      return roles.some(role => keycloak.hasRealmRole(role));
    }
  };
}

export default useAuth;