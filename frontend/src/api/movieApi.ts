import { publicApiClient, getAuthApiClient } from './apiClient';
import { Movie, Comment, LikeStatus, UserRating } from './apiService';
import axios from 'axios';

interface CreateRatingPayload {
  rating: number;
}

const moviesApi = {
  getAll: async (): Promise<Movie[]> => {
    const response = await publicApiClient.get<Movie[]>('/movies');
    return response.data;
  },

  getById: async (id: number): Promise<Movie> => {
    const response = await publicApiClient.get<Movie>(`/movies/${id}`);
    return response.data;
  },

  getRandomized: async (timestamp?: number): Promise<Movie[]> => {
    const params = timestamp ? { t: timestamp } : undefined;
    const response = await publicApiClient.get<Movie[]>('/movies/random', { params });
    return response.data;
  },

  search: async (params: { 
    title?: string; 
    actor?: string; 
    genre?: string 
  }): Promise<Movie[]> => {
    const response = await publicApiClient.get<Movie[]>('/movies/search', { params });
    return response.data;
  },

  getComments: async (movieId: number, sortBy: string = 'newest', page: number = 1, pageSize: number = 10): Promise<Comment[]> => {
    const response = await publicApiClient.get<Comment[]>(`/movies/${movieId}/comments`, {
      params: { sortBy, page, pageSize }
    });
    return response.data;
  },

  addComment: async (movieId: number, comment: string): Promise<Comment> => {
    const response = await getAuthApiClient().post<Comment>(`/movies/${movieId}/comments`, { comment });
    return response.data;
  },

  updateComment: async (commentId: number, comment: string): Promise<Comment> => {
    const response = await getAuthApiClient().put<Comment>(`/movies/comments/${commentId}`, { comment });
    return response.data;
  },

  deleteComment: async (commentId: number): Promise<void> => {
    await getAuthApiClient().delete(`/movies/comments/${commentId}`);
  },

  likeComment: async (commentId: number, isLike: boolean): Promise<Comment> => {
    const response = await getAuthApiClient().post<Comment>(`/movies/comments/${commentId}/like`, {
      isLike: isLike
    });
    return response.data;
  },

  removeCommentReaction: async (commentId: number): Promise<Comment> => {
    const response = await getAuthApiClient().delete<Comment>(`/movies/comments/${commentId}/like`);
    return response.data;
  },

  getCommentLikeStatus: async (commentId: number): Promise<LikeStatus> => {
    try {
      const response = await getAuthApiClient().get<LikeStatus>(`/movies/comments/${commentId}/like/status`);
      return response.data;
    } catch (error) {
      return { liked: false, disliked: false };
    }
  },

  getRating: async (movieId: number): Promise<number> => {
    const response = await publicApiClient.get<number>(`/movies/${movieId}/ratings`);
    return response.data;
  },

  getUserRating: async (movieId: number): Promise<number | null> => {
    try {
      const response = await getAuthApiClient().get<{ rating: number }>(`/movies/${movieId}/ratings/user`);
      return response.data.rating;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  rateMovie: async (movieId: number, rating: number): Promise<void> => {
    const payload: CreateRatingPayload = { rating };
    await getAuthApiClient().post(`/movies/${movieId}/ratings`, payload);
  },

  removeRating: async (movieId: number): Promise<void> => {
    await getAuthApiClient().delete(`/movies/${movieId}/ratings`);
  },

  getUserRatings: async (): Promise<UserRating[]> => {
    const response = await getAuthApiClient().get<UserRating[]>('/movies/users/me/ratings');
    return response.data;
  }
};

export default moviesApi;