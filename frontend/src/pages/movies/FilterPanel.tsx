import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { X, ChevronDown } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Genre } from '@/api/apiService';
import { useState, useEffect } from 'react';

interface FilterPanelProps {
  filters: {
    genreIds: number[];
    ratingRange: [number, number];
  };
  availableGenres: Genre[];
  handleGenreToggle: (genreId: number) => void;
  handleRatingRangeChange: (values: number[]) => void;
  resetFilters: () => void;
  setFilters: React.Dispatch<React.SetStateAction<{
    genreIds: number[];
    ratingRange: [number, number];
  }>>;
  inCard?: boolean;
}

export function FilterPanel({
  filters,
  availableGenres,
  handleGenreToggle,
  handleRatingRangeChange,
  resetFilters,
  inCard = false,
}: FilterPanelProps) {
  const [minRating, setMinRating] = useState(filters.ratingRange[0].toString());
  const [maxRating, setMaxRating] = useState(filters.ratingRange[1].toString());

  useEffect(() => {
    setMinRating(filters.ratingRange[0].toString());
    setMaxRating(filters.ratingRange[1].toString());
  }, [filters.ratingRange]);

  const handleMinRatingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMinRating(value);
    
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 10) {
      const newMax = Math.max(numValue, filters.ratingRange[1]);
      handleRatingRangeChange([numValue, newMax]);
    }
  };

  const handleMaxRatingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMaxRating(value);
    
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 10) {
      const newMin = Math.min(filters.ratingRange[0], numValue);
      handleRatingRangeChange([newMin, numValue]);
    }
  };

  const filterContent = (
    <div className="space-y-8">
      {/* Genres filter */}
      <div>
        <h3 className="text-sm font-medium mb-3">Genres</h3>
        <Popover>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              className="w-full justify-between text-left font-normal"
            >
              {filters.genreIds.length > 0 
                ? `${filters.genreIds.length} genre${filters.genreIds.length > 1 ? 's' : ''} selected` 
                : "Select genres"}
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" align="start">
            <ScrollArea className="h-72 p-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="font-medium">Select Genres</Label>
                  {filters.genreIds.length > 0 && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleGenreToggle(-1)} 
                      className="h-7 px-2 text-xs text-rose-600 hover:text-rose-700"
                    >
                      Clear selection
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {availableGenres.map(genre => (
                    <div key={genre.id} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`genre-popup-${genre.id}`} 
                        checked={filters.genreIds.includes(genre.id)}
                        onCheckedChange={() => handleGenreToggle(genre.id)}
                      />
                      <label 
                        htmlFor={`genre-popup-${genre.id}`}
                        className="text-sm leading-none cursor-pointer"
                      >
                        {genre.genre}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollArea>
          </PopoverContent>
        </Popover>

        {/* Show selected genres as badges */}
        {filters.genreIds.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {filters.genreIds.map(genreId => {
              const genre = availableGenres.find(g => g.id === genreId);
              return genre ? (
                <Badge 
                  key={genre.id}
                  variant="outline" 
                  className="bg-slate-50 text-slate-700 dark:bg-slate-900 dark:text-slate-300 flex items-center gap-1 border-slate-200 dark:border-slate-700"
                >
                  {genre.genre}
                  <X 
                    className="h-3 w-3 cursor-pointer hover:text-rose-600" 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleGenreToggle(genre.id);
                    }}
                  />
                </Badge>
              ) : null;
            })}
          </div>
        )}
      </div>

      {/* Rating range filter with keyboard input */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-medium">Rating</h3>
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
            <div className="flex items-center space-x-2">
              <Input 
                type="number" 
                value={minRating}
                onChange={handleMinRatingChange}
                min="0"
                max="10"
                step="0.5"
                className="w-16 h-8 text-xs text-center"
              />
              <span>-</span>
              <Input 
                type="number" 
                value={maxRating}
                onChange={handleMaxRatingChange}
                min="0"
                max="10"
                step="0.5"
                className="w-16 h-8 text-xs text-center"
              />
            </div>
          </div>
        </div>
        <div className="px-1">
          <Slider
            min={0}
            max={10}
            step={0.5}
            value={filters.ratingRange}
            onValueChange={handleRatingRangeChange}
            className="py-4"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>0</span>
            <span>10</span>
          </div>
        </div>
      </div>

      <Button 
        variant="outline" 
        onClick={resetFilters}
        className="w-full"
        size="sm"
      >
        Reset All Filters
      </Button>
    </div>
  );

  if (inCard) {
    return (
      <Card className="sticky top-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center justify-between">
            <span>Filters</span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={resetFilters} 
              className="h-7 px-2 text-xs text-rose-600"
            >
              Reset All
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filterContent}
        </CardContent>
      </Card>
    );
  }

  return filterContent;
}
