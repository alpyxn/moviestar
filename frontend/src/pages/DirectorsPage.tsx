import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useKeycloak } from '@react-keycloak/web';
import directorsApi from '@/api/directorsApi'; 
import adminApi from '@/api/adminApi'; 
import { Director } from '@/api/apiService';
import { Loader2, Search, Edit, Trash2, Film, UserPlus } from 'lucide-react';
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from '@/components/ui/badge';

export default function DirectorsPage() {
  const [directors, setDirectors] = useState<Director[]>([]);
  const [filteredDirectors, setFilteredDirectors] = useState<Director[]>([]);
  const [displayedDirectors, setDisplayedDirectors] = useState<Director[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDirectorId, setDeleteDirectorId] = useState<number | null>(null);
  
  // Infinite scroll states
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const DIRECTORS_PER_BATCH = 8; 
  
  const observerRef = useRef<HTMLDivElement>(null);
  
  const { toast } = useToast();
  const navigate = useNavigate();
  const { keycloak, initialized } = useKeycloak();

  const isAdmin = initialized && 
    keycloak.authenticated && 
    keycloak.hasRealmRole('ADMIN');

  useEffect(() => {
    let isMounted = true;
    
    const fetchDirectors = async () => {
      try {
        setLoading(true);
        const data = await directorsApi.getAll();
        if (!isMounted) return;
        setDirectors(data);
        
        setFilteredDirectors(data);
        setDisplayedDirectors(data.slice(0, DIRECTORS_PER_BATCH));
        setHasMore(data.length > DIRECTORS_PER_BATCH);
      } catch (error) {
        console.error('Error fetching directors:', error);
        if (isMounted) {
          toast({
            title: 'Error',
            description: 'Failed to load directors',
            variant: 'destructive',
          });
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchDirectors();
    
    return () => {
      isMounted = false;
    };
  }, [toast]); 

  useEffect(() => {
    if (!directors.length) return;
    
    const lowercaseSearch = searchTerm.toLowerCase();
    let filtered = directors;
    
    if (searchTerm.trim() !== '') {
      filtered = directors.filter(director => 
        `${director.name} ${director.surname}`.toLowerCase().includes(lowercaseSearch) ||
        director.about?.toLowerCase().includes(lowercaseSearch)
      );
    }
    
    setFilteredDirectors(filtered);
  }, [searchTerm, directors]);
  
  useEffect(() => {
    if (loading || !filteredDirectors.length) return;
    
    setDisplayedDirectors(filteredDirectors.slice(0, DIRECTORS_PER_BATCH));
    setHasMore(filteredDirectors.length > DIRECTORS_PER_BATCH);
  }, [filteredDirectors, loading]);
  
  useEffect(() => {
    if (!observerRef.current || !hasMore || loadingMore || loading) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          loadMoreDirectors();
        }
      },
      { threshold: 0.5 }
    );
    
    observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, displayedDirectors.length]);
  
  const loadMoreDirectors = useCallback(() => {
    if (loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    
    setTimeout(() => {
      const currentCount = displayedDirectors.length;
      const nextBatch = filteredDirectors.slice(currentCount, currentCount + DIRECTORS_PER_BATCH);
      
      if (nextBatch.length > 0) {
        setDisplayedDirectors(prev => [...prev, ...nextBatch]);
      }
      
      setHasMore(currentCount + nextBatch.length < filteredDirectors.length);
      setLoadingMore(false);
    }, 300);
  }, [loadingMore, hasMore, displayedDirectors.length, filteredDirectors]);

  const handleDeleteDirector = async (directorId: number) => {
    try {
      await adminApi.deleteDirector(directorId);
      toast({
        title: "Success",
        description: "Director deleted successfully",
      });
      
      const fetchDirectorsAfterDelete = async () => {
        try {
          const data = await directorsApi.getAll();
          setDirectors(data);
        } catch (error) {
          console.error('Error fetching directors after deletion:', error);
          toast({
            title: 'Error',
            description: 'Failed to refresh directors list',
            variant: 'destructive',
          });
        }
      };
      
      fetchDirectorsAfterDelete();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete director. The director may be associated with movies.",
        variant: "destructive",
      });
    } finally {
      setDeleteDirectorId(null);
    }
  };

  const getInitials = (director: Director): string => {
    return `${director.name?.charAt(0) || ''}${director.surname?.charAt(0) || ''}`;
  };
  
  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-[70vh]">
        <Loader2 className="h-8 w-8 animate-spin text-rose-600" />
        <span className="ml-2">Loading directors...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold">Directors</h1>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search directors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          
          {isAdmin && (
            <Button 
              className="bg-rose-600 hover:bg-rose-700 whitespace-nowrap"
              onClick={() => navigate('/admin/directors/new')}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add Director
            </Button>
          )}
        </div>
      </div>
      
      {filteredDirectors.length === 0 ? (
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold mb-2">No directors found</h2>
          <p className="text-gray-500">Try adjusting your search criteria</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {displayedDirectors.map((director) => (
              <Card key={director.id} className="overflow-hidden flex flex-col hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-col items-center pb-2">
                  <Avatar className="h-32 w-32">
                    {director.pictureUrl ? (
                      <img 
                        src={director.pictureUrl} 
                        alt={`${director.name} ${director.surname}`}
                        className="object-cover"
                      />
                    ) : (
                      <AvatarFallback className="text-3xl bg-rose-100 text-rose-800">
                        {getInitials(director)}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <CardTitle className="mt-4 text-center">
                    {director.name} {director.surname}
                  </CardTitle>
                  {director.birthDay && ( // Changed from birthDate to birthDay to match API
                    <p className="text-sm text-gray-500">
                      Born: {new Date(director.birthDay).getFullYear()}
                      {director.deathDay && ` - Died: ${new Date(director.deathDay).getFullYear()}`} {/* Changed from deathDate to deathDay */}
                    </p>
                  )}
                </CardHeader>
                
                <CardContent className="pb-2 flex-grow">
                  {director.about && (
                    <p className="text-sm line-clamp-3 text-center">{director.about}</p>
                  )}
                  
                  {/* Safe check for movies array */}
                  {Array.isArray(director.movies) && director.movies.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-semibold mb-2 flex items-center">
                        <Film className="h-3 w-3 mr-1" />
                        Notable works:
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {director.movies.slice(0, 3).map(movie => (
                          <Badge key={movie.id} variant="secondary" className="text-xs">
                            {movie.title}
                          </Badge>
                        ))}
                        {director.movies.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{director.movies.length - 3} more
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
                    <Link to={`/directors/${director.id}`}>View Details</Link>
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
                        <DropdownMenuItem onClick={() => navigate(`/admin/directors/edit/${director.id}`)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-red-600 focus:text-red-600"
                          onClick={() => setDeleteDirectorId(director.id)}
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
            {!hasMore && filteredDirectors.length > DIRECTORS_PER_BATCH && (
              <p className="text-sm text-muted-foreground">You've seen all directors</p>
            )}
          </div>
          
          <div className="mt-4 text-sm text-gray-500">
            Showing {displayedDirectors.length} of {filteredDirectors.length} directors
          </div>
        </>
      )}
      
      <AlertDialog open={deleteDirectorId !== null} onOpenChange={() => setDeleteDirectorId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Director</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this director? This action cannot be undone.
              Note: Directors associated with movies cannot be deleted until they are removed from all movies.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deleteDirectorId && handleDeleteDirector(deleteDirectorId)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}