import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useKeycloak } from '@react-keycloak/web';
import userApi from '@/api/userApi';
import adminApi from '@/api/adminApi';
import moviesApi from '@/api/movieApi';
import { User, Comment, WatchlistItem } from '@/api/apiService';
import { Loader2, UserIcon, Calendar, Film, MessageSquare, Shield, Ban, CheckCircle, Trash2, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function UserDetails() {
  const { username } = useParams<{ username: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [userComments, setUserComments] = useState<Comment[]>([]);
  const [userWatchlist, setUserWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [watchlistLoading, setWatchlistLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isBanning, setIsBanning] = useState(false);
  const [showBanDialog, setShowBanDialog] = useState(false);
  const [showDeleteCommentDialog, setShowDeleteCommentDialog] = useState(false);
  const [selectedCommentId, setSelectedCommentId] = useState<number | null>(null);
  const [notesForDeveloper, setNotesForDeveloper] = useState<string[]>([]);
  const [movieTitles, setMovieTitles] = useState<Record<number, string>>({});
  
  const { toast } = useToast();
  const { keycloak } = useKeycloak();

  // Check if current user is an admin
  useEffect(() => {
    if (keycloak?.tokenParsed?.realm_access?.roles) {
      setIsAdmin(keycloak.tokenParsed.realm_access.roles.includes('ADMIN'));
    }
  }, [keycloak.tokenParsed]);

  // Fetch user data
  useEffect(() => {
    let isMounted = true;
    
    const fetchUserData = async () => {
      if (!username) {
        setError('No username provided');
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        const userData = await userApi.getUserByUsername(username);
        
        if (!isMounted) return;
        
        setUser(userData);
        
        // Now we can also fetch comments and watchlist using our new endpoints
        const fetchUserComments = async () => {
          setCommentsLoading(true);
          try {
            const comments = await userApi.getUserComments(username);
            
            if (!isMounted) return;
            
            setUserComments(comments);
            
            // Fetch movie titles for the comments
            const uniqueMovieIds = Array.from(new Set(comments.map(comment => comment.movieId)));
            const movieTitlesMap: Record<number, string> = {};
            
            await Promise.all(uniqueMovieIds.map(async (movieId) => {
              try {
                const movie = await moviesApi.getById(movieId);
                if (!isMounted) return;
                movieTitlesMap[movieId] = movie.title;
              } catch (error) {
                console.error(`Error fetching movie title for ID ${movieId}:`, error);
                if (!isMounted) return;
                movieTitlesMap[movieId] = `Unknown Movie`;
              }
            }));
            
            if (!isMounted) return;
            setMovieTitles(movieTitlesMap);
          } catch (error) {
            console.error('Error fetching user comments:', error);
            // No need to set error state here as this is not critical
            if (isMounted) {
              setNotesForDeveloper(prev => [
                ...prev, 
                "There was an error fetching user comments. The endpoint might be having issues."
              ]);
            }
          } finally {
            if (isMounted) {
              setCommentsLoading(false);
            }
          }
        };

        const fetchUserWatchlist = async () => {
          setWatchlistLoading(true);
          try {
            const watchlist = await userApi.getUserWatchlist(username);
            if (!isMounted) return;
            setUserWatchlist(watchlist);
          } catch (error) {
            console.error('Error fetching user watchlist:', error);
            // No need to set error state here as this is not critical
            if (isMounted) {
              setNotesForDeveloper(prev => [
                ...prev, 
                "There was an error fetching user watchlist. The endpoint might be having issues."
              ]);
            }
          } finally {
            if (isMounted) {
              setWatchlistLoading(false);
            }
          }
        };

        // Execute these in parallel
        fetchUserComments();
        fetchUserWatchlist();

      } catch (error) {
        console.error('Error fetching user data:', error);
        if (isMounted) {
          setError('Failed to load user data');
          toast({
            title: 'Error',
            description: 'Failed to load user profile',
            variant: 'destructive',
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
  }, [username]);

  const getInitials = (name: string): string => {
    return name.charAt(0).toUpperCase();
  };
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown';
    try {
      return format(new Date(dateString), 'MMMM d, yyyy');
    } catch (error) {
      return 'Invalid date format';
    }
  };

  // Admin: Ban/unban user
  const handleBanUser = async (shouldBan: boolean) => {
    if (!username || !isAdmin) return;
    
    setIsBanning(true);
    try {
      // Ensure token is fresh before making admin requests
      if (keycloak.authenticated) {
        try {
          await keycloak.updateToken(30);
        } catch (refreshError) {
          console.error("Token refresh failed:", refreshError);
          toast({
            title: 'Authentication Error',
            description: 'Please login again to continue',
            variant: 'destructive',
          });
          keycloak.login();
          return;
        }
      }
      
      if (shouldBan) {
        await adminApi.banUser(username);
        toast({
          title: 'User Banned',
          description: `${username} has been banned`,
        });
        // Update the local user state with the new status
        setUser(prev => prev ? {...prev, status: 'BANNED'} : null);
      } else {
        await adminApi.unbanUser(username);
        toast({
          title: 'User Unbanned',
          description: `${username} has been unbanned`,
        });
        // Update the local user state with the new status
        setUser(prev => prev ? {...prev, status: 'ACTIVE'} : null);
      }
    } catch (error) {
      toast({
        title: 'Action Failed',
        description: `Failed to ${shouldBan ? 'ban' : 'unban'} user`,
        variant: 'destructive',
      });
    } finally {
      setIsBanning(false);
      setShowBanDialog(false);
    }
  };

  // Admin: Delete comment
  const handleDeleteComment = async () => {
    if (!selectedCommentId || !isAdmin) return;
    
    try {
      // Ensure token is fresh before making admin requests
      if (keycloak.authenticated) {
        try {
          await keycloak.updateToken(30);
        } catch (refreshError) {
          console.error("Token refresh failed:", refreshError);
          toast({
            title: 'Authentication Error',
            description: 'Please login again to continue',
            variant: 'destructive',
          });
          keycloak.login();
          return;
        }
      }
      
      await adminApi.deleteComment(selectedCommentId);
      // Remove the comment from the local state
      setUserComments(comments => comments.filter(c => c.id !== selectedCommentId));
      toast({
        title: 'Comment Deleted',
        description: 'The comment has been removed',
      });
    } catch (error) {
      toast({
        title: 'Delete Failed',
        description: 'Failed to delete the comment',
        variant: 'destructive',
      });
    } finally {
      setSelectedCommentId(null);
      setShowDeleteCommentDialog(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[70vh]">
        <Loader2 className="h-8 w-8 animate-spin text-rose-600" />
        <span className="ml-2">Loading user profile...</span>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-bold mb-4">User Not Found</h1>
        <p className="text-gray-500 mb-6">
          {error || `The user "${username}" could not be found.`}
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* User Profile Card - Left Side */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className={`text-center ${user.status === 'BANNED' ? 'bg-red-50' : 'bg-muted'}`}>
              <div className="flex flex-col items-center">
                <Avatar className="h-24 w-24 mb-4">
                  {user.profilePictureUrl ? (
                    <img 
                      src={user.profilePictureUrl} 
                      alt={`${user.username}'s profile`}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.onerror = null;
                        target.style.display = "none";
                      }}
                    />
                  ) : (
                    <AvatarFallback className="bg-rose-100 text-rose-800 text-xl">
                      {getInitials(user.username)}
                    </AvatarFallback>
                  )}
                </Avatar>
                <CardTitle className="text-2xl">{user.username}</CardTitle>
                {user.email && <CardDescription>{user.email}</CardDescription>}
                
                {user.status && (
                  <Badge 
                    className={`mt-2 ${
                      user.status === 'ACTIVE' ? 'bg-green-100 text-green-800 hover:bg-green-200' : 
                      'bg-red-100 text-red-800 hover:bg-red-200'
                    }`}
                  >
                    {user.status === 'ACTIVE' ? (
                      <CheckCircle className="h-3.5 w-3.5 mr-1" />
                    ) : (
                      <Ban className="h-3.5 w-3.5 mr-1" />
                    )}
                    {user.status}
                  </Badge>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center">
                  <UserIcon className="h-5 w-5 mr-3 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Username</p>
                    <p>{user.username}</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 mr-3 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Member since</p>
                    <p>{formatDate(user.createdAt)}</p>
                  </div>
                </div>
                
                {user.lastLogin && (
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 mr-3 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Last login</p>
                      <p>{formatDate(user.lastLogin)}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
            
            {/* Admin Controls */}
            {isAdmin && (
              <CardFooter className="flex flex-col gap-2">
                <div className="w-full mb-2 border-t pt-4">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Shield className="h-5 w-5 text-amber-600" />
                    <p className="text-sm font-medium text-center">Admin Controls</p>
                  </div>
                </div>
                
                {user.status === 'BANNED' ? (
                  <Button 
                    onClick={() => setShowBanDialog(true)} 
                    variant="outline" 
                    className="w-full border-green-300 text-green-700 hover:bg-green-50"
                    disabled={isBanning}
                  >
                    {isBanning ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    Unban User
                  </Button>
                ) : (
                  <Button 
                    onClick={() => setShowBanDialog(true)} 
                    variant="outline" 
                    className="w-full border-red-300 text-red-700 hover:bg-red-50"
                    disabled={isBanning}
                  >
                    {isBanning ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Ban className="h-4 w-4 mr-2" />
                    )}
                    Ban User
                  </Button>
                )}
              </CardFooter>
            )}
          </Card>
          
          {/* Developer Notes (only visible to admins) */}
          {isAdmin && notesForDeveloper.length > 0 && (
            <Card className="mt-4 border-amber-200">
              <CardHeader className="bg-amber-50 py-2">
                <CardTitle className="text-sm text-amber-800 flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Developer Notes
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <ul className="list-disc pl-5 text-xs text-amber-700 space-y-1">
                  {notesForDeveloper.map((note, index) => (
                    <li key={index}>{note}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
        
        {/* Tabbed Content - Right Side */}
        <div className="lg:col-span-3">
          <Tabs defaultValue="comments">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="comments">Comments</TabsTrigger>
              <TabsTrigger value="watchlist">Watchlist</TabsTrigger>
            </TabsList>
            
            {/* Comments Tab */}
            <TabsContent value="comments">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" />
                      <span>{user.username}'s Comments</span>
                    </div>
                  </CardTitle>
                  <CardDescription>
                    Comments this user has made on movies
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {commentsLoading ? (
                    <div className="py-12 flex justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : userComments.length > 0 ? (
                    <div className="space-y-4">
                      {userComments.map(comment => (
                        <Card key={comment.id} className="border border-muted">
                          <CardHeader className="p-3 pb-1">
                            <div className="flex justify-between items-start">
                              <div>
                                <Link to={`/movies/${comment.movieId}`} className="text-sm font-medium hover:underline">
                                  {movieTitles[comment.movieId] || `Movie #${comment.movieId}`}
                                </Link>
                                <p className="text-xs text-muted-foreground">
                                  {formatDate(comment.createdAt)}
                                  {comment.updatedAt && ` (edited ${formatDate(comment.updatedAt)})`}
                                </p>
                              </div>
                              
                              {isAdmin && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-8 w-8 text-red-600 hover:bg-red-50 hover:text-red-700"
                                        onClick={() => {
                                          setSelectedCommentId(comment.id);
                                          setShowDeleteCommentDialog(true);
                                        }}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Delete comment</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>
                          </CardHeader>
                          <CardContent className="p-3 pt-1">
                            <p>{comment.comment}</p>
                          </CardContent>
                          <CardFooter className="p-3 pt-1 text-xs text-muted-foreground">
                            <div className="flex gap-3">
                              <span className="flex items-center">
                                👍 {comment.likesCount}
                              </span>
                              <span className="flex items-center">
                                👎 {comment.dislikesCount}
                              </span>
                            </div>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-muted/50 rounded-md">
                      <MessageSquare className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
                      <h3 className="font-medium text-lg mb-1">No Comments Available</h3>
                      <p className="text-muted-foreground max-w-sm mx-auto">
                        {username === keycloak.profile?.username 
                          ? "You haven't made any comments yet."
                          : `${user.username} hasn't made any comments yet.`
                        }
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Watchlist Tab */}
            <TabsContent value="watchlist">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Film className="h-5 w-5" />
                    <span>{user.username}'s Watchlist</span>
                  </CardTitle>
                  <CardDescription>
                    Movies this user has added to their watchlist
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {watchlistLoading ? (
                    <div className="py-12 flex justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : userWatchlist.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {userWatchlist.map(item => {
                        // Check if the item is directly a movie or has a nested movie property
                        const movie = item.movie || item;
                        
                        return (
                          <Card key={item.id || movie.id} className="overflow-hidden">
                            <div className="aspect-[2/3] relative">
                              <img 
                                src={movie.posterURL || '/placeholder-poster.jpg'} 
                                alt={`${movie.title || 'Movie'} poster`}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.onerror = null;
                                  target.src = '/placeholder-poster.jpg';
                                }}
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent flex items-end p-4">
                                <div>
                                  <h3 className="text-white font-bold text-lg">{movie.title || 'Untitled'}</h3>
                                  <p className="text-white text-sm opacity-90">{movie.year || 'N/A'}</p>
                                </div>
                              </div>
                            </div>
                            <CardFooter className="p-4">
                              <Button variant="default" size="sm" asChild className="w-full">
                                <Link to={`/movies/${movie.id}`}>View Details</Link>
                              </Button>
                            </CardFooter>
                          </Card>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-muted/50 rounded-md">
                      <Film className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
                      <h3 className="font-medium text-lg mb-1">No Watchlist Available</h3>
                      <p className="text-muted-foreground max-w-sm mx-auto">
                        {username === keycloak.profile?.username 
                          ? "You haven't added any movies to your watchlist yet."
                          : `${user.username} hasn't added any movies to their watchlist yet.`
                        }
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {/* Ban/Unban Dialog */}
      <AlertDialog open={showBanDialog} onOpenChange={setShowBanDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {user.status === 'BANNED' ? 'Unban User' : 'Ban User'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {user.status === 'BANNED' 
                ? `Are you sure you want to unban ${user.username}? They will regain access to all features.` 
                : `Are you sure you want to ban ${user.username}? They will lose access to all features.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => handleBanUser(user.status !== 'BANNED')} 
              className={user.status === 'BANNED' ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
            >
              {user.status === 'BANNED' ? 'Unban' : 'Ban'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Delete Comment Dialog */}
      <AlertDialog open={showDeleteCommentDialog} onOpenChange={setShowDeleteCommentDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Comment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this comment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteComment}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
