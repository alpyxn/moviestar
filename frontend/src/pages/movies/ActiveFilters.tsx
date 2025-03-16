import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { Genre } from '@/api/apiService';

interface ActiveFiltersProps {
  filters: {
    genreIds: number[];
    ratingRange: [number, number];
  };
  availableGenres: Genre[];
  handleGenreToggle: (genreId: number) => void;
  resetFilters: () => void;
  setFilters: React.Dispatch<React.SetStateAction<{
    genreIds: number[];
    ratingRange: [number, number];
  }>>;
}

export function ActiveFilters({
  filters,
  availableGenres,
  handleGenreToggle,
  resetFilters,
  setFilters
}: ActiveFiltersProps) {
  
  const resetRatingFilter = () => {
    setFilters(prev => ({
      ...prev,
      ratingRange: [0, 10]
    }));
  };
  
  const hasActiveGenres = filters.genreIds.length > 0;
  const hasActiveRatingFilter = filters.ratingRange[0] > 0 || filters.ratingRange[1] < 10;
  
  if (!hasActiveGenres && !hasActiveRatingFilter) return null;
  
  return (
    <div className="mb-6">
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-sm font-medium mr-1">Active filters:</span>
        
        {/* Genre filters */}
        {hasActiveGenres && 
          filters.genreIds.map(genreId => {
            const genre = availableGenres.find(g => g.id === genreId);
            return genre ? (
              <Badge 
                key={genre.id}
                variant="outline" 
                className="flex items-center gap-1 py-1 pl-3 pr-2 bg-slate-50 dark:bg-slate-900"
              >
                {genre.genre}
                <X 
                  className="h-3 w-3 cursor-pointer hover:text-rose-600" 
                  onClick={() => handleGenreToggle(genre.id)}
                />
              </Badge>
            ) : null;
          })
        }
        
        {/* Rating filter */}
        {hasActiveRatingFilter && (
          <Badge 
            variant="outline" 
            className="flex items-center gap-1 py-1 pl-3 pr-2 bg-slate-50 dark:bg-slate-900"
          >
            Rating: {filters.ratingRange[0]} - {filters.ratingRange[1]}
            <X 
              className="h-3 w-3 cursor-pointer hover:text-rose-600" 
              onClick={resetRatingFilter}
            />
          </Badge>
        )}
        
        {/* Clear all filters button */}
        <button 
          onClick={resetFilters}
          className="text-xs text-rose-600 hover:text-rose-800 hover:underline ml-2"
        >
          Clear all
        </button>
      </div>
    </div>
  );
}
