import { useState, useEffect, useRef, useCallback } from 'react'
import { useKeycloak } from '@react-keycloak/web';
import userApi from '@/api/userApi';
import watchlistApi from '@/api/watchlistApi';
import moviesApi from '@/api/movieApi';
import { User, WatchlistItem, UserRating, Comment } from '@/api/apiService';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

// Import our modular components
import ProfileSidebar from '@/components/profile/ProfileSidebar';
import WatchlistTab from '@/components/profile/WatchlistTab';
import CommentsTab from '@/components/profile/CommentsTab';
import RatingsTab from '@/components/profile/RatingsTab';
import SettingsTab from '@/components/profile/SettingsTab';

export default function ProfilePage() {
  // User and authentication state
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { keycloak, initialized } = useKeycloak();
  const isAuthenticated = initialized && keycloak.authenticated;
  
  // Watchlist state
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [displayedWatchlistItems, setDisplayedWatchlistItems] = useState<WatchlistItem[]>([]);
  const [loadingMoreWatchlist, setLoadingMoreWatchlist] = useState(false);
  const [hasMoreWatchlist, setHasMoreWatchlist] = useState(true);
  const [removingItemId, setRemovingItemId] = useState<number | null>(null);
  const watchlistEndRef = useRef<HTMLDivElement>(null);
  
  // Ratings state
  const [userRatings, setUserRatings] = useState<UserRating[]>([]);
  const [displayedRatingItems, setDisplayedRatingItems] = useState<UserRating[]>([]);
  const [loadingMoreRatings, setLoadingMoreRatings] = useState(false);
  const [hasMoreRatings, setHasMoreRatings] = useState(true);
  const ratingsEndRef = useRef<HTMLDivElement>(null);
  
  // Comments state
  const [userComments, setUserComments] = useState<Comment[]>([]);
  const [displayedComments, setDisplayedComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [movieTitles, setMovieTitles] = useState<Record<number, string>>({});
  const commentUsers = useState<Record<string, User>>({});
  const [deleteCommentId, setDeleteCommentId] = useState<number | null>(null);
  const [isDeletingComment, setIsDeletingComment] = useState(false);
  const [commentsPage, setCommentsPage] = useState(1);
  const [hasMoreComments, setHasMoreComments] = useState(true);
  const [loadingMoreComments, setLoadingMoreComments] = useState(false);
  const commentsEndRef = useRef<HTMLDivElement>(null);
  
  // Profile settings state
  const [newProfilePicture, setNewProfilePicture] = useState<string | null>(null);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  
  // Constants for pagination
  const ITEMS_PER_BATCH = 10;
  const COMMENTS_PER_PAGE = 10;

  // Fetch initial user data
  useEffect(() => {
    let isMounted = true;
    
    const fetchUserData = async () => {
      if (!initialized) return;
      
      if (!keycloak.authenticated) {
        if (isMounted) setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        
        try {
          await keycloak.updateToken(30);
        } catch (tokenError) {
          console.error("Failed to refresh token:", tokenError);
          if (isMounted) setLoading(false);
          return;
        }
        
        // Fetch user profile data
        const userProfile = await userApi.getCurrentUser();
        if (!isMounted) return;
        setUser(userProfile);
        
        // Fetch all watchlist items
        try {
          const watchlistData = await watchlistApi.getWatchlist();
          if (!isMounted) return;
          
          // Store all items in state
          setWatchlist(watchlistData);
          
          // Initialize with first batch of items
          const initialItems = watchlistData.slice(0, ITEMS_PER_BATCH);
          setDisplayedWatchlistItems(initialItems);
          
          // Set has more flag based on if there are more items than initially displayed
          setHasMoreWatchlist(watchlistData.length > ITEMS_PER_BATCH);
        } catch (error) {
          console.error("Error fetching watchlist:", error);
        }
        
        // Fetch all ratings items
        try {
          const ratingsData = await moviesApi.getUserRatings();
          if (!isMounted) return;
          
          // Store all items in state
          setUserRatings(ratingsData);
          
          // Initialize with first batch of items
          const initialItems = ratingsData.slice(0, ITEMS_PER_BATCH);
          setDisplayedRatingItems(initialItems);
          
          // Set has more flag based on if there are more items than initially displayed
          setHasMoreRatings(ratingsData.length > ITEMS_PER_BATCH);
        } catch (error) {
          console.error("Error fetching ratings:", error);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    fetchUserData();
    
    return () => { isMounted = false; };
  }, [initialized, keycloak]);

  // Set up intersection observer for watchlist
  useEffect(() => {
    if (!watchlistEndRef.current || !hasMoreWatchlist || loadingMoreWatchlist || !isAuthenticated) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreWatchlist && !loadingMoreWatchlist) {
          loadMoreWatchlist();
        }
      },
      { threshold: 0.5 }
    );
    
    observer.observe(watchlistEndRef.current);
    return () => observer.disconnect();
  }, [hasMoreWatchlist, loadingMoreWatchlist, displayedWatchlistItems, isAuthenticated]);
  
  // Set up intersection observer for ratings
  useEffect(() => {
    if (!ratingsEndRef.current || !hasMoreRatings || loadingMoreRatings || !isAuthenticated) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreRatings && !loadingMoreRatings) {
          loadMoreRatings();
        }
      },
      { threshold: 0.5 }
    );
    
    observer.observe(ratingsEndRef.current);
    return () => observer.disconnect();
  }, [hasMoreRatings, loadingMoreRatings, displayedRatingItems, isAuthenticated]);

  // Load more watchlist items from already fetched data
  const loadMoreWatchlist = useCallback(() => {
    setLoadingMoreWatchlist(true);
    
    // Short timeout to allow loading indicator to show
    setTimeout(() => {
      const currentCount = displayedWatchlistItems.length;
      const nextItems = watchlist.slice(currentCount, currentCount + ITEMS_PER_BATCH);
      
      if (nextItems.length > 0) {
        setDisplayedWatchlistItems(prev => [...prev, ...nextItems]);
      }
      
      // Check if we've displayed all available items
      setHasMoreWatchlist(currentCount + nextItems.length < watchlist.length);
      setLoadingMoreWatchlist(false);
    }, 300);
  }, [displayedWatchlistItems, watchlist]);
  
  // Load more rating items from already fetched data
  const loadMoreRatings = useCallback(() => {
    setLoadingMoreRatings(true);
    
    // Short timeout to allow loading indicator to show
    setTimeout(() => {
      const currentCount = displayedRatingItems.length;
      const nextItems = userRatings.slice(currentCount, currentCount + ITEMS_PER_BATCH);
      
      if (nextItems.length > 0) {
        setDisplayedRatingItems(prev => [...prev, ...nextItems]);
      }
      
      // Check if we've displayed all available items
      setHasMoreRatings(currentCount + nextItems.length < userRatings.length);
      setLoadingMoreRatings(false);
    }, 300);
  }, [displayedRatingItems, userRatings]);

  // Handle removing item from watchlist
  const handleRemoveFromWatchlist = async (movieId: number) => {
    try {
      setRemovingItemId(movieId);
      await watchlistApi.removeFromWatchlist(movieId);
      setWatchlist(prev => prev.filter(item => item.movie?.id !== movieId));
      setDisplayedWatchlistItems(prev => prev.filter(item => item.movie?.id !== movieId));
      setRemovingItemId(null);
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      setRemovingItemId(null);
    }
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
      } catch (error) {
        console.error('Error updating profile picture:', error);
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
      
      // Send null to remove profile picture
      await userApi.updateProfilePicture(null);
      
      // Update local state - use empty string for the frontend display
      setUser(prev => {
        if (!prev) return null;
        return { ...prev, profilePictureUrl: "" };
      });
      
      // Also clear any pending new profile picture
      setNewProfilePicture(null);
    } catch (error) {
      console.error('Error removing profile picture:', error);
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // Fetch user's comments
  useEffect(() => {
    const fetchComments = async () => {
      if (!isAuthenticated || !user?.username) return;
      
      try {
        setCommentsLoading(true);
        const comments = await userApi.getUserComments(user.username);
        setUserComments(comments);
        
        // Initialize displayed comments
        const initialComments = comments.slice(0, COMMENTS_PER_PAGE);
        setDisplayedComments(initialComments);
        setHasMoreComments(comments.length > COMMENTS_PER_PAGE);
        
        // Fetch movie titles for the comments
        await fetchMovieTitles(comments);
      } catch (error) {
        console.error('Error fetching comments:', error);
      } finally {
        setCommentsLoading(false);
      }
    };
    
    fetchComments();
  }, [isAuthenticated, user]);
  
  // Fetch movie titles for comments
  const fetchMovieTitles = async (comments: Comment[]) => {
    const uniqueMovieIds = Array.from(new Set(comments.map(c => c.movieId)));
    const titles: Record<number, string> = {};
    
    for (const movieId of uniqueMovieIds) {
      try {
        const movie = await moviesApi.getById(movieId);
        titles[movieId] = movie.title;
      } catch (error) {
        console.error(`Failed to fetch movie ${movieId}:`, error);
        titles[movieId] = `Movie #${movieId}`;
      }
    }
    
    setMovieTitles(titles);
  };
  
  // Set up intersection observer for comments
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
  
  // Load more comments function
  const loadMoreComments = useCallback(() => {
    if (loadingMoreComments || !hasMoreComments) return;
    
    setLoadingMoreComments(true);
    
    // Short timeout to allow loading indicator to show
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
  
  // Delete comment handler
  const handleDeleteComment = (commentId: number) => {
    setDeleteCommentId(commentId);
  };
  
  // Execute comment deletion
  const executeCommentDeletion = async () => {
    if (!deleteCommentId) return;
    
    try {
      setIsDeletingComment(true);
      await moviesApi.deleteComment(deleteCommentId);
      
      // Update local state by removing the deleted comment
      const updatedComments = userComments.filter(c => c.id !== deleteCommentId);
      setUserComments(updatedComments);
      
      // Update displayed comments
      const updatedDisplayed = displayedComments.filter(c => c.id !== deleteCommentId);
      setDisplayedComments(updatedDisplayed);
      
      // If we've removed a comment, we might need to load one more
      if (updatedDisplayed.length < displayedComments.length && userComments.length > displayedComments.length) {
        const nextIndex = displayedComments.length;
        if (userComments[nextIndex]) {
          setDisplayedComments([...updatedDisplayed, userComments[nextIndex]]);
        }
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
    } finally {
      setDeleteCommentId(null);
      setIsDeletingComment(false);
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
        {/* Left Sidebar - Using our ProfileSidebar component */}
        <div className="col-span-1">
          <ProfileSidebar 
            user={user} 
            watchlistCount={watchlist.length} 
            onSignOut={() => keycloak.logout()} 
          />
        </div>
        
        {/* Main Content */}
        <div className="col-span-1 md:col-span-3">
          <Tabs defaultValue="watchlist" className="w-full">
            <TabsList className="w-full grid grid-cols-4 mb-4">
              <TabsTrigger value="watchlist" className="text-xs sm:text-sm">Watchlist</TabsTrigger>
              <TabsTrigger value="comments" className="text-xs sm:text-sm">My Comments</TabsTrigger>
              <TabsTrigger value="ratings" className="text-xs sm:text-sm">My Ratings</TabsTrigger>
              <TabsTrigger value="settings" className="text-xs sm:text-sm">Account Settings</TabsTrigger>
            </TabsList>
            
            {/* Watchlist Tab - Using WatchlistTab component */}
            <TabsContent value="watchlist" className="pt-6">
              <h2 className="text-xl sm:text-2xl font-bold mb-4">My Watchlist</h2>
              <WatchlistTab
                watchlist={watchlist}
                displayedItems={displayedWatchlistItems}
                loadingMore={loadingMoreWatchlist}
                hasMore={hasMoreWatchlist}
                removingItemId={removingItemId}
                onRemoveItem={handleRemoveFromWatchlist}
                watchlistEndRef={watchlistEndRef}
              />
            </TabsContent>
            
            {/* Comments Tab - Using CommentsTab component */}
            <TabsContent value="comments" className="pt-6">
              <h2 className="text-xl sm:text-2xl font-bold mb-4">My Comments</h2>
              <CommentsTab
                userComments={userComments}
                displayedComments={displayedComments}
                commentUsers={commentUsers[0]}
                movieTitles={movieTitles}
                commentsLoading={commentsLoading}
                loadingMoreComments={loadingMoreComments}
                hasMoreComments={hasMoreComments}
                commentsEndRef={commentsEndRef}
                onDeleteComment={handleDeleteComment}
              />
            </TabsContent>
            
            {/* Ratings Tab - Using RatingsTab component */}
            <TabsContent value="ratings" className="pt-6">
              <h2 className="text-xl sm:text-2xl font-bold mb-4">My Ratings</h2>
              <RatingsTab
                userRatings={userRatings}
                displayedItems={displayedRatingItems}
                loadingMore={loadingMoreRatings}
                hasMore={hasMoreRatings}
                ratingsEndRef={ratingsEndRef}
              />
            </TabsContent>
            
            {/* Settings Tab - Using SettingsTab component */}
            <TabsContent value="settings" className="pt-6">
              <h2 className="text-xl sm:text-2xl font-bold mb-4">Account Settings</h2>
              <SettingsTab
                user={user}
                newProfilePicture={newProfilePicture}
                isUpdatingProfile={isUpdatingProfile}
                onProfilePictureSelected={handleProfilePictureSelected}
                onUpdateProfile={handleUpdateProfile}
                onRemoveProfilePicture={handleRemoveProfilePicture}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
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
      
      {/* Remove from watchlist confirmation dialog */}
      <AlertDialog open={removingItemId !== null} onOpenChange={(open) => {
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
  );
}
