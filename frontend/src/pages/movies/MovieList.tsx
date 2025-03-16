import { Movie } from '@/api/apiService';
import { Star, Edit, Trash2, Plus, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useKeycloak } from '@react-keycloak/web';
import { useState, useEffect, useCallback } from 'react';
import watchlistApi from '@/api/watchlistApi';
import { useToast } from '@/hooks/use-toast';

interface MovieListProps {
  movies: Movie[];
  isAdmin: boolean;
  navigate: (path: string) => void;
  setDeleteMovieId: (id: number) => void;
  size?: 'default' | 'large';
}

export function MovieList({ movies, isAdmin, navigate, setDeleteMovieId, size = 'default' }: MovieListProps) {
  const { keycloak, initialized } = useKeycloak();
  const isAuthenticated = initialized && keycloak.authenticated;
  const { toast } = useToast();
  
  const [addingToWatchlist, setAddingToWatchlist] = useState<Record<number, boolean>>({});
  const [watchlistStatus, setWatchlistStatus] = useState<Record<number, boolean>>({});
  
  const fetchWatchlistStatuses = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      const movieIds = movies.map(movie => movie.id);
      
      if (movieIds.length === 0) return;
      
      const statuses = await watchlistApi.batchCheckWatchlistStatus(movieIds);
      
      if (Object.keys(statuses).length > 0) {
        setWatchlistStatus(statuses);
      }
    } catch (error) {
      // Silent error handling
    }
  }, [movies, isAuthenticated]);
  
  useEffect(() => {
    fetchWatchlistStatuses();
  }, [fetchWatchlistStatuses]);
  
  const handleAddToWatchlist = async (movieId: number, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (!isAuthenticated) {
      keycloak.login();
      return;
    }
    
    try {
      setAddingToWatchlist(prev => ({ ...prev, [movieId]: true }));
      
      const currentStatus = watchlistStatus[movieId];
      
      if (currentStatus) {
        await watchlistApi.removeFromWatchlist(movieId);
        toast({ title: "Removed from watchlist" });
        setWatchlistStatus(prev => ({ ...prev, [movieId]: false }));
      } else {
        await watchlistApi.addToWatchlist(movieId);
        toast({ title: "Added to watchlist" });
        setWatchlistStatus(prev => ({ ...prev, [movieId]: true }));
      }
      
      await fetchWatchlistStatuses();
    } catch (error) {
      console.error('Error updating watchlist:', error);
      toast({
        title: 'Error',
        description: 'Failed to update watchlist',
        variant: 'destructive',
      });
      
      await fetchWatchlistStatuses();
    } finally {
      setAddingToWatchlist(prev => ({ ...prev, [movieId]: false }));
    }
  };
  
  const imageHeight = size === 'large' ? 'h-48' : 'h-36'; 
  const titleSize = size === 'large' ? 'text-2xl' : 'text-xl';
  const descriptionClass = size === 'large' ? 'text-base' : 'text-sm';
  const paddingClass = size === 'large' ? 'p-6' : 'p-4';
  
  return (
    <div className="space-y-4">
      {movies.map((movie) => (
        <Card key={movie.id} className="overflow-hidden hover:shadow-lg transition-shadow">
          <div className="flex flex-col md:flex-row">
            <div className={`w-full md:w-36 ${imageHeight} shrink-0 relative`}>
              <img 
                src={movie.posterURL || '/placeholder-poster.jpg'} 
                alt={movie.title} 
                className="w-full h-full object-cover"
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/placeholder-poster.jpg';
                  (e.target as HTMLImageElement).onerror = null;
                }}
                style={{ height: '100%' }}
              />
              
              {/* Watchlist badge indicator */}
              {watchlistStatus[movie.id] && (
                <div className="absolute top-2 left-2 bg-rose-600 bg-opacity-90 rounded-full p-1.5">
                  <Check className="h-3 w-3 text-white" />
                </div>
              )}
            </div>
            
            <div className={`flex flex-col flex-grow ${paddingClass}`}>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className={`${titleSize} font-bold`}>{movie.title}</h3>
                  <p className="text-sm text-gray-500">{movie.year}</p>
                </div>
                <div className="flex items-center bg-black bg-opacity-70 rounded-full px-2 py-1">
                  <Star className="h-6 w-6 text-yellow-400 mr-1" />
                  <span className="text-sm font-bold text-white">{movie.averageRating.toFixed(1)}</span>
                </div>
              </div>
              
              <p className={`line-clamp-2 my-2 flex-grow ${descriptionClass}`}>{movie.description}</p>
              <div className="flex flex-wrap gap-1 mb-4">
                {movie.genres.map(genre => (
                  <span 
                    key={genre.id} 
                    className="text-xs bg-rose-100 text-rose-800 rounded px-2 py-1"
                  >
                    {genre.genre}
                  </span>
                ))}
              </div>
              
              <div className="flex flex-wrap gap-2 mt-auto">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate(`/movies/${movie.id}`)}
                >
                  View Details
                </Button>
                
                {isAuthenticated && (
                  <Button 
                    variant={watchlistStatus[movie.id] ? "secondary" : "default"}
                    className={!watchlistStatus[movie.id] ? "bg-rose-600 hover:bg-rose-700" : ""}
                    size="sm"
                    onClick={(e) => handleAddToWatchlist(movie.id, e)}
                    disabled={addingToWatchlist[movie.id]}
                  >
                    {addingToWatchlist[movie.id] ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    ) : watchlistStatus[movie.id] ? (
                      <>
                        <Check className="h-4 w-4 mr-1" />
                        In Watchlist
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-1" />
                        Add to Watchlist
                      </>
                    )}
                  </Button>
                )}
                
                {isAdmin && (
                  <>
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/admin/movies/edit/${movie.id}`)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => setDeleteMovieId(movie.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
