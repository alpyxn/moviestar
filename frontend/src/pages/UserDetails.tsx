import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useKeycloak } from '@react-keycloak/web';
import { useToast } from '@/hooks/use-toast';
import userApi from '@/api/userApi';
import moviesApi from '@/api/movieApi';
import adminApi from '@/api/adminApi';
import { User, Comment, WatchlistItem } from '@/api/apiService';
import { Loader2, UserIcon, Film, Trash2, Ban, CheckCircle, Shield } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Card,
  CardContent,
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
import CommentsTab from '@/components/profile/CommentsTab';
import WatchlistTab from '@/components/profile/WatchlistTab';

export default function UserDetails() {
  const { username } = useParams<{ username: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  
  const [userComments, setUserComments] = useState<Comment[]>([]);
  const [displayedComments, setDisplayedComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [movieTitles, setMovieTitles] = useState<Record<number, string>>({});
  const [commentUsers, setCommentUsers] = useState<Record<string, User>>({});
  
  const [commentsPage, setCommentsPage] = useState(1);
  const [hasMoreComments, setHasMoreComments] = useState(true);
  const [loadingMoreComments, setLoadingMoreComments] = useState(false);
  const COMMENTS_PER_PAGE = 10;
  
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [displayedWatchlistItems, setDisplayedWatchlistItems] = useState<WatchlistItem[]>([]);
  const [loadingWatchlist, setLoadingWatchlist] = useState(false);
  const [hasMoreWatchlist, setHasMoreWatchlist] = useState(true);
  const [loadingMoreWatchlist, setLoadingMoreWatchlist] = useState(false);
  const [watchlistPage, setWatchlistPage] = useState(1);
  const ITEMS_PER_BATCH = 12;
  
  const commentsEndRef = useRef<HTMLDivElement>(null);
  const watchlistEndRef = useRef<HTMLDivElement>(null);
  
  const [deleteCommentId, setDeleteCommentId] = useState<number | null>(null);
  const [isDeletingComment, setIsDeletingComment] = useState(false);
  const [isDeletingAllComments, setIsDeletingAllComments] = useState(false);
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);
  
  const { toast } = useToast();
  const { keycloak, initialized } = useKeycloak();
  const isAdmin = initialized && keycloak.authenticated && keycloak.hasRealmRole('ADMIN');
  
  // Add state for ban/unban functionality
  const [isBanning, setIsBanning] = useState(false);
  const [isUnbanning, setIsUnbanning] = useState(false);
  const [showBanDialog, setShowBanDialog] = useState(false);
  const [showUnbanDialog, setShowUnbanDialog] = useState(false);
  
  useEffect(() => {
    if (!username) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const userData = await userApi.getUserByUsername(username);
        setUser(userData);
      } catch (error) {
        setNotFound(true);
        toast({
          title: 'Error',
          description: 'User not found or error loading user data',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [username, toast]);
  
  useEffect(() => {
    if (!user?.username) return;
    
    const fetchComments = async () => {
      try {
        setCommentsLoading(true);
        const comments = await userApi.getUserComments(user.username);
        setUserComments(comments);
        
        const initialComments = comments.slice(0, COMMENTS_PER_PAGE);
        setDisplayedComments(initialComments);
        setHasMoreComments(comments.length > COMMENTS_PER_PAGE);
        
        await fetchMovieTitles(comments);
        
        setCommentUsers(prev => ({
          ...prev,
          [user.username]: user
        }));
        
      } catch (error) {
      } finally {
        setCommentsLoading(false);
      }
    };
    
    fetchComments();
  }, [user]);
  
  useEffect(() => {
    if (!user?.username) return;
    
    const fetchWatchlist = async () => {
      try {
        setLoadingWatchlist(true);
        const watchlistData = await userApi.getUserWatchlist(user.username);
        setWatchlist(watchlistData);
        
        const initialItems = watchlistData.slice(0, ITEMS_PER_BATCH);
        setDisplayedWatchlistItems(initialItems);
        setHasMoreWatchlist(watchlistData.length > ITEMS_PER_BATCH);
      } catch (error) {
      } finally {
        setLoadingWatchlist(false);
      }
    };
    
    fetchWatchlist();
  }, [user]);
  
  const fetchMovieTitles = async (comments: Comment[]) => {
    const uniqueMovieIds = Array.from(new Set(comments.map(c => c.movieId)));
    const titles: Record<number, string> = {};
    
    for (const movieId of uniqueMovieIds) {
      try {
        const movie = await moviesApi.getById(movieId);
        titles[movieId] = movie.title;
      } catch (error) {
        titles[movieId] = `Movie #${movieId}`;
      }
    }
    
    setMovieTitles(titles);
  };
  
  useEffect(() => {
    if (!commentsEndRef.current || !hasMoreComments || loadingMoreComments || commentsLoading) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreComments && !loadingMoreComments) {
          loadMoreComments();
        }
      },
      { threshold: 0.5 }
    );
    
    observer.observe(commentsEndRef.current);
    return () => observer.disconnect();
  }, [hasMoreComments, loadingMoreComments, commentsLoading]);
  
  useEffect(() => {
    if (!watchlistEndRef.current || !hasMoreWatchlist || loadingMoreWatchlist || loadingWatchlist) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreWatchlist && !loadingMoreWatchlist) {
          loadMoreWatchlistItems();
        }
      },
      { threshold: 0.5 }
    );
    
    observer.observe(watchlistEndRef.current);
    return () => observer.disconnect();
  }, [hasMoreWatchlist, loadingMoreWatchlist, loadingWatchlist]);
  
  const loadMoreComments = useCallback(() => {
    if (loadingMoreComments || !hasMoreComments) return;
    
    setLoadingMoreComments(true);
    
    setTimeout(() => {
      const nextPage = commentsPage + 1;
      const start = (nextPage - 1) * COMMENTS_PER_PAGE;
      const end = start + COMMENTS_PER_PAGE;
      const nextBatch = userComments.slice(start, end);
      
      if (nextBatch.length > 0) {
        setDisplayedComments(prev => [...prev, ...nextBatch]);
      }
      
      setCommentsPage(nextPage);
      setHasMoreComments(end < userComments.length);
      setLoadingMoreComments(false);
    }, 300);
  }, [loadingMoreComments, hasMoreComments, commentsPage, userComments]);
  
  const loadMoreWatchlistItems = useCallback(() => {
    if (loadingMoreWatchlist || !hasMoreWatchlist) return;
    
    setLoadingMoreWatchlist(true);
    
    setTimeout(() => {
      const nextPage = watchlistPage + 1;
      const start = (nextPage - 1) * ITEMS_PER_BATCH;
      const end = start + ITEMS_PER_BATCH;
      const nextBatch = watchlist.slice(start, end);
      
      if (nextBatch.length > 0) {
        setDisplayedWatchlistItems(prev => [...prev, ...nextBatch]);
      }
      
      setWatchlistPage(nextPage);
      setHasMoreWatchlist(end < watchlist.length);
      setLoadingMoreWatchlist(false);
    }, 300);
  }, [loadingMoreWatchlist, hasMoreWatchlist, watchlistPage, watchlist]);
  
  const handleDeleteComment = (commentId: number) => {
    if (!isAdmin) return;
    setDeleteCommentId(commentId);
  };
  
  const executeCommentDeletion = async () => {
    if (!deleteCommentId || !isAdmin) return;
    
    try {
      setIsDeletingComment(true);
      
      if (keycloak.authenticated) {
        try {
          await keycloak.updateToken(30);
        } catch (refreshError) {
          keycloak.login();
          return;
        }
      }
      
      await adminApi.deleteComment(deleteCommentId);
      
      const updatedComments = userComments.filter(c => c.id !== deleteCommentId);
      setUserComments(updatedComments);
      setDisplayedComments(prev => prev.filter(c => c.id !== deleteCommentId));
      
      toast({
        title: "Success",
        description: "Comment deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete comment",
        variant: "destructive",
      });
    } finally {
      setDeleteCommentId(null);
      setIsDeletingComment(false);
    }
  };
  
  const handleDeleteAllComments = () => {
    if (!isAdmin || !user) return;
    setShowDeleteAllDialog(true);
  };
  
  const executeDeleteAllComments = async () => {
    if (!isAdmin || !user) return;
    
    try {
      setIsDeletingAllComments(true);
      
      if (keycloak.authenticated) {
        try {
          await keycloak.updateToken(30);
        } catch (refreshError) {
          keycloak.login();
          return;
        }
      }
      
      await adminApi.deleteAllUserComments(user.username);
      
      // Clear all comments
      setUserComments([]);
      setDisplayedComments([]);
      setHasMoreComments(false);
      
      toast({
        title: "Success",
        description: "All comments deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete all comments",
        variant: "destructive",
      });
    } finally {
      setShowDeleteAllDialog(false);
      setIsDeletingAllComments(false);
    }
  };
  
  const handleBanUser = () => {
    if (!isAdmin || !user) return;
    setShowBanDialog(true);
  };
  
  const executeBanUser = async () => {
    if (!isAdmin || !user) return;
    
    try {
      setIsBanning(true);
      
      if (keycloak.authenticated) {
        try {
          await keycloak.updateToken(30);
        } catch (refreshError) {
          keycloak.login();
          return;
        }
      }
      
      const updatedUser = await adminApi.banUser(user.username);
      
      setUser(prev => prev ? { ...prev, status: updatedUser.status } : null);
      
      toast({
        title: "Success",
        description: "User banned successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to ban user",
        variant: "destructive",
      });
    } finally {
      setShowBanDialog(false);
      setIsBanning(false);
    }
  };
  
  const handleUnbanUser = () => {
    if (!isAdmin || !user) return;
    setShowUnbanDialog(true);
  };
  
  const executeUnbanUser = async () => {
    if (!isAdmin || !user) return;
    
    try {
      setIsUnbanning(true);
      
      if (keycloak.authenticated) {
        try {
          await keycloak.updateToken(30);
        } catch (refreshError) {
          keycloak.login();
          return;
        }
      }
      
      const updatedUser = await adminApi.unbanUser(user.username);
      
      setUser(prev => prev ? { ...prev, status: updatedUser.status } : null);
      
      toast({
        title: "Success",
        description: "User unbanned successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to unban user",
        variant: "destructive",
      });
    } finally {
      setShowUnbanDialog(false);
      setIsUnbanning(false);
    }
  };
  
  const getInitials = (name: string): string => {
    return name.charAt(0).toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[70vh]">
        <Loader2 className="h-8 w-8 animate-spin text-rose-600" />
        <span className="ml-2">Loading user profile...</span>
      </div>
    );
  }

  if (notFound || !user) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-bold mb-4">User Not Found</h1>
        <p className="text-gray-500 mb-6">The user profile you're looking for doesn't exist or has been removed.</p>
        <Button asChild>
          <Link to="/">Back to Home</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="col-span-1">
          <Card className="overflow-hidden">
            <CardHeader className="bg-muted">
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-24 w-24 mb-2">
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
                <CardTitle className="break-words max-w-full">{user.username}</CardTitle>
                
                {/* Display user status */}
                {user.status && (
                  <div className="mt-1">
                    {user.status === 'ACTIVE' ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Active
                      </span>
                    ) : user.status === 'BANNED' ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <Ban className="w-3 h-3 mr-1" />
                        Banned
                      </span>
                    ) : null}
                  </div>
                )}
                
                {/* Admin actions for banning/unbanning */}
                {isAdmin && (
                  <div className="mt-3 w-full">
                    {user.status === 'ACTIVE' ? (
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={handleBanUser}
                        className="w-full text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <Ban className="w-4 h-4 mr-2" />
                        Ban User
                      </Button>
                    ) : user.status === 'BANNED' ? (
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={handleUnbanUser}
                        className="w-full text-green-600 border-green-200 hover:bg-green-50"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Unban User
                      </Button>
                    ) : null}
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ul className="divide-y">
                <li className="px-4 py-3 hover:bg-muted transition-colors">
                  <div className="flex items-center">
                    <UserIcon className="h-4 w-4 mr-2 text-muted-foreground shrink-0" />
                    <span className="truncate">Member since: {user.createdAt ? format(new Date(user.createdAt), 'MMMM yyyy') : 'Unknown'}</span>
                  </div>
                </li>
                <li className="px-4 py-3 hover:bg-muted transition-colors">
                  <div className="flex items-center">
                    <Film className="h-4 w-4 mr-2 text-muted-foreground shrink-0" />
                    <span>Activity: {userComments.length} comments</span>
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
          </Card>
          
          {/* Admin section */}
          {isAdmin && (
            <Card className="mt-4 overflow-hidden">
              <CardHeader className="py-4">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-yellow-500" />
                  <CardTitle className="text-base">Admin Actions</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground mb-2">Moderation options for this user</p>
                  
                  {userComments.length > 0 && (
                    <Button 
                      variant="destructive"
                      size="sm"
                      onClick={handleDeleteAllComments}
                      className="w-full justify-start"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete All Comments
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
        
        <div className="col-span-1 md:col-span-3">
          <Tabs defaultValue="comments" className="w-full">
            <TabsList className="w-full grid grid-cols-2 mb-4">
              <TabsTrigger value="comments">User Comments</TabsTrigger>
              <TabsTrigger value="watchlist">Watchlist</TabsTrigger>
            </TabsList>
            
            <TabsContent value="comments" className="pt-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl sm:text-2xl font-bold">{user.username}'s Comments</h2>
                {isAdmin && userComments.length > 0 && (
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={handleDeleteAllComments}
                    className="flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete All Comments
                  </Button>
                )}
              </div>
              <CommentsTab
                userComments={userComments}
                displayedComments={displayedComments}
                commentUsers={commentUsers}
                movieTitles={movieTitles}
                commentsLoading={commentsLoading}
                loadingMoreComments={loadingMoreComments}
                hasMoreComments={hasMoreComments}
                commentsEndRef={commentsEndRef}
                onDeleteComment={handleDeleteComment}
                isAdmin={isAdmin || false}
              />
            </TabsContent>
            
            <TabsContent value="watchlist" className="pt-6">
              <h2 className="text-xl sm:text-2xl font-bold mb-4">{user.username}'s Watchlist</h2>
              <WatchlistTab
                watchlist={watchlist}
                displayedItems={displayedWatchlistItems}
                loadingMore={loadingMoreWatchlist}
                hasMore={hasMoreWatchlist}
                removingItemId={null}
                onRemoveItem={() => {}}
                watchlistEndRef={watchlistEndRef}
                isViewOnly={true}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      <AlertDialog open={deleteCommentId !== null} onOpenChange={() => setDeleteCommentId(null)}>
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
              className="bg-red-600 hover:bg-red-700"
              onClick={executeCommentDeletion}
              disabled={isDeletingComment}
            >
              {isDeletingComment ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <AlertDialog open={showDeleteAllDialog} onOpenChange={setShowDeleteAllDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete All Comments</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete all comments from this user? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={executeDeleteAllComments}
              disabled={isDeletingAllComments}
            >
              {isDeletingAllComments ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting All Comments...
                </>
              ) : 'Delete All'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Ban User Dialog */}
      <AlertDialog open={showBanDialog} onOpenChange={setShowBanDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ban User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to ban {user?.username}? The user will no longer be able to log in.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={executeBanUser}
              disabled={isBanning}
            >
              {isBanning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Banning...
                </>
              ) : 'Ban User'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Unban User Dialog */}
      <AlertDialog open={showUnbanDialog} onOpenChange={setShowUnbanDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unban User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to unban {user?.username}? The user will be able to log in again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-green-600 hover:bg-green-700"
              onClick={executeUnbanUser}
              disabled={isUnbanning}
            >
              {isUnbanning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Unbanning...
                </>
              ) : 'Unban User'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
