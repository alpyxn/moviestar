import useAuth from "../auth/useAuth";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8081/api";

// Custom hook to create an authenticated fetch function
export function useApiClient() {
  const { token } = useAuth();
  
  const fetchWithAuth = async (
    endpoint: string,
    options: RequestInit = {}
  ) => {
    const headers = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    // Handle non-2xx responses
    if (!response.ok) {
      // Parse error response
      let errorData;
      try {
        errorData = await response.json();
      } 
      catch {
        errorData = { message: "Unknown error occurred" };
      }
      
      throw new Error(errorData.message || `Error ${response.status}`);
    }

    // Check if response is empty
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return response.json();
    }
    
    return response.text();
  };

  return { fetchWithAuth };
}