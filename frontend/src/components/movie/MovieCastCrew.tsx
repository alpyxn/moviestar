import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";

interface Person {
  id: number;
  name: string;
  surname: string;
  pictureUrl?: string;
}

interface MovieCastCrewProps {
  actors: Person[];
  directors: Person[];
  actorImages: Record<number, string>;
  directorImages: Record<number, string>;
}

export default function MovieCastCrew({ 
  actors = [], 
  directors = [], 
  actorImages,
  directorImages
}: MovieCastCrewProps) {
  const [showAllActors, setShowAllActors] = useState(false);
  const [showAllDirectors, setShowAllDirectors] = useState(false);
  const DISPLAY_LIMIT = 5;
  
  return (
    <section>
      <Tabs defaultValue="cast">
        <TabsList className="mb-4">
          <TabsTrigger value="cast">Cast</TabsTrigger>
          <TabsTrigger value="directors">Directors</TabsTrigger>
        </TabsList>

        <TabsContent value="cast" className="space-y-4">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
            {actors
              .slice(0, showAllActors ? undefined : DISPLAY_LIMIT)
              .map((actor) => {
                const pictureUrl = actorImages[actor.id] || actor.pictureUrl;

                return (
                  <Link
                    to={`/actors/${actor.id}`}
                    key={actor.id}
                    className="group"
                  >
                    <Card className="overflow-hidden h-full transition-all hover:shadow-md">
                      <CardContent className="p-2">
                        <div className="w-full pb-[100%] relative overflow-hidden rounded-full mb-1">
                          <div className="absolute inset-0 bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
                            {pictureUrl ? (
                              <>
                                <img
                                  src={pictureUrl}
                                  alt={`${actor.name} ${actor.surname}`}
                                  className="absolute inset-0 w-full h-full object-cover"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.onerror = null;
                                    target.style.display = "none";
                                    target.parentElement!.querySelector('.fallback-icon')!.classList.remove('hidden');
                                  }}
                                />
                                <UserIcon className="h-8 w-8 text-gray-400 hidden fallback-icon" />
                              </>
                            ) : (
                              <UserIcon className="h-8 w-8 text-gray-400" />
                            )}
                          </div>
                        </div>
                        <h3 className="font-medium text-center text-sm group-hover:text-rose-600 transition-colors truncate">
                          {actor.name} {actor.surname}
                        </h3>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}

            {/* Show "View All" button if there are more than DISPLAY_LIMIT actors */}
            {actors.length > DISPLAY_LIMIT && (
              <div className="col-span-full flex justify-center mt-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowAllActors(!showAllActors)} 
                  className="text-xs"
                >
                  {showAllActors ? "Show Less" : `View All (${actors.length}) Cast Members`}
                </Button>
              </div>
            )}

            {/* Show message if no actors */}
            {actors.length === 0 && (
              <div className="col-span-full text-center py-6 text-gray-500 text-sm">
                No cast information available.
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="directors" className="space-y-4">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
            {directors
              .slice(0, showAllDirectors ? undefined : DISPLAY_LIMIT)
              .map((director) => {
                const pictureUrl = directorImages[director.id] || director.pictureUrl;

                return (
                  <Link
                    to={`/directors/${director.id}`}
                    key={director.id}
                    className="group"
                  >
                    <Card className="overflow-hidden h-full transition-all hover:shadow-md">
                      <CardContent className="p-2">
                        <div className="w-full pb-[100%] relative overflow-hidden rounded-full mb-1">
                          <div className="absolute inset-0 bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
                            {pictureUrl ? (
                              <>
                                <img
                                  src={pictureUrl}
                                  alt={`${director.name} ${director.surname}`}
                                  className="absolute inset-0 w-full h-full object-cover"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.onerror = null;
                                    target.style.display = "none";
                                    target.parentElement!.querySelector('.fallback-icon')!.classList.remove('hidden');
                                  }}
                                />
                                <UserIcon className="h-8 w-8 text-gray-400 hidden fallback-icon" />
                              </>
                            ) : (
                              <UserIcon className="h-8 w-8 text-gray-400" />
                            )}
                          </div>
                        </div>
                        <h3 className="font-medium text-center text-sm group-hover:text-rose-600 transition-colors truncate">
                          {director.name} {director.surname}
                        </h3>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}

            {/* Show "View All" button if there are more than DISPLAY_LIMIT directors */}
            {directors.length > DISPLAY_LIMIT && (
              <div className="col-span-full flex justify-center mt-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowAllDirectors(!showAllDirectors)} 
                  className="text-xs"
                >
                  {showAllDirectors ? "Show Less" : `View All (${directors.length}) Directors`}
                </Button>
              </div>
            )}

            {/* Show message if no directors */}
            {directors.length === 0 && (
              <div className="col-span-full text-center py-6 text-gray-500 text-sm">
                No director information available.
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </section>
  );
}
