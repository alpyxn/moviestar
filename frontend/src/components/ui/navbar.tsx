import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/auth/useAuth";

export function Navbar() {
  const { initialized, isAuthenticated, login, logout, hasRole } = useAuth();
  const isAdmin = hasRole("ADMIN");
  
  // If authentication is not initialized yet, show a minimal navbar
  if (!initialized) {
    return (
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md shadow-sm">
        <div className="flex h-16 items-center px-6 w-full">
          <Link to="/" className="font-semibold text-lg text-rose-600">
            MovieStar
          </Link>
          <div className="ml-auto">
            <Button variant="outline" disabled className="text-gray-400">Loading...</Button>
          </div>
        </div>
      </nav>
    );
  }
  
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md shadow-sm">
      <div className="flex h-16 items-center px-6 w-full">
        {/* Logo */}
        <Link to="/" className="font-bold text-xl text-rose-600 hover:text-rose-700 transition-colors">
          MovieStar
        </Link>
        
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-4 mx-4">
          <Separator orientation="vertical" className="h-6 bg-gray-300 ml-4" />
          {/* Public Links - Always visible */}
          <Link to="/movies">
            <Button variant="ghost" className="text-gray-700 hover:text-rose-600 hover:bg-rose-50">Movies</Button>
          </Link>
          <Link to="/directors">
            <Button variant="ghost" className="text-gray-700 hover:text-rose-600 hover:bg-rose-50">Directors</Button>
          </Link>
          <Link to="/actors">
            <Button variant="ghost" className="text-gray-700 hover:text-rose-600 hover:bg-rose-50">Actors</Button>
          </Link>
          
          {/* Auth Required Links */}
          {isAuthenticated && (
            <Link to="/profile">
              <Button variant="ghost" className="text-gray-700 hover:text-rose-600 hover:bg-rose-50">Profile</Button>
            </Link>
          )}
          
          {/* Admin Links */}
          {isAdmin && (
            <Link to="/admin">
              <Button variant="ghost" className="text-gray-700 hover:text-rose-600 hover:bg-rose-50">Admin Panel</Button>
            </Link>
          )}
        </div>
        
        {/* Auth buttons pushed all the way to right */}
        <div className="ml-auto flex items-center">
          {!isAuthenticated ? (
            <Button className="bg-rose-600 hover:bg-rose-700 text-white" onClick={login}>
              Login
            </Button>
          ) : (
            <Button variant="outline" className="border-rose-600 text-rose-600 hover:bg-rose-50" onClick={logout}>
              Logout
            </Button>
          )}
        </div>
        
        {/* Mobile Navigation */}
        <Sheet>
          <SheetTrigger asChild className="md:hidden ml-2">
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6 text-gray-800" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="border-r-rose-100">
            <div className="flex flex-col space-y-4 mt-4">
              <Link to="/" className="font-bold text-xl text-rose-600">
                MovieStar
              </Link>
              <Separator className="bg-rose-100" />
              {/* Public Links - Always visible */}
              <Link to="/movies">
                <Button variant="ghost" className="w-full justify-start text-gray-700 hover:text-rose-600 hover:bg-rose-50">
                  Movies
                </Button>
              </Link>
              <Link to="/directors">
                <Button variant="ghost" className="w-full justify-start text-gray-700 hover:text-rose-600 hover:bg-rose-50">
                  Directors
                </Button>
              </Link>
              <Link to="/actors">
                <Button variant="ghost" className="w-full justify-start text-gray-700 hover:text-rose-600 hover:bg-rose-50">
                  Actors
                </Button>
              </Link>
              
              {/* Auth Required Links */}
              {isAuthenticated && (
                <Link to="/profile">
                  <Button variant="ghost" className="w-full justify-start text-gray-700 hover:text-rose-600 hover:bg-rose-50">
                    Profile
                  </Button>
                </Link>
              )}
              
              {/* Admin Links */}
              {isAdmin && (
                <Link to="/admin">
                  <Button variant="ghost" className="w-full justify-start text-gray-700 hover:text-rose-600 hover:bg-rose-50">
                    Admin Panel
                  </Button>
                </Link>
              )}
              
              <Separator className="bg-rose-100" />
              
              {/* Mobile Auth Button */}
              {!isAuthenticated ? (
                <Button className="bg-rose-600 hover:bg-rose-700 w-full" onClick={login}>
                  Login
                </Button>
              ) : (
                <Button variant="outline" className="border-rose-600 text-rose-600 hover:bg-rose-50 w-full" onClick={logout}>
                  Logout
                </Button>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}