import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Film } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/auth/useAuth";
import { cn } from "@/lib/utils";

export function Navbar() {
  const { initialized, isAuthenticated, login, logout, hasRole } = useAuth();
  const isAdmin = hasRole("ADMIN");
  
  if (!initialized) {
    return (
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-md shadow-sm">
        <div className="flex h-16 items-center w-full">
          <div className="px-4">
            <Link to="/" className="font-bold text-xl flex items-center gap-2 text-rose-600">
              <Film size={24} className="text-rose-600" />
              <span>MovieStar</span>
            </Link>
          </div>
          
          <div className="ml-auto px-4">
            <Button variant="outline" disabled className="text-gray-400">Loading...</Button>
          </div>
        </div>
      </nav>
    );
  }
  
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-md shadow-sm">
      <div className="flex h-16 items-center w-full">
        <div className="flex items-center">
          {/* Logo */}
          <div className="px-4">
            <Link 
              to="/" 
              className="font-bold text-xl flex items-center gap-2 text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-pink-500 hover:from-rose-500 hover:to-pink-400 transition-all"
            >
              <Film size={24} className="text-rose-600" />
              <span>MovieStar</span>
            </Link>
          </div>
          
          {/* Navigation links */}
          <div className="hidden md:flex items-center">
            <NavLink to="/movies">Movies</NavLink>
            <NavLink to="/directors">Directors</NavLink>
            <NavLink to="/actors">Actors</NavLink>
            
            {isAuthenticated && (
              <NavLink to="/profile">Profile</NavLink>
            )}
            
            {isAdmin && (
              <NavLink to="/admin" className="relative">
                <span className="text-purple-700 font-medium">Admin Panel</span>
                <span className="absolute -top-1 -right-1 h-2 w-2 bg-purple-500 rounded-full"></span>
              </NavLink>
            )}
          </div>
        </div>
        
        {/* Auth buttons */}
        <div className="flex items-center ml-auto px-4">
          {!isAuthenticated ? (
            <Button 
              className="bg-gradient-to-br from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 text-white shadow-md hover:shadow-lg transition-all duration-300" 
              onClick={login}
            >
              Login
            </Button>
          ) : (
            <Button 
              variant="outline" 
              className="border-rose-500 text-rose-600 hover:bg-rose-50 shadow-sm" 
              onClick={logout}
            >
              Logout
            </Button>
          )}
          
          {/* Mobile menu button */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden ml-2">
              <Button variant="ghost" size="icon" className="rounded-full">
                <Menu className="h-5 w-5 text-gray-700" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="border-r-rose-100 w-[240px]">
              <div className="flex flex-col space-y-6 mt-8">
                <Link 
                  to="/" 
                  className="font-bold text-xl flex items-center gap-2 text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-pink-500"
                >
                  <Film size={24} className="text-rose-600" />
                  <span>MovieStar</span>
                </Link>
                
                <Separator className="bg-gradient-to-r from-rose-100 to-pink-100 h-[1px]" />
                
                <MobileNavLink to="/movies">Movies</MobileNavLink>
                <MobileNavLink to="/directors">Directors</MobileNavLink>
                <MobileNavLink to="/actors">Actors</MobileNavLink>
                
                {isAuthenticated && (
                  <MobileNavLink to="/profile">Profile</MobileNavLink>
                )}
                
                {isAdmin && (
                  <MobileNavLink to="/admin" className="text-purple-700">
                    <div className="flex items-center">
                      <span>Admin Panel</span>
                      <span className="ml-2 h-2 w-2 bg-purple-500 rounded-full"></span>
                    </div>
                  </MobileNavLink>
                )}
                
                <Separator className="bg-gradient-to-r from-rose-100 to-pink-100 h-[1px]" />
                
                {/* Mobile Auth Button */}
                {!isAuthenticated ? (
                  <Button 
                    className="bg-gradient-to-br from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 w-full shadow-md" 
                    onClick={login}
                  >
                    Login
                  </Button>
                ) : (
                  <Button 
                    variant="outline" 
                    className="border-rose-500 text-rose-600 hover:bg-rose-50 w-full" 
                    onClick={logout}
                  >
                    Logout
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}

type NavLinkProps = {
  to: string;
  className?: string;
  children: React.ReactNode;
};

function NavLink({ to, className, children }: NavLinkProps) {
  return (
    <Link to={to}>
      <Button 
        variant="ghost" 
        className={cn(
          "text-gray-700 hover:text-rose-600 hover:bg-rose-50 relative group",
          className
        )}
      >
        {children}
        <span className="absolute inset-x-0 -bottom-[1px] h-[2px] bg-rose-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-200"></span>
      </Button>
    </Link>
  );
}

function MobileNavLink({ to, children, className }: NavLinkProps) {
  return (
    <Link to={to}>
      <Button 
        variant="ghost" 
        className={cn(
          "w-full justify-start text-gray-700 hover:text-rose-600 hover:bg-rose-50/80 rounded-md px-4 font-medium",
          className
        )}
      >
        {children}
      </Button>
    </Link>
  );
}