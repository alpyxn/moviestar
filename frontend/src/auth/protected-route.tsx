import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./useAuth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requiredRoles?: string[];
}

export function ProtectedRoute({ 
  children, 
  requireAuth = false,
  requiredRoles = [] 
}: ProtectedRouteProps) {
  const auth = useAuth();
  const location = useLocation();

  if (!auth.initialized && requireAuth) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="text-lg">Initializing authentication...</div>
      </div>
    );
  }

  if (requireAuth && !auth.isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (auth.isAuthenticated && requiredRoles.length > 0 && !requiredRoles.some(role => auth.hasRole(role))) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}