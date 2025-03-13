import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import moviesApi from "@/api/movieApi";
import { Movie } from "@/api/apiService";

export default function LandingPage() {
  const [featuredMovies, setFeaturedMovies] = useState<Movie[]>([]);

  useEffect(() => {
    let isMounted = true;
    
    async function fetchMovies() {
      try {
        // Using getAll() instead of getFeaturedMovies() which doesn't exist
        const data = await moviesApi.getAll();
        if (!isMounted) return;
        // Take just the first few movies to show as featured
        setFeaturedMovies(data.slice(0, 3));
      } catch (error) {
        console.error('Failed to fetch featured movies:', error);
        // Not showing a toast here since it's not critical for landing page UX
      }
    }
    
    fetchMovies();
    
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    // Remove any top padding here since it's handled in App.tsx
    <div className="flex flex-col items-center">
      {/* Hero Section - adjust min-height to fill screen properly */}
      <section className="relative w-full min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center text-center bg-gradient-to-r from-gray-200 via-gray-300 to-gray-400 mt-0">
        <div className="absolute inset-0 bg-white opacity-30"></div>
        <div className="relative z-10 px-4">
          <h1 className="text-5xl font-bold text-gray-800 mb-6">Welcome to MovieStar</h1>
          <Link to="/movies">
            <Button size="lg" className="bg-rose-600 text-white text-lg shadow-md hover:bg-rose-500">
              Explore Movies
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full py-16 bg-gray-50">
        <div className="container mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 px-4">
          <div className="text-center p-6 bg-white shadow-lg rounded-lg hover:shadow-xl transition">
            <h3 className="text-2xl font-semibold mb-2 text-gray-800">Explore Films</h3>
            <p className="text-gray-600">Browse an extensive catalog of distinguished works.</p>
          </div>
          <div className="text-center p-6 bg-white shadow-lg rounded-lg hover:shadow-xl transition">
            <h3 className="text-2xl font-semibold mb-2 text-gray-800">Review & Reflect</h3>
            <p className="text-gray-600">Share thoughtful insights and engage in discussions.</p>
          </div>
          <div className="text-center p-6 bg-white shadow-lg rounded-lg hover:shadow-xl transition">
            <h3 className="text-2xl font-semibold mb-2 text-gray-800">Stay Informed</h3>
            <p className="text-gray-600">Stay updated on the latest releases and developments.</p>
          </div>
        </div>
      </section>

      {/* Featured Movies Section */}
      <section className="w-full py-16 bg-gray-100">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">Featured Movies</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredMovies.map((movie) => (
              <div 
              key={movie.id} 
              className="text-center p-0 bg-white shadow-lg rounded-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group"
            >
              <div className="h-48 bg-gray-200 relative overflow-hidden">
                {/* If movie has an image */}
                {movie.posterURL && <img 
                  src={movie.posterURL} 
                  alt={movie.title} 
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                />}
              </div>
              <div className="p-6">
                <h3 className="text-2xl font-semibold mb-2 text-gray-800">{movie.title}</h3>
                <p className="text-gray-600 line-clamp-2">{movie.description}</p>
                <Link to={`/movies/${movie.id}`} className="mt-4 inline-block text-rose-600 hover:text-rose-700">
                  Learn more
                </Link>
              </div>
            </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}