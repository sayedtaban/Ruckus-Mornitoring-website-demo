import { createClient, User, Session, Subscription } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

// Create a mock Supabase client for development when env vars are missing
const isDevelopment = !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Mock authentication methods for development
if (isDevelopment) {
  console.warn('Supabase environment variables not found. Running in development mode with mock authentication.');
  
  // Mock user for development
  const mockUser: User = {
    id: 'dev-user-1',
    email: 'admin@smartzone.local',
    user_metadata: { username: 'admin' },
    app_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    email_confirmed_at: new Date().toISOString(),
    last_sign_in_at: new Date().toISOString(),
    role: 'authenticated',
    phone: '',
    confirmed_at: new Date().toISOString(),
    recovery_sent_at: undefined,
    new_email: undefined,
    invited_at: undefined,
    action_link: undefined,
    email_change_sent_at: undefined,
    new_phone: undefined,
    is_anonymous: false
  };

  const mockSession: Session = {
    access_token: 'mock-token',
    refresh_token: 'mock-refresh-token',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    token_type: 'bearer',
    user: mockUser
  };

  // Override auth methods for development
  supabase.auth.getSession = async () => ({
    data: { session: mockSession },
    error: null
  });

  supabase.auth.signInWithPassword = async (credentials) => {
    const email = 'email' in credentials ? credentials.email : undefined;
    if (email === 'admin@smartzone.local' && credentials.password === '1qaz@WSX#EDC!') {
      return {
        data: { user: mockUser, session: mockSession },
        error: null
      };
    }
    return {
      data: { user: null, session: null },
      error: { message: 'Invalid credentials' } as any
    };
  };

  supabase.auth.signUp = async () => {
    return {
      data: { user: mockUser, session: mockSession },
      error: null
    };
  };

  supabase.auth.signOut = async () => {
    return { error: null };
  };

  supabase.auth.onAuthStateChange = (_callback) => {
    // Don't automatically call with mock user - only when signIn is called
    return { 
      data: { 
        subscription: { 
          unsubscribe: () => {},
          id: 'mock-subscription'
        } as Subscription
      } 
    };
  };
}

export const convertUsernameToEmail = (username: string): string => {
  return `${username}@smartzone.local`;
};

export const convertEmailToUsername = (email: string): string => {
  return email.replace('@smartzone.local', '');
};

