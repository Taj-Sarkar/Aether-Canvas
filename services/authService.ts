export interface User {
  id: string;
  email: string;
  name: string;
  bio?: string;
  banner?: string;
  avatar?: string;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: User;
  error?: string;
}

const API_BASE = '';

// Token management
export const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
};

export const setToken = (token: string): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('auth_token', token);
};

export const removeToken = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('auth_token');
};

// User persistence
export const getStoredUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem('auth_user');
  return stored ? JSON.parse(stored) : null;
};

export const setStoredUser = (user: User): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('auth_user', JSON.stringify(user));
};

export const removeStoredUser = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('auth_user');
};

export const getAuthHeaders = (): HeadersInit => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Sign up
export const signUp = async (email: string, password: string, name: string): Promise<AuthResponse> => {
  try {
    const res = await fetch(`${API_BASE}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    });

    const data = await res.json();

    if (data.success && data.token && data.user) {
      setToken(data.token);
      setStoredUser(data.user);
    }

    return data;
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to sign up' };
  }
};

// Sign in
export const signIn = async (email: string, password: string): Promise<AuthResponse> => {
  try {
    const res = await fetch(`${API_BASE}/api/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (data.success && data.token && data.user) {
      setToken(data.token);
      setStoredUser(data.user);
    }

    return data;
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to sign in' };
  }
};

// Verify token and get user
export const verifyAuth = async (): Promise<{ success: boolean; user?: User; error?: string }> => {
  try {
    const token = getToken();
    if (!token) {
      return { success: false, error: 'No token found' };
    }

    const res = await fetch(`${API_BASE}/api/auth/verify`, {
      headers: getAuthHeaders(),
    });

    const data = await res.json();
    
    if (data.success && data.user) {
      setStoredUser(data.user); // Update stored user with latest from server
    } else if (res.status === 401) {
      // Token expired or invalid
      logout();
    }

    return data;
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to verify token' };
  }
};

// Logout
export const logout = (): void => {
  removeToken();
  removeStoredUser();
};

export const updateProfile = async (data: { name: string; bio: string; banner: string; avatar: string }): Promise<AuthResponse> => {
  try {
    const res = await fetch('/api/user/update', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeaders() 
      } as HeadersInit,
      body: JSON.stringify(data),
    });

    const responseData = await res.json();

    if (responseData.success && responseData.user) {
      setStoredUser(responseData.user);
    }

    return responseData;
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to update user' };
  }
};
