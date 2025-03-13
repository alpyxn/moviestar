import { publicApiClient } from './apiClient';
import { Genre } from './apiService';

/**
 * API service for genre-related endpoints
 */
const genresApi = {
  /**
   * Get all genres - public endpoint
   */
  getAll: async (): Promise<Genre[]> => {
    const response = await publicApiClient.get<Genre[]>('/genres');
    return response.data;
  },

  /**
   * Get a specific genre by ID - public endpoint
   */
  getById: async (id: number): Promise<Genre> => {
    const response = await publicApiClient.get<Genre>(`/genres/${id}`);
    return response.data;
  }
};

export default genresApi;