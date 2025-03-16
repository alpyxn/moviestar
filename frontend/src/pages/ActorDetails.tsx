import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useKeycloak } from '@react-keycloak/web';
import actorsApi from '@/api/actorsApi';
import adminApi from '@/api/adminApi';
import { Actor, Movie } from '@/api/apiService';
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
import { Card } from '@/components/ui/card';
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

export default function ActorDetails() {
  const { id } = useParams<{ id: string }>();
  const actorId = parseInt(id || '0');
  
  const [actor, setActor] = useState<Actor | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [movies, setMovies] = useState<Movie[]>([]);
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const { keycloak, initialized } = useKeycloak();
  
  const isAdmin = initialized && 
    keycloak.authenticated && 
    keycloak.hasRealmRole('ADMIN');

  useEffect(() => {
    let isMounted = true;
    
    const fetchActorData = async () => {
      if (!actorId) return;
      
      try {
        setLoading(true);
        const actorData = await actorsApi.getById(actorId);
        
        if (!isMounted) return;
        
        setActor(actorData);
        
        try {
          const moviesData = await actorsApi.getFilmography(actorId);
          
          if (!isMounted) return;
          
          setMovies(moviesData);
        } catch (movieError) {
          console.error('Error fetching actor filmography:', movieError);
          
          if (!isMounted) return;
          
          if (actorData.movies) {
            setMovies(actorData.movies);
          } else {
            setMovies([]);
          }
        }
      } catch (error) {
        console.error('Error fetching actor data:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchActorData();
    
    return () => {
      isMounted = false;
    };
  }, [actorId]);

  const handleDeleteActor = async () => {
    if (!isAdmin || !actorId) return;

    try {
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
      
      await adminApi.deleteActor(actorId);
      toast({
        title: "Success",
        description: "Actor deleted successfully",
      });
      navigate('/actors');
    } catch (error) {
      console.error('Error deleting actor:', error);
      toast({
        title: "Error",
        description: "Failed to delete actor. They may be associated with movies.",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
    }
  };

  const getInitials = (name: string, surname: string): string => {
    return `${name.charAt(0)}${surname.charAt(0)}`;
  };

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
        <span className="ml-2">Loading actor details...</span>
      </div>
    );
  }

  if (!actor) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-bold mb-4">Actor Not Found</h1>
        <p className="text-gray-500 mb-6">The actor you're looking for doesn't exist or has been removed.</p>
        <Button asChild>
          <Link to="/actors">Back to Actors</Link>
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
        <Link to="/actors">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Actors
        </Link>
      </Button>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="flex flex-col items-center text-center p-6 bg-card rounded-lg shadow">
            <Avatar className="h-48 w-48 mb-4">
              {actor.pictureUrl ? (
                <img 
                  src={actor.pictureUrl} 
                  alt={`${actor.name} ${actor.surname}`}
                  className="object-cover h-full w-full"
                />
              ) : (
                <AvatarFallback className="text-6xl bg-rose-100 text-rose-800">
                  {getInitials(actor.name, actor.surname)}
                </AvatarFallback>
              )}
            </Avatar>
            
            <h1 className="text-3xl font-bold">
              {actor.name} {actor.surname}
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
                    onClick={() => navigate(`/admin/actors/edit/${actorId}`)}
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
                  Born: {formatDate(actor.birthDay)}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="lg:col-span-2 space-y-8">
          {/* Biography Section */}
          <section>
            <h2 className="text-2xl font-bold mb-4">Biography</h2>
            {actor.about ? (
              <div className="prose dark:prose-invert max-w-none">
                <p>{actor.about}</p>
              </div>
            ) : (
              <p className="text-gray-500 italic">No biography available for this actor.</p>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {movies.map(movie => (
                  <Card key={movie.id} className="overflow-hidden flex flex-col h-full hover:shadow-lg transition-shadow">
                    <Link 
                      to={`/movies/${movie.id}`}
                      className="group h-full"
                    >
                      <div className="aspect-[2/3] relative">
                        <img 
                          src={movie.posterURL || '/placeholder-poster.jpg'} 
                          alt={movie.title} 
                          className="w-full h-full object-cover"
                          loading="lazy"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.onerror = null;
                            target.src = '/placeholder-poster.jpg';
                          }}
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-3">
                          <h3 className="text-white font-bold text-base">
                            {movie.title}
                          </h3>
                          <p className="text-white text-xs opacity-90">{movie.year}</p>
                        </div>
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200"></div>
                      </div>
                    </Link>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic">No movies available for this actor.</p>
            )}
          </section>
        </div>
      </div>
      
      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Actor</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this actor? This action cannot be undone.
              Actors associated with movies cannot be deleted until they are removed from all movies.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={handleDeleteActor}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
