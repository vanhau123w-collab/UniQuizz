// utils/auth.js
// Helper functions để làm việc với authentication

export const getAuthToken = () => {
  return localStorage.getItem("token");
};

export const getAuthHeaders = () => {
  const token = getAuthToken();
  return {
    "Authorization": token ? `Bearer ${token}` : "",
  };
};

export const isAuthenticated = () => {
  const token = getAuthToken();
  if (!token) return false;
  
  try {
    // Basic JWT validation - check if token has proper structure
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    
    // Decode payload to check expiration
    const payload = JSON.parse(atob(parts[1]));
    const now = Date.now() / 1000;
    
    // Check if token is expired
    if (payload.exp && payload.exp < now) {
      localStorage.removeItem('token');
      return false;
    }
    
    return true;
  } catch (error) {
    // Invalid token format
    localStorage.removeItem('token');
    return false;
  }
};

