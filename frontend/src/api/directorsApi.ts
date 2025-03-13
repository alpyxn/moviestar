import { publicApiClient } from './apiClient';
import { Director, Movie } from './apiService';

/**
 * API service for director-related endpoints
 */
const directorsApi = {
  /**
   * Get all directors - public endpoint
   */
  getAll: async (): Promise<Director[]> => {
    const response = await publicApiClient.get<Director[]>('/directors');
    return response.data;
  },

  /**
   * Get a specific director by ID - public endpoint
   */
  getById: async (id: number): Promise<Director> => {
    const response = await publicApiClient.get<Director>(`/directors/${id}`);
    return response.data;
  },

  /**
   * Search for directors by name or surname - public endpoint
   */
  search: async (query: string): Promise<Director[]> => {
    const response = await publicApiClient.get<Director[]>('/directors/search', { params: { query } });
    return response.data;
  },

  /**
   * Get director biography - public endpoint
   */
  getBiography: async (id: number): Promise<{ about: string }> => {
    const response = await publicApiClient.get<{ about: string }>(`/directors/${id}/about`);
    return response.data;
  },

  /**
   * Get director picture - public endpoint
   */
  getPicture: async (id: number): Promise<{ pictureUrl: string }> => {
    const response = await publicApiClient.get<{ pictureUrl: string }>(`/directors/${id}/picture`);
    return response.data;
  },

  /**
   * Get director's filmography - public endpoint with fallback
   */
  getFilmography: async (id: number): Promise<Movie[]> => {
    try {
      // Try to use the dedicated endpoint
      const response = await publicApiClient.get<Movie[]>(`/directors/${id}/movies`);
      return response.data;
    } catch (error: unknown) {
      // Fallback: Get the director and extract movies from there if the endpoint isn't available
      console.warn('Directors filmography endpoint not available, using fallback');
      const director = await directorsApi.getById(id);
      if (director.movies) {
        return director.movies;
      } else if (director.movieIds && director.movieIds.length > 0) {
        // If we only have IDs but not full movies, we can't show detailed information
        return director.movieIds.map(id => ({ id } as unknown as Movie));
      }
      return [];
    }
  }
};

export default directorsApi;