import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { Platform } from 'react-native';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { useIdTokenAuthRequest } from "expo-auth-session/providers/google";
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';

WebBrowser.maybeCompleteAuthSession();

interface User {
  uid: string;
  email?: string | null;
  phoneNumber?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
  provider?: string | null;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithPhone: (phoneNumber: string) => Promise<FirebaseAuthTypes.ConfirmationResult>;
  confirmPhoneCode: (confirmation: FirebaseAuthTypes.ConfirmationResult, code: string) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Get environment variables from Expo config
const extra = Constants.expoConfig?.extra;
console.log('Expo extra config:', JSON.stringify(extra, null, 2));

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Configuration for Google Authentication
  const googleAuthConfig = {
    webClientId: extra?.secrets?.GOOGLE_WEB_CLIENT_ID as string,
    androidClientId: extra?.secrets?.GOOGLE_ANDROID_CLIENT_ID as string,
    iosClientId: extra?.secrets?.GOOGLE_IOS_CLIENT_ID as string,
    scopes: ["profile", "email"],
  };

  // Initialize Google Sign-In request
  const [request, response, promptAsync] = useIdTokenAuthRequest({
    clientId: Platform.select({
      web: googleAuthConfig.webClientId,
      android: googleAuthConfig.androidClientId,
      ios: googleAuthConfig.iosClientId,
    }),
    scopes: googleAuthConfig.scopes,
  });

  useEffect(() => {
    const subscriber = auth().onAuthStateChanged((firebaseUser) => {
      if (firebaseUser) {
        const appUser: User = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          provider: firebaseUser.providerData?.[0]?.providerId
        };
        setUser(appUser);
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });
    return subscriber;
  }, []);

  // Handle Google sign-in response
  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      const credential = auth.GoogleAuthProvider.credential(id_token);
      setIsLoading(true);
      auth()
        .signInWithCredential(credential)
        .then(() => {
          // Successfully signed in
        })
        .catch((error) => {
          console.error("Firebase credential error:", error);
        })
        .finally(() => setIsLoading(false));
    }
  }, [response]);

  const signInWithGoogle = async () => {
    try {
      setIsLoading(true);
      await promptAsync();
    } catch (error) {
      console.error("Sign-in error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithPhone = async (phoneNumber: string): Promise<FirebaseAuthTypes.ConfirmationResult> => {
    setIsLoading(true);
    try {
      const confirmation = await auth().signInWithPhoneNumber(phoneNumber);
      return confirmation;
    } catch (error) {
      console.error('Phone sign-in error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const confirmPhoneCode = async (confirmation: FirebaseAuthTypes.ConfirmationResult, code: string) => {
    setIsLoading(true);
    try {
      await confirmation.confirm(code);
    } catch (error) {
      console.error('Verification code error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      await auth().signInWithEmailAndPassword(email, password);
    } catch (error) {
      console.error('Email sign-in error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    setIsLoading(true);
    try {
      const userCredential = await auth().createUserWithEmailAndPassword(email, password);
      if (userCredential.user) {
        await userCredential.user.updateProfile({ displayName: displayName });
      }
    } catch (error) {
      console.error('Sign-up error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await auth().signOut();
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
    const currentUser = auth().currentUser;
    if (!currentUser) return;
    
    try {
      await currentUser.updateProfile({
        displayName: updates.displayName,
        photoURL: updates.photoURL,
      });
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  };

  const isAuthenticated = user !== null;

  const value = useMemo(() => ({
    user,
    isLoading,
    isAuthenticated,
    signInWithGoogle,
    signInWithPhone,
    confirmPhoneCode,
    signInWithEmail,
    signUp,
    signOut,
    updateProfile,
  }), [user, isLoading, isAuthenticated, signInWithPhone, confirmPhoneCode, signInWithEmail, signUp, signOut, updateProfile, signInWithGoogle]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};