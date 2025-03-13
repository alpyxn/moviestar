import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useKeycloak } from '@react-keycloak/web';
import moviesApi from '@/api/movieApi';
import adminApi from '@/api/adminApi';
import genresApi from '@/api/genresApi';
import { Movie, Genre } from '@/api/apiService';
import { Loader2, Search, LayoutGrid, List, Edit, Trash2, Star, Filter, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";

// Define filter types
interface MovieFilters {
  genreIds: number[];
  yearRange: [number, number];
  ratingRange: [number, number];
}

export default function MoviesPage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [filteredMovies, setFilteredMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [deleteMovieId, setDeleteMovieId] = useState<number | null>(null);
  
  // Determine the current year for ranges
  const currentYear = new Date().getFullYear();
  
  // Filter states - initialize with null to indicate no filter applied
  const [availableGenres, setAvailableGenres] = useState<Genre[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<MovieFilters>({
    genreIds: [],
    yearRange: [1900, currentYear], // Default to entire range
    ratingRange: [0, 10],
  });
  
  // Track min and max possible years separately
  const [yearBounds, setYearBounds] = useState<[number, number]>([1900, currentYear]);
  
  const [isFilterActive, setIsFilterActive] = useState(false);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  
  const { toast } = useToast();
  const navigate = useNavigate();
  const { keycloak, initialized } = useKeycloak();

  // Get admin status
  const isAdmin = initialized && 
    keycloak.authenticated && 
    keycloak.hasRealmRole('ADMIN');

  // Fetch movies and genres on component mount
  useEffect(() => {
    let isMounted = true;
    
    const fetchMoviesAndGenres = async () => {
      try {
        setLoading(true);
        
        // Fetch movies and genres in parallel
        const [moviesData, genresData] = await Promise.all([
          moviesApi.getAll(),
          genresApi.getAll()
        ]);
        
        if (!isMounted) return;
        
        setMovies(moviesData);
        setAvailableGenres(genresData);
        
        // Determine year range based on available movies, but don't automatically set as filter
        if (moviesData.length > 0) {
          const years = moviesData.map(movie => movie.year);
          const minYear = Math.min(...years);
          const maxYear = Math.max(...years);
          
          // Update the bounds but keep filters at full range
          setYearBounds([minYear, maxYear]);
        }
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

  // Apply search and filters to movies
  useEffect(() => {
    if (movies.length === 0) {
      setFilteredMovies([]);
      return;
    }
    
    // Start with all movies
    let result = [...movies];
    
    // Apply search term filter if any
    if (searchTerm.trim()) {
      const lowercaseSearch = searchTerm.toLowerCase();
      result = result.filter((movie) => 
        movie.title.toLowerCase().includes(lowercaseSearch) ||
        movie.description.toLowerCase().includes(lowercaseSearch) ||
        movie.genres.some((genre) => genre.genre.toLowerCase().includes(lowercaseSearch))
      );
    }
    
    // Apply genre filter if any
    if (filters.genreIds.length > 0) {
      result = result.filter((movie) =>
        movie.genres.some((genre) => filters.genreIds.includes(genre.id))
      );
    }
    
    // Apply year range filter - only if different from the full range
    const isYearFiltered = 
      filters.yearRange[0] > yearBounds[0] || 
      filters.yearRange[1] < yearBounds[1];
    
    if (isYearFiltered) {
      result = result.filter(
        (movie) => movie.year >= filters.yearRange[0] && movie.year <= filters.yearRange[1]
      );
    }
    
    // Apply rating range filter - only if different from the full range
    const isRatingFiltered =
      filters.ratingRange[0] > 0 || 
      filters.ratingRange[1] < 10;
    
    if (isRatingFiltered) {
      result = result.filter(
        (movie) => movie.averageRating >= filters.ratingRange[0] && movie.averageRating <= filters.ratingRange[1]
      );
    }
    
    setFilteredMovies(result);
    
    // Set filter active status
    const isActive = 
      filters.genreIds.length > 0 || 
      isYearFiltered ||
      isRatingFiltered;
    
    setIsFilterActive(isActive);
  }, [searchTerm, movies, filters, yearBounds]);

  const handleDeleteMovie = async (movieId: number) => {
    try {
      await adminApi.deleteMovie(movieId);
      toast({
        title: "Success",
        description: "Movie deleted successfully",
      });
      
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
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete movie",
        variant: "destructive",
      });
    } finally {
      setDeleteMovieId(null);
    }
  };

  const handleGenreToggle = (genreId: number) => {
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

  const handleYearRangeChange = (values: number[]) => {
    setFilters(prev => ({
      ...prev,
      yearRange: [values[0], values[1]] as [number, number]
    }));
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
      yearRange: yearBounds, // Reset to the bounds from actual movie data
      ratingRange: [0, 10],
    });
  };

  const getActiveFiltersCount = (): number => {
    let count = 0;
    if (filters.genreIds.length > 0) count++;
    if (filters.yearRange[0] > yearBounds[0] || filters.yearRange[1] < yearBounds[1]) count++;
    if (filters.ratingRange[0] > 0 || filters.ratingRange[1] < 10) count++;
    return count;
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-[70vh]">
        <Loader2 className="h-8 w-8 animate-spin text-rose-600" />
        <span className="ml-2">Loading movies...</span>
      </div>
    );
  }

  // Mobile/Desktop Filter Panel
  const FilterPanel = () => (
    <div className="space-y-8">
      {/* Genres filter - now using a popover */}
      <div>
        <h3 className="text-sm font-medium mb-3">Genres</h3>
        <Popover>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              className="w-full justify-between text-left font-normal"
            >
              {filters.genreIds.length > 0 
                ? `${filters.genreIds.length} genre${filters.genreIds.length > 1 ? 's' : ''} selected` 
                : "Select genres"}
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" align="start">
            <ScrollArea className="h-72 p-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="font-medium">Select Genres</Label>
                  {filters.genreIds.length > 0 && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setFilters(prev => ({ ...prev, genreIds: [] }))}
                      className="h-7 px-2 text-xs text-rose-600 hover:text-rose-700"
                    >
                      Clear selection
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {availableGenres.map(genre => (
                    <div key={genre.id} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`genre-popup-${genre.id}`} 
                        checked={filters.genreIds.includes(genre.id)}
                        onCheckedChange={() => handleGenreToggle(genre.id)}
                      />
                      <label 
                        htmlFor={`genre-popup-${genre.id}`}
                        className="text-sm leading-none cursor-pointer"
                      >
                        {genre.genre}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollArea>
          </PopoverContent>
        </Popover>

        {/* Show selected genres as badges */}
        {filters.genreIds.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {filters.genreIds.map(genreId => {
              const genre = availableGenres.find(g => g.id === genreId);
              return genre ? (
                <Badge 
                  key={genre.id}
                  variant="outline" 
                  className="bg-slate-50 text-slate-700 dark:bg-slate-900 dark:text-slate-300 flex items-center gap-1 border-slate-200 dark:border-slate-700"
                >
                  {genre.genre}
                  <X 
                    className="h-3 w-3 cursor-pointer hover:text-rose-600" 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleGenreToggle(genre.id);
                    }}
                  />
                </Badge>
              ) : null;
            })}
          </div>
        )}
      </div>

      {/* Year range filter - with improved interaction */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-medium">Release Year</h3>
          <div className="flex items-center gap-1 text-sm bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
            <span className="font-mono">{filters.yearRange[0]}</span>
            <span>-</span>
            <span className="font-mono">{filters.yearRange[1]}</span>
          </div>
        </div>
        <div className="px-1">
          <Slider
            defaultValue={yearBounds}
            min={yearBounds[0]}
            max={yearBounds[1]}
            step={1}
            value={filters.yearRange}
            onValueChange={handleYearRangeChange}
            className="py-4"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>{yearBounds[0]}</span>
            <span>{yearBounds[1]}</span>
          </div>
        </div>
      </div>

      {/* Rating range filter - with improved interaction */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-medium">Rating</h3>
          <div className="flex items-center gap-1 text-sm bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
            <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
            <span className="font-mono">{filters.ratingRange[0].toFixed(1)}</span>
            <span>-</span>
            <span className="font-mono">{filters.ratingRange[1].toFixed(1)}</span>
          </div>
        </div>
        <div className="px-1">
          <Slider
            defaultValue={filters.ratingRange}
            min={0}
            max={10}
            step={0.5}
            value={filters.ratingRange}
            onValueChange={handleRatingRangeChange}
            className="py-4"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>0</span>
            <span>10</span>
          </div>
        </div>
      </div>

      {/* Reset filters button */}
      <Button 
        variant="outline" 
        onClick={resetFilters}
        className="w-full"
        size="sm"
      >
        Reset All Filters
      </Button>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold">Movies</h1>
        
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
            {/* Filter toggle button - visible only on desktop */}
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

            {/* Filter sheet trigger - visible only on mobile */}
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
                  <FilterPanel />
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
              onClick={() => navigate('/admin/movies/add')}
            >
              Add Movie
            </Button>
          )}
        </div>
      </div>

      {/* Active filters indicators - improved badges */}
      {isFilterActive && (
        <div className="flex flex-wrap items-center gap-2 mb-6 mt-2 bg-slate-50 dark:bg-slate-900/60 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300 mr-1">Filters:</span>
          
          {filters.genreIds.length > 0 && (
            <Popover>
              <PopoverTrigger asChild>
                <Badge 
                  variant="secondary" 
                  className="flex items-center gap-1 h-7 px-3 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                  <span>Genres ({filters.genreIds.length})</span>
                  <ChevronDown className="h-3 w-3 ml-1" />
                </Badge>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-2" align="start">
                <div className="space-y-2">
                  <div className="flex items-center justify-between mb-1">
                    <Label className="font-medium text-sm">Selected Genres</Label>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setFilters(prev => ({ ...prev, genreIds: [] }))}
                      className="h-6 px-2 text-xs text-rose-600 hover:text-rose-700"
                    >
                      Clear all
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {filters.genreIds.map(genreId => {
                      const genre = availableGenres.find(g => g.id === genreId);
                      return genre ? (
                        <Badge 
                          key={genre.id} 
                          variant="outline"
                          className="flex items-center gap-1"
                        >
                          {genre.genre}
                          <X 
                            className="h-3 w-3 ml-1 cursor-pointer hover:text-rose-600" 
                            onClick={() => handleGenreToggle(genre.id)}
                          />
                        </Badge>
                      ) : null;
                    })}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          )}
          
          {(filters.yearRange[0] > yearBounds[0] || filters.yearRange[1] < yearBounds[1]) && (
            <Badge 
              variant="secondary" 
              className="flex items-center gap-1 h-7 px-3"
            >
              <span>Year: {filters.yearRange[0]}-{filters.yearRange[1]}</span>
              <X 
                className="h-3 w-3 ml-1 cursor-pointer hover:text-rose-600" 
                onClick={() => setFilters(prev => ({ ...prev, yearRange: yearBounds }))} 
              />
            </Badge>
          )}
          
          {(filters.ratingRange[0] > 0 || filters.ratingRange[1] < 10) && (
            <Badge 
              variant="secondary" 
              className="flex items-center gap-1 h-7 px-3"
            >
              <Star className="h-3 w-3 text-yellow-500" />
              <span>{filters.ratingRange[0].toFixed(1)}-{filters.ratingRange[1].toFixed(1)}</span>
              <X 
                className="h-3 w-3 ml-1 cursor-pointer hover:text-rose-600" 
                onClick={() => setFilters(prev => ({ ...prev, ratingRange: [0, 10] }))} 
              />
            </Badge>
          )}
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={resetFilters} 
            className="h-7 px-3 ml-auto text-xs text-rose-600 hover:text-rose-700"
          >
            Clear All
          </Button>
        </div>
      )}
      
      {/* Content grid with optional filter sidebar */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Filter sidebar - desktop only */}
        {showFilters && (
          <div className="hidden md:block w-64 shrink-0">
            <Card className="sticky top-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>Filters</span>
                  {isFilterActive && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={resetFilters} 
                      className="h-7 px-2 text-xs text-rose-600"
                    >
                      Reset All
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FilterPanel />
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* Main content */}
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
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredMovies.map((movie) => (
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
                      {movie.genres.map(genre => (
                        <span 
                          key={genre.id} 
                          className="text-xs bg-rose-100 text-rose-800 rounded px-1.5 py-0.5"
                        >
                          {genre.genre}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                  
                  <CardFooter className="pt-0 pb-2 px-3 flex justify-between">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full text-xs h-7"
                      asChild
                    >
                      <Link to={`/movies/${movie.id}`}>View Details</Link>
                    </Button>
                    
                    {isAdmin && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <span className="sr-only">Open menu</span>
                            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/200/svg">
                              <path d="M8.625 2.5C8.625 3.12132 8.12132 3.625 7.5 3.625C6.87868 3.625 6.375 3.12132 6.375 2.5C6.375 1.87868 6.87868 1.375 7.5 1.375C8.12132 1.375 8.625 1.87868 8.625 2.5ZM8.625 7.5C8.625 8.12132 8.12132 8.625 7.5 8.625C6.87868 8.625 6.375 8.12132 6.375 7.5C6.375 6.87868 6.87868 6.375 7.5 6.375C8.12132 6.375 8.625 6.87868 8.625 7.5ZM7.5 13.625C8.12132 13.625 8.625 13.1213 8.625 12.5C8.625 11.8787 8.12132 11.375 7.5 11.375C6.87868 11.375 6.375 11.8787 6.375 12.5C6.375 13.1213 6.87868 13.625 7.5 13.625Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                            </svg>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/admin/movies/edit/${movie.id}`)}>
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
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredMovies.map((movie) => (
                <Card key={movie.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="flex flex-col md:flex-row">
                    <div className="w-full md:w-36 h-36 shrink-0">
                      <img 
                        src={movie.posterURL} 
                        alt={movie.title} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex flex-col flex-grow p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-xl font-bold">{movie.title}</h3>
                          <p className="text-sm text-gray-500">{movie.year}</p>
                        </div>
                        <div className="flex items-center bg-black bg-opacity-70 rounded-full px-2 py-1">
                          <Star className="h-4 w-4 text-yellow-400 mr-1" />
                          <span className="text-sm font-bold text-white">{movie.averageRating.toFixed(1)}</span>
                        </div>
                      </div>
                      
                      <p className="line-clamp-2 my-2 flex-grow">{movie.description}</p>
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
                      
                      <div className="flex justify-between items-center">
                        <Button 
                          variant="outline" 
                          size="sm"
                          asChild
                        >
                          <Link to={`/movies/${movie.id}`}>View Details</Link>
                        </Button>
                        
                        {isAdmin && (
                          <div className="flex gap-2">
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
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
          
          {/* Show count of filtered movies */}
          <div className="mt-6 text-sm text-gray-500">
            Showing {filteredMovies.length} of {movies.length} movies
          </div>
        </div>
      </div>
      
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