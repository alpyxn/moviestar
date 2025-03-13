import { useState, useEffect } from 'react'
import { useKeycloak } from '@react-keycloak/web';
import { useToast } from '@/hooks/use-toast';
import userApi from '@/api/userApi';
import watchlistApi from '@/api/watchlistApi';
import moviesApi from '@/api/movieApi';
import { User, WatchlistItem, UserRating } from '@/api/apiService';
import { Loader2, Film, User as UserIcon, Settings, Trash2, Star, Upload } from 'lucide-react';
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
import { Uploader } from '@/components/uploader';

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [userRatings, setUserRatings] = useState<UserRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingItemId, setRemovingItemId] = useState<number | null>(null);
  const [newProfilePicture, setNewProfilePicture] = useState<string | null>(null);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  
  const { toast } = useToast();
  const { keycloak, initialized } = useKeycloak();
  const isAuthenticated = initialized && keycloak.authenticated;

  // Fetch user data and watchlist
  useEffect(() => {
    let isMounted = true;
    
    const fetchUserData = async () => {
      if (!initialized) {
        return; // Wait until keycloak is initialized
      }
      
      if (!keycloak.authenticated) {
        if (isMounted) {
          setLoading(false); // Set loading to false if not authenticated
        }
        return;
      }
      
      try {
        setLoading(true);
        
        // Refresh token before making API calls
        try {
          await keycloak.updateToken(30);
        } catch (tokenError) {
          console.error("Failed to refresh token:", tokenError);
          if (isMounted) {
            setLoading(false);
          }
          return;
        }
        
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
  }, [initialized, keycloak]); // Use keycloak object instead of just authenticated state

  // Handle removing item from watchlist
  const handleRemoveFromWatchlist = async (movieId: number) => {
    if (!isAuthenticated) return;
    
    try {
      setRemovingItemId(movieId);
      
      // First make the API call
      await watchlistApi.removeFromWatchlist(movieId);
      
      // Then update the local state safely
      setWatchlist(prev => {
        // Create a new array without the removed movie
        return prev.filter(item => {
          // Handle both direct movie ID and nested movie objects
          const itemMovieId = item.movie ? item.movie.id : item.id;
          return itemMovieId !== movieId;
        });
      });
      
      // Close the dialog explicitly
      setRemovingItemId(null);
      
      // Optional: Add a toast confirmation
      toast({
        title: "Success",
        description: "Movie removed from watchlist",
      });
      
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove from watchlist',
        variant: 'destructive',
      });
      setRemovingItemId(null);
    }
  };

  const getInitials = (name: string): string => {
    return name.charAt(0).toUpperCase();
  };

  // Handle profile picture selection (without immediate update)
  const handleProfilePictureSelected = (imageUrl: string) => {
    setNewProfilePicture(imageUrl);
  };
  
  // Handle profile update (including picture)
  const handleUpdateProfile = async () => {
    if (!isAuthenticated) return;
    
    // Only update if there's a new profile picture and it's different from the current one
    if (newProfilePicture !== null && newProfilePicture !== user?.profilePictureUrl) {
      try {
        setIsUpdatingProfile(true);
        
        await userApi.updateProfilePicture(newProfilePicture);
        
        // Update the local user state
        setUser(prev => prev ? { ...prev, profilePictureUrl: newProfilePicture } : null);
        
        // Reset new profile picture state
        setNewProfilePicture(null);
        
        toast({
          title: "Success",
          description: "Profile picture updated successfully",
        });
      } catch (error) {
        console.error('Error updating profile picture:', error);
        toast({
          title: 'Error',
          description: 'Failed to update profile picture',
          variant: 'destructive',
        });
      } finally {
        setIsUpdatingProfile(false);
      }
    }
  };
  
  // Handle profile picture removal
  const handleRemoveProfilePicture = async () => {
    if (!isAuthenticated) return;
    
    try {
      setIsUpdatingProfile(true);
      console.log("Attempting to remove profile picture...");
      
      // Send null to remove profile picture - this should work better with your backend
      await userApi.updateProfilePicture(null);
      
      console.log("API call completed, updating local state");
      
      // Update local state - use empty string for the frontend display
      setUser(prev => {
        if (!prev) return null;
        return { ...prev, profilePictureUrl: "" };
      });
      
      // Also clear any pending new profile picture
      setNewProfilePicture(null);
      
      toast({
        title: "Success",
        description: "Profile picture removed successfully",
      });
    } catch (error) {
      console.error('Error removing profile picture:', error);
      
      // Log more details about the error
      if (error instanceof Error) {
        console.error('Error message:', error.message);
      }
      
      toast({
        title: 'Error',
        description: 'Failed to remove profile picture',
        variant: 'destructive',
      });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  if (!initialized) {
    return (
      <div className="flex justify-center items-center h-[70vh]">
        <Loader2 className="h-8 w-8 animate-spin text-rose-600" />
        <span className="ml-2">Initializing authentication...</span>
      </div>
    );
  }

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
                  {user?.profilePictureUrl ? (
                    <img 
                      src={user.profilePictureUrl} 
                      alt={`${user.username}'s profile`}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        console.log(1);
                        const target = e.target as HTMLImageElement;
                        target.onerror = null;
                        target.style.display = "none";
                      }}
                    />
                  ) : (
                    <AvatarFallback className="bg-rose-100 text-rose-800 text-xl">
                      {user?.username ? getInitials(user.username) : "U"}
                    </AvatarFallback>
                  )}
                </Avatar>
                <CardTitle className="break-words max-w-full">{user?.username || 'User'}</CardTitle>
                <CardDescription className="break-words max-w-full">
                  {user?.email || 'No email available'}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ul className="divide-y">
                <li className="px-4 py-3 hover:bg-muted transition-colors">
                  <div className="flex items-center">
                    <UserIcon className="h-4 w-4 mr-2 text-muted-foreground shrink-0" />
                    <span className="truncate">Member since: {user?.createdAt ? format(new Date(user.createdAt), 'MMMM yyyy') : 'Unknown'}</span>
                  </div>
                </li>
                <li className="px-4 py-3 hover:bg-muted transition-colors">
                  <div className="flex items-center">
                    <Film className="h-4 w-4 mr-2 text-muted-foreground shrink-0" />
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
          <Tabs defaultValue="watchlist" className="w-full">
            <TabsList className="w-full grid grid-cols-3 mb-4">
              <TabsTrigger value="watchlist" className="text-xs sm:text-sm">Watchlist</TabsTrigger>
              <TabsTrigger value="ratings" className="text-xs sm:text-sm">My Ratings</TabsTrigger>
              <TabsTrigger value="settings" className="text-xs sm:text-sm">Account Settings</TabsTrigger>
            </TabsList>
            
            {/* Watchlist Tab */}
            <TabsContent value="watchlist" className="pt-6">
              <h2 className="text-xl sm:text-2xl font-bold mb-4">My Watchlist</h2>
              
              {/* Watchlist cards */}
              {watchlist.length === 0 ? (
                <div className="text-center py-8 sm:py-12 bg-muted/50 rounded-lg">
                  <Film className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mb-2" />
                  <h3 className="text-lg sm:text-xl font-medium">Your watchlist is empty</h3>
                  <p className="text-muted-foreground mt-2 text-sm sm:text-base">
                    Add movies to your watchlist to keep track of what you want to watch.
                  </p>
                  <Button asChild className="mt-4">
                    <Link to="/movies">Browse Movies</Link>
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
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
                      <Card key={itemId} className="overflow-hidden flex flex-col h-full hover:shadow-lg transition-shadow relative group">
                        <Link to={`/movies/${movie.id}`} className="h-full">
                          <div className="aspect-[2/3] relative">
                            <img 
                              src={movie.posterURL || '/placeholder-poster.jpg'} 
                              alt={movie.title || 'Movie poster'} 
                              className="w-full h-full object-cover"
                              loading="lazy"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.onerror = null;
                                target.src = '/placeholder-poster.jpg';
                              }}
                            />
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-3">
                              <h3 className="text-white font-bold text-sm sm:text-base line-clamp-1">
                                {movie.title || 'Untitled Movie'}
                              </h3>
                              <p className="text-white text-xs opacity-90">{movie.year || 'N/A'}</p>
                            </div>
                          </div>
                        </Link>
                        
                        {/* Improved Remove Button - Positioned Absolutely */}
                        <button
                          className="absolute top-2 right-2 bg-black/70 hover:bg-black/90 rounded-full p-1.5 text-white opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
                          onClick={() => setRemovingItemId(movie.id)}
                          disabled={removingItemId === movie.id}
                          aria-label="Remove from watchlist"
                        >
                          {removingItemId === movie.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                          <span className="sr-only">Remove from watchlist</span>
                        </button>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
            
            {/* Ratings Tab */}
            <TabsContent value="ratings" className="pt-6">
              <h2 className="text-xl sm:text-2xl font-bold mb-4">My Ratings</h2>
              
              {userRatings.length === 0 ? (
                <div className="text-center py-8 sm:py-12 bg-muted/50 rounded-lg">
                  <Star className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mb-2" />
                  <h3 className="text-lg sm:text-xl font-medium">No Ratings Yet</h3>
                  <p className="text-muted-foreground mt-2 text-sm sm:text-base">
                    Rate movies to keep track of what you've watched.
                  </p>
                  <Button asChild className="mt-4">
                    <Link to="/movies">Browse Movies</Link>
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                  {userRatings.map((item) => (
                    <Card key={item.id} className="overflow-hidden flex flex-col h-full hover:shadow-lg transition-shadow">
                      {item.movie ? (
                        <>
                          <Link to={`/movies/${item.movie.id}`} className="group h-full">
                            <div className="aspect-[2/3] relative">
                              <img 
                                src={item.movie.posterURL || '/placeholder-poster.jpg'} 
                                alt={item.movie.title} 
                                className="w-full h-full object-cover"
                                loading="lazy"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.onerror = null;
                                  target.src = '/placeholder-poster.jpg';
                                }}
                              />
                              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-3">
                                <h3 className="text-white font-bold text-sm sm:text-base line-clamp-1">
                                  {item.movie.title}
                                </h3>
                                <p className="text-white text-xs opacity-90">
                                  {item.movie.year}
                                </p>
                              </div>
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200"></div>
                            </div>
                          </Link>
                          <CardFooter className="p-3 pt-0 flex justify-center items-center mt-auto">
                            <div className="flex items-center gap-2">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              <span className="font-medium">{item.rating}/10</span>
                            </div>
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
              <h2 className="text-xl sm:text-2xl font-bold mb-4">Account Settings</h2>
              
              <Card>
                <CardHeader>
                  <CardTitle>Profile Picture</CardTitle>
                  <CardDescription>
                    Update your profile picture
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col items-center sm:flex-row sm:items-start gap-6">
                    <div className="flex-shrink-0">
                      <Avatar className="h-24 w-24 sm:h-32 sm:w-32">
                        {/* Show new profile picture if available, otherwise show current or fallback */}
                        {newProfilePicture || user?.profilePictureUrl ? (
                          <img 
                            src={newProfilePicture || user?.profilePictureUrl || ''} 
                            alt={`${user?.username}'s profile`}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.onerror = null;
                              target.style.display = "none";
                            }}
                          />
                        ) : (
                          <AvatarFallback className="bg-rose-100 text-rose-800 text-4xl">
                            {user?.username ? getInitials(user.username) : "U"}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      
                      {/* Remove Picture Button - Only show if there's a current picture */}
                      {(user?.profilePictureUrl || newProfilePicture) && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-4 w-full text-xs border-red-200 text-red-600 hover:bg-red-50"
                          onClick={handleRemoveProfilePicture}
                          disabled={isUpdatingProfile}
                          type="button"
                        >
                          {isUpdatingProfile ? (
                            <Loader2 className="h-3 w-3 animate-spin mr-2" />
                          ) : (
                            <Trash2 className="h-3 w-3 mr-2" />
                          )}
                          Remove Picture
                        </Button>
                      )}
                    </div>
                    
                    <div className="w-full max-w-md mt-4 sm:mt-0">
                      <Uploader
                        onImageUploaded={handleProfilePictureSelected}
                        defaultImage={newProfilePicture || user?.profilePictureUrl || ""}
                        id="profile-picture-upload"
                        aspectRatio="square"
                        placeholderText="Upload profile image"
                      />

                      <div className="mt-3 text-xs sm:text-sm text-muted-foreground">
                        <p>Recommended: Upload a square image for best results.</p>
                        <p>Maximum file size: 5MB</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end border-t pt-6">
                  <Button
                    onClick={handleUpdateProfile}
                    disabled={isUpdatingProfile || (newProfilePicture === null && user?.profilePictureUrl !== null)}
                    className="bg-rose-600 hover:bg-rose-700"
                    type="button"
                  >
                    {isUpdatingProfile ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      'Update Profile'
                    )}
                  </Button>
                </CardFooter>
              </Card>
              
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Account Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Username</h3>
                      <p className="break-all">{user?.username}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Email Address</h3>
                      <p className="break-all">{user?.email || 'No email provided'}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Member Since</h3>
                      <p>{user?.createdAt ? format(new Date(user.createdAt), 'MMMM d, yyyy') : 'Unknown'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {/* Remove from watchlist confirmation dialog */}
      <AlertDialog open={removingItemId !== null} onOpenChange={(open) => {
        // Only allow closing if we're not in the middle of an operation
        if (!open && removingItemId !== null && !watchlist.some(item => {
          const itemMovieId = item.movie ? item.movie.id : item.id;
          return itemMovieId === removingItemId;
        })) {
          setRemovingItemId(null);
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove from Watchlist</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this movie from your watchlist?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 mt-0"
              onClick={() => removingItemId && handleRemoveFromWatchlist(removingItemId)}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
