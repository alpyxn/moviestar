import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useKeycloak } from '@react-keycloak/web';
import directorsApi from '@/api/directorsApi';
import adminApi from '@/api/adminApi';
import { Director, Movie } from '@/api/apiService';
import { format } from 'date-fns';
import { 
  Loader2, 
  Calendar, 
  Film, 
  Edit, 
  Trash2, 
  ArrowLeft,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
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
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

export default function DirectorDetails() {
  const { id } = useParams<{ id: string }>();
  const directorId = parseInt(id || '0');
  
  const [director, setDirector] = useState<Director | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [movies, setMovies] = useState<Movie[]>([]);
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const { keycloak, initialized } = useKeycloak();
  
  // Check if user is admin
  const isAdmin = initialized && 
    keycloak.authenticated && 
    keycloak.hasRealmRole('ADMIN');

  // Fetch director data with improved error handling
  useEffect(() => {
    let isMounted = true;
    
    const fetchDirectorData = async () => {
      if (!directorId) return;
      
      try {
        setLoading(true);
        // First get the director details
        const directorData = await directorsApi.getById(directorId);
        
        if (!isMounted) return;
        
        setDirector(directorData);
        
        // Then try to get the filmography
        try {
          const moviesData = await directorsApi.getFilmography(directorId);
          
          if (!isMounted) return;
          
          setMovies(moviesData);
        } catch (movieError) {
          console.error('Error fetching director filmography:', movieError);
          
          if (!isMounted) return;
          
          // If we already have movies from the director data, use those
          if (directorData.movies) {
            setMovies(directorData.movies);
          } else {
            setMovies([]);
          }
        }
      } catch (error) {
        console.error('Error fetching director data:', error);
        
        if (isMounted) {
          toast({
            title: 'Error',
            description: 'Failed to load director details',
            variant: 'destructive',
          });
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchDirectorData();
    
    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [directorId]);

  // Handle director deletion
  const handleDeleteDirector = async () => {
    if (!isAdmin || !directorId) return;

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
      
      await adminApi.deleteDirector(directorId);
      // Keep toast for admin action
      toast({
        title: "Success",
        description: "Director deleted successfully",
      });
      navigate('/directors');
    } catch (error) {
      console.error('Error deleting director:', error);
      // Keep error toast for admin action
      toast({
        title: "Error",
        description: "Failed to delete director. They may be associated with movies.",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
    }
  };

  // Generate initials for avatar
  const getInitials = (name: string, surname: string): string => {
    return `${name.charAt(0)}${surname.charAt(0)}`;
  };

  // Format date to display
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Unknown';
    try {
      return format(new Date(dateString), 'MMMM d, yyyy');
    } catch (e) {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[70vh]">
        <Loader2 className="h-8 w-8 animate-spin text-rose-600" />
        <span className="ml-2">Loading director details...</span>
      </div>
    );
  }

  if (!director) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-bold mb-4">Director Not Found</h1>
        <p className="text-gray-500 mb-6">The director you're looking for doesn't exist or has been removed.</p>
        <Button asChild>
          <Link to="/directors">Back to Directors</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Button */}
      <Button 
        variant="outline" 
        className="mb-6" 
        asChild
      >
        <Link to="/directors">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Directors
        </Link>
      </Button>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Director Info - 1/3 width on large screens */}
        <div className="lg:col-span-1 space-y-6">
          <div className="flex flex-col items-center text-center p-6 bg-card rounded-lg shadow">
            <Avatar className="h-48 w-48 mb-4">
              {director.pictureUrl ? (
                <img 
                  src={director.pictureUrl} 
                  alt={`${director.name} ${director.surname}`}
                  className="object-cover h-full w-full"
                />
              ) : (
                <AvatarFallback className="text-6xl bg-rose-100 text-rose-800">
                  {getInitials(director.name, director.surname)}
                </AvatarFallback>
              )}
            </Avatar>
            
            <h1 className="text-3xl font-bold">
              {director.name} {director.surname}
            </h1>
            
            {/* Admin buttons */}
            {isAdmin && (
              <div className="mt-4 w-full bg-black/5 p-3 rounded-lg">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Shield className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm text-yellow-600 font-medium">Admin Actions</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline" 
                    size="sm"
                    className="w-full"
                    onClick={() => navigate(`/admin/directors/edit/${directorId}`)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm" 
                    className="w-full border-red-200 text-red-600 hover:bg-red-50"
                    onClick={() => setDeleteDialogOpen(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            )}
            
            <div className="mt-6 space-y-4 w-full">
              <div className="flex items-center justify-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-sm">
                  Born: {formatDate(director.birthDay)}
                  {director.deathDay && ` - Died: ${formatDate(director.deathDay)}`}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Main Content - 2/3 width on large screens */}
        <div className="lg:col-span-2 space-y-8">
          {/* Biography Section */}
          <section>
            <h2 className="text-2xl font-bold mb-4">Biography</h2>
            {director.about ? (
              <div className="prose dark:prose-invert max-w-none">
                <p>{director.about}</p>
              </div>
            ) : (
              <p className="text-gray-500 italic">No biography available for this director.</p>
            )}
          </section>
          
          {/* Filmography Section */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Filmography</h2>
              <Badge className="bg-gray-200 text-gray-800 hover:bg-gray-300">
                <Film className="h-3 w-3 mr-1" />
                {movies.length} Movies
              </Badge>
            </div>
            
            {movies.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {movies.map(movie => (
                  <Link 
                    key={movie.id} 
                    to={`/movies/${movie.id}`}
                    className="group"
                  >
                    <Card className="overflow-hidden h-full hover:shadow-md transition-all">
                      <div className="aspect-[2/3] relative">
                        <img 
                          src={movie.posterURL || '/placeholder-poster.jpg'} 
                          alt={movie.title} 
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-3">
                          <h3 className="text-white font-bold group-hover:text-rose-300 transition-colors">
                            {movie.title}
                          </h3>
                          <p className="text-white text-sm opacity-80">{movie.year}</p>
                        </div>
                      </div>
                      <CardContent className="p-3">
                        <div className="flex flex-wrap gap-1">
                          {movie.genres && movie.genres.slice(0, 3).map((genre: { id: number; genre: string }) => (
                            <Badge key={genre.id} variant="outline" className="text-xs">
                              {genre.genre}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic">No movies available for this director.</p>
            )}
          </section>
        </div>
      </div>
      
      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Director</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this director? This action cannot be undone.
              Directors associated with movies cannot be deleted until they are removed from all movies.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={handleDeleteDirector}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
