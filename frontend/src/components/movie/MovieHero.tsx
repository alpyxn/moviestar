import { Movie } from "@/api/apiService";
import { Button } from "@/components/ui/button";
import { Calendar, Edit, Shield, Star, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface MovieHeroProps {
  movie: Movie;
  isAdmin: boolean; 
  onDeleteClick: () => void;
}

export default function MovieHero({ movie, isAdmin, onDeleteClick }: MovieHeroProps) {
  const navigate = useNavigate();

  return (
    <div
      className="h-[50vh] bg-cover bg-center relative"
      style={{ backgroundImage: `url(${movie.backdropURL || ''})` }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-background" />
      <div className="container mx-auto h-full flex items-end pb-8 px-4 relative z-10">
        <div className="flex flex-col md:flex-row gap-6 items-start w-full">
          {/* Poster */}
          <div className="w-40 md:w-64 rounded-lg overflow-hidden shadow-xl">
            <img
              src={movie.posterURL}
              alt={movie.title}
              className="w-full h-auto"
            />
          </div>

          {/* Movie Info */}
          <div className="text-white flex-grow">
            <div className="flex justify-between items-start">
              <h1 className="text-3xl md:text-5xl font-bold">{movie.title}</h1>
              {isAdmin && (
                <div className="flex items-center bg-black/50 rounded-lg p-2 gap-2">
                  <Shield className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm text-yellow-500 font-medium">Admin</span>
                  <div className="flex ml-2 gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 border-gray-600 bg-transparent hover:bg-gray-800"
                      onClick={() => navigate(`/admin/movies/edit/${movie.id}`)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 border-red-600 text-red-500 bg-transparent hover:bg-red-900/30"
                      onClick={onDeleteClick}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-4 mt-3 items-center">
              <div className="flex items-center">
                <Star className="h-5 w-5 text-yellow-500 mr-1" />
                <span className="font-semibold">{movie.averageRating.toFixed(1)}</span>
                <span className="text-sm text-gray-300 ml-1">({movie.totalRatings} ratings)</span>
              </div>

              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                <span>{movie.year}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-1 mt-2">
              {(movie.genres || []).map((genre) => (
                <span
                  key={genre.id}
                  className="px-2 py-1 bg-gray-700 rounded-full text-xs"
                >
                  {genre.genre}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
