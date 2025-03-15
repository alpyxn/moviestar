import { WatchlistStatus } from "@/api/apiService";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Check, Heart, Loader2, Plus, Star } from "lucide-react";
import { useKeycloak } from "@react-keycloak/web";

interface MovieSidebarProps {
  averageRating: number;
  totalRatings: number;
  userRating: number | null;
  watchlistStatus: WatchlistStatus | null;
  isRating: boolean;
  isAddingToWatchlist: boolean;
  onRate: (rating: number) => void;
  onWatchlistToggle: () => void;
}

export default function MovieSidebar({
  averageRating,
  totalRatings,
  userRating,
  watchlistStatus,
  isRating,
  isAddingToWatchlist,
  onRate,
  onWatchlistToggle,
}: MovieSidebarProps) {
  const { keycloak, initialized } = useKeycloak();
  const isAuthenticated = initialized && keycloak.authenticated;

  // Generate stars for rating with enhanced visual appearance
  const renderStars = (rating: number | null, isInteractive: boolean = false) => {
    return (
      <div className="flex flex-wrap gap-1"> {/* Added gap between stars */}
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
          <Star
            key={star}
            size={32} // Even larger star size
            strokeWidth={1.5} // Thinner stroke for better appearance
            className={`${isInteractive ? 'cursor-pointer transition-all hover:scale-110' : ''} ${
              isInteractive && star <= (rating || 0)
                ? 'text-yellow-400 fill-yellow-400 drop-shadow-sm'
                : isInteractive
                ? 'text-gray-300 hover:text-yellow-400'
                : star <= Math.round(rating || 0)
                ? 'text-yellow-400 fill-yellow-400 drop-shadow-sm'
                : 'text-gray-300'
            }`}
            onClick={isInteractive ? () => onRate(star) : undefined}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Rating Section - Enhanced styling */}
      <Card className="overflow-hidden border-2">
        <CardContent className="p-6">
          <h3 className="text-xl font-bold mb-4 flex items-center">
            <Star className="h-6 w-6 text-yellow-500 mr-2 fill-yellow-500" /> {/* Bigger icon */}
            Rating
          </h3>
          <div className="flex items-center gap-4 mb-6"> {/* Increased spacing */}
            <div className="text-5xl font-bold text-yellow-500">{averageRating.toFixed(1)}</div> {/* Larger text */}
            <div className="text-gray-500">
              <div className="text-sm font-medium">out of 10</div>
              <div className="text-xs">{totalRatings} ratings</div>
            </div>
          </div>

          {isAuthenticated ? (
            <div className="space-y-3"> {/* More spacing */}
              <h4 className="text-base font-medium">Rate this movie:</h4> {/* Larger text */}
              {isRating ? (
                <div className="flex items-center justify-center py-2">
                  <Loader2 className="h-6 w-6 animate-spin mr-2 text-rose-600" />
                  <span>Updating...</span>
                </div>
              ) : (
                renderStars(userRating, true)
              )}
              {userRating && (
                <div className="mt-3 text-sm font-medium text-rose-600">
                  Your rating: {userRating}/10
                </div>
              )}
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full mt-2"
              onClick={() => keycloak.login()}
            >
              Sign in to rate
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Add to Watchlist Card */}
      {isAuthenticated && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center">
              <Heart className="h-5 w-5 text-rose-500 mr-2" />
              Watchlist
            </h3>
            <Button
              className={cn(
                "w-full",
                watchlistStatus?.inWatchlist
                  ? "bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                  : "bg-rose-600 hover:bg-rose-700"
              )}
              onClick={onWatchlistToggle}
              disabled={isAddingToWatchlist}
            >
              {isAddingToWatchlist ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : watchlistStatus?.inWatchlist ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  In Your Watchlist
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Add to Watchlist
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
