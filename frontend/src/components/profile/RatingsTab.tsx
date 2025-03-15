import { UserRating } from '@/api/apiService';
import { Button } from '@/components/ui/button';
import { 
  Card,
  CardFooter,
} from "@/components/ui/card";
import { Link } from 'react-router-dom';
import { Loader2, Star } from 'lucide-react';

interface RatingsTabProps {
  userRatings: UserRating[];
  displayedItems: UserRating[];
  loadingMore: boolean;
  hasMore: boolean;
  ratingsEndRef: React.RefObject<HTMLDivElement>;
}

export default function RatingsTab({
  userRatings,
  displayedItems,
  loadingMore,
  hasMore,
  ratingsEndRef,
}: RatingsTabProps) {

  if (userRatings.length === 0) {
    return (
      <div className="text-center py-8 sm:py-12 bg-muted/50 rounded-lg">
        <Star className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mb-2" />
        <h3 className="text-lg sm:text-xl font-medium">No Ratings Yet</h3>
        <p className="text-muted-foreground mt-2 text-sm sm:text-base">
          Rate movies to keep track of what you've watched.
        </p>
        <Button asChild className="mt-4">
          <Link to="/movies">Browse Movies</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {displayedItems.map((item) => (
          <Card key={item.id} className="overflow-hidden flex flex-col h-full hover:shadow-lg transition-shadow">
            {item.movie ? (
              <>
                <Link to={`/movies/${item.movie.id}`} className="group h-full">
                  <div className="aspect-[2/3] relative">
                    <img 
                      src={item.movie.posterURL || '/placeholder-poster.jpg'} 
                      alt={item.movie.title} 
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.onerror = null;
                        target.src = '/placeholder-poster.jpg';
                      }}
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-3">
                      <h3 className="text-white font-bold text-sm sm:text-base line-clamp-1">
                        {item.movie.title}
                      </h3>
                      <p className="text-white text-xs opacity-90">
                        {item.movie.year}
                      </p>
                    </div>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200"></div>
                  </div>
                </Link>
                <CardFooter className="p-3 pt-0 flex justify-center items-center mt-auto">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{item.rating}/10</span>
                  </div>
                </CardFooter>
              </>
            ) : (
              <div className="p-4 text-center text-muted-foreground">
                <p>Movie information unavailable</p>
                <p className="text-sm">Rating: {item.rating}/10</p>
              </div>
            )}
          </Card>
        ))}
      </div>
      
      {/* Infinite scroll loader */}
      <div ref={ratingsEndRef} className="py-8 flex justify-center">
        {loadingMore && (
          <Loader2 className="h-6 w-6 animate-spin text-rose-600" />
        )}
        {!hasMore && userRatings.length > displayedItems.length && (
          <p className="text-sm text-muted-foreground">You've reached the end of your ratings</p>
        )}
      </div>
    </>
  );
}
