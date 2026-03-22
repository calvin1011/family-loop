import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { mapSessionUser } from '@/lib/auth/mapSessionUser';
import { normalizeToE164 } from '@/lib/phone';
import type { AppUser } from '@/types';

GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
});

interface AuthContextType {
  user: AppUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithPhone: (phoneNumber: string) => Promise<void>;
  verifyPhoneOtp: (phoneNumber: string, code: string, displayName?: string) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    displayName: string
  ) => Promise<{ needsEmailConfirmation: boolean }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<AppUser>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ? mapSessionUser(session.user) : null);
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ? mapSessionUser(session.user) : null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.');
    }
    if (!process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID) {
      throw new Error('Google Sign-In is not configured. Set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID.');
    }
    setIsLoading(true);
    try {
      await GoogleSignin.hasPlayServices();
      const result = await GoogleSignin.signIn();
      const idToken = result.data?.idToken;

      if (!idToken) throw new Error('No ID token returned from Google. Check web client ID and SHA-1 (Android).');

      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
      });
      if (error) throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signInWithPhone = useCallback(async (phoneNumber: string) => {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured.');
    }
    const e164 = normalizeToE164(phoneNumber);
    if (e164.length < 8) {
      throw new Error('Enter a valid phone number with area code (e.g. +15551234567).');
    }
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({ phone: e164 });
      if (error) throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const verifyPhoneOtp = useCallback(async (phoneNumber: string, code: string, displayName?: string) => {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured.');
    }
    const e164 = normalizeToE164(phoneNumber);
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        phone: e164,
        token: code.trim(),
        type: 'sms',
      });
      if (error) throw error;
      const name = displayName?.trim();
      if (name) {
        const { error: metaError } = await supabase.auth.updateUser({
          data: { full_name: name },
        });
        if (metaError) throw metaError;
        const { data: u } = await supabase.auth.getUser();
        if (u.user) {
          await supabase.from('profiles').update({ display_name: name }).eq('id', u.user.id);
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured.');
    }
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, displayName: string) => {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured.');
    }
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { full_name: displayName } },
      });
      if (error) throw error;
      const needsEmailConfirmation = !data.session;
      return { needsEmailConfirmation };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    setIsLoading(true);
    try {
      await supabase.auth.signOut();
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (updates: Partial<AppUser>) => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: updates.displayName ?? user.displayName,
          avatar_url: updates.avatarUrl ?? user.avatarUrl,
        },
      });
      if (authError) throw authError;

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          display_name: updates.displayName ?? user.displayName ?? null,
          avatar_url: updates.avatarUrl ?? user.avatarUrl ?? null,
        })
        .eq('id', user.id);
      if (profileError) throw profileError;

      setUser((prev) => (prev ? { ...prev, ...updates } : null));
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const isAuthenticated = user !== null;

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated,
      signInWithGoogle,
      signInWithPhone,
      verifyPhoneOtp,
      signInWithEmail,
      signUp,
      signOut,
      updateProfile,
    }),
    [
      user,
      isLoading,
      isAuthenticated,
      signInWithGoogle,
      signInWithPhone,
      verifyPhoneOtp,
      signInWithEmail,
      signUp,
      signOut,
      updateProfile,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
