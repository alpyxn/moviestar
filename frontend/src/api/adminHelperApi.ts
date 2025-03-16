import axios from 'axios';
import keycloak from '../auth/keycloak';
import { Actor, Director, Genre } from '@/api/apiService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8081/api';

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

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

const refreshKeycloakToken = async (): Promise<string> => {
  if (isRefreshing) {
    return new Promise((resolve, reject) => {
      failedQueue.push({ resolve, reject });
    });
  }

  isRefreshing = true;

  try {
    await keycloak.updateToken(5);
    
    if (keycloak.isTokenExpired()) {
      throw new Error('Token refresh failed');
    }
    
    const token = keycloak.token!;
    processQueue(null, token);
    return token;
  } catch (error) {
    processQueue(error);
    keycloak.login();
    throw error;
  } finally {
    isRefreshing = false;
  }
};

const adminAxios = axios.create({
  baseURL: API_URL,
});

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

adminAxios.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    
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
      return [];
    }
  },
  
  getAdminActors: async (): Promise<Actor[]> => {
    try {
      const response = await adminAxios.get<Actor[]>('/admin/actors');
      return response.data;
    } catch (error) {
      return [];
    }
  },
  
  getAdminDirectors: async (): Promise<Director[]> => {
    try {
      const response = await adminAxios.get<Director[]>('/admin/directors');
      return response.data;
    } catch (error) {
      return [];
    }
  }
};

export default adminHelperApi;