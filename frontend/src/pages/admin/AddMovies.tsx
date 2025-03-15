import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useKeycloak } from '@react-keycloak/web'; 
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription 
} from '@/components/ui/card';
import { 
  Form, FormControl,  FormField, FormItem, FormLabel, FormMessage 
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import adminApi from '@/api/adminApi';
import { CreateMoviePayload, Genre, Actor, Director } from '@/api/apiService';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';
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
  actorIds: z.array(z.number()).default([]), // Made optional
  directorIds: z.array(z.number()).default([]), // Made optional
  posterURL: z.string().url("Poster URL must be a valid URL").or(z.literal("")),
  backdropURL: z.string().url("Backdrop URL must be a valid URL").or(z.literal(""))
});

type FormSchema = z.infer<typeof formSchema>;

export default function AddMovies() {
  const [genres, setGenres] = useState<Genre[]>([]);
  const [actors, setActors] = useState<Actor[]>([]);
  const [directors, setDirectors] = useState<Director[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { keycloak, initialized } = useKeycloak();
  
  // Initialize form
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
    mode: "onSubmit", // Only validate on submit
  });

  // Function to manually refresh token before API calls
  const ensureValidToken = async () => {
    if (!initialized) return false;
    if (!keycloak.authenticated) {
      keycloak.login();
      return false;
    }
    
    try {
      await keycloak.updateToken(60);
      return true;
    } catch (error) {
      keycloak.login();
      return false;
    }
  };

  useEffect(() => {
    let mounted = true;
    
    const fetchData = async () => {
      if (!initialized) {
        return;
      }
      
      if (!keycloak.authenticated) {
        keycloak.login();
        return;
      }
      
      try {
        setLoading(true);
        
        // Use the admin endpoints
        const response = await Promise.all([
          adminApi.getGenres(),
          adminApi.getActors(),
          adminApi.getDirectors()
        ]);
        
        if (!mounted) return;
        
        const [genresData, actorsData, directorsData] = response;
        
        setGenres(genresData);
        setActors(actorsData);
        setDirectors(directorsData);
        
      } catch (error: unknown) {
        if (mounted) {
          toast({
            title: "Error",
            description: "Failed to load necessary data for the form",
            variant: "destructive"
          });
        }
        
        if ((error as any).response?.status === 401 && mounted) {
          keycloak.login();
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
  }, [toast, keycloak, initialized]);

  const onSubmit = async (data: FormSchema) => {
    // Ensure valid token before submitting
    const tokenValid = await ensureValidToken();
    if (!tokenValid) return;
    
    try {
      setSubmitting(true);
      
      // Create the movie with the form data
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
      
      await adminApi.createMovie(moviePayload);
      
      toast({
        title: "Success!",
        description: "Movie has been successfully created",
      });
      
      // Redirect to the movies list page
      navigate('/admin/movies');
    } catch (error: unknown) {
      console.error("Error creating movie:", error);
      toast({
        title: "Error",
        description: "Failed to create movie. Please try again.",
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
        <span className="ml-2">Loading form data...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Add New Movie</h1>
      
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Movie Details</CardTitle>
          <CardDescription>
            Enter the information for the new movie.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* Form fields as before... */}
              
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
                  
                  {/* Genres Section - Multiple Select with Checkboxes */}
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

                  {/* Directors Section - Multiple Select with Checkboxes */}
                  <FormField
                    control={form.control}
                    name="directorIds"
                    render={({ /* field, */ fieldState }) => (
                      <FormItem>
                        <FormLabel>Directors</FormLabel>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {directors.map((director) => (
                            <FormField
                              key={director.id}
                              control={form.control}
                              name="directorIds"
                              render={({ field }) => {
                                return (
                                  <FormItem
                                    key={director.id}
                                    className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3"
                                  >
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(director.id)}
                                        onCheckedChange={(checked) => {
                                          return checked
                                            ? field.onChange([...field.value, director.id])
                                            : field.onChange(
                                                field.value?.filter(
                                                  (value) => value !== director.id
                                                )
                                              )
                                        }}
                                      />
                                    </FormControl>
                                    <FormLabel className="font-normal">
                                      {director.name} {director.surname}
                                    </FormLabel>
                                  </FormItem>
                                );
                              }}
                            />
                          ))}
                        </div>
                        {fieldState?.error && (
                          <p className="text-sm font-medium text-destructive">{fieldState.error.message}</p>
                        )}
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
                
                {/* Right column */}
                <div className="space-y-6">
                  {/* Poster URL with Uploader - Set to vertical aspect ratio */}
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
                            aspectRatio="vertical" // Set vertical aspect ratio for poster
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Backdrop URL with Uploader - Keep horizontal aspect ratio */}
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
                            aspectRatio="horizontal" // Set horizontal aspect ratio for backdrop
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              {/* Actors Section */}
              <div>
                <FormField
                  control={form.control}
                  name="actorIds"
                  render={({ /* field, */ fieldState }) => (
                    <FormItem>
                      <FormLabel className="text-lg font-semibold">Actors</FormLabel>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mt-2">
                        {actors.map((actor) => (
                          <FormField
                            key={actor.id}
                            control={form.control}
                            name="actorIds"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={actor.id}
                                  className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(actor.id)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...field.value, actor.id])
                                          : field.onChange(
                                              field.value?.filter(
                                                (value) => value !== actor.id
                                              )
                                            )
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal">
                                    {actor.name} {actor.surname}
                                  </FormLabel>
                                </FormItem>
                              );
                            }}
                          />
                        ))}
                      </div>
                      {fieldState?.error && (
                        <p className="text-sm font-medium text-destructive">{fieldState.error.message}</p>
                      )}
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Display form level errors - keep only required fields */}
              {form.formState.isSubmitted && Object.keys(form.formState.errors).length > 0 && (
                <div className="text-sm font-medium text-destructive">
                  {form.formState.errors.genreIds && (
                    <p>{form.formState.errors.genreIds.message}</p>
                  )}
                </div>
              )}
              
              <CardFooter className="flex justify-between px-0 pt-4">
                <Button variant="outline" type="button" onClick={() => navigate('/admin/movies')}>
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
                      Creating...
                    </>
                  ) : (
                    'Create Movie'
                  )}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}