import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useKeycloak } from '@react-keycloak/web';
import moviesApi from '@/api/movieApi';
import watchlistApi from '@/api/watchlistApi';
import { Movie, Comment, WatchlistStatus,LikeStatus  } from '@/api/apiService';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { 
  Heart,
  ThumbsUp, 
  ThumbsDown, 
  Star, 
  Calendar, 
  MessageSquare,
  Loader2,
  Plus,
  Check,
  User,
  Edit,
  Trash2,
  Shield
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import adminApi from '@/api/adminApi';
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

export default function MovieDetails() {
  const { id } = useParams<{ id: string }>();
  const movieId = parseInt(id || '0');
  
  const [movie, setMovie] = useState<Movie | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(true);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [watchlistStatus, setWatchlistStatus] = useState<WatchlistStatus | null>(null);
  const [isAddingToWatchlist, setIsAddingToWatchlist] = useState(false);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [isRating, setIsRating] = useState(false);
  const [commentLikeStatuses, setCommentLikeStatuses] = useState<Record<number, LikeStatus>>({});
  const [isSubmittingLike, setIsSubmittingLike] = useState<number | null>(null);
  const [commentSortBy, setCommentSortBy] = useState<string>('newest');
  const [deleteMovieId, setDeleteMovieId] = useState<number | null>(null);
  const [deleteCommentId, setDeleteCommentId] = useState<number | null>(null);
  const [isDeletingComment, setIsDeletingComment] = useState(false);
  const [editCommentId, setEditCommentId] = useState<number | null>(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [isEditingComment, setIsEditingComment] = useState(false);
  const [isDeletingUserComment, setIsDeletingUserComment] = useState(false);
  const editTextAreaRef = useRef<HTMLTextAreaElement>(null);

  const navigate = useNavigate();
  const { toast } = useToast();
  const { keycloak, initialized } = useKeycloak();
  const isAuthenticated = initialized && keycloak.authenticated;
  
  // Check if user is admin
  const isAdmin = initialized && 
    keycloak.authenticated && 
    keycloak.hasRealmRole('ADMIN');

  // Fetch movie data, comments, and user's rating on component mount
  useEffect(() => {
    const fetchMovieData = async () => {
      if (!movieId) return;
      
      try {
        setLoading(true);
        const [movieData, commentsData] = await Promise.all([
          moviesApi.getById(movieId),
          moviesApi.getComments(movieId, commentSortBy)
        ]);
        
        setMovie({
          ...movieData,
          actors: movieData.actors || [],
          directors: movieData.directors || [],
          genres: movieData.genres || []
        });
        setComments(commentsData);
        
        // If user is authenticated, fetch user-specific data
        if (isAuthenticated) {
          try {
            const [status, userRating] = await Promise.all([
              watchlistApi.checkWatchlistStatus(movieId),
              moviesApi.getUserRating(movieId)
            ]);
            
            setWatchlistStatus(status);
            setUserRating(userRating);
            
            // Fetch like statuses for comments...
            const statuses: Record<number, LikeStatus> = {};
            
            await Promise.all(
              commentsData.map(async (comment) => {
                try {
                  const likeStatus = await moviesApi.getCommentLikeStatus(comment.id);
                  statuses[comment.id] = likeStatus;
                } catch (error) {
                  console.error(`Error fetching like status for comment ${comment.id}:`, error);
                }
              })
            );
            
            setCommentLikeStatuses(statuses);
            
          } catch (error) {
            console.error('Error fetching user specific data:', error);
          }
        }
      } catch (error) {
        console.error('Error fetching movie data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load movie details',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMovieData();
    
    // Cleanup function to prevent state updates after unmount
    return () => {
      // This empty cleanup function helps prevent updates after unmount
    };
  }, [movieId, isAuthenticated, commentSortBy]); // Removed toast from dependencies

  // Handler for adding/removing movie from watchlist
  const handleWatchlistToggle = async () => {
    if (!isAuthenticated) {
      keycloak.login();
      return;
    }
    
    try {
      setIsAddingToWatchlist(true);
      
      if (watchlistStatus?.inWatchlist) {
        await watchlistApi.removeFromWatchlist(movieId);
        setWatchlistStatus({ inWatchlist: false });
      } else {
        await watchlistApi.addToWatchlist(movieId);
        setWatchlistStatus({ inWatchlist: true });
      }
    } catch (error) {
      console.error('Error updating watchlist:', error);
      toast({
        title: 'Error',
        description: 'Failed to update watchlist',
        variant: 'destructive',
      });
    } finally {
      setIsAddingToWatchlist(false);
    }
  };

  // Handler for submitting a comment
  const handleCommentSubmit = async () => {
    if (!isAuthenticated) {
      keycloak.login();
      return;
    }
    
    if (!commentText.trim()) return;
    
    try {
      setSubmittingComment(true);
      await moviesApi.addComment(movieId, commentText);
      
      // Refresh comments after submission
      const newComments = await moviesApi.getComments(movieId, commentSortBy);
      setComments(newComments);
      
      setCommentText('');
    } catch (error) {
      console.error('Error submitting comment:', error);
      toast({
        title: 'Error',
        description: 'Failed to add comment',
        variant: 'destructive',
      });
    } finally {
      setSubmittingComment(false);
    }
  };

  // Update the rating handler to allow rating changes
  const handleRateMovie = async (rating: number) => {
    if (!isAuthenticated) {
      keycloak.login();
      return;
    }
    
    // If user clicks the same rating, remove it
    if (rating === userRating) {
      try {
        setIsRating(true);
        await moviesApi.removeRating(movieId);
        setUserRating(null);
        
        // Refresh movie data to get updated ratings
        const updatedMovie = await moviesApi.getById(movieId);
        setMovie(updatedMovie);
      } catch (error) {
        console.error('Error removing rating:', error);
        toast({
          title: 'Error',
          description: 'Failed to remove rating',
          variant: 'destructive',
        });
      } finally {
        setIsRating(false);
      }
      return;
    }
    
    // Otherwise, set or update the rating
    try {
      setIsRating(true);
      await moviesApi.rateMovie(movieId, rating);
      
      setUserRating(rating);
      
      // Refresh movie data to get updated ratings
      const updatedMovie = await moviesApi.getById(movieId);
      setMovie(updatedMovie);
    } catch (error) {
      console.error('Error rating movie:', error);
      toast({
        title: 'Error',
        description: 'Failed to rate movie',
        variant: 'destructive',
      });
    } finally {
      setIsRating(false);
    }
  };

  // Handler for liking/disliking a comment
  const handleCommentReaction = async (commentId: number, isLike: boolean | null) => {
    if (!isAuthenticated) {
      keycloak.login();
      return;
    }
    
    try {
      setIsSubmittingLike(commentId);
      
      const currentStatus = commentLikeStatuses[commentId] || { liked: false, disliked: false };
      
      // If trying to set the same state, remove it
      if (
        (isLike === true && currentStatus.liked) ||
        (isLike === false && currentStatus.disliked)
      ) {
        await moviesApi.removeCommentReaction(commentId);
        setCommentLikeStatuses({
          ...commentLikeStatuses,
          [commentId]: { liked: false, disliked: false }
        });
      } else {
        // Otherwise, set the new reaction
        if (isLike !== null) {
          await moviesApi.likeComment(commentId, isLike);
          setCommentLikeStatuses({
            ...commentLikeStatuses,
            [commentId]: { liked: isLike, disliked: !isLike }
          });
        }
      }
      
      // Refresh comments to get updated like counts
      const updatedComments = await moviesApi.getComments(movieId, commentSortBy);
      setComments(updatedComments);
      
    } catch (error) {
      console.error('Error updating comment reaction:', error);
      toast({
        title: 'Error',
        description: 'Failed to update reaction',
        variant: 'destructive',
      });
    } finally {
      setIsSubmittingLike(null);
    }
  };

  // Handler for changing comment sorting
  const handleSortComments = async (sortBy: string) => {
    setCommentSortBy(sortBy);
  };

  // Add handler to delete a movie as admin
  const handleDeleteMovie = async () => {
    if (!isAdmin || !movieId) return;

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
      
      await adminApi.deleteMovie(movieId);
      toast({
        title: "Success",
        description: "Movie deleted successfully",
      });
      navigate('/movies');
    } catch (error) {
      console.error('Error deleting movie:', error);
      toast({
        title: "Error",
        description: "Failed to delete movie",
        variant: "destructive",
      });
    } finally {
      setDeleteMovieId(null);
    }
  };

  // Add handler to delete a comment as admin
  const handleDeleteComment = async (commentId: number) => {
    if (!isAdmin) return;

    try {
      setIsDeletingComment(true);
      
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
      
      // Implement API call to delete comment
      await adminApi.deleteComment(commentId);
      
      toast({
        title: "Success",
        description: "Comment deleted successfully",
      });
      
      // Refresh comments after deletion
      const updatedComments = await moviesApi.getComments(movieId, commentSortBy);
      setComments(updatedComments);
    } catch (error) {
      console.error('Error deleting comment:', error);
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

  // Add handler to edit own comment
  const handleEditComment = async () => {
    if (!isAuthenticated || !editCommentId) return;
    
    try {
      setIsEditingComment(true);
      await moviesApi.updateComment(editCommentId, editCommentText);
      
      // Refresh comments after editing
      const updatedComments = await moviesApi.getComments(movieId, commentSortBy);
      setComments(updatedComments);
    } catch (error) {
      console.error('Error updating comment:', error);
      toast({
        title: "Error",
        description: "Failed to update comment",
        variant: "destructive",
      });
    } finally {
      setIsEditingComment(false);
    }
  };

  // Add handler to delete own comment
  const handleDeleteUserComment = async (commentId: number) => {
    if (!isAuthenticated) return;
    
    try {
      setIsDeletingUserComment(true);
      await moviesApi.deleteComment(commentId);
      
      // Refresh comments after deletion
      const updatedComments = await moviesApi.getComments(movieId, commentSortBy);
      setComments(updatedComments);
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast({
        title: "Error",
        description: "Failed to delete comment",
        variant: "destructive",
      });
    } finally {
      setDeleteCommentId(null);
      setIsDeletingUserComment(false);
    }
  };

  // Focus on textarea when editing a comment
  useEffect(() => {
    if (editCommentId && editTextAreaRef.current) {
      editTextAreaRef.current.focus();
    }
  }, [editCommentId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[70vh]">
        <Loader2 className="h-8 w-8 animate-spin text-rose-600" />
        <span className="ml-2">Loading movie details...</span>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-bold mb-4">Movie Not Found</h1>
        <p className="text-gray-500 mb-6">The movie you're looking for doesn't exist or has been removed.</p>
        <Button asChild>
          <Link to="/movies">Back to Movies</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section with Backdrop */}
      <div 
        className="h-[50vh] bg-cover bg-center relative"
        style={{ backgroundImage: `url(${movie.backdropURL})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-background" />
        
        <div className="container mx-auto h-full flex items-end pb-8 px-4 relative z-10">
          <div className="flex flex-col md:flex-row gap-6 items-start w-full">
            {/* Poster */}
            <div className="w-40 md:w-64 rounded-lg overflow-hidden shadow-xl">
              <img 
                src={movie.posterURL} 
                alt={movie.title} 
                className="w-full h-auto"
              />
            </div>
            
            {/* Movie Info */}
            <div className="text-white flex-grow">
              <div className="flex justify-between items-start">
                <h1 className="text-3xl md:text-5xl font-bold">{movie.title}</h1>
                
                {isAdmin && (
                  <div className="flex items-center bg-black/50 rounded-lg p-2 gap-2">
                    <Shield className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm text-yellow-500 font-medium">Admin</span>
                    
                    <div className="flex ml-2 gap-1">
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="h-8 border-gray-600 bg-transparent hover:bg-gray-800"
                        onClick={() => navigate(`/admin/movies/edit/${movieId}`)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-8 border-red-600 text-red-500 bg-transparent hover:bg-red-900/30"
                        onClick={() => setDeleteMovieId(movieId)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex flex-wrap gap-4 mt-3 items-center">
                <div className="flex items-center">
                  <Star className="h-5 w-5 text-yellow-500 mr-1" />
                  <span className="font-semibold">{movie.averageRating.toFixed(1)}</span>
                  <span className="text-sm text-gray-300 ml-1">({movie.totalRatings} ratings)</span>
                </div>
                
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>{movie.year}</span>
                </div>
                
                <div className="flex flex-wrap gap-1">
                  {(movie.genres || []).map((genre) => (
                    <span 
                      key={genre.id} 
                      className="px-2 py-1 bg-gray-700 rounded-full text-xs"
                    >
                      {genre.genre}
                    </span>
                  ))}
                </div>
                
                {isAuthenticated && (
                  <Button 
                    size="sm"
                    className="ml-auto flex items-center gap-1 bg-slate-700"
                    onClick={handleWatchlistToggle}
                    disabled={isAddingToWatchlist}
                  >
                    {isAddingToWatchlist ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : watchlistStatus?.inWatchlist ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                    {watchlistStatus?.inWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Content Section */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - 2/3 width on large screens */}
          <div className="lg:col-span-2 space-y-8">
            {/* Synopsis */}
            <section>
              <h2 className="text-2xl font-bold mb-4">Synopsis</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {movie.description}
              </p>
            </section>
            
            {/* Cast and Crew Tabs */}
            <section>
              <Tabs defaultValue="cast">
                <TabsList className="mb-4">
                  <TabsTrigger value="cast">Cast</TabsTrigger>
                  <TabsTrigger value="directors">Directors</TabsTrigger>
                </TabsList>
                
                <TabsContent value="cast" className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {(movie.actors || []).map((actor) => (
                      <Link 
                        to={`/actors/${actor.id}`} 
                        key={actor.id}
                        className="group"
                      >
                        <Card className="overflow-hidden h-full transition-all hover:shadow-md">
                          <CardContent className="p-3">
                            <div className="w-full pb-[100%] relative overflow-hidden rounded-full mb-2">
                              {actor.pictureUrl ? (
                                <img 
                                  src={actor.pictureUrl} 
                                  alt={`${actor.name} ${actor.surname}`}
                                  className="absolute inset-0 w-full h-full object-cover"
                                />
                              ) : (
                                <div className="absolute inset-0 bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
                                  <User className="h-12 w-12 text-gray-400" />
                                </div>
                              )}
                            </div>
                            <h3 className="font-medium text-center group-hover:text-rose-600 transition-colors">
                              {actor.name} {actor.surname}
                            </h3>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                    
                    {/* Show message if no actors */}
                    {(!movie.actors || movie.actors.length === 0) && (
                      <div className="col-span-full text-center py-8 text-gray-500">
                        No cast information available.
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="directors" className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {(movie.directors || []).map((director) => (
                      <Link 
                        to={`/directors/${director.id}`} 
                        key={director.id}
                        className="group"
                      >
                        <Card className="overflow-hidden h-full transition-all hover:shadow-md">
                          <CardContent className="p-3">
                            <div className="w-full pb-[100%] relative overflow-hidden rounded-full mb-2">
                              {director.pictureUrl ? (
                                <img 
                                  src={director.pictureUrl} 
                                  alt={`${director.name} ${director.surname}`}
                                  className="absolute inset-0 w-full h-full object-cover"
                                />
                              ) : (
                                <div className="absolute inset-0 bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
                                  <User className="h-12 w-12 text-gray-400" />
                                </div>
                              )}
                            </div>
                            <h3 className="font-medium text-center group-hover:text-rose-600 transition-colors">
                              {director.name} {director.surname}
                            </h3>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                    
                    {/* Show message if no directors */}
                    {(!movie.directors || movie.directors.length === 0) && (
                      <div className="col-span-full text-center py-8 text-gray-500">
                        No director information available.
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </section>
            
            {/* Comments Section */}
            <section className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Comments</h2>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Sort by:</span>
                  <select 
                    className="text-sm border rounded-md py-1 px-2"
                    value={commentSortBy}
                    onChange={(e) => handleSortComments(e.target.value)}
                  >
                    <option value="newest">Newest</option>
                    <option value="oldest">Oldest</option>
                    <option value="likes">Most Likes</option>
                  </select>
                </div>
              </div>
              
              {/* Add a comment form - only for authenticated users */}
              {isAuthenticated ? (
                <div className="space-y-4">
                  <Textarea
                    placeholder="Share your thoughts about this movie..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="min-h-[100px] resize-none"
                  />
                  <div className="flex justify-end">
                    <Button
                      onClick={handleCommentSubmit}
                      disabled={submittingComment || !commentText.trim()}
                      className="bg-rose-600 hover:bg-rose-700"
                    >
                      {submittingComment ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Posting...
                        </>
                      ) : (
                        <>
                          <MessageSquare className="mr-2 h-4 w-4" />
                          Post Comment
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg text-center">
                  <p className="text-gray-600 dark:text-gray-300 mb-2">Sign in to leave a comment</p>
                  <Button 
                    variant="outline" 
                    onClick={() => keycloak.login()}
                  >
                    Sign In
                  </Button>
                </div>
              )}
              
              {/* Comments List */}
              <div className="space-y-4 mt-6">
                {comments.length === 0 ? (
                  <div className="text-center py-6 text-gray-500">
                    <MessageSquare className="mx-auto h-12 w-12 opacity-20 mb-2" />
                    <p>No comments yet. Be the first to share your thoughts!</p>
                  </div>
                ) : (
                  comments.map((comment) => {
                    const likeStatus = commentLikeStatuses[comment.id] || { liked: false, disliked: false };
                    const isCommentAuthor = isAuthenticated && keycloak.tokenParsed?.preferred_username === comment.username;
                    
                    return (
                      <div key={comment.id} className="border rounded-lg p-4">
                        <div className="flex justify-between">
                          <div className="flex items-center gap-2">
                            <Avatar>
                              <AvatarFallback>{comment.username[0].toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div>
                              <h4 className="font-semibold">{comment.username}</h4>
                              <time className="text-xs text-gray-500">
                                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                              </time>
                            </div>
                          </div>
                          
                          {/* Comment Controls */}
                          <div>
                            {/* Admin Delete Button */}
                            {isAdmin && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-500 hover:text-red-700 hover:bg-red-100"
                                onClick={() => setDeleteCommentId(comment.id)}
                                title="Delete comment"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                            
                            {/* User's Own Comment Controls */}
                            {isCommentAuthor && (
                              <div className="flex">
                                {editCommentId !== comment.id && (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-blue-500 hover:text-blue-700 hover:bg-blue-100"
                                      onClick={() => {
                                        setEditCommentId(comment.id);
                                        setEditCommentText(comment.comment);
                                      }}
                                      title="Edit comment"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-red-500 hover:text-red-700 hover:bg-red-100"
                                      onClick={() => setDeleteCommentId(comment.id)}
                                      title="Delete comment"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Comment Content - Show edit form or comment text */}
                        {editCommentId === comment.id ? (
                          <div className="mt-2 space-y-2">
                            <Textarea
                              ref={editTextAreaRef}
                              value={editCommentText}
                              onChange={(e) => setEditCommentText(e.target.value)}
                              className="min-h-[80px] resize-none"
                            />
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEditCommentId(null)}
                              >
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                onClick={handleEditComment}
                                disabled={isEditingComment || !editCommentText.trim() || editCommentText === comment.comment}
                                className="bg-blue-600 hover:bg-blue-700"
                              >
                                {isEditingComment ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                  </>
                                ) : 'Save'}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <p className="my-3">{comment.comment}</p>
                        )}
                        
                        {/* Like/Dislike Buttons - only show if not in edit mode */}
                        {editCommentId !== comment.id && (
                          <div className="flex items-center gap-4 mt-2">
                            <button
                              onClick={() => handleCommentReaction(comment.id, true)}
                              disabled={isSubmittingLike === comment.id}
                              className="flex items-center gap-1 text-sm disabled:opacity-50"
                              aria-label="Like comment"
                            >
                              <ThumbsUp
                                size={16}
                                className={cn(
                                  "transition-colors",
                                  likeStatus.liked ? "text-green-500 fill-green-500" : "text-gray-500"
                                )}
                              />
                              <span>{comment.likesCount || 0}</span>
                            </button>
                            
                            <button
                              onClick={() => handleCommentReaction(comment.id, false)}
                              disabled={isSubmittingLike === comment.id}
                              className="flex items-center gap-1 text-sm disabled:opacity-50"
                              aria-label="Dislike comment"
                            >
                              <ThumbsDown
                                size={16}
                                className={cn(
                                  "transition-colors",
                                  likeStatus.disliked ? "text-red-500 fill-red-500" : "text-gray-500"
                                )}
                              />
                              <span>{comment.dislikesCount || 0}</span>
                            </button>
                            
                            {isSubmittingLike === comment.id && (
                              <Loader2 size={16} className="animate-spin text-gray-500" />
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          </div>
          
          {/* Sidebar - 1/3 width on large screens */}
          <div className="space-y-6">
            {/* Rating Section */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center">
                  <Star className="h-5 w-5 text-yellow-500 mr-2" />
                  Rating
                </h3>
                
                <div className="flex items-center gap-2 mb-4">
                  <div className="text-4xl font-bold">{movie.averageRating.toFixed(1)}</div>
                  <div className="text-gray-500">
                    <div className="text-sm">out of 10</div>
                    <div className="text-xs">{movie.totalRatings} ratings</div>
                  </div>
                </div>
                
                {isAuthenticated ? (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Rate this movie:</h4>
                    <div className="flex flex-wrap gap-1">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
                        <button
                          key={rating}
                          onClick={() => handleRateMovie(rating)}
                          disabled={isRating}
                          className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                            userRating === rating
                              ? "bg-rose-600 text-white"
                              : "bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
                          )}
                        >
                          {rating}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    onClick={() => keycloak.login()}
                  >
                    Sign in to rate
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Add to Watchlist Card */}
            {isAuthenticated && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-4 flex items-center">
                    <Heart className="h-5 w-5 text-rose-500 mr-2" />
                    Watchlist
                  </h3>
                  
                  <Button
                    className={cn(
                      "w-full",
                      watchlistStatus?.inWatchlist
                        ? "bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                        : "bg-rose-600 hover:bg-rose-700"
                    )}
                    onClick={handleWatchlistToggle}
                    disabled={isAddingToWatchlist}
                  >
                    {isAddingToWatchlist ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : watchlistStatus?.inWatchlist ? (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        In Your Watchlist
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Add to Watchlist
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Delete Movie Dialog */}
            <AlertDialog open={deleteMovieId !== null} onOpenChange={() => setDeleteMovieId(null)}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Movie</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this movie? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-red-600 hover:bg-red-700"
                    onClick={handleDeleteMovie}
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* Delete Comment Dialog */}
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
                    onClick={() => {
                      // Check if the user is admin or the comment author and use appropriate handler
                      const comment = comments.find(c => c.id === deleteCommentId);
                      const isCommentAuthor = isAuthenticated && keycloak.tokenParsed?.preferred_username === comment?.username;
                      
                      if (deleteCommentId && isAdmin && !isCommentAuthor) {
                        handleDeleteComment(deleteCommentId);
                      } else if (deleteCommentId) {
                        handleDeleteUserComment(deleteCommentId);
                      }
                    }}
                    disabled={isDeletingComment || isDeletingUserComment}
                  >
                    {(isDeletingComment || isDeletingUserComment) ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Deleting...
                      </>
                    ) : 'Delete'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    </div>
  );
}
