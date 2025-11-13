import { createContext, useContext, useEffect, useState } from 'react';
import { authApi } from '../lib/api';

interface User {
  id: number;
  username: string;
  email: string;
  is_active: boolean;
}

interface AuthContextType {
  user: User | null;
  username: string | null;
  loading: boolean;
  signIn: (username: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (username: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        // Check if we have a token
        const token = localStorage.getItem('auth_token');
        if (!token) {
          setUser(null);
          setLoading(false);
          return;
        }

        // Verify session and get user
        const isValid = await authApi.checkSession();
        if (isValid) {
          const currentUser = await authApi.getCurrentUser();
          setUser(currentUser);
        } else {
          // Invalid token, clear it
          localStorage.removeItem('auth_token');
          setUser(null);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        localStorage.removeItem('auth_token');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const signIn = async (username: string, password: string) => {
    try {
      await authApi.login(username, password);
      const currentUser = await authApi.getCurrentUser();
      setUser(currentUser);
      return { error: null };
    } catch (error: any) {
      // Extract user-friendly error message
      let errorMessage = 'Failed to sign in. Please check your credentials.';
      
      if (error?.message) {
        // If the error message is already user-friendly (from our improved fetchApi)
        errorMessage = error.message;
      } else if (error?.status === 401) {
        errorMessage = 'Incorrect username or password. Please try again.';
      } else if (error?.status === 400) {
        errorMessage = 'Invalid request. Please check your input.';
      } else if (error?.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      }
      
      return { error: new Error(errorMessage) };
    }
  };

  const signUp = async (username: string, password: string) => {
    try {
      await authApi.register(username, password);
      return { error: null };
    } catch (error: any) {
      // Extract user-friendly error message
      let errorMessage = 'Failed to create account. Please try again.';
      
      if (error?.message) {
        // If the error message is already user-friendly (from our improved fetchApi)
        errorMessage = error.message;
      } else if (error?.status === 400) {
        errorMessage = 'Invalid request. Please check your input.';
      } else if (error?.status === 409 || error?.status === 422) {
        errorMessage = 'Username or email already exists. Please choose a different one.';
      } else if (error?.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      }
      
      return { error: new Error(errorMessage) };
    }
  };

  const signOut = async () => {
    try {
      await authApi.logout();
      setUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
      // Even if logout fails, clear the local state
      localStorage.removeItem('auth_token');
      setUser(null);
    }
  };

  const username = user?.username || null;

  return (
    <AuthContext.Provider value={{ user, username, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
