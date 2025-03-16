import "./App.css";
import { Routes, Route } from "react-router-dom";
import { useAuth } from "@/auth/useAuth";
import { ReactNode, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useKeycloak } from "@react-keycloak/web";
import { Loader2 } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";

// Page Imports
import LandingPage from "./pages/LandingPage";
import MoviesPage from "./pages/MoviesPage";
import DirectorsPage from "./pages/DirectorsPage";
import ActorsPage from "./pages/ActorsPage";
import MovieDetails from "./pages/MovieDetails"; // Import the new MovieDetails component
import AdminDashboard from "./pages/admin/AdminDashboard";
import AddDirector from "./pages/admin/AddEditDirector";
import AddActor from "./pages/admin/AddActor";
import ManageGenres from "./pages/admin/ManageGenres";
import AddEditMovie from "./pages/admin/AddEditMovie";
import DirectorDetails from "./pages/DirectorDetails";
import AddEditDirector from "./pages/admin/AddEditDirector";
import ActorDetails from "./pages/ActorDetails";
import ProfilePage from "./pages/ProfilePage";
import UserDetails from "./pages/UserDetails";
import AddEditActor from "./pages/admin/AddEditActor";
import AdminUsers from "./pages/admin/AdminUsers";

const Unauthorized = () => (
  <div className="container py-10 text-center">
    <h1 className="text-2xl font-bold">Unauthorized Access</h1>
    <p className="text-muted-foreground mt-2">
      You don't have permission to access this page.
    </p>
  </div>
);
const Login = () => (
  <div className="container py-10 text-center">
    <h1 className="text-2xl font-bold">Login Required</h1>
    <p className="text-muted-foreground mt-2">Please log in to continue.</p>
  </div>
);

interface ProtectedRouteProps {
  children: ReactNode;
  requireAuth?: boolean;
  requiredRoles?: string[];
}

export const ProtectedRoute = ({
  children,
  requireAuth = false,
  requiredRoles = [],
}: ProtectedRouteProps) => {
  const { keycloak, initialized } = useKeycloak();

  useEffect(() => {
    if (initialized && keycloak.authenticated) {
      keycloak.updateToken(30).catch(() => {
        console.log("Token refresh failed, redirecting to login");
        keycloak.login();
      });
    }
  }, [keycloak, initialized]);

  if (!initialized && requireAuth) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-rose-600" />
        <p className="mt-4">Loading authentication...</p>
      </div>
    );
  }

  if (requireAuth && !keycloak.authenticated) {
    keycloak.login();
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-rose-600" />
        <p className="mt-4">Redirecting to login...</p>
      </div>
    );
  }

  if (
    keycloak.authenticated &&
    requiredRoles.length > 0 &&
    !requiredRoles.some((role) => keycloak.hasRealmRole(role))
  ) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

function App() {
  const {} = useAuth();

  return (
    <div className="min-h-screen bg-background pt-16 flex flex-col">
      <Toaster />
      <Routes>

        {/* Public routes - available without authentication */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/movies" element={<MoviesPage />} />
        <Route path="/movies/:id" element={<MovieDetails />} />{" "}
        <Route path="/directors" element={<DirectorsPage />} />
        <Route path="/directors/:id" element={<DirectorDetails />} />
        <Route path="/actors" element={<ActorsPage />} />
        <Route path="/actors/:id" element={<ActorDetails />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="/login" element={<Login />} />
        <Route path="/users/:username" element={<UserDetails />} />

        {/* Movie interaction routes - require authentication */}
        <Route
          path="/movies/:id/rate"
          element={
            <ProtectedRoute requireAuth>
              <MovieDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute requireAuth>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/movies/:id/comment"
          element={
            <ProtectedRoute requireAuth>
              <MovieDetails />
            </ProtectedRoute>
          }
        />
        {/* Admin routes */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute requireAuth requiredRoles={["ADMIN"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/directors/new"
          element={
            <ProtectedRoute requireAuth requiredRoles={["ADMIN"]}>
              <AddDirector />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/directors/edit/:id"
          element={
            <ProtectedRoute requireAuth requiredRoles={["ADMIN"]}>
              <AddEditDirector />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/actors/new"
          element={
            <ProtectedRoute requireAuth requiredRoles={["ADMIN"]}>
              <AddActor />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/actors/edit/:id"
          element={
            <ProtectedRoute requireAuth requiredRoles={["ADMIN"]}>
              <AddEditActor />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/movies/new"
          element={
            <ProtectedRoute requireAuth requiredRoles={["ADMIN"]}>
              <AddEditMovie />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/movies/edit/:id"
          element={
            <ProtectedRoute requireAuth requiredRoles={["ADMIN"]}>
              <AddEditMovie />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/genres"
          element={
            <ProtectedRoute requireAuth requiredRoles={["ADMIN"]}>
              <ManageGenres />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute requireAuth requiredRoles={["ADMIN"]}>
              <AdminUsers />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
}

export default App;
