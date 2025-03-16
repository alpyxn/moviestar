import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Film, Users, FileText, 
  BarChart2, Settings, Plus 
} from "lucide-react";
import { useEffect, useState } from "react";
import { useKeycloak } from '@react-keycloak/web'; 
import moviesApi from "@/api/movieApi";
import actorsApi from "@/api/actorsApi";
import directorsApi from "@/api/directorsApi";
import genresApi from "@/api/genresApi";

export default function AdminDashboard() {
  const [counts, setCounts] = useState({
    movies: 0,
    actors: 0,
    directors: 0,
    genres: 0,
  });
  const [loading, setLoading] = useState(true);
  const { keycloak, initialized } = useKeycloak(); 

  useEffect(() => {
    let isMounted = true;
    
    async function fetchData() {
      if (!initialized || !keycloak.authenticated) {
        return;
      }
      
      try {
        setLoading(true);
        
        if (keycloak.authenticated) {
          try {
            await keycloak.updateToken(30);
          } catch (refreshError) {
            return;
          }
        }
        
        const [movies, actors, directors, genres] = await Promise.all([
          moviesApi.getAll(),
          actorsApi.getAll(),
          directorsApi.getAll(),
          genresApi.getAll()
        ]);
        
        if (!isMounted) return;

        setCounts({
          movies: movies.length,
          actors: actors.length,
          directors: directors.length,
          genres: genres.length
        });
      } catch (error) {
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchData();
    
    return () => {
      isMounted = false;
    };
  }, [initialized, keycloak.authenticated]);  

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-gray-500 mt-1">Manage your MovieStar platform</p>
        </div>
        <div className="mt-4 md:mt-0">
          <Link to="/admin/movies/new">
            <Button className="bg-rose-600 hover:bg-rose-700">
              <Plus className="mr-2 h-4 w-4" /> Add New Movie
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Movies</p>
                <h3 className="text-2xl font-bold">{loading ? "..." : counts.movies}</h3>
              </div>
              <Film className="h-8 w-8 text-rose-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Actors</p>
                <h3 className="text-2xl font-bold">{loading ? "..." : counts.actors}</h3>
              </div>
              <Users className="h-8 w-8 text-blue-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Directors</p>
                <h3 className="text-2xl font-bold">{loading ? "..." : counts.directors}</h3>
              </div>
              <FileText className="h-8 w-8 text-emerald-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Genres</p>
                <h3 className="text-2xl font-bold">{loading ? "..." : counts.genres}</h3>
              </div>
              <BarChart2 className="h-8 w-8 text-purple-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Movies Management */}
        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Film className="h-5 w-5 text-rose-600" />
              <CardTitle>Movies Management</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Link to="/movies">
                <Button variant="outline" className="w-full justify-start">View All Movies</Button>
              </Link>
              <Link to="/admin/movies/new">
                <Button variant="outline" className="w-full justify-start">Add New Movie</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Actors Management */}
        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <CardTitle>Actors Management</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Link to="/actors">
                <Button variant="outline" className="w-full justify-start">View All Actors</Button>
              </Link>
              <Link to="/admin/actors/new">
                <Button variant="outline" className="w-full justify-start">Add New Actor</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Directors Management */}
        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-emerald-600" />
              <CardTitle>Directors Management</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Link to="/directors">
                <Button variant="outline" className="w-full justify-start">View All Directors</Button>
              </Link>
              <Link to="/admin/directors/new">
                <Button variant="outline" className="w-full justify-start">Add New Director</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Genres Management */}
        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart2 className="h-5 w-5 text-purple-600" />
              <CardTitle>Genres Management</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Link to="/admin/genres">
                <Button variant="outline" className="w-full justify-start">Manage Genres</Button>
              </Link>
            </div>
          </CardContent>
        </Card>


        {/* Settings */}
        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-gray-600" />
              <CardTitle>Settings</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Link to="/admin/users">
                <Button variant="outline" className="w-full justify-start">Manage Users</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}