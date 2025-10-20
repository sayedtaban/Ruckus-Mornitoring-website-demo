import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, convertEmailToUsername } from '../lib/supabase';

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
    let timeoutId: NodeJS.Timeout;

    const initAuth = async () => {
      try {
        const timeoutPromise = new Promise((_, reject) => {
          timeoutId = setTimeout(() => reject(new Error('Auth timeout')), 5000);
        });

        const authPromise = supabase.auth.getSession();

        const { data: { session } } = await Promise.race([authPromise, timeoutPromise]) as any;
        clearTimeout(timeoutId);
        setUser(session?.user ?? null);
      } catch (error) {
        console.error('Auth initialization error:', error);
        // In development mode, don't auto-login - show login page first
        console.log('Development mode: Starting with no user to show login page');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        setUser(session?.user ?? null);
      })();
    });

    return () => {
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (username: string, password: string) => {
    try {
      const email = `${username}@smartzone.local`;
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) return { error };
      
      // In development mode, manually trigger auth state change
      const isDevelopment = !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY;
      if (isDevelopment) {
        // Get the session after successful sign in
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
      }
      
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signUp = async (username: string, password: string) => {
    try {
      const email = `${username}@smartzone.local`;
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
          },
        },
      });
      if (error) return { error };
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    try {
      // Check if we're in development mode (mock authentication)
      const isDevelopment = !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (isDevelopment) {
        // In development mode, just clear the user state
        console.log('Signing out from development mode');
        setUser(null);
        return;
      }
      
      // In production mode, use Supabase sign out
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Sign out error:', error);
        throw error;
      }
      
      // Clear user state after successful sign out
      setUser(null);
    } catch (error) {
      console.error('Sign out failed:', error);
      // Even if Supabase sign out fails, clear the local user state
      setUser(null);
      throw error;
    }
  };

  const username = user?.email ? convertEmailToUsername(user.email) : null;

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
