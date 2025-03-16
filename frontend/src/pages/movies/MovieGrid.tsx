import { Link } from 'react-router-dom';
import { Movie } from '@/api/apiService';
import { Star, Edit, Trash2, Eye, Plus, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useKeycloak } from '@react-keycloak/web';
import { useState, useEffect, useCallback } from 'react';
import watchlistApi from '@/api/watchlistApi';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MovieGridProps {
  movies: Movie[];
  isAdmin: boolean;
  navigate: (path: string) => void;
  setDeleteMovieId: (id: number) => void;
}

export function MovieGrid({ movies, isAdmin, navigate, setDeleteMovieId }: MovieGridProps) {
  const { keycloak, initialized } = useKeycloak();
  const isAuthenticated = initialized && keycloak.authenticated;
  const { toast } = useToast();
  
  const [addingToWatchlist, setAddingToWatchlist] = useState<Record<number, boolean>>({});
  const [watchlistStatus, setWatchlistStatus] = useState<Record<number, boolean>>({});
  
  const fetchWatchlistStatuses = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      console.log('MovieGrid: Fetching watchlist statuses for', movies.length, 'movies');
      
      const movieIds = movies.map(movie => movie.id);
      
      if (movieIds.length === 0) return;
      
      const statuses = await watchlistApi.batchCheckWatchlistStatus(movieIds);
      
      console.log('MovieGrid - Final watchlist statuses:', statuses);
      
      if (Object.keys(statuses).length > 0) {
        setWatchlistStatus(statuses);
      } else {
        console.warn('Empty watchlist statuses received');
      }
    } catch (error) {
      console.error('Error fetching watchlist statuses:', error);
    }
  }, [movies, isAuthenticated]);
  
  useEffect(() => {
    fetchWatchlistStatuses();
  }, [fetchWatchlistStatuses]);
  
  const handleAddToWatchlist = async (movieId: number, event: React.MouseEvent) => {
    event.preventDefault();
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
        setWatchlistStatus(prev => ({ ...prev, [movieId]: false }));
      } else {
        await watchlistApi.addToWatchlist(movieId);
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

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {movies.map((movie) => (
        <Card key={movie.id} className="overflow-hidden flex flex-col h-full hover:shadow-lg transition-shadow">
          <Link to={`/movies/${movie.id}`} className="group">
            <div className="relative pb-[150%]">
              <img 
                src={movie.posterURL || '/placeholder-poster.jpg'} 
                alt={movie.title} 
                className="absolute inset-0 w-full h-full object-cover"
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/placeholder-poster.jpg';
                  (e.target as HTMLImageElement).onerror = null;
                }}
              />
              <div className="absolute top-2 right-2 bg-black bg-opacity-70 rounded-full px-2 py-1 flex items-center">
                <Star className="h-3 w-3 text-yellow-400 mr-1" />
                <span className="text-xs font-bold text-white">{movie.averageRating.toFixed(1)}</span>
              </div>
              
              {/* Watchlist badge indicator */}
              {watchlistStatus[movie.id] && (
                <div className="absolute top-2 left-2 bg-rose-600 bg-opacity-90 rounded-full p-1.5">
                  <Check className="h-3 w-3 text-white" />
                </div>
              )}
              
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200"></div>
            </div>
          </Link>
          
          <CardHeader className="pb-1 px-3 pt-2">
            <CardTitle className="text-base line-clamp-1">{movie.title}</CardTitle>
            <p className="text-xs text-gray-500">{movie.year}</p>
          </CardHeader>
          
          <CardContent className="pb-1 px-3 flex-grow">
            <p className="text-xs line-clamp-2">{movie.description}</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {movie.genres.slice(0, 2).map(genre => (
                <span 
                  key={genre.id} 
                  className="text-xs bg-rose-100 text-rose-800 rounded px-1.5 py-0.5"
                >
                  {genre.genre}
                </span>
              ))}
              {movie.genres.length > 2 && (
                <span className="text-xs bg-gray-100 text-gray-800 rounded px-1.5 py-0.5">
                  +{movie.genres.length - 2}
                </span>
              )}
            </div>
          </CardContent>
          
          <CardFooter className="pt-0 pb-2 px-3 flex flex-col gap-2">
            {/* Responsive two-button layout */}
            <div className="grid grid-cols-2 gap-1 w-full">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full text-[10px] xs:text-xs h-7 sm:h-8 px-1 sm:px-2"
                onClick={(e) => {
                  e.preventDefault();
                  navigate(`/movies/${movie.id}`);
                }}
              >
                <Eye className="h-3 w-3 mr-0.5 sm:mr-1 flex-shrink-0" />
                <span className="truncate">Details</span>
              </Button>
              
              {isAuthenticated && (
                <Button 
                  variant={watchlistStatus[movie.id] ? "secondary" : "default"}
                  className={`w-full text-[10px] xs:text-xs h-7 sm:h-8 px-1 sm:px-2 ${!watchlistStatus[movie.id] ? "bg-rose-600 hover:bg-rose-700" : ""}`}
                  size="sm"
                  onClick={(e) => handleAddToWatchlist(movie.id, e)}
                  disabled={addingToWatchlist[movie.id]}
                >
                  {addingToWatchlist[movie.id] ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : watchlistStatus[movie.id] ? (
                    <>
                      <Check className="h-3 w-3 mr-0.5 sm:mr-1 flex-shrink-0" />
                      <span className="truncate">In Watchlist</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-3 w-3 mr-0.5 sm:mr-1 flex-shrink-0" />
                      <span className="truncate">Watchlist</span>
                    </>
                  )}
                </Button>
              )}
            </div>
            
            {/* Admin actions */}
            {isAdmin && (
              <div className="flex justify-end w-full">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <span className="sr-only">Open menu</span>
                      <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M8.625 2.5C8.625 3.12132 8.12132 3.625 7.5 3.625C6.87868 3.625 6.375 3.12132 6.375 2.5C6.375 1.87868 6.87868 1.375 7.5 1.375C8.12132 1.375 8.625 1.87868 8.625 2.5ZM8.625 7.5C8.625 8.12132 8.12132 8.625 7.5 8.625C6.87868 8.625 6.375 8.12132 6.375 7.5C6.375 6.87868 6.87868 6.375 7.5 6.375C8.12132 6.375 8.625 6.87868 8.625 7.5ZM7.5 13.625C8.12132 13.625 8.625 13.1213 8.625 12.5C8.625 11.8787 8.12132 11.375 7.5 11.375C6.87868 11.375 6.375 11.8787 6.375 12.5C6.375 13.1213 6.87868 13.625 7.5 13.625Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                      </svg>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem 
                      onClick={() => navigate(`/admin/movies/edit/${movie.id}`)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-red-600 focus:text-red-600"
                      onClick={() => setDeleteMovieId(movie.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}