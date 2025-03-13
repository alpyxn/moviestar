import { useEffect, useState } from 'react';
import { useKeycloak } from '@react-keycloak/web';
import { useToast } from '@/hooks/use-toast';
import userApi from '@/api/userApi';
import watchlistApi from '@/api/watchlistApi';
import moviesApi from '@/api/movieApi';
import { User, WatchlistItem, UserRating } from '@/api/apiService';
import { Loader2, Film, /* Calendar, */ User as UserIcon, Settings, Trash2, Star } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Link } from 'react-router-dom';

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [userRatings, setUserRatings] = useState<UserRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingItemId, setRemovingItemId] = useState<number | null>(null);
  
  const { toast } = useToast();
  const { keycloak, initialized } = useKeycloak();
  const isAuthenticated = initialized && keycloak.authenticated;

  // Fetch user data and watchlist
  useEffect(() => {
    let isMounted = true;
    
    const fetchUserData = async () => {
      if (!initialized || !keycloak.authenticated)
      
      try {
        setLoading(true);
        
        // Fetch user profile data
        const userProfile = await userApi.getCurrentUser();
        if (!isMounted) return;
        setUser(userProfile);
        
        // Fetch watchlist
        try {
          const watchlistData = await watchlistApi.getWatchlist();
          if (!isMounted) return;
          setWatchlist(watchlistData);
        } catch (error) {
          console.error("Error fetching watchlist:", error);
          // Don't show a toast for this since it's not critical
        }
        
        // Fetch rating
        try {
          const ratings = await moviesApi.getUserRatings();
          if (!isMounted) return;
          setUserRatings(ratings);
        } catch (error) {
          console.error("Error fetching ratings:", error);
          // Don't show a toast for this since it's not critical
        }
        
      } catch (error) {
        console.error("Error fetching user data:", error);
        if (isMounted) {
          toast({
            title: "Error",
            description: "Failed to load user data",
            variant: "destructive",
          });
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    fetchUserData();
    
    return () => {
      isMounted = false;
    };
  }, [initialized, keycloak.authenticated]); // Remove toast from dependencies

  // Handle removing item from watchlist
  const handleRemoveFromWatchlist = async (movieId: number) => {
    if (!isAuthenticated) return;
    
    try {
      setRemovingItemId(movieId);
      await watchlistApi.removeFromWatchlist(movieId);
      
      // Update watchlist state by filtering out the removed item
      setWatchlist(prev => prev.filter(item => item.movie.id !== movieId));
      
      // Toast removed for regular user action
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      // Keep error toast for failures
      toast({
        title: 'Error',
        description: 'Failed to remove from watchlist',
        variant: 'destructive',
      });
    } finally {
      setRemovingItemId(null);
    }
  };

  const getInitials = (name: string): string => {
    return name.charAt(0).toUpperCase();
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-bold mb-4">Authentication Required</h1>
        <p className="text-gray-500 mb-6">Please sign in to view your profile.</p>
        <Button onClick={() => keycloak.login()}>Sign In</Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[70vh]">
        <Loader2 className="h-8 w-8 animate-spin text-rose-600" />
        <span className="ml-2">Loading profile...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Left Sidebar */}
        <div className="col-span-1">
          <Card className="overflow-hidden">
            <CardHeader className="bg-muted">
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-24 w-24 mb-2">
                  <AvatarFallback className="bg-rose-100 text-rose-800 text-xl">
                    {user?.username ? getInitials(user.username) : "U"}
                  </AvatarFallback>
                </Avatar>
                <CardTitle>{user?.username || 'User'}</CardTitle>
                <CardDescription>
                  {user?.email || 'No email available'}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ul className="divide-y">
                <li className="px-4 py-3 hover:bg-muted transition-colors">
                  <div className="flex items-center">
                    <UserIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>Member since: {user?.createdAt ? format(new Date(user.createdAt), 'MMMM yyyy') : 'Unknown'}</span>
                  </div>
                </li>
                <li className="px-4 py-3 hover:bg-muted transition-colors">
                  <div className="flex items-center">
                    <Film className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>Watchlist: {watchlist.length} movies</span>
                  </div>
                </li>
              </ul>
            </CardContent>
            <CardFooter className="flex justify-center p-4">
              <Button 
                variant="outline" 
                size="sm"
                className="w-full"
                onClick={() => keycloak.logout()}
              >
                Sign Out
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        {/* Main Content */}
        <div className="col-span-1 md:col-span-3">
          <Tabs defaultValue="watchlist">
            <TabsList className="w-full">
              <TabsTrigger value="watchlist" className="flex-1">Watchlist</TabsTrigger>
              <TabsTrigger value="ratings" className="flex-1">My Ratings</TabsTrigger>
              <TabsTrigger value="settings" className="flex-1">Account Settings</TabsTrigger>
            </TabsList>
            
            {/* Watchlist Tab */}
            <TabsContent value="watchlist" className="pt-6">
              <h2 className="text-2xl font-bold mb-4">My Watchlist</h2>
              
              {watchlist.length === 0 ? (
                <div className="text-center py-12 bg-muted/50 rounded-lg">
                  <Film className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
                  <h3 className="text-xl font-medium">Your watchlist is empty</h3>
                  <p className="text-muted-foreground mt-2">
                    Add movies to your watchlist to keep track of what you want to watch.
                  </p>
                  <Button asChild className="mt-4">
                    <Link to="/movies">Browse Movies</Link>
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {watchlist.map((item) => {
                    // Determine if we're dealing with a WatchlistItem or Movie object
                    const movie = item.movie || item;
                    const itemId = item.id || (movie?.id || 0);
                    
                    // Skip rendering if movie is undefined or doesn't have required data
                    if (!movie || typeof movie !== 'object') {
                      console.error('Invalid movie data in watchlist item:', item);
                      return null;
                    }
                    
                    return (
                      <Card key={itemId} className="overflow-hidden">
                        <div className="aspect-[2/3] relative">
                          <img 
                            src={movie.posterURL || '/placeholder-poster.jpg'} 
                            alt={movie.title || 'Movie poster'} 
                            className="w-full h-full object-cover"
                            loading="lazy"
                            onError={(e) => {
                              // Fallback if image fails to load
                              (e.target as HTMLImageElement).src = '/placeholder-poster.jpg';
                              (e.target as HTMLImageElement).onerror = null;
                            }}
                          />
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-3">
                            <h3 className="text-white font-bold">
                              {movie.title || 'Untitled Movie'}
                            </h3>
                            <p className="text-white text-xs opacity-80">{movie.year || 'N/A'}</p>
                          </div>
                        </div>
                        <CardFooter className="justify-between p-3">
                          <Button variant="outline" size="sm" asChild>
                            <Link to={`/movies/${movie.id}`}>
                              View Details
                            </Link>
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => setRemovingItemId(movie.id)}
                            disabled={removingItemId === movie.id}
                          >
                            {removingItemId === movie.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </CardFooter>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
            
            {/* Ratings Tab */}
            <TabsContent value="ratings" className="pt-6">
              <h2 className="text-2xl font-bold mb-4">My Ratings</h2>
              
              {userRatings.length === 0 ? (
                <div className="text-center py-12 bg-muted/50 rounded-lg">
                  <Star className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
                  <h3 className="text-xl font-medium">No Ratings Yet</h3>
                  <p className="text-muted-foreground mt-2">
                    Rate movies to keep track of what you've watched.
                  </p>
                  <Button asChild className="mt-4">
                    <Link to="/movies">Browse Movies</Link>
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {userRatings.map((item) => (
                    <Card key={item.id} className="overflow-hidden">
                      {item.movie ? (
                        <>
                          <div className="aspect-[2/3] relative">
                            <img 
                              src={item.movie.posterURL || '/placeholder-poster.jpg'} 
                              alt={item.movie.title} 
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-3">
                              <h3 className="text-white font-bold">
                                {item.movie.title}
                              </h3>
                              <p className="text-white text-xs opacity-80">
                                {item.movie.year}
                              </p>
                            </div>
                          </div>
                          <CardFooter className="justify-between p-3">
                            <div className="flex items-center gap-2">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              <span className="font-medium">{item.rating}/10</span>
                            </div>
                            <Button variant="outline" size="sm" asChild>
                              <Link to={`/movies/${item.movie.id}`}>
                                View Details
                              </Link>
                            </Button>
                          </CardFooter>
                        </>
                      ) : (
                        <div className="p-4 text-center text-muted-foreground">
                          <p>Movie information unavailable</p>
                          <p className="text-sm">Rating: {item.rating}/10</p>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
            
            {/* Settings Tab */}
            <TabsContent value="settings" className="pt-6">
              <h2 className="text-2xl font-bold mb-4">Account Settings</h2>
              <div className="text-center py-12 bg-muted/50 rounded-lg">
                <Settings className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
                <h3 className="text-xl font-medium">Coming Soon</h3>
                <p className="text-muted-foreground mt-2">
                  Account settings will be available in a future update.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {/* Remove from watchlist confirmation dialog */}
      <AlertDialog open={removingItemId !== null} onOpenChange={() => setRemovingItemId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove from Watchlist</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this movie from your watchlist?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => removingItemId && handleRemoveFromWatchlist(removingItemId)}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
