// Client-side authentication utilities

export function getAuthToken() {
  if (typeof document === 'undefined') return null;
  
  // Try to get from cookie first
  const cookies = document.cookie.split(';');
  const authCookie = cookies.find(cookie => 
    cookie.trim().startsWith('auth-token=')
  );
  
  if (authCookie) {
    return authCookie.split('=')[1];
  }
  
  // Fallback to localStorage
  return localStorage.getItem('auth-token');
}

export function setAuthToken(token) {
  if (typeof document === 'undefined') return;
  
  // Store in localStorage as fallback
  localStorage.setItem('auth-token', token);
  
  // Note: Setting cookies from client-side has limitations
  // In production, cookies should be set server-side
}

export function removeAuthToken() {
  if (typeof document === 'undefined') return;
  
  localStorage.removeItem('auth-token');
  
  // Clear cookie by setting expiration in the past
  document.cookie = 'auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
}

export function parseJWT(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Failed to parse JWT:', error);
    return null;
  }
}

export function getCurrentUser() {
  const token = getAuthToken();
  if (!token) return null;
  
  const payload = parseJWT(token);
  if (!payload || payload.exp * 1000 < Date.now()) {
    removeAuthToken();
    return null;
  }
  
  return payload;
}

export function isAuthenticated() {
  return getCurrentUser() !== null;
}

export function hasRole(role) {
  const user = getCurrentUser();
  return user && user.role === role;
}

export function isInventoryManager() {
  return hasRole('inventory_manager');
}
