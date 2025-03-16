import axios from 'axios';
import keycloak from '../auth/keycloak';
import { 
  Actor, Director, Genre, Movie,
  CreateMoviePayload, CreateActorDirectorPayload,
  User
} from './apiService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8081/api';

let isRefreshing = false;
let refreshQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

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

const safeRefreshToken = async (): Promise<string> => {
  if (isRefreshing) {
    return new Promise<string>((resolve, reject) => {
      refreshQueue.push({ resolve, reject });
    });
  }

  isRefreshing = true;
  
  try {
    await keycloak.updateToken(30);
    
    if (!keycloak.token) {
      throw new Error('No token available after refresh attempt');
    }
    
    const token = keycloak.token;
    processQueue(null, token);
    return token;
  } catch (error) {
    processQueue(error);
    throw error;
  } finally {
    isRefreshing = false;
  }
};

const adminClient = axios.create({
  baseURL: `${API_URL}/admin`,
});

adminClient.interceptors.request.use(async (config) => {
  try {
    if (keycloak.authenticated) {
      const token = await safeRefreshToken();
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  } catch (error) {
    return Promise.reject(error);
  }
});

adminClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        await keycloak.updateToken(0);
        
        if (keycloak.token) {
          originalRequest.headers.Authorization = `Bearer ${keycloak.token}`;
          return adminClient(originalRequest);
        } else {
          keycloak.login();
          return Promise.reject(new Error('Authentication required'));
        }
      } catch (refreshError) {
        keycloak.login();
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

const adminApi = {
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
  
  /**
   * Delete all comments from a user
   * Requires admin authentication
   */
  deleteAllUserComments: async (username: string): Promise<void> => {
    await adminClient.delete(`/users/${username}/comments`);
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
    try {
      const response = await adminClient.post<Movie>(`/movies/${movieId}/directors/${directorId}`);
      return response.data;
    } catch (error: unknown) {
      if ((error as any).response) {
      }
      throw error;
    }
  },

  /**
   * Remove a director from a movie
   * Requires admin authentication
   */
  removeDirectorFromMovie: async (movieId: number, directorId: number): Promise<Movie> => {
    try {
      const response = await adminClient.delete<Movie>(`/movies/${movieId}/directors/${directorId}`);
      return response.data;
    } catch (error: unknown) {
      if ((error as any).response) {
      }
      throw error;
    }
  }
};

export default adminApi;