import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useKeycloak } from '@react-keycloak/web';
import actorsApi from '@/api/actorsApi';
import adminApi from '@/api/adminApi';
import { Actor } from '@/api/apiService';
import { Loader2, Search, Edit, Trash2, Film, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card, CardContent, CardFooter, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
   AlertDialog,
   AlertDialogContent,
   AlertDialogDescription,
   AlertDialogTitle,
   AlertDialogHeader,
   AlertDialogFooter,
   AlertDialogAction,
   AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";



export default function ActorsPage() {
  const [actors, setActors] = useState<Actor[]>([]);
  const [filteredActors, setFilteredActors] = useState<Actor[]>([]);
  const [displayedActors, setDisplayedActors] = useState<Actor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteActorId, setDeleteActorId] = useState<number | null>(null);
  
  // Infinite scroll states
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const ACTORS_PER_BATCH = 8; // Same as previous pageSize
  
  // Ref for infinite scroll observer
  const observerRef = useRef<HTMLDivElement>(null);
  
  const { toast } = useToast();
  const navigate = useNavigate();
  const { keycloak, initialized } = useKeycloak();

  const isAdmin = initialized && 
    keycloak.authenticated && 
    keycloak.hasRealmRole('ADMIN');

  useEffect(() => {
    let isMounted = true;
    
    const fetchActors = async () => {
      try {
        setLoading(true);
        const data = await actorsApi.getAll();
        if (!isMounted) return;
        setActors(data);
        
        // Also set filtered and displayed actors immediately
        setFilteredActors(data);
        setDisplayedActors(data.slice(0, ACTORS_PER_BATCH));
        setHasMore(data.length > ACTORS_PER_BATCH);
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load actors',
          variant: 'destructive',
        });
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchActors();
    
    return () => {
      isMounted = false;
    };
  }, [toast]);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredActors(actors);
    } else {
      const lowercaseSearch = searchTerm.toLowerCase();
      const filtered = actors.filter(actor => 
        `${actor.name} ${actor.surname}`.toLowerCase().includes(lowercaseSearch) ||
        actor.about?.toLowerCase().includes(lowercaseSearch)
      );
      setFilteredActors(filtered);
    }
    
    // Reset displayed actors when filter changes
    setDisplayedActors(_prev => {
      const initialActors = filteredActors.slice(0, ACTORS_PER_BATCH);
      return initialActors;
    });
    setHasMore(filteredActors.length > ACTORS_PER_BATCH);
  }, [searchTerm, actors]);
  
  // Set up intersection observer for infinite scroll
  useEffect(() => {
    if (!observerRef.current || !hasMore || !filteredActors.length || loadingMore || loading) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          loadMoreActors();
        }
      },
      { threshold: 0.5 }
    );
    
    observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, displayedActors.length, filteredActors.length]);
  
  // Load more actors function
  const loadMoreActors = useCallback(() => {
    if (loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    
    // Short timeout to allow loading indicator to show
    setTimeout(() => {
      const currentCount = displayedActors.length;
      const nextBatch = filteredActors.slice(currentCount, currentCount + ACTORS_PER_BATCH);
      
      if (nextBatch.length > 0) {
        setDisplayedActors(prev => [...prev, ...nextBatch]);
      }
      
      // Check if we've displayed all filtered actors
      setHasMore(currentCount + nextBatch.length < filteredActors.length);
      setLoadingMore(false);
    }, 300);
  }, [loadingMore, hasMore, displayedActors.length, filteredActors]);

  const handleDeleteActor = async (actorId: number) => {
    try {
      await adminApi.deleteActor(actorId);
      // Keep toast for admin action
      toast({
        title: "Success",
        description: "Actor deleted successfully",
      });
      
      // Define the fetchActors function inline to refresh the list
      const fetchActorsAfterDelete = async () => {
        try {
          const data = await actorsApi.getAll();
          setActors(data);
        } catch (error) {
          toast({
            title: 'Error',
            description: 'Failed to refresh actors list',
            variant: 'destructive',
          });
        }
      };
      
      // Call the newly defined function
      fetchActorsAfterDelete();
    } catch (error) {
      // Keep error toast for admin action
      toast({
        title: "Error",
        description: "Failed to delete actor. The actor may be associated with movies.",
        variant: "destructive",
      });
    } finally {
      setDeleteActorId(null);
    }
  };

  const getInitials = (actor: Actor): string => {
    return `${actor.name?.charAt(0) || ''}${actor.surname?.charAt(0) || ''}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[70vh]">
        <Loader2 className="h-8 w-8 animate-spin text-rose-600" />
        <span className="ml-2">Loading actors...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold">Actors</h1>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search actors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          
          {isAdmin && (
            <Button 
              className="bg-rose-600 hover:bg-rose-700 whitespace-nowrap"
              onClick={() => navigate('/admin/actors/new')}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add Actor
            </Button>
          )}
        </div>
      </div>
      
      {filteredActors.length === 0 ? (
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold mb-2">No actors found</h2>
          <p className="text-gray-500">Try adjusting your search criteria</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {displayedActors.map((actor) => (
              <Card key={actor.id} className="overflow-hidden flex flex-col hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-col items-center pb-2">
                  <Avatar className="h-32 w-32">
                    {actor.pictureUrl ? (
                      <img 
                        src={actor.pictureUrl} 
                        alt={`${actor.name} ${actor.surname}`}
                        className="object-cover"
                      />
                    ) : (
                      <AvatarFallback className="text-3xl bg-rose-100 text-rose-800">
                        {getInitials(actor)}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <CardTitle className="mt-4 text-center">
                    {actor.name} {actor.surname}
                  </CardTitle>
                  {actor.birthDay && (
                    <p className="text-sm text-gray-500">
                      Born: {new Date(actor.birthDay).getFullYear()}
                    </p>
                  )}
                </CardHeader>
                
                <CardContent className="pb-2 flex-grow">
                  {actor.about && (
                    <p className="text-sm line-clamp-3 text-center">{actor.about}</p>
                  )}
                  
                  {/* Movie list section similar to DirectorsPage */}
                  {Array.isArray(actor.movies) && actor.movies.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-semibold mb-2 flex items-center">
                        <Film className="h-3 w-3 mr-1" />
                        Notable works:
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {actor.movies.slice(0, 3).map(movie => (
                          <Badge key={movie.id} variant="secondary" className="text-xs">
                            {movie.title}
                          </Badge>
                        ))}
                        {actor.movies.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{actor.movies.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
                
                <CardFooter className="pt-2 flex justify-between">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    asChild
                  >
                    <Link to={`/actors/${actor.id}`}>View Details</Link>
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
                      <DropdownMenuContent align="end" className="w-[160px]">
                        <DropdownMenuItem 
                          className="cursor-pointer"
                          onClick={() => navigate(`/admin/actors/edit/${actor.id}`)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="cursor-pointer text-red-600 focus:text-red-600"
                          onClick={() => setDeleteActorId(actor.id)}
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
          
          {/* Infinite scroll loader */}
          <div 
            ref={observerRef} 
            className="py-6 flex justify-center"
          >
            {loadingMore && (
              <Loader2 className="h-6 w-6 animate-spin text-rose-600" />
            )}
            {!hasMore && filteredActors.length > ACTORS_PER_BATCH && (
              <p className="text-sm text-muted-foreground">You've seen all actors</p>
            )}
          </div>
          
          <div className="mt-4 text-sm text-gray-500">
            Showing {displayedActors.length} of {filteredActors.length} actors
          </div>
        </>
      )}
      
      <AlertDialog open={deleteActorId !== null} onOpenChange={() => setDeleteActorId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Actor</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this actor? This action cannot be undone.
              Note: Actors associated with movies cannot be deleted until they are removed from all movies.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deleteActorId && handleDeleteActor(deleteActorId)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}