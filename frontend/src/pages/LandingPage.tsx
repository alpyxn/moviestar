import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import moviesApi from "@/api/movieApi";
import { Movie } from "@/api/apiService";
import { Loader2, ArrowRight, Star, Calendar, Popcorn, Play } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useKeycloak } from "@react-keycloak/web";

export default function LandingPage() {
  const [randomMovies, setRandomMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const { keycloak, initialized } = useKeycloak();
  const isAuthenticated = initialized && keycloak.authenticated;

  useEffect(() => {
    let isMounted = true;
    
    async function fetchRandomMovies() {
      try {
        setLoading(true);
        // Get all movies
        const data = await moviesApi.getAll();
        if (!isMounted) return;
        
        // Shuffle the array to get random movies
        const shuffled = [...data].sort(() => 0.5 - Math.random());
        
        // Take just a few movies to show
        setRandomMovies(shuffled.slice(0, 5));
      } catch (error) {
        console.error('Failed to fetch movies:', error);
        if (isMounted) {
          setRandomMovies([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    
    fetchRandomMovies();
    
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="flex flex-col items-center">
      {/* Hero Section */}
      <section className="relative w-full min-h-[85vh] flex flex-col items-center justify-center text-center bg-gradient-to-br from-slate-900 via-rose-900 to-slate-900 mt-0">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-[url('/hero-bg.jpg')] bg-cover bg-center opacity-20"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80"></div>
        </div>
        <div className="relative z-10 px-4 max-w-4xl mx-auto">
          <div className="mb-6 animate-fade-in-down">
            <Popcorn className="h-16 w-16 mx-auto text-rose-400 mb-4" />
          </div>
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-white mb-6 tracking-tight animate-fade-in-down">
            Discover Your Next <span className="text-rose-400">Favorite Film</span>
          </h1>
          <p className="text-xl sm:text-2xl text-gray-200 mb-8 max-w-2xl mx-auto animate-fade-in-up">
            Explore, rate, and share cinematic experiences with fellow film enthusiasts
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 animate-fade-in-up">
            <Button 
              asChild 
              size="lg" 
              className="bg-rose-600 text-white hover:bg-rose-500 transition-all duration-300 text-lg px-8 py-6 h-auto rounded-full shadow-lg hover:shadow-rose-500/30"
            >
              <Link to="/movies">
                <Play className="h-5 w-5 mr-2" />
                Explore Movies
              </Link>
            </Button>
            
            {!isAuthenticated && (
              <Button 
                onClick={() => keycloak.login()} 
                size="lg" 
                className="bg-white/10 text-white hover:bg-white/20 border-2 border-rose-400 transition-all duration-300 text-lg px-8 py-6 h-auto rounded-full shadow-lg backdrop-blur-sm"
              >
                Sign Up
              </Button>
            )}
          </div>
        </div>
        
        {/* Decorative animated wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" className="w-full">
            <path fill="#f8fafc" fillOpacity="1" d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,224C672,245,768,267,864,261.3C960,256,1056,224,1152,208C1248,192,1344,192,1392,192L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
          </svg>
        </div>
      </section>

      {/* Completely rebuilt Random Movies Section */}
      <section className="w-full py-16 bg-gradient-to-b from-white to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-gray-100 mb-3">Random Movies from Collection</h2>
          <div className="w-16 h-1 bg-rose-600 rounded-full mb-4 mx-auto"></div>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto px-4">
            Discover something unexpected from our diverse movie collection
          </p>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-rose-600" />
            <span className="ml-3 text-gray-600 dark:text-gray-300">Finding movies for you...</span>
          </div>
        ) : (
          <div className="px-4">
            {randomMovies.length > 0 ? (
              <>
                {/* Updated flexbox container with larger cards */}
                <div className="flex flex-wrap justify-center gap-5" style={{ maxWidth: '1200px', margin: '0 auto' }}>
                  {randomMovies.map((movie) => (
                    <div key={movie.id} style={{ width: '190px' }}>
                      <Card 
                        className="overflow-hidden bg-white dark:bg-gray-800 shadow hover:shadow-md transition-all duration-300 h-full group rounded-lg border-0"
                      >
                        <Link to={`/movies/${movie.id}`} className="group w-full">
                          <div className="aspect-[2/3] w-full relative overflow-hidden">
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
                            <div className="absolute top-2 right-2 bg-black/70 rounded-full px-2 py-0.5 flex items-center">
                              <Star className="h-3 w-3 text-yellow-400 mr-0.5 fill-yellow-400" />
                              <span className="text-xs font-bold text-white">
                                {movie.averageRating?.toFixed(1) || 'N/A'}
                              </span>
                            </div>
                          </div>
                        </Link>
                        <CardContent className="p-3 flex flex-col">
                          <h3 className="text-sm font-medium text-gray-800 dark:text-gray-100 line-clamp-1">
                            {movie.title}
                          </h3>
                          <div className="flex items-center text-gray-500 dark:text-gray-400 mt-1 mb-1">
                            <Calendar className="h-3 w-3 mr-1" />
                            <span className="text-xs">{movie.year}</span>
                          </div>
                          <Link 
                            to={`/movies/${movie.id}`} 
                            className="mt-auto inline-flex items-center text-xs text-rose-600 hover:text-rose-700 dark:text-rose-500 dark:hover:text-rose-400 font-medium"
                          >
                            More Info
                            <ArrowRight className="ml-1 h-3 w-3" />
                          </Link>
                        </CardContent>
                      </Card>
                    </div>
                  ))}
                </div>
                
                <div className="text-center mt-8">
                  <Button 
                    asChild 
                    variant="outline" 
                    size="sm" 
                    className="border border-rose-600 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-900/20"
                  >
                    <Link to="/movies" className="flex items-center">
                      Explore All Movies
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-12 w-full">
                <p className="text-gray-500 dark:text-gray-400 mb-4">No movies available at this time.</p>
                <Button asChild className="bg-rose-600 hover:bg-rose-700">
                  <Link to="/movies">Browse All Movies</Link>
                </Button>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Features Section - Moved down */}
      <section className="w-full py-24 bg-slate-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-gray-800 dark:text-gray-100">
              The Ultimate Movie Experience
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Connect with a vibrant community of film enthusiasts and discover movies tailored to your taste
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12">
            <Card className="overflow-hidden bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-300 border-t-4 border-rose-500 rounded-xl">
              <CardContent className="p-8 text-center">
                <div className="inline-flex p-4 mb-6 bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-3.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-1.5A1.125 1.125 0 0118 18.375M20.625 4.5H3.375m17.25 0c.621 0 1.125.504 1.125 1.125M20.625 4.5h-1.5C18.504 4.5 18 5.004 18 5.625m3.75 0v1.5c0 .621-.504 1.125-1.125 1.125M3.375 4.5c-.621 0-1.125.504-1.125 1.125M3.375 4.5h1.5C5.496 4.5 6 5.004 6 5.625m-3.75 0v1.5c0 .621.504 1.125 1.125 1.125m0 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m1.5-3.75C5.496 8.25 6 7.746 6 7.125v-1.5M4.875 8.25C5.496 8.25 6 8.754 6 9.375v1.5m0-5.25v5.25m0-5.25C6 5.004 6.504 4.5 7.125 4.5h9.75c.621 0 1.125.504 1.125 1.125m1.125 2.625h1.5m-1.5 0A1.125 1.125 0 0118 7.125v-1.5m1.125 2.625c-.621 0-1.125.504-1.125 1.125v1.5m0 0v1.5c0 .621-.504 1.125-1.125 1.125m0 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m-1.5-6.75h1.5c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125h-1.5m-7.5 0h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m-7.5-6.75h1.5m-1.5 0A1.125 1.125 0 017.125 7.125v1.5" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-3 text-gray-800 dark:text-gray-200">Curated Collection</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">Discover hand-picked films from classics to new releases across all genres</p>
                <Link to="/movies" className="inline-flex items-center text-rose-600 hover:text-rose-700 font-medium">
                  Browse Collection
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </CardContent>
            </Card>
            
            <Card className="overflow-hidden bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-300 border-t-4 border-blue-500 rounded-xl">
              <CardContent className="p-8 text-center">
                <div className="inline-flex p-4 mb-6 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-3 text-gray-800 dark:text-gray-200">Engage & Connect</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">Share your thoughts and engage in meaningful conversations about cinema</p>
                <Link to="/movies" className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium">
                  Join Discussions
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </CardContent>
            </Card>
            
            <Card className="overflow-hidden bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-300 border-t-4 border-green-500 rounded-xl">
              <CardContent className="p-8 text-center">
                <div className="inline-flex p-4 mb-6 bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 007.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-3 text-gray-800 dark:text-gray-200">Personalized Experience</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">Create watchlists, rate films, and receive recommendations tailored to your taste</p>
                <Link to="/movies" className="inline-flex items-center text-green-600 hover:text-green-700 font-medium">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}