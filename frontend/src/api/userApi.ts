import { getAuthApiClient /* , publicApiClient */ } from './apiClient';
import { User, WatchlistItem, Comment } from './apiService';
import axios from 'axios';

const userApi = {
  /**
   * Get the current user's profile
   */
  getCurrentUser: async (): Promise<User> => {
    const response = await getAuthApiClient().get<User>('/users/profile');
    return response.data;
  },

  /**
   * Get a user profile by username
   */
  getUserByUsername: async (username: string): Promise<User> => {
    // Changed to use authenticated client since this endpoint requires auth
    const response = await getAuthApiClient().get<User>(`/users/${username}`);
    return response.data;
  },

  /**
   * Get comments from a specific user by username
   */
  getUserComments: async (username: string): Promise<Comment[]> => {
    // This might be public but using authenticated client to be safe
    const response = await getAuthApiClient().get<Comment[]>(`/users/${username}/comments`);
    return response.data;
  },

  /**
   * Get a user's watchlist by username
   */
  getUserWatchlist: async (username: string): Promise<WatchlistItem[]> => {
    // This might be public but using authenticated client to be safe
    const response = await getAuthApiClient().get<WatchlistItem[]>(`/users/${username}/watchlist`);
    return response.data;
  },

  /**
   * Get a user's watchlist
   */
  getWatchlist: async (): Promise<WatchlistItem[]> => {
    const response = await getAuthApiClient().get<WatchlistItem[]>('/users/me/watchlist');
    return response.data;
  },

  /**
   * Update user profile picture
   */
  updateProfilePicture: async (pictureUrl: string | null): Promise<User> => {
    console.log("userApi.updateProfilePicture called with:", pictureUrl);
    
    try {
      // Send null directly to backend to remove profile picture
      const payload = { profilePictureUrl: pictureUrl };
      
      console.log("Sending profile picture payload:", payload);
      
      const response = await getAuthApiClient().put<User>('/users/profile/picture', payload);
      console.log("Profile picture update response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error in updateProfilePicture:", error);
      
      // Add more detailed error logging
      if (axios.isAxiosError(error) && error.response) {
        console.error("API error response:", {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        });
      }
      
      throw error;
    }
  },

  /**
   * Update user preferences
   * Note: This endpoint seems to be missing in the backend.
   * You might need to implement it or remove this method.
   */
  updatePreferences: async (preferences: Record<string, any>): Promise<User> => {
    try {
      // This endpoint might need to be created in the backend
      const response = await getAuthApiClient().put<User>('/users/preferences', preferences);
      return response.data;
    } catch (error) {
      console.error('User preferences endpoint not available:', error);
      throw new Error('Cannot update preferences: endpoint not implemented');
    }
  }
};

export default userApi;
