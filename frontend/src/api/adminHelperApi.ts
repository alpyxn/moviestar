import axios from 'axios';
import keycloak from '../auth/keycloak';
import { Actor, Director, Genre } from '@/api/apiService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8081/api';

// We'll use a separate mechanism to track token refresh
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

// Process failed requests once token is refreshed
const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(request => {
    if (error) {
      request.reject(error);
    } else {
      request.resolve(token!);
    }
  });
  
  failedQueue = [];
};

// Main refresh function
const refreshKeycloakToken = async (): Promise<string> => {
  if (isRefreshing) {
    return new Promise((resolve, reject) => {
      failedQueue.push({ resolve, reject });
    });
  }

  isRefreshing = true;

  try {
    console.log('Attempting to refresh token...');
    const refreshed = await keycloak.updateToken(5);
    
    console.log('Token refresh result:', refreshed ? 'refreshed' : 'not needed');
    
    if (keycloak.isTokenExpired()) {
      console.error('Token still expired after refresh attempt');
      throw new Error('Token refresh failed');
    }
    
    const token = keycloak.token!;
    processQueue(null, token);
    return token;
  } catch (error) {
    console.error('Token refresh failed, redirecting to login:', error);
    processQueue(error);
    keycloak.login();
    throw error;
  } finally {
    isRefreshing = false;
  }
};

// Create an axios instance with interceptors
const adminAxios = axios.create({
  baseURL: API_URL,
});

// Request interceptor to add auth token
adminAxios.interceptors.request.use(async config => {
  if (keycloak.authenticated) {
    if (keycloak.isTokenExpired()) {
      try {
        const token = await refreshKeycloakToken();
        config.headers.Authorization = `Bearer ${token}`;
      } catch (error) {
        throw error;
      }
    } else {
      config.headers.Authorization = `Bearer ${keycloak.token}`;
    }
  }
  return config;
});

// Response interceptor to handle 401s
adminAxios.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    
    // Handle 401 by refreshing token once
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const token = await refreshKeycloakToken();
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return adminAxios(originalRequest);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

const adminHelperApi = {
  getAdminGenres: async (): Promise<Genre[]> => {
    try {
      const response = await adminAxios.get<Genre[]>('/admin/genres');
      return response.data;
    } catch (error) {
      console.error('Error fetching genres:', error);
      return [];
    }
  },
  
  getAdminActors: async (): Promise<Actor[]> => {
    try {
      const response = await adminAxios.get<Actor[]>('/admin/actors');
      return response.data;
    } catch (error) {
      console.error('Error fetching actors:', error);
      return [];
    }
  },
  
  getAdminDirectors: async (): Promise<Director[]> => {
    try {
      const response = await adminAxios.get<Director[]>('/admin/directors');
      return response.data;
    } catch (error) {
      console.error('Error fetching directors:', error);
      return [];
    }
  }
};

export default adminHelperApi;