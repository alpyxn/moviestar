import { getAuthApiClient, publicApiClient } from './apiClient';
import { User, WatchlistItem, Comment } from './apiService';
import axios from 'axios';
import keycloak from '../auth/keycloak';

const userApi = {
  getCurrentUser: async (): Promise<User> => {
    const response = await getAuthApiClient().get<User>('/users/profile');
    return response.data;
  },

  getUserByUsername: async (username: string): Promise<User> => {
    try {
      if (keycloak.authenticated) {
        try {
          const authResponse = await getAuthApiClient().get<User>(`/users/${username}`);
          return authResponse.data;
        } catch (authError) {
          if (axios.isAxiosError(authError) && authError.response?.status === 404) {
            throw new Error(`User "${username}" not found`);
          }
          
          if (axios.isAxiosError(authError) && authError.response?.status === 500) {
            throw new Error(`Server error when looking up user "${username}". Please try again later.`);
          }
        }
      }
      
      try {
        const response = await publicApiClient.get<User>(`/users/${username}`);
        return response.data;
      } catch (publicError) {
        if (axios.isAxiosError(publicError) && publicError.response?.status === 404) {
          throw new Error(`User "${username}" not found`);
        }
        
        if (axios.isAxiosError(publicError) && publicError.response?.status === 500) {
          throw new Error(`Server error when looking up user "${username}". Please try again later.`);
        }
        
        throw publicError;
      }
    } catch (error) {
      throw error instanceof Error 
        ? error 
        : new Error(`Failed to load user "${username}". Please try again later.`);
    }
  },

  getUserProfilePicture: async (username: string): Promise<string | null> => {
    try {
      const response = await publicApiClient.get<User>(`/users/${username}`);
      return response.data.profilePictureUrl || null;
    } catch (error) {
      return null;
    }
  },
  
  getUserProfiles: async (usernames: string[]): Promise<Record<string, User>> => {
    if (!usernames.length) return {};
    
    const uniqueUsernames = [...new Set(usernames)];
    const results: Record<string, User> = {};
    
    const client = publicApiClient;
    
    await Promise.allSettled(
      uniqueUsernames.map(async (username) => {
        try {
          const response = await client.get<User>(`/users/${username}`);
          results[username] = response.data;
        } catch (error) {
        }
      })
    );
    
    return results;
  },

  getUserComments: async (username: string): Promise<Comment[]> => {
    try {
      if (keycloak.authenticated) {
        try {
          const authResponse = await getAuthApiClient().get<Comment[]>(`/users/${username}/comments`);
          return authResponse.data;
        } catch (authError) {
        }
      }
      
      const response = await publicApiClient.get<Comment[]>(`/users/${username}/comments`);
      return response.data;
    } catch (error) {
      return [];
    }
  },

  getUserWatchlist: async (username: string): Promise<WatchlistItem[]> => {
    try {
      if (keycloak.authenticated) {
        try {
          const authResponse = await getAuthApiClient().get<WatchlistItem[]>(`/users/${username}/watchlist`);
          return authResponse.data;
        } catch (authError) {
        }
      }
      
      const response = await publicApiClient.get<WatchlistItem[]>(`/users/${username}/watchlist`);
      return response.data;
    } catch (error) {
      return [];
    }
  },

  getWatchlist: async (): Promise<WatchlistItem[]> => {
    const response = await getAuthApiClient().get<WatchlistItem[]>('/users/me/watchlist');
    return response.data;
  },

  updateProfilePicture: async (pictureUrl: string | null): Promise<User> => {
    try {
      const payload = { profilePictureUrl: pictureUrl };
      
      const response = await getAuthApiClient().put<User>('/users/profile/picture', payload);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
      }
      
      throw error;
    }
  },

  updatePreferences: async (preferences: Record<string, any>): Promise<User> => {
    try {
      const response = await getAuthApiClient().put<User>('/users/preferences', preferences);
      return response.data;
    } catch (error) {
      throw new Error('Cannot update preferences: endpoint not implemented');
    }
  }
};

export default userApi;
