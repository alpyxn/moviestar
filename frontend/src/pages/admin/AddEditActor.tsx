import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useKeycloak } from '@react-keycloak/web';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription 
} from '@/components/ui/card';
import { 
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage 
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import adminApi from '@/api/adminApi';
import actorsApi from '@/api/actorsApi';
import { CreateActorDirectorPayload } from '@/api/apiService';
import { Loader2 } from 'lucide-react';
import * as z from "zod";
import { useToast } from '@/hooks/use-toast';
import { Uploader } from '@/components/uploader';

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  surname: z.string().min(1, "Surname is required"),
  birthDay: z.string().min(1, "Birth date is required"),
  about: z.string().min(10, "Biography must be at least 10 characters"),
  pictureUrl: z.string().url("Image URL must be a valid URL").or(z.literal(""))
});

type FormSchema = z.infer<typeof formSchema>;

export default function AddEditActor() {
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  const actorId = isEditMode ? parseInt(id) : undefined;
  
  const [loading, setLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [dataFetched, setDataFetched] = useState<boolean>(false); // Add a flag to track if data was fetched
  const { toast } = useToast();
  const navigate = useNavigate();
  const { keycloak, initialized } = useKeycloak();
  
  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      surname: "",
      birthDay: "",
      about: "",
      pictureUrl: ""
    },
    mode: "onSubmit",
  });

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

  useEffect(() => {
    const fetchActorData = async () => {
      if (loading || !isEditMode || !actorId || dataFetched) return;
      
      try {
        setLoading(true);
        const actor = await actorsApi.getById(actorId);
        
        const formattedBirthDay = actor.birthDay ? 
          new Date(actor.birthDay).toISOString().split('T')[0] : '';
        
        form.reset({
          name: actor.name || '',
          surname: actor.surname || '',
          birthDay: formattedBirthDay,
          about: actor.about || '',
          pictureUrl: actor.pictureUrl || ''
        });
        
        setDataFetched(true); 
      } catch (error) {
        console.error('Error fetching actor data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load actor details',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchActorData();
  }, [actorId, isEditMode, loading, dataFetched]); 

  const onSubmit = async (data: FormSchema) => {
    const tokenValid = await ensureValidToken();
    if (!tokenValid) return;
    
    try {
      setSubmitting(true);
      
      const actorPayload: CreateActorDirectorPayload = {
        name: data.name,
        surname: data.surname,
        birthDay: data.birthDay,
        about: data.about,
        pictureUrl: data.pictureUrl
      };
      
      if (isEditMode && actorId) {
        await adminApi.updateActor(actorId, actorPayload);
        toast({
          title: "Success!",
          description: "Actor has been updated successfully",
        });
      } else {
        await adminApi.createActor(actorPayload);
        toast({
          title: "Success!",
          description: "Actor has been created successfully",
        });
      }
      
      navigate('/actors');
    } catch (error: unknown) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} actor:`, error);
      
      if ((error as any).response) {
        console.error('Server response error:', {
          status: (error as any).response.status,
          data: (error as any).response.data
        });
        
        toast({
          title: `Error (${(error as any).response.status})`,
          description: (error as any).response.data?.message || `Failed to ${isEditMode ? 'update' : 'create'} actor. Please check the form data.`,
          variant: "destructive"
        });
      } else if ((error as any).request) {
        console.error('No response received:', (error as any).request);
        toast({
          title: "Network Error",
          description: "The server did not respond. Please check your connection.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Error",
          description: `Failed to ${isEditMode ? 'update' : 'create'} actor. Please try again.`,
          variant: "destructive"
        });
      }
      
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
        <span className="ml-2">Loading actor data...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">{isEditMode ? 'Edit Actor' : 'Add New Actor'}</h1>
      
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>{isEditMode ? 'Edit Actor Details' : 'Actor Details'}</CardTitle>
          <CardDescription>
            {isEditMode 
              ? 'Update the information for this actor.' 
              : 'Enter the information for the new actor.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter first name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="surname"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter last name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="birthDay"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Birth Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="about"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Biography</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter actor biography"
                        className="min-h-[120px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="pictureUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Profile Picture</FormLabel>
                    <FormControl>
                      <Uploader 
                        onImageUploaded={field.onChange}
                        defaultImage={field.value}
                        className="mt-2"
                        id="profile-upload"
                        aspectRatio="square" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <CardFooter className="flex justify-between px-0 pt-4">
                <Button variant="outline" type="button" onClick={() => navigate('/actors')}>
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
                    isEditMode ? 'Update Actor' : 'Create Actor'
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
