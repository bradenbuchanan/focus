// src/context/AuthContext.tsx
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { Session, User, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signUp: (
    email: string,
    password: string,
    name: string
  ) => Promise<{ success: boolean; error?: string }>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check active session
    const getSession = async () => {
      setIsLoading(true);
      const { data, error } = await supabase.auth.getSession();

      if (!error && data.session) {
        setSession(data.session);
        setUser(data.session.user);
      }

      setIsLoading(false);
    };

    getSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event: string, session: Session | null) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (
    email: string,
    password: string,
    name: string
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      console.log('Attempting signup with:', { email, name });

      // First check if the email already exists
      const { data: existingUsers, error: checkError } = await supabase
        .from('user_profiles')
        .select('email')
        .eq('email', email)
        .limit(1);

      if (checkError) {
        console.error('Error checking for existing email:', checkError);
      } else if (existingUsers && existingUsers.length > 0) {
        // Email already exists in the profiles table
        return {
          success: false,
          error:
            'This email address is already registered. Please use a different email or try signing in instead.',
        };
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
        },
      });

      if (error) {
        console.error('Supabase auth error:', error);

        // Handle specific auth errors
        if (error.message.includes('already registered')) {
          return {
            success: false,
            error:
              'This email address is already registered. Please use a different email or try signing in instead.',
          };
        }

        throw error;
      }

      console.log('Signup successful, user data:', data);

      // Create user profile using upsert instead of insert
      if (data?.user) {
        console.log('Creating user profile for:', data.user.id);

        // Using upsert instead of insert to handle potential duplicates
        const { error: profileError } = await supabase
          .from('user_profiles')
          .upsert(
            {
              id: data.user.id,
              email,
              name,
            },
            {
              // On conflict, do nothing or update only specific fields
              onConflict: 'id',
              ignoreDuplicates: false,
            }
          );

        if (profileError) {
          // Log the error but don't throw - this way the auth still succeeds
          console.warn('Profile creation warning:', profileError);
        } else {
          console.log('User profile created successfully');
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Signup process error:', error);

      // Format error message for return
      let errorMessage = 'An unexpected error occurred during registration.';
      if (error instanceof AuthError) {
        errorMessage = error.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    setIsLoading(false);
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const value = {
    user,
    session,
    isLoading,
    signUp,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
