import { publicApiClient } from './apiClient';
import { Actor, Movie } from './apiService';

const actorsApi = {

  /**
   * Get all actors - public endpoint
   */
  getAll: async (): Promise<Actor[]> => {
    const response = await publicApiClient.get<Actor[]>('/actors');
    return response.data;
  },

  /**
   * Get a specific actor by ID - public endpoint
   */
  getById: async (id: number): Promise<Actor> => {
    const response = await publicApiClient.get<Actor>(`/actors/${id}`);
    return response.data;
  },

  /**
   * Search for actors by name or surname - public endpoint
   */
  search: async (query: string): Promise<Actor[]> => {
    const response = await publicApiClient.get<Actor[]>('/actors/search', { params: { query } });
    return response.data;
  },

  /**
   * Get actor biography - public endpoint
   */
  getBiography: async (id: number): Promise<{ about: string }> => {
    const response = await publicApiClient.get<{ about: string }>(`/actors/${id}/about`);
    return response.data;
  },

  /**
   * Get actor picture - public endpoint
   */
  getPicture: async (id: number): Promise<{ pictureUrl: string }> => {
    const response = await publicApiClient.get<{ pictureUrl: string }>(`/actors/${id}/picture`);
    return response.data;
  },

  /**
   * Get actor's filmography - public endpoint with fallback
   */
  getFilmography: async (id: number): Promise<Movie[]> => {
    try {
      // Try to use the dedicated endpoint
      const response = await publicApiClient.get<Movie[]>(`/actors/${id}/movies`);
      return response.data;
    } catch (error: unknown) {
      // Fallback: Get the actor and extract movies from there if the endpoint isn't available
      console.warn('Actors filmography endpoint not available, using fallback');
      const actor = await actorsApi.getById(id);
      if (actor.movies) {
        return actor.movies;
      } else if (actor.movieIds && actor.movieIds.length > 0) {
        // If we only have IDs but not full movies, we can't show detailed information
        return actor.movieIds.map(id => ({ id } as unknown as Movie));
      }
      return [];
    }
  }
};

export default actorsApi;