import { WatchlistItem } from '@/api/apiService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TabsContent } from '@/components/ui/tabs';
import { Film, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

interface WatchlistGridProps {
  username: string;
  watchlist: WatchlistItem[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  endRef: React.RefObject<HTMLDivElement>;
  totalCount: number;
  isCurrentUser: boolean;
}

export default function WatchlistGrid({
  username,
  watchlist,
  isLoading,
  isLoadingMore,
  hasMore,
  endRef,
  totalCount,
  isCurrentUser
}: WatchlistGridProps) {
  return (
    <TabsContent value="watchlist">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Film className="h-5 w-5" />
            <span className="break-all">{username}'s Watchlist</span>
          </CardTitle>
          <CardDescription>
            Movies this user has added to their watchlist
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-12 flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : watchlist.length > 0 ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                {watchlist.map(item => {
                  // Check if the item is directly a movie or has a nested movie property
                  const movie = item.movie || item;
                  
                  return (
                    <Card key={item.id || movie.id} className="overflow-hidden flex flex-col h-full hover:shadow-lg transition-shadow">
                      <Link to={`/movies/${movie.id}`} className="group h-full">
                        <div className="aspect-[2/3] relative">
                          <img 
                            src={movie.posterURL || '/placeholder-poster.jpg'} 
                            alt={`${movie.title || 'Movie'} poster`}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.onerror = null;
                              target.src = '/placeholder-poster.jpg';
                            }}
                          />
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-3">
                            <h3 className="text-white font-bold text-base">{movie.title || 'Untitled'}</h3>
                            <p className="text-white text-xs opacity-90">{movie.year || 'N/A'}</p>
                          </div>
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200"></div>
                        </div>
                      </Link>
                    </Card>
                  );
                })}
              </div>
              
              {/* Infinite scroll loader for watchlist */}
              <div ref={endRef} className="py-4 flex justify-center">
                {isLoadingMore && (
                  <Loader2 className="h-6 w-6 animate-spin text-rose-600" />
                )}
                {!hasMore && totalCount > 10 && (
                  <p className="text-sm text-muted-foreground">You've reached the end of the watchlist</p>
                )}
              </div>
              
              <div className="mt-2 text-sm text-gray-500">
                Showing {watchlist.length} of {totalCount} watchlist items
              </div>
            </>
          ) : (
            <div className="text-center py-12 bg-muted/50 rounded-md">
              <Film className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
              <h3 className="font-medium text-lg mb-1">No Watchlist Available</h3>
              <p className="text-muted-foreground max-w-sm mx-auto">
                {isCurrentUser
                  ? "You haven't added any movies to your watchlist yet."
                  : `${username} hasn't added any movies to their watchlist yet.`
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );
}
