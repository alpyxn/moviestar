import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useKeycloak } from '@react-keycloak/web';
import moviesApi from '@/api/movieApi';
import genresApi from '@/api/genresApi';
import { Movie, Genre } from '@/api/apiService';
import { Loader2, Search, LayoutGrid, List, Filter, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InfiniteScroll } from '@/components/infinite-scroll';
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { FilterPanel } from "./movies/FilterPanel";
import { MovieGrid } from "./movies/MovieGrid";
import { MovieList } from "./movies/MovieList";
import { ActiveFilters } from "./movies/ActiveFilters";
import { deleteMovie } from "./movies/movieUtils";

interface MovieFilters {
  genreIds: number[];
  ratingRange: [number, number];
}

export default function MoviesPage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [filteredMovies, setFilteredMovies] = useState<Movie[]>([]);
  const [displayedMovies, setDisplayedMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [deleteMovieId, setDeleteMovieId] = useState<number | null>(null);
  const [refreshLoading, setRefreshLoading] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 12; 
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  
  const currentYear = new Date().getFullYear();
  
  const [availableGenres, setAvailableGenres] = useState<Genre[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<MovieFilters>({
    genreIds: [],
    ratingRange: [0, 10],
  });
  
  const [_, setYearBounds] = useState<[number, number]>([1900, currentYear]);
  
  const [isFilterActive, setIsFilterActive] = useState(false);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  
  const { toast } = useToast();
  const navigate = useNavigate();
  const { keycloak, initialized } = useKeycloak();

  const isAdmin = initialized && 
    keycloak.authenticated && 
    keycloak.hasRealmRole('ADMIN');

  const fetchMoviesData = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      else setRefreshLoading(true);
      
      const timestamp = new Date().getTime();
      const moviesData = await moviesApi.getRandomized(timestamp);
      
      setMovies(moviesData);
      
      if (moviesData.length > 0) {
        const years = moviesData.map(movie => movie.year);
        const minYear = Math.min(...years);
        const maxYear = Math.max(...years);
        
        setYearBounds([minYear, maxYear]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load movies',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setRefreshLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    
    const fetchMoviesAndGenres = async () => {
      try {
        setLoading(true);
        
        const genresData = await genresApi.getAll();
        if (!isMounted) return;
        
        setAvailableGenres(genresData);
        
        await fetchMoviesData(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        if (isMounted) {
          toast({
            title: 'Error',
            description: 'Failed to load movies',
            variant: 'destructive',
          });
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchMoviesAndGenres();
    
    return () => {
      isMounted = false;
    };
  }, []); 

  useEffect(() => {
    if (movies.length === 0) {
      setFilteredMovies([]);
      return;
    }
    
    let result = [...movies];
    
    if (searchTerm.trim()) {
      const lowercaseSearch = searchTerm.toLowerCase();
      result = result.filter((movie) => 
        movie.title.toLowerCase().includes(lowercaseSearch) ||
        movie.description.toLowerCase().includes(lowercaseSearch) ||
        movie.genres.some((genre) => genre.genre.toLowerCase().includes(lowercaseSearch))
      );
    }
    
    if (filters.genreIds.length > 0) {
      result = result.filter((movie) =>
        movie.genres.some((genre) => filters.genreIds.includes(genre.id))
      );
    }
    
    const isRatingFiltered =
      filters.ratingRange[0] > 0 || 
      filters.ratingRange[1] < 10;
    
    if (isRatingFiltered) {
      result = result.filter(
        (movie) => movie.averageRating >= filters.ratingRange[0] && movie.averageRating <= filters.ratingRange[1]
      );
    }
    
    setFilteredMovies(result);
    
    setDisplayedMovies(result.slice(0, PAGE_SIZE));
    setCurrentPage(1);
    setHasMore(result.length > PAGE_SIZE);
    
    const isActive = 
      filters.genreIds.length > 0 || 
      isRatingFiltered;
    
    setIsFilterActive(isActive);
  }, [searchTerm, movies, filters]);

  const loadMoreMovies = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    
    try {
      setLoadingMore(true);
      
      const nextPage = currentPage + 1;
      const startIdx = currentPage * PAGE_SIZE;
      const endIdx = startIdx + PAGE_SIZE;
      
      const nextBatch = filteredMovies.slice(startIdx, endIdx);
      
      if (nextBatch.length === 0) {
        setHasMore(false);
      } else {
        setDisplayedMovies(prev => [...prev, ...nextBatch]);
        setCurrentPage(nextPage);
        
        setHasMore(endIdx < filteredMovies.length);
      }
    } catch (error) {
      console.error('Error loading more movies:', error);
    } finally {
      setLoadingMore(false);
    }
  }, [currentPage, filteredMovies, hasMore, loadingMore]);

  const handleDeleteMovie = async (movieId: number) => {
    const success = await deleteMovie(movieId, toast);
    if (success) {
      const fetchMoviesAfterDelete = async () => {
        try {
          const data = await moviesApi.getAll();
          setMovies(data);
        } catch (error) {
          console.error('Error fetching movies after deletion:', error);
          toast({
            title: 'Error',
            description: 'Failed to refresh movies list',
            variant: 'destructive',
          });
        }
      };
      
      fetchMoviesAfterDelete();
    }
    setDeleteMovieId(null);
  };

  const handleGenreToggle = (genreId: number) => {
    if (genreId === -1) {
      setFilters(prev => ({ ...prev, genreIds: [] }));
      return;
    }
    
    setFilters(prev => {
      if (prev.genreIds.includes(genreId)) {
        return {
          ...prev,
          genreIds: prev.genreIds.filter(id => id !== genreId)
        };
      } else {
        return {
          ...prev,
          genreIds: [...prev.genreIds, genreId]
        };
      }
    });
  };

  const handleRatingRangeChange = (values: number[]) => {
    setFilters(prev => ({
      ...prev,
      ratingRange: [values[0], values[1]] as [number, number]
    }));
  };

  const resetFilters = () => {
    setFilters({
      genreIds: [],
      ratingRange: [0, 10],
    });
  };

  const getActiveFiltersCount = (): number => {
    let count = 0;
    if (filters.genreIds.length > 0) count++;
    if (filters.ratingRange[0] > 0 || filters.ratingRange[1] < 10) count++;
    return count;
  };

  // For watchlist operations in the movies listing page:
  /* Keeping for future implementation
  const handleWatchlistToggle = async (movieId: number, isInWatchlist: boolean) => {
    if (!isAuthenticated) {
      keycloak.login();
      return;
    }
  
    // Update local state optimistically
    setMovies(movies.map(movie => 
      movie.id === movieId ? { ...movie, isInWatchlist: !isInWatchlist } : movie
    ));
  
    try {
      if (isInWatchlist) {
        await watchlistApi.removeFromWatchlist(movieId);
      } else {
        await watchlistApi.addToWatchlist(movieId);
      }
    } catch (error) {
      console.error('Error updating watchlist:', error);
      
      setMovies(movies.map(movie => 
        movie.id === movieId ? { ...movie, isInWatchlist: isInWatchlist } : movie
      ));
    }
  };
  */

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-[70vh]">
        <Loader2 className="h-8 w-8 animate-spin text-rose-600" />
        <span className="ml-2">Loading movies...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div className="flex items-center">
          <h1 className="text-3xl font-bold">Movies</h1>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => fetchMoviesData()}
            disabled={refreshLoading}
            title="Refresh with new random order"
            className="ml-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          {/* Search field */}
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search movies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          
          <div className="flex gap-2">
            {/* Filter toggle button - desktop */}
            <Button
              variant="outline"
              size="icon"
              className={`relative hidden md:flex ${showFilters ? 'bg-slate-100 dark:bg-slate-800' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
              title={showFilters ? "Hide filters" : "Show filters"}
            >
              <Filter className={`h-4 w-4 ${isFilterActive ? 'text-rose-600' : ''}`} />
              {isFilterActive && (
                <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                  {getActiveFiltersCount()}
                </span>
              )}
            </Button>

            {/* Filter sheet - mobile */}
            <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="relative md:hidden"
                  title="Show filters"
                >
                  <Filter className={`h-4 w-4 ${isFilterActive ? 'text-rose-600' : ''}`} />
                  {isFilterActive && (
                    <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                      {getActiveFiltersCount()}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <SheetHeader className="mb-4">
                  <SheetTitle>Filter Movies</SheetTitle>
                  <SheetDescription>
                    Apply filters to find specific movies
                  </SheetDescription>
                </SheetHeader>
                <div className="py-4">
                  <FilterPanel 
                    filters={filters}
                    availableGenres={availableGenres}
                    handleGenreToggle={handleGenreToggle}
                    handleRatingRangeChange={handleRatingRangeChange}
                    resetFilters={resetFilters}
                    setFilters={setFilters}
                  />
                </div>
              </SheetContent>
            </Sheet>

            {/* View mode buttons */}
            <Button 
              variant={viewMode === 'grid' ? 'default' : 'outline'} 
              size="icon"
              onClick={() => setViewMode('grid')}
              title="Grid view"
              className="h-9 w-9"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button 
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('list')}
              title="List view"
              className="h-9 w-9"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Admin only button */}
          {isAdmin && (
            <Button 
              className="bg-rose-600 hover:bg-rose-700 whitespace-nowrap"
              onClick={() => navigate('/admin/movies/new')}
            >
              Add Movie
            </Button>
          )}
        </div>
      </div>

      {/* Active filters indicators */}
      {isFilterActive && (
        <ActiveFilters 
          filters={filters}
          availableGenres={availableGenres}
          handleGenreToggle={handleGenreToggle}
          resetFilters={resetFilters}
          setFilters={setFilters}
        />
      )}
      
      <div className="flex flex-col md:flex-row gap-6">
        {showFilters && (
          <div className="hidden md:block w-64 shrink-0">
            <FilterPanel 
              filters={filters}
              availableGenres={availableGenres}
              handleGenreToggle={handleGenreToggle}
              handleRatingRangeChange={handleRatingRangeChange}
              resetFilters={resetFilters}
              setFilters={setFilters}
              inCard={true}
            />
          </div>
        )}
        
        <div className="flex-grow">
          {filteredMovies.length === 0 ? (
            <div className="text-center py-12">
              <h2 className="text-2xl font-semibold mb-2">No movies found</h2>
              <p className="text-gray-500">Try adjusting your filters or search criteria</p>
              {isFilterActive && (
                <Button 
                  variant="outline" 
                  onClick={resetFilters} 
                  className="mt-4"
                >
                  Reset Filters
                </Button>
              )}
            </div>
          ) : (
            <InfiniteScroll
              loadMore={loadMoreMovies}
              hasMore={hasMore}
              isLoading={loadingMore}
              endMessage={<p className="text-center py-4">You've seen all the movies!</p>}
              className="w-full"
            >
              {viewMode === 'grid' ? (
                <MovieGrid 
                  movies={displayedMovies} 
                  isAdmin={!!isAdmin}
                  navigate={navigate} 
                  setDeleteMovieId={setDeleteMovieId} 
                />
              ) : (
                <MovieList 
                  movies={displayedMovies} 
                  isAdmin={!!isAdmin}
                  navigate={navigate} 
                  setDeleteMovieId={setDeleteMovieId} 
                  size="large"
                />
              )}
            </InfiniteScroll>
          )}
          
          {/* Show count of filtered movies */}
          <div className="mt-6 text-sm text-gray-500">
            Showing {displayedMovies.length} of {filteredMovies.length} movies
          </div>
        </div>
      </div>
      
      {/* Delete confirmation dialog */}
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
              onClick={() => deleteMovieId && handleDeleteMovie(deleteMovieId)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}