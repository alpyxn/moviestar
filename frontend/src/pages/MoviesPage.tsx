import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useKeycloak } from '@react-keycloak/web';
import moviesApi from '@/api/movieApi';
import adminApi from '@/api/adminApi';
import { Movie } from '@/api/apiService';
import { Loader2, Search, LayoutGrid, List, Edit, Trash2, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

export default function MoviesPage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [filteredMovies, setFilteredMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [deleteMovieId, setDeleteMovieId] = useState<number | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { keycloak, initialized } = useKeycloak();

  // Get admin status
  const isAdmin = initialized && 
    keycloak.authenticated && 
    keycloak.hasRealmRole('ADMIN');

  // Fetch movies on component mount
  useEffect(() => {
    let isMounted = true;
    
    const fetchMovies = async () => {
      try {
        setLoading(true);
        const data = await moviesApi.getAll();
        if (!isMounted) return;
        setMovies(data);
      } catch (error) {
        console.error('Error fetching movies:', error);
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

    fetchMovies();
    
    return () => {
      isMounted = false;
    };
  }, []); // No dependencies needed

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredMovies(movies);
    } else {
      const lowercaseSearch = searchTerm.toLowerCase();
      const filtered = movies.filter((movie) => 
        movie.title.toLowerCase().includes(lowercaseSearch) ||
        movie.description.toLowerCase().includes(lowercaseSearch) ||
        movie.genres.some((genre) => genre.genre.toLowerCase().includes(lowercaseSearch))
      );
      setFilteredMovies(filtered);
    }
  }, [searchTerm, movies]);

  const handleDeleteMovie = async (movieId: number) => {
    try {
      await adminApi.deleteMovie(movieId);
      // Keep toast for admin action
      toast({
        title: "Success",
        description: "Movie deleted successfully",
      });
      
      // Define the missing fetchMovies function here
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
      
      // Call the newly defined function
      fetchMoviesAfterDelete();
    } catch (error) {
      // Keep error toast for admin action
      toast({
        title: "Error",
        description: "Failed to delete movie",
        variant: "destructive",
      });
    } finally {
      setDeleteMovieId(null);
    }
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold">Movies</h1>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
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
            <Button 
              variant={viewMode === 'grid' ? 'default' : 'outline'} 
              size="icon"
              onClick={() => setViewMode('grid')}
              title="Grid view"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button 
              variant={viewMode === 'list' ? 'default' : 'outline'} 
              size="icon"
              onClick={() => setViewMode('list')}
              title="List view"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          
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
      
      {filteredMovies.length === 0 ? (
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold mb-2">No movies found</h2>
          <p className="text-gray-500">Try adjusting your search criteria</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredMovies.map((movie) => (
            <Card key={movie.id} className="overflow-hidden flex flex-col h-full hover:shadow-lg transition-shadow">
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
              </div>
              
              <CardHeader className="pb-2">
                <CardTitle className="text-lg line-clamp-1">{movie.title}</CardTitle>
                <p className="text-sm text-gray-500">{movie.year}</p>
              </CardHeader>
              
              <CardContent className="pb-2 flex-grow">
                <p className="text-sm line-clamp-2">{movie.description}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {movie.genres.map(genre => (
                    <span 
                      key={genre.id} 
                      className="text-xs bg-rose-100 text-rose-800 rounded px-2 py-1"
                    >
                      {genre.genre}
                    </span>
                  ))}
                </div>
              </CardContent>
              
              <CardFooter className="pt-0 flex justify-between">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  asChild
                >
                  <Link to={`/movies/${movie.id}`}>View Details</Link>
                </Button>
                
                {isAdmin && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <span className="sr-only">Open menu</span>
                        <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
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
                <div className="w-full md:w-48 h-48 shrink-0">
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