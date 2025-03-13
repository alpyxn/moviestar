import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import moviesApi from "@/api/movieApi";
import { Movie } from "@/api/apiService";
import { Loader2, ArrowRight, Star, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function LandingPage() {
  const [featuredMovies, setFeaturedMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    async function fetchMovies() {
      try {
        setLoading(true);
        // Using getAll() instead of getFeaturedMovies() which doesn't exist
        const data = await moviesApi.getAll();
        if (!isMounted) return;
        // Take just the first few movies to show as featured
        setFeaturedMovies(data.slice(0, 3));
      } catch (error) {
        console.error('Failed to fetch featured movies:', error);
        // Not showing a toast here since it's not critical for landing page UX
        if (isMounted) {
          setFeaturedMovies([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    
    fetchMovies();
    
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="flex flex-col items-center">
      {/* Hero Section - Responsive height and improved visual appearance */}
      <section className="relative w-full min-h-[80vh] sm:min-h-[90vh] flex flex-col items-center justify-center text-center bg-gradient-to-r from-gray-200 via-gray-300 to-gray-400 mt-0">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative z-10 px-4 max-w-3xl mx-auto">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-800 mb-4 sm:mb-6">Welcome to MovieStar</h1>
          <p className="text-lg sm:text-xl text-gray-700 mb-6 sm:mb-8 max-w-xl mx-auto">
            Discover, rate, and discuss your favorite movies with fellow film enthusiasts
          </p>
          <Link to="/movies">
            <Button size="lg" className="bg-rose-600 text-white hover:bg-rose-500 shadow-md text-base sm:text-lg px-6 py-5 h-auto">
              Explore Movies
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section - Improved responsive layout and added icons */}
      <section className="w-full py-12 sm:py-16 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 px-4">
          <Card className="overflow-hidden bg-white dark:bg-gray-800 shadow-md hover:shadow-xl transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="inline-flex p-3 mb-4 bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 rounded-xl">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-3.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-1.5A1.125 1.125 0 0118 18.375M20.625 4.5H3.375m17.25 0c.621 0 1.125.504 1.125 1.125M20.625 4.5h-1.5C18.504 4.5 18 5.004 18 5.625m3.75 0v1.5c0 .621-.504 1.125-1.125 1.125M3.375 4.5c-.621 0-1.125.504-1.125 1.125M3.375 4.5h1.5C5.496 4.5 6 5.004 6 5.625m-3.75 0v1.5c0 .621.504 1.125 1.125 1.125m0 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m1.5-3.75C5.496 8.25 6 7.746 6 7.125v-1.5M4.875 8.25C5.496 8.25 6 8.754 6 9.375v1.5m0-5.25v5.25m0-5.25C6 5.004 6.504 4.5 7.125 4.5h9.75c.621 0 1.125.504 1.125 1.125m1.125 2.625h1.5m-1.5 0A1.125 1.125 0 0118 7.125v-1.5m1.125 2.625c-.621 0-1.125.504-1.125 1.125v1.5m0 0v1.5c0 .621-.504 1.125-1.125 1.125m0 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m-1.5-6.75h1.5c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125h-1.5m-7.5 0h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m-7.5-6.75h1.5m-1.5 0A1.125 1.125 0 017.125 7.125v1.5" />
                </svg>
              </div>
              <h3 className="text-xl sm:text-2xl font-semibold mb-2 text-gray-800 dark:text-gray-200">Explore Films</h3>
              <p className="text-gray-600 dark:text-gray-300">Browse an extensive catalog of distinguished works from around the world.</p>
            </CardContent>
          </Card>
          
          <Card className="overflow-hidden bg-white dark:bg-gray-800 shadow-md hover:shadow-xl transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="inline-flex p-3 mb-4 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-xl">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                </svg>
              </div>
              <h3 className="text-xl sm:text-2xl font-semibold mb-2 text-gray-800 dark:text-gray-200">Review & Reflect</h3>
              <p className="text-gray-600 dark:text-gray-300">Share thoughtful insights and engage in discussions with fellow cinema lovers.</p>
            </CardContent>
          </Card>
          
          <Card className="overflow-hidden bg-white dark:bg-gray-800 shadow-md hover:shadow-xl transition-shadow sm:col-span-2 md:col-span-1 sm:max-w-lg sm:mx-auto md:max-w-none">
            <CardContent className="p-6 text-center">
              <div className="inline-flex p-3 mb-4 bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 rounded-xl">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 007.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
                </svg>
              </div>
              <h3 className="text-xl sm:text-2xl font-semibold mb-2 text-gray-800 dark:text-gray-200">Stay Informed</h3>
              <p className="text-gray-600 dark:text-gray-300">Stay updated on the latest releases, trends, and developments in cinema.</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Featured Movies Section - Improved cards and loading state */}
      <section className="w-full py-12 sm:py-16 bg-gray-100 dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-200">Featured Movies</h2>
            <Link to="/movies" className="text-rose-600 hover:text-rose-700 flex items-center text-sm sm:text-base">
              View all <ArrowRight size={16} className="ml-1" />
            </Link>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-rose-600" />
              <span className="ml-2 text-gray-600 dark:text-gray-300">Loading featured movies...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {featuredMovies.length > 0 ? featuredMovies.map((movie) => (
                <Card 
                  key={movie.id} 
                  className="overflow-hidden bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col h-full"
                >
                  <Link to={`/movies/${movie.id}`} className="group">
                    <div className="h-48 sm:h-56 md:h-64 bg-gray-200 dark:bg-gray-700 relative overflow-hidden">
                      {movie.posterURL && (
                        <img 
                          src={movie.posterURL} 
                          alt={movie.title} 
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.onerror = null;
                            target.src = '/placeholder-poster.jpg';
                          }}
                        />
                      )}
                      <div className="absolute top-2 right-2 bg-black bg-opacity-70 rounded-full px-2 py-1 flex items-center">
                        <Star className="h-3 w-3 text-yellow-400 mr-1" />
                        <span className="text-xs font-bold text-white">
                          {movie.averageRating?.toFixed(1) || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </Link>
                  <CardContent className="p-5 flex-grow flex flex-col">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 line-clamp-1">
                        {movie.title}
                      </h3>
                      <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                        <Calendar className="h-3 w-3 mr-1" />
                        <span>{movie.year}</span>
                      </div>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 line-clamp-3 mb-4 flex-grow">
                      {movie.description}
                    </p>
                    <Link 
                      to={`/movies/${movie.id}`} 
                      className="mt-auto inline-flex items-center text-rose-600 hover:text-rose-700 dark:text-rose-500 dark:hover:text-rose-400 font-medium"
                    >
                      View details
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </CardContent>
                </Card>
              )) : (
                <div className="col-span-1 sm:col-span-2 lg:col-span-3 text-center py-12">
                  <p className="text-gray-500 dark:text-gray-400">No featured movies available at this time.</p>
                  <Button asChild className="mt-4 bg-rose-600 hover:bg-rose-700">
                    <Link to="/movies">Browse All Movies</Link>
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* New Call-to-Action Section */}
      <section className="w-full py-16 bg-rose-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">Ready to explore more movies?</h2>
          <p className="text-lg mb-6 max-w-2xl mx-auto">
            Join our community today to discover new films, share your thoughts, and connect with other movie enthusiasts.
          </p>
          <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-rose-600">
            <Link to="/movies">Get Started</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}