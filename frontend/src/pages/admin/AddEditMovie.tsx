import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useKeycloak } from '@react-keycloak/web';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription 
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage 
} from "@/components/ui/form";
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle 
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import adminApi from '@/api/adminApi';
import moviesApi from '@/api/movieApi';
import { CreateMoviePayload, Genre, Actor, Director } from '@/api/apiService';
import { Loader2, X, Search, UserPlus } from 'lucide-react';
import * as z from "zod";
import { useToast } from '@/hooks/use-toast';
import { Uploader } from '@/components/uploader';

// Form validation schema
const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  year: z.coerce.number()
    .min(1900, "Year must be after 1900")
    .max(new Date().getFullYear(), `Year must not be after ${new Date().getFullYear()}`),
  genreIds: z.array(z.number()).min(1, "Select at least one genre"),
  actorIds: z.array(z.number()).default([]),
  directorIds: z.array(z.number()).default([]),
  posterURL: z.string().url("Poster URL must be a valid URL").or(z.literal("")),
  backdropURL: z.string().url("Backdrop URL must be a valid URL").or(z.literal(""))
});

type FormSchema = z.infer<typeof formSchema>;

export default function AddEditMovie() {
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  const movieId = isEditMode ? parseInt(id) : undefined;
  
  const [genres, setGenres] = useState<Genre[]>([]);
  const [actors, setActors] = useState<Actor[]>([]);
  const [directors, setDirectors] = useState<Director[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  
  // Dialog state
  const [actorDialogOpen, setActorDialogOpen] = useState(false);
  const [directorDialogOpen, setDirectorDialogOpen] = useState(false);
  const [actorSearch, setActorSearch] = useState("");
  const [directorSearch, setDirectorSearch] = useState("");
  const [selectedActors, setSelectedActors] = useState<Actor[]>([]);
  const [selectedDirectors, setSelectedDirectors] = useState<Director[]>([]);
  
  const { toast } = useToast();
  const navigate = useNavigate();
  const { keycloak, initialized } = useKeycloak();
  
  // Initialize form with default values
  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      year: new Date().getFullYear(),
      genreIds: [],
      actorIds: [],
      directorIds: [],
      posterURL: "",
      backdropURL: ""
    },
    mode: "onSubmit",
  });

  // Function to manually refresh token before API calls
  const ensureValidToken = async () => {
    if (!initialized) return false;
    if (!keycloak.authenticated) {
      keycloak.login();
      return false;
    }
    
    try {
      const refreshed = await keycloak.updateToken(60);
      if (!refreshed) {
        console.log("Token still valid, no refresh needed");
      }
      return true;
    } catch (error) {
      console.error("Failed to refresh token:", error);
      keycloak.login();
      return false;
    }
  };

  // Filter actors based on search term
  const filteredActors = actors.filter(actor => 
    `${actor.name} ${actor.surname}`.toLowerCase().includes(actorSearch.toLowerCase())
  );

  // Filter directors based on search term
  const filteredDirectors = directors.filter(director => 
    `${director.name} ${director.surname}`.toLowerCase().includes(directorSearch.toLowerCase())
  );

  // Handle actor selection dialog confirm
  const handleActorSelectionConfirm = () => {
    const actorIds = selectedActors.map(actor => actor.id);
    form.setValue("actorIds", actorIds);
    setActorDialogOpen(false);
  };

  // Handle director selection dialog confirm
  const handleDirectorSelectionConfirm = () => {
    const directorIds = selectedDirectors.map(director => director.id);
    form.setValue("directorIds", directorIds);
    setDirectorDialogOpen(false);
  };

  // Toggle actor selection
  const toggleActorSelection = (actor: Actor) => {
    setSelectedActors(prevSelected => {
      if (prevSelected.some(a => a.id === actor.id)) {
        return prevSelected.filter(a => a.id !== actor.id);
      } else {
        return [...prevSelected, actor];
      }
    });
  };

  // Toggle director selection
  const toggleDirectorSelection = (director: Director) => {
    setSelectedDirectors(prevSelected => {
      if (prevSelected.some(d => d.id === director.id)) {
        return prevSelected.filter(d => d.id !== director.id);
      } else {
        return [...prevSelected, director];
      }
    });
  };

  // Remove actor from selection
  const removeActor = (actorId: number) => {
    setSelectedActors(selectedActors.filter(actor => actor.id !== actorId));
    const updatedActorIds = form.getValues("actorIds").filter(id => id !== actorId);
    form.setValue("actorIds", updatedActorIds);
  };

  // Remove director from selection
  const removeDirector = (directorId: number) => {
    setSelectedDirectors(selectedDirectors.filter(director => director.id !== directorId));
    const updatedDirectorIds = form.getValues("directorIds").filter(id => id !== directorId);
    form.setValue("directorIds", updatedDirectorIds);
  };

  // Fetch form data and movie details if in edit mode
  useEffect(() => {
    let mounted = true;
    
    const fetchData = async () => {
      if (!initialized) {
        console.log("Keycloak not initialized yet");
        return;
      }
      
      try {
        setLoading(true);
        
        // Check token before making admin API calls
        if (keycloak.authenticated) {
          try {
            await keycloak.updateToken(30);
          } catch (refreshError) {
            console.error("Token refresh failed:", refreshError);
            keycloak.login();
            return;
          }
        }
        
        // Fetch all necessary data
        const [genresData, actorsData, directorsData] = await Promise.all([
          adminApi.getGenres(),
          adminApi.getActors(),
          adminApi.getDirectors()
        ]);
        
        if (!mounted) return;
        
        setGenres(genresData);
        setActors(actorsData);
        setDirectors(directorsData);
        
        // If in edit mode, fetch the movie details
        if (isEditMode && movieId) {
          console.log(`Fetching movie data for ID: ${movieId}`);
          try {
            const movieData = await moviesApi.getById(movieId);
            console.log("Movie data retrieved:", movieData);
            
            if (!mounted) return;
            
            // Set the selected actors and directors
            if (movieData.actors) {
              setSelectedActors(movieData.actors);
            }
            
            if (movieData.directors) {
              setSelectedDirectors(movieData.directors);
            }
            
            // Pre-populate form with movie data
            form.reset({
              title: movieData.title || "",
              description: movieData.description || "",
              year: movieData.year || new Date().getFullYear(),
              genreIds: movieData.genres?.map(g => g.id) || [],
              actorIds: movieData.actors?.map(a => a.id) || [],
              directorIds: movieData.directors?.map(d => d.id) || [],
              posterURL: movieData.posterURL || "",
              backdropURL: movieData.backdropURL || ""
            });
          } catch (movieError) {
            console.error(`Error fetching movie with ID ${movieId}:`, movieError);
            if (mounted) {
              toast({
                title: "Error",
                description: `Could not load movie with ID ${movieId}`,
                variant: "destructive"
              });
            }
          }
        }
      } catch (error) {
        console.error("Error loading form data:", error);
        if (mounted) {
          toast({
            title: "Error",
            description: "Failed to load necessary data for the form",
            variant: "destructive"
          });
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchData();
    
    // Cleanup function
    return () => {
      mounted = false;
    };
  }, [initialized, isEditMode, movieId, form]);  // Dependencies cleaned up

  const onSubmit = async (data: FormSchema) => {
    // Ensure valid token before submitting
    const tokenValid = await ensureValidToken();
    if (!tokenValid) return;
    
    try {
      setSubmitting(true);
      
      // Create the movie payload
      const moviePayload: CreateMoviePayload = {
        title: data.title,
        description: data.description,
        year: data.year,
        genreIds: data.genreIds,
        actorIds: data.actorIds,
        directorIds: data.directorIds,
        posterURL: data.posterURL,
        backdropURL: data.backdropURL
      };
      
      if (isEditMode && movieId) {
        // Update existing movie
        await adminApi.updateMovie(movieId, moviePayload);
        toast({
          title: "Success!",
          description: "Movie has been updated successfully",
        });
      } else {
        // Create new movie
        await adminApi.createMovie(moviePayload);
        toast({
          title: "Success!",
          description: "Movie has been created successfully",
        });
      }
      
      // Redirect to the movies list page
      navigate('/movies');
    } catch (error: unknown) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} movie:`, error);
      toast({
        title: "Error",
        description: `Failed to ${isEditMode ? 'update' : 'create'} movie. Please try again.`,
        variant: "destructive"
      });
      
      // If authentication error, redirect to login
      if ((error as any).response?.status === 401) {
        keycloak.login();
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!initialized || !keycloak.authenticated) {
    return (
      <div className="flex justify-center items-center h-[70vh]">
        <Loader2 className="h-8 w-8 animate-spin text-rose-600" />
        <span className="ml-2">{!initialized ? "Initializing authentication..." : "Authenticating..."}</span>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[70vh]">
        <Loader2 className="h-8 w-8 animate-spin text-rose-600" />
        <span className="ml-2">Loading data...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">{isEditMode ? 'Edit Movie' : 'Add New Movie'}</h1>
      
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>{isEditMode ? 'Edit Movie Details' : 'Movie Details'}</CardTitle>
          <CardDescription>
            {isEditMode 
              ? 'Update the information for this movie.' 
              : 'Enter the information for the new movie.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-6">
                  {/* Basic Information */}
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Movie Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter movie title" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="year"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Release Year</FormLabel>
                        <FormControl>
                          <Input type="number" min={1900} max={new Date().getFullYear()} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Genres Section */}
                  <FormField
                    control={form.control}
                    name="genreIds"
                    render={() => (
                      <FormItem>
                        <FormLabel>Genres</FormLabel>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {genres.map((genre) => (
                            <FormField
                              key={genre.id}
                              control={form.control}
                              name="genreIds"
                              render={({ field }) => {
                                return (
                                  <FormItem
                                    key={genre.id}
                                    className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3"
                                  >
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(genre.id)}
                                        onCheckedChange={(checked) => {
                                          return checked
                                            ? field.onChange([...field.value, genre.id])
                                            : field.onChange(
                                                field.value?.filter(
                                                  (value) => value !== genre.id
                                                )
                                              )
                                        }}
                                      />
                                    </FormControl>
                                    <FormLabel className="font-normal">
                                      {genre.genre}
                                    </FormLabel>
                                  </FormItem>
                                );
                              }}
                            />
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter movie description"
                            className="min-h-[120px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="space-y-6">
                  {/* Poster URL with Uploader */}
                  <FormField
                    control={form.control}
                    name="posterURL"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Poster Image</FormLabel>
                        <FormControl>
                          <Uploader 
                            onImageUploaded={field.onChange}
                            defaultImage={field.value}
                            className="mt-2"
                            id="poster-upload"
                            aspectRatio="vertical"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Backdrop URL with Uploader */}
                  <FormField
                    control={form.control}
                    name="backdropURL"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Backdrop Image</FormLabel>
                        <FormControl>
                          <Uploader 
                            onImageUploaded={field.onChange}
                            defaultImage={field.value}
                            className="mt-2"
                            id="backdrop-upload"
                            aspectRatio="horizontal"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              {/* Actors Section - Replaced with dialog selection */}
              <div className="border p-4 rounded-md">
                <FormField
                  control={form.control}
                  name="actorIds"
                  render={({ /* field, */ fieldState }) => (
                    <FormItem>
                      <div className="flex justify-between items-center mb-4">
                        <FormLabel className="text-lg font-semibold m-0">Actors</FormLabel>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setActorDialogOpen(true)}
                          className="flex items-center gap-2"
                        >
                          <UserPlus size={16} />
                          Select Actors
                        </Button>
                      </div>
                      
                      {/* Show selected actors */}
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedActors.length > 0 ? (
                          selectedActors.map(actor => (
                            <Badge 
                              key={actor.id} 
                              variant="secondary"
                              className="flex items-center gap-1 py-1.5 pl-3 pr-2"
                            >
                              {actor.name} {actor.surname}
                              <button 
                                type="button"
                                onClick={() => removeActor(actor.id)} 
                                className="ml-1 rounded-full hover:bg-rose-100 p-0.5"
                              >
                                <X size={14} className="text-rose-500" />
                              </button>
                            </Badge>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">No actors selected</p>
                        )}
                      </div>
                      
                      {fieldState?.error && (
                        <p className="text-sm font-medium text-destructive mt-2">{fieldState.error.message}</p>
                      )}
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Directors Section - Replaced with dialog selection */}
              <div className="border p-4 rounded-md">
                <FormField
                  control={form.control}
                  name="directorIds"
                  render={({ /* field, */ fieldState }) => (
                    <FormItem>
                      <div className="flex justify-between items-center mb-4">
                        <FormLabel className="text-lg font-semibold m-0">Directors</FormLabel>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setDirectorDialogOpen(true)}
                          className="flex items-center gap-2"
                        >
                          <UserPlus size={16} />
                          Select Directors
                        </Button>
                      </div>
                      
                      {/* Show selected directors */}
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedDirectors.length > 0 ? (
                          selectedDirectors.map(director => (
                            <Badge 
                              key={director.id} 
                              variant="secondary"
                              className="flex items-center gap-1 py-1.5 pl-3 pr-2"
                            >
                              {director.name} {director.surname}
                              <button 
                                type="button"
                                onClick={() => removeDirector(director.id)} 
                                className="ml-1 rounded-full hover:bg-rose-100 p-0.5"
                              >
                                <X size={14} className="text-rose-500" />
                              </button>
                            </Badge>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">No directors selected</p>
                        )}
                      </div>
                      
                      {fieldState?.error && (
                        <p className="text-sm font-medium text-destructive mt-2">{fieldState.error.message}</p>
                      )}
                    </FormItem>
                  )}
                />
              </div>
              
              <CardFooter className="flex justify-between px-0 pt-4">
                <Button variant="outline" type="button" onClick={() => navigate('/movies')}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-rose-600 hover:bg-rose-700" 
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isEditMode ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    isEditMode ? 'Update Movie' : 'Create Movie'
                  )}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      {/* Actor Selection Dialog */}
      <Dialog open={actorDialogOpen} onOpenChange={setActorDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Select Actors</DialogTitle>
            <DialogDescription>
              Search and select actors for the movie.
            </DialogDescription>
          </DialogHeader>
          
          <div className="relative mb-4 mt-2">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search actors..."
              className="pl-8"
              value={actorSearch}
              onChange={(e) => setActorSearch(e.target.value)}
            />
          </div>
          
          <ScrollArea className="flex-1 border rounded-md">
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-2">
              {filteredActors.length > 0 ? (
                filteredActors.map(actor => {
                  const isSelected = selectedActors.some(a => a.id === actor.id);
                  return (
                    <div 
                      key={actor.id}
                      className={`flex justify-between items-center p-3 rounded-md border cursor-pointer hover:bg-secondary/50 ${
                        isSelected ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/20' : 'border-gray-200'
                      }`}
                      onClick={() => toggleActorSelection(actor)}
                    >
                      <span>{actor.name} {actor.surname}</span>
                      <Checkbox checked={isSelected} />
                    </div>
                  );
                })
              ) : (
                <p className="text-center col-span-2 py-4 text-muted-foreground">
                  No actors found matching your search
                </p>
              )}
            </div>
          </ScrollArea>
          
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setActorDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleActorSelectionConfirm}>
              Confirm Selection ({selectedActors.length})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Director Selection Dialog */}
      <Dialog open={directorDialogOpen} onOpenChange={setDirectorDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Select Directors</DialogTitle>
            <DialogDescription>
              Search and select directors for the movie.
            </DialogDescription>
          </DialogHeader>
          
          <div className="relative mb-4 mt-2">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search directors..."
              className="pl-8"
              value={directorSearch}
              onChange={(e) => setDirectorSearch(e.target.value)}
            />
          </div>
          
          <ScrollArea className="flex-1 border rounded-md">
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-2">
              {filteredDirectors.length > 0 ? (
                filteredDirectors.map(director => {
                  const isSelected = selectedDirectors.some(d => d.id === director.id);
                  return (
                    <div 
                      key={director.id}
                      className={`flex justify-between items-center p-3 rounded-md border cursor-pointer hover:bg-secondary/50 ${
                        isSelected ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/20' : 'border-gray-200'
                      }`}
                      onClick={() => toggleDirectorSelection(director)}
                    >
                      <span>{director.name} {director.surname}</span>
                      <Checkbox checked={isSelected} />
                    </div>
                  );
                })
              ) : (
                <p className="text-center col-span-2 py-4 text-muted-foreground">
                  No directors found matching your search
                </p>
              )}
            </div>
          </ScrollArea>
          
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDirectorDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleDirectorSelectionConfirm}>
              Confirm Selection ({selectedDirectors.length})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
