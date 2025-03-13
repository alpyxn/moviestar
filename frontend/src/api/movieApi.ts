import axios from 'axios';
import { publicApiClient, getAuthApiClient } from './apiClient';
import { Movie, Comment, CreateCommentPayload, CreateRatingPayload, LikePayload, LikeStatus, UserRating } from './apiService';

/**
 * API service for movie-related endpoints
 */
const moviesApi = {
  /**
   * Get all movies - public endpoint
   */
  getAll: async (): Promise<Movie[]> => {
    const response = await publicApiClient.get<Movie[]>('/movies');
    return response.data;
  },

  /**
   * Get a specific movie by ID - public endpoint
   */
  getById: async (id: number): Promise<Movie> => {
    const response = await publicApiClient.get<Movie>(`/movies/${id}`);
    return response.data;
  },

  /**
   * Search for movies by different criteria - public endpoint
   */
  search: async (params: { 
    title?: string; 
    actor?: string; 
    genre?: string 
  }): Promise<Movie[]> => {
    const response = await publicApiClient.get<Movie[]>('/movies/search', { params });
    return response.data;
  },

  /**
   * Get all comments for a movie
   */
  getComments: async (movieId: number, sortBy?: string): Promise<Comment[]> => {
    const response = await publicApiClient.get<Comment[]>(`/movies/${movieId}/comments`, { 
      params: sortBy ? { sortBy } : {} 
    });
    return response.data;
  },

  /**
   * Add a comment to a movie
   * Requires authentication
   */
  addComment: async (movieId: number, comment: string): Promise<void> => {
    const payload: CreateCommentPayload = { comment };
    await getAuthApiClient().post(`/movies/${movieId}/comments`, payload);
  },

  /**
   * Like or dislike a comment
   * Requires authentication
   */
  likeComment: async (commentId: number, isLike: boolean): Promise<Comment> => {
    const payload: LikePayload = { isLike };
    const response = await getAuthApiClient().post<Comment>(`/movies/comments/${commentId}/like`, payload);
    return response.data;
  },

  /**
   * Remove like or dislike from a comment
   * Requires authentication
   */
  removeCommentReaction: async (commentId: number): Promise<Comment> => {
    const response = await getAuthApiClient().delete<Comment>(`/movies/comments/${commentId}/like`);
    return response.data;
  },

  /**
   * Get like status for a comment
   * Requires authentication
   */
  getCommentLikeStatus: async (commentId: number): Promise<LikeStatus> => {
    const response = await getAuthApiClient().get<LikeStatus>(`/movies/comments/${commentId}/like/status`);
    return response.data;
  },

  /**
   * Update a comment
   * Can only update own comments
   * Requires authentication
   */
  updateComment: async (commentId: number, comment: string): Promise<Comment> => {
    const payload: CreateCommentPayload = { comment };
    const response = await getAuthApiClient().put<Comment>(`/movies/comments/${commentId}`, payload);
    return response.data;
  },

  /**
   * Delete a comment
   * Can only delete own comments
   * Requires authentication
   */
  deleteComment: async (commentId: number): Promise<void> => {
    await getAuthApiClient().delete(`/movies/comments/${commentId}`);
  },

  /**
   * Get the average rating for a movie
   */
  getRating: async (movieId: number): Promise<number> => {
    const response = await publicApiClient.get<number>(`/movies/${movieId}/ratings`);
    return response.data;
  },

  /**
   * Get user's rating for a movie
   * Requires authentication
   */
  getUserRating: async (movieId: number): Promise<number | null> => {
    try {
      const response = await getAuthApiClient().get<{ rating: number }>(`/movies/${movieId}/ratings/user`);
      return response.data.rating;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null; // User hasn't rated this movie
      }
      throw error;
    }
  },

  /**
   * Rate a movie (1-10)
   * Requires authentication
   */
  rateMovie: async (movieId: number, rating: number): Promise<void> => {
    const payload: CreateRatingPayload = { rating };
    await getAuthApiClient().post(`/movies/${movieId}/ratings`, payload);
  },

  /**
   * Remove user's rating for a movie
   * Requires authentication
   */
  removeRating: async (movieId: number): Promise<void> => {
    await getAuthApiClient().delete(`/movies/${movieId}/ratings`);
  },

  /**
   * Get all user ratings
   * Requires authentication
   */
  getUserRatings: async (): Promise<UserRating[]> => {
    const response = await getAuthApiClient().get<UserRating[]>('/movies/users/me/ratings');
    return response.data;
  }
};

export default moviesApi;