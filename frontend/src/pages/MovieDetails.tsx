import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useKeycloak } from '@react-keycloak/web';
import { useToast } from '@/hooks/use-toast';
import { Movie, Comment, WatchlistStatus, LikeStatus, User } from '@/api/apiService';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
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

// Import API services
import moviesApi from '@/api/movieApi';
import userApi from '@/api/userApi';
import actorsApi from '@/api/actorsApi';
import directorsApi from '@/api/directorsApi';
import watchlistApi from '@/api/watchlistApi';
import adminApi from '@/api/adminApi';

// Import modular components
import MovieHero from '@/components/movie/MovieHero';
import MovieSynopsis from '@/components/movie/MovieSynopsis';
import MovieCastCrew from '@/components/movie/MovieCastCrew';
import CommentsSection from '@/components/movie/CommentsSection';
import MovieSidebar from '@/components/movie/MovieSidebar';

// Helper function to sort comments
const sortComments = (
  comments: Comment[], 
  currentUsername: string | undefined, 
  sortBy: string
): Comment[] => {
  const sorted = [...comments];
  
  if (sortBy === 'newest') {
    return sorted.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } else if (sortBy === 'oldest') {
    return sorted.sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  } else if (sortBy === 'likes') {
    // Always show the user's own comments first for likes sort
    return sorted.sort((a, b) => {
      // First prioritize user's own comments
      if (currentUsername) {
        if (a.username === currentUsername && b.username !== currentUsername) return -1;
        if (a.username !== currentUsername && b.username === currentUsername) return 1;
      }
      // Only then sort by likes
      return (b.likesCount || 0) - (a.likesCount || 0);
    });
  }
  return sorted;
};

export default function MovieDetails() {
  const { id } = useParams<{ id: string }>();
  const movieId = parseInt(id || '0');
  const navigate = useNavigate();
  const { toast } = useToast();
  const { keycloak, initialized } = useKeycloak();
  const isAuthenticated = initialized && keycloak.authenticated;
  const isAdmin = initialized && keycloak.authenticated && keycloak.hasRealmRole('ADMIN');
  
  // Main state
  const [loading, setLoading] = useState(true);
  const [movie, setMovie] = useState<Movie | null>(null);
  const [actorImages, setActorImages] = useState<Record<number, string>>({});
  const [directorImages, setDirectorImages] = useState<Record<number, string>>({});
  
  // Comments state
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentPage, setCommentPage] = useState(1);
  const [hasMoreComments, setHasMoreComments] = useState(true);
  const [loadingMoreComments, setLoadingMoreComments] = useState(false);
  const [commentSortBy, setCommentSortBy] = useState<string>('newest');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentLikeStatuses, setCommentLikeStatuses] = useState<Record<number, LikeStatus>>({});
  const [isSubmittingLike, setIsSubmittingLike] = useState<number | null>(null);
  const [commentUsers, setCommentUsers] = useState<Record<string, User>>({});
  const [loadingUserProfiles, setLoadingUserProfiles] = useState(false);
  
  // User interaction state
  const [watchlistStatus, setWatchlistStatus] = useState<WatchlistStatus | null>(null);
  const [isAddingToWatchlist, setIsAddingToWatchlist] = useState(false);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [isRating, setIsRating] = useState(false);
  
  // Dialog state
  const [deleteMovieId, setDeleteMovieId] = useState<number | null>(null);
  const [deleteCommentId, setDeleteCommentId] = useState<number | null>(null);
  const [isDeletingComment, setIsDeletingComment] = useState(false);
  
  const COMMENTS_PER_PAGE = 10;

  // Fetch actor and director images
  useEffect(() => {
    let isMounted = true;

    const fetchActorDirectorImages = async () => {
      if (!movie) return;
      
      // Fetch actor images
      if (movie.actors && movie.actors.length > 0) {
        const actorImagesMap: Record<number, string> = {};
        await Promise.all(
          movie.actors.map(async (actor) => {
            if (!isMounted) return;
            try {
              if (!actor.pictureUrl) {
                const pictureData = await actorsApi.getPicture(actor.id);
                if (pictureData?.pictureUrl) {
                  actorImagesMap[actor.id] = pictureData.pictureUrl;
                }
              } else {
                actorImagesMap[actor.id] = actor.pictureUrl;
              }
            } catch (error) {
              console.error(`Failed to fetch image for actor ${actor.id}:`, error);
            }
          })
        );
        if (isMounted) {
          setActorImages(actorImagesMap);
        }
      }

      // Fetch director images
      if (movie.directors && movie.directors.length > 0) {
        const directorImagesMap: Record<number, string> = {};
        await Promise.all(
          movie.directors.map(async (director) => {
            if (!isMounted) return;
            try {
              if (!director.pictureUrl) {
                const pictureData = await directorsApi.getPicture(director.id);
                if (pictureData?.pictureUrl) {
                  directorImagesMap[director.id] = pictureData.pictureUrl;
                }
              } else {
                directorImagesMap[director.id] = director.pictureUrl;
              }
            } catch (error) {
              console.error(`Failed to fetch image for director ${director.id}:`, error);
            }
          })
        );
        if (isMounted) {
          setDirectorImages(directorImagesMap);
        }
      }
    };

    fetchActorDirectorImages();

    return () => {
      isMounted = false;
    };
  }, [movie]);

  // Fetch movie data and first page of comments
  useEffect(() => {
    let isMounted = true;

    const fetchMovieData = async () => {
      if (!movieId) return;
      try {
        setLoading(true);
        setComments([]);
        setCommentPage(1);
        setHasMoreComments(true);

        // Get movie data and first page of comments
        const [movieData, commentsData] = await Promise.all([
          moviesApi.getById(movieId),
          moviesApi.getComments(movieId, commentSortBy, 1, COMMENTS_PER_PAGE)
        ]);

        if (!isMounted) return;

        setMovie({
          ...movieData,
          actors: movieData.actors || [],
          directors: movieData.directors || [],
          genres: movieData.genres || [],
        });

        // Apply custom sorting after fetching comments
        const username = keycloak.tokenParsed?.preferred_username;
        const sortedComments = sortComments(commentsData, username, commentSortBy);
        setComments(sortedComments);
        
        setHasMoreComments(commentsData.length === COMMENTS_PER_PAGE);

        // If user is authenticated, fetch user-specific data
        if (isAuthenticated) {
          try {
            const [status, userRating] = await Promise.all([
              watchlistApi.checkWatchlistStatus(movieId),
              moviesApi.getUserRating(movieId)
            ]);
            if (!isMounted) return;

            setWatchlistStatus(status);
            setUserRating(userRating);
            
            // Fetch like statuses for comments
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

            if (isMounted) {
              setCommentLikeStatuses(statuses);
            }
          } catch (error) {
            console.error('Error fetching user specific data:', error);
          }
        }
      } catch (error) {
        console.error('Error fetching movie data:', error);
        if (isMounted) {
          toast({
            title: 'Error',
            description: 'Failed to load movie details',
            variant: 'destructive',
          });
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchMovieData();

    return () => {
      isMounted = false;
    };
  }, [movieId, isAuthenticated, commentSortBy, keycloak.tokenParsed, toast]);

  // Load more comments function
  const loadMoreComments = useCallback(async () => {
    if (!movieId || !hasMoreComments || loadingMoreComments) return;
    
    try {
      setLoadingMoreComments(true);
      const nextPage = commentPage + 1;
      const newComments = await moviesApi.getComments(
        movieId,
        commentSortBy,
        nextPage,
        COMMENTS_PER_PAGE
      );

      if (newComments.length === 0) {
        setHasMoreComments(false);
        return;
      }

      // Apply custom sorting after fetching more comments
      const allComments = [...comments, ...newComments];
      const username = keycloak.tokenParsed?.preferred_username;
      const sortedComments = sortComments(allComments, username, commentSortBy);
      setComments(sortedComments);
      
      setCommentPage(nextPage);
      setHasMoreComments(newComments.length === COMMENTS_PER_PAGE);

      // If user is authenticated, fetch like statuses for new comments
      if (isAuthenticated) {
        const statuses = { ...commentLikeStatuses };
        await Promise.all(
          newComments.map(async (comment) => {
            try {
              const likeStatus = await moviesApi.getCommentLikeStatus(comment.id);
              statuses[comment.id] = likeStatus;
            } catch (error) {
              console.error(`Error fetching like status for comment ${comment.id}:`, error);
            }
          })
        );
        setCommentLikeStatuses(statuses);
      }
    } catch (error) {
      console.error('Error loading more comments:', error);
      toast({
        title: 'Error',
        description: 'Failed to load more comments',
        variant: 'destructive',
      });
      setHasMoreComments(false);
    } finally {
      setLoadingMoreComments(false);
    }
  }, [movieId, commentPage, hasMoreComments, commentSortBy, isAuthenticated, loadingMoreComments, 
      commentLikeStatuses, comments, keycloak.tokenParsed, toast]);

  // Comment sort handler
  const handleSortComments = async (sortBy: string) => {
    setCommentSortBy(sortBy);
    setComments([]);
    setCommentPage(1);
    setHasMoreComments(true);
    
    try {
      setLoadingMoreComments(true);
      const commentsData = await moviesApi.getComments(movieId, sortBy, 1, COMMENTS_PER_PAGE);
      
      // Apply custom sorting
      const username = keycloak.tokenParsed?.preferred_username;
      const sortedComments = sortComments(commentsData, username, sortBy);
      setComments(sortedComments);
      
      setHasMoreComments(commentsData.length === COMMENTS_PER_PAGE);
      
      // Update like statuses if authenticated
      if (isAuthenticated) {
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
      }
    } catch (error) {
      console.error('Error loading comments with new sort:', error);
      toast({
        title: 'Error',
        description: 'Failed to load comments',
        variant: 'destructive',
      });
    } finally {
      setLoadingMoreComments(false);
    }
  };
  
  // Delete movie handler
  const handleDeleteMovie = async () => {
    if (!isAdmin || !movieId) return;
    try {
      // Ensure token is fresh before making admin requests
      if (keycloak.authenticated) {
        try {
          await keycloak.updateToken(30);
        } catch (refreshError) {
          console.error("Token refresh failed:", refreshError);
          keycloak.login();
          return;
        }
      }
      
      await adminApi.deleteMovie(movieId);
      toast({
        title: "Success",
        description: "Movie deleted successfully",
      });
      // Navigate back to movies page
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
  
  // Comment handlers
  const handleAddComment = async (text: string) => {
    if (!isAuthenticated) {
      keycloak.login();
      return;
    }

    try {
      setSubmittingComment(true);
      await moviesApi.addComment(movieId, text);
      
      // Reset and reload comments
      setCommentPage(1);
      const newComments = await moviesApi.getComments(movieId, commentSortBy, 1, COMMENTS_PER_PAGE);
      
      // Apply custom sorting
      const username = keycloak.tokenParsed?.preferred_username;
      const sortedComments = sortComments(newComments, username, commentSortBy);
      setComments(sortedComments);
      
      setHasMoreComments(newComments.length === COMMENTS_PER_PAGE);
      
      // Update like statuses
      if (isAuthenticated) {
        const statuses: Record<number, LikeStatus> = {};
        await Promise.all(
          newComments.map(async (comment) => {
            try {
              const likeStatus = await moviesApi.getCommentLikeStatus(comment.id);
              statuses[comment.id] = likeStatus;
            } catch (error) {
              console.error(`Error fetching like status for comment ${comment.id}:`, error);
            }
          })
        );
        setCommentLikeStatuses(statuses);
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
    } finally {
      setSubmittingComment(false);
    }
  };
  
  // Comment reaction handler - make sure it returns a Promise
  const handleCommentReaction = async (commentId: number, isLike: boolean): Promise<void> => {
    if (!isAuthenticated) {
      keycloak.login();
      return;
    }
    
    try {
      setIsSubmittingLike(commentId);
      const currentStatus = commentLikeStatuses[commentId] || { liked: false, disliked: false };
      
      // If trying to set the same state, remove the reaction
      if ((isLike && currentStatus.liked) || (!isLike && currentStatus.disliked)) {
        await moviesApi.removeCommentReaction(commentId);
        setCommentLikeStatuses({
          ...commentLikeStatuses,
          [commentId]: { liked: false, disliked: false }
        });
      } else {
        // Otherwise, set the new reaction
        await moviesApi.likeComment(commentId, isLike);
        setCommentLikeStatuses({
          ...commentLikeStatuses,
          [commentId]: { liked: isLike, disliked: !isLike }
        });
      }
      
      // Refresh comments to get updated like counts and re-sort
      const updatedComments = await moviesApi.getComments(movieId, commentSortBy);
      const username = keycloak.tokenParsed?.preferred_username;
      const sortedComments = sortComments(updatedComments, username, commentSortBy);
      setComments(sortedComments);
    } catch (error) {
      console.error('Error updating comment reaction:', error);
    } finally {
      setIsSubmittingLike(null);
    }
  };
  
  // Rating handler
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
    } finally {
      setIsRating(false);
    }
  };
  
  // Watchlist toggle handler
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
    } finally {
      setIsAddingToWatchlist(false);
    }
  };
  
  // Edit comment handler - make sure it returns Promise<void> to match expected type
  const handleEditComment = async (commentId: number, text: string): Promise<void> => {
    if (!isAuthenticated) return;
    
    try {
      await moviesApi.updateComment(commentId, text);
      // Refresh comments
      const updatedComments = await moviesApi.getComments(movieId, commentSortBy);
      const username = keycloak.tokenParsed?.preferred_username;
      const sortedComments = sortComments(updatedComments, username, commentSortBy);
      setComments(sortedComments);
    } catch (error) {
      console.error('Error updating comment:', error);
    }
  };
  
  // Delete comment handler
  const handleDeleteComment = async (commentId: number) => {
    setDeleteCommentId(commentId);
  };
  
  // Execute comment deletion
  const executeCommentDeletion = async () => {
    if (!deleteCommentId) return;
    
    try {
      setIsDeletingComment(true);
      
      if (isAdmin) {
        // Ensure token is fresh before admin action
        if (keycloak.authenticated) {
          try {
            await keycloak.updateToken(30);
          } catch (refreshError) {
            console.error("Token refresh failed:", refreshError);
            keycloak.login();
            return;
          }
        }
        await adminApi.deleteComment(deleteCommentId);
        toast({
          title: "Success",
          description: "Comment deleted successfully",
        });
      } else {
        await moviesApi.deleteComment(deleteCommentId);
      }
      
      // Refresh comments
      const updatedComments = await moviesApi.getComments(movieId, commentSortBy, 1, COMMENTS_PER_PAGE);
      const username = keycloak.tokenParsed?.preferred_username;
      const sortedComments = sortComments(updatedComments, username, commentSortBy);
      setComments(sortedComments);
      setHasMoreComments(updatedComments.length === COMMENTS_PER_PAGE);
    } catch (error) {
      console.error('Error deleting comment:', error);
      if (isAdmin) {
        toast({
          title: "Error",
          description: "Failed to delete comment",
          variant: "destructive",
        });
      }
    } finally {
      setDeleteCommentId(null);
      setIsDeletingComment(false);
    }
  };
  
  // Fetch user profiles for comments
  useEffect(() => {
    if (!comments.length || loadingUserProfiles) return;

    const fetchUserProfiles = async () => {
      try {
        setLoadingUserProfiles(true);
        // Get unique usernames that we don't already have profiles for
        const usernamesToFetch = comments
          .map(comment => comment.username)
          .filter((username, index, self) => 
            self.indexOf(username) === index && !commentUsers[username]
          );

        if (!usernamesToFetch.length) return;

        // Fetch profiles for these users using public client
        const profiles = await userApi.getUserProfiles(usernamesToFetch);
        
        if (Object.keys(profiles).length > 0) {
          setCommentUsers(prev => ({...prev, ...profiles}));
        }
      } catch (error) {
        console.error('Error fetching user profiles:', error);
      } finally {
        setLoadingUserProfiles(false);
      }
    };

    fetchUserProfiles();
  }, [comments, commentUsers, loadingUserProfiles]);
  
  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-[70vh]">
        <Loader2 className="h-8 w-8 animate-spin text-rose-600" />
        <span className="ml-2">Loading movie details...</span>
      </div>
    );
  }

  // Movie not found state
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
      {/* Hero Section */}
      <MovieHero 
        movie={movie} 
        isAdmin={isAdmin || false} // Ensure boolean by providing default
        onDeleteClick={() => setDeleteMovieId(movieId)} 
      />

      {/* Content Section */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - 2/3 width on large screens */}
          <div className="lg:col-span-2 space-y-6">
            {/* Synopsis */}
            <MovieSynopsis description={movie.description} />

            {/* Cast and Crew */}
            <MovieCastCrew 
              actors={movie.actors || []} 
              directors={movie.directors || []} 
              actorImages={actorImages}
              directorImages={directorImages}
            />

            {/* Comments Section - fix boolean props */}
            <CommentsSection 
              comments={comments}
              commentUsers={commentUsers}
              commentLikeStatuses={commentLikeStatuses}
              isSubmittingLike={isSubmittingLike}
              hasMoreComments={hasMoreComments}
              loadingMoreComments={loadingMoreComments}
              commentSortBy={commentSortBy}
              submittingComment={submittingComment}
              isAdmin={!!isAdmin} // Ensure boolean with double negation
              onSortChange={handleSortComments}
              onLoadMoreComments={loadMoreComments}
              onLike={handleCommentReaction}
              onAddComment={handleAddComment}
              onEditComment={handleEditComment}
              onDeleteComment={handleDeleteComment}
            />
          </div>

          {/* Sidebar - 1/3 width on large screens */}
          <div className="space-y-6">
            <MovieSidebar 
              averageRating={movie.averageRating}
              totalRatings={movie.totalRatings}
              userRating={userRating}
              watchlistStatus={watchlistStatus}
              isRating={isRating}
              isAddingToWatchlist={isAddingToWatchlist}
              onRate={handleRateMovie}
              onWatchlistToggle={handleWatchlistToggle}
            />
          </div>
        </div>
      </div>
      
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
              Delete Movie
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
    </div>
  );
}
