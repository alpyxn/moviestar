import axios from 'axios';
import keycloak from '../auth/keycloak';
import { 
  Actor, Director, Genre, Movie,
  CreateMoviePayload, CreateActorDirectorPayload,
  User
} from './apiService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8081/api';

// Improved token refresh handling
let isRefreshing = false;
let refreshQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

// Process refresh queue
const processQueue = (error: any | null = null, token: string | null = null) => {
  refreshQueue.forEach(promise => {
    if (error) {
      promise.reject(error);
    } else if (token) {
      promise.resolve(token);
    }
  });
  
  refreshQueue = [];
};

// Safely refresh the token
const safeRefreshToken = async (): Promise<string> => {
  // If we're already refreshing, queue this request
  if (isRefreshing) {
    return new Promise<string>((resolve, reject) => {
      refreshQueue.push({ resolve, reject });
    });
  }

  isRefreshing = true;
  
  try {
    const refreshed = await keycloak.updateToken(30);
    console.log('Token refresh attempt result:', refreshed ? 'refreshed' : 'not needed');
    
    if (!keycloak.token) {
      throw new Error('No token available after refresh attempt');
    }
    
    const token = keycloak.token;
    processQueue(null, token);
    return token;
  } catch (error) {
    console.error('Failed to refresh token:', error);
    processQueue(error);
    throw error;
  } finally {
    isRefreshing = false;
  }
};

// Create axios instance with interceptors
const adminClient = axios.create({
  baseURL: `${API_URL}/admin`,
});

// Request interceptor to add auth token
adminClient.interceptors.request.use(async (config) => {
  try {
    if (keycloak.authenticated) {
      // Always try to get a fresh token for admin requests
      const token = await safeRefreshToken();
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  } catch (error) {
    console.error('Error in request interceptor:', error);
    return Promise.reject(error);
  }
});

// Response interceptor for handling 401s and other error cases
adminClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Don't retry already retried requests to avoid infinite loops
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Force token refresh on 401
        await keycloak.updateToken(0);
        
        if (keycloak.token) {
          originalRequest.headers.Authorization = `Bearer ${keycloak.token}`;
          return adminClient(originalRequest);
        } else {
          // If we still don't have a token, redirect to login
          keycloak.login();
          return Promise.reject(new Error('Authentication required'));
        }
      } catch (refreshError) {
        console.error('Failed to refresh token after 401:', refreshError);
        keycloak.login();
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// Admin API service
const adminApi = {
  // Movies
  getMovies: async (): Promise<Movie[]> => {
    const response = await adminClient.get<Movie[]>('/movies');
    return response.data;
  },
  
  createMovie: async (movie: CreateMoviePayload): Promise<Movie> => {
    const response = await adminClient.post<Movie>('/movies', movie);
    return response.data;
  },
  
  updateMovie: async (id: number, movie: CreateMoviePayload): Promise<Movie> => {
    const response = await adminClient.put<Movie>(`/movies/${id}`, movie);
    return response.data;
  },
  
  deleteMovie: async (id: number): Promise<void> => {
    await adminClient.delete(`/movies/${id}`);
  },
  
  // Actors
  getActors: async (): Promise<Actor[]> => {
    const response = await adminClient.get<Actor[]>('/actors');
    return response.data;
  },
  
  createActor: async (actor: CreateActorDirectorPayload): Promise<Actor> => {
    const response = await adminClient.post<Actor>('/actors', actor);
    return response.data;
  },
  
  updateActor: async (id: number, actor: CreateActorDirectorPayload): Promise<Actor> => {
    const response = await adminClient.put<Actor>(`/actors/${id}`, actor);
    return response.data;
  },
  
  deleteActor: async (id: number): Promise<void> => {
    await adminClient.delete(`/actors/${id}`);
  },
  
  /**
   * Update an actor's biography
   */
  updateActorBiography: async (id: number, about: string): Promise<Actor> => {
    const response = await adminClient.put<Actor>(`/actors/${id}/about`, { about });
    return response.data;
  },
  
  /**
   * Update an actor's picture
   */
  updateActorPicture: async (id: number, pictureUrl: string): Promise<Actor> => {
    const response = await adminClient.put<Actor>(`/actors/${id}/picture`, { pictureUrl });
    return response.data;
  },
  
  // Directors
  getDirectors: async (): Promise<Director[]> => {
    const response = await adminClient.get<Director[]>('/directors');
    return response.data;
  },
  
  createDirector: async (director: CreateActorDirectorPayload): Promise<Director> => {
    const response = await adminClient.post<Director>('/directors', director);
    return response.data;
  },
  
  updateDirector: async (id: number, director: CreateActorDirectorPayload): Promise<Director> => {
    const response = await adminClient.put<Director>(`/directors/${id}`, director);
    return response.data;
  },
  
  deleteDirector: async (id: number): Promise<void> => {
    await adminClient.delete(`/directors/${id}`);
  },
  
  /**
   * Update a director's biography
   */
  updateDirectorBiography: async (id: number, about: string): Promise<Director> => {
    const response = await adminClient.put<Director>(`/directors/${id}/about`, { about });
    return response.data;
  },
  
  /**
   * Update a director's picture
   */
  updateDirectorPicture: async (id: number, pictureUrl: string): Promise<Director> => {
    const response = await adminClient.put<Director>(`/directors/${id}/picture`, { pictureUrl });
    return response.data;
  },
  
  // Genres
  getGenres: async (): Promise<Genre[]> => {
    const response = await adminClient.get<Genre[]>('/genres');
    return response.data;
  },
  
  createGenre: async (genre: { genre: string }): Promise<Genre> => {
    const response = await adminClient.post<Genre>('/genres', genre);
    return response.data;
  },
  
  updateGenre: async (id: number, genre: { genre: string }): Promise<Genre> => {
    const response = await adminClient.put<Genre>(`/genres/${id}`, genre);
    return response.data;
  },
  
  deleteGenre: async (id: number): Promise<void> => {
    await adminClient.delete(`/genres/${id}`);
  },
  
  // Comments
  deleteComment: async (id: number): Promise<void> => {
    await adminClient.delete(`/comments/${id}`);
  },
  
  // Users
  getAllUsers: async (): Promise<User[]> => {
    const response = await adminClient.get<User[]>('/users');
    return response.data;
  },
  
  getBannedUsers: async (): Promise<User[]> => {
    const response = await adminClient.get<User[]>('/users/banned');
    return response.data;
  },
  
  getActiveUsers: async (): Promise<User[]> => {
    const response = await adminClient.get<User[]>('/users/active');
    return response.data;
  },
  
  banUser: async (username: string): Promise<User> => {
    const response = await adminClient.post<User>(`/users/${username}/ban`);
    return response.data;
  },
  
  unbanUser: async (username: string): Promise<User> => {
    const response = await adminClient.post<User>(`/users/${username}/unban`);
    return response.data;
  },
  
  /**
   * Add a director to a movie
   * Requires admin authentication
   */
  addDirectorToMovie: async (movieId: number, directorId: number): Promise<Movie> => {
    console.log(`Adding director ${directorId} to movie ${movieId}`);
    try {
      const response = await adminClient.post<Movie>(`/movies/${movieId}/directors/${directorId}`);
      console.log("Director added successfully, updated movie:", response.data);
      return response.data;
    } catch (error: unknown) {
      console.error("Error adding director to movie:", error);
      if ((error as any).response) {
        console.error("Response data:", (error as any).response.data);
        console.error("Response status:", (error as any).response.status);
      }
      throw error;
    }
  },

  /**
   * Remove a director from a movie
   * Requires admin authentication
   */
  removeDirectorFromMovie: async (movieId: number, directorId: number): Promise<Movie> => {
    console.log(`Removing director ${directorId} from movie ${movieId}`);
    try {
      const response = await adminClient.delete<Movie>(`/movies/${movieId}/directors/${directorId}`);
      console.log("Director removed successfully, updated movie:", response.data);
      return response.data;
    } catch (error: unknown) {
      console.error("Error removing director from movie:", error);
      if ((error as any).response) {
        console.error("Response data:", (error as any).response.data);
        console.error("Response status:", (error as any).response.status);
      }
      throw error;
    }
  }
};

export default adminApi;