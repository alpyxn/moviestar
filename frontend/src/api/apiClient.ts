import axios  from 'axios';
import keycloak from '../auth/keycloak';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8081/api';

export const publicApiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});

export const getAuthApiClient = () => {
  const token = keycloak.token;
  
  return axios.create({
    baseURL: API_URL,
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    }
  });
};

const apiClient = {
  get: async <T>(url: string, config?: any): Promise<{data: T}> => {
    return getAuthApiClient().get<T>(url, config);
  },
  post: async <T>(url: string, data?: any, config?: any): Promise<{data: T}> => {
    return getAuthApiClient().post<T>(url, data, config);
  },
  put: async <T>(url: string, data?: any, config?: any): Promise<{data: T}> => {
    return getAuthApiClient().put<T>(url, data, config);
  },
  delete: async <T>(url: string, config?: any): Promise<{data: T}> => {
    return getAuthApiClient().delete<T>(url, config);
  }
};

export default apiClient;