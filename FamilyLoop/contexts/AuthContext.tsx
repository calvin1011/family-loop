import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { Platform } from 'react-native';
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile as firebaseUpdateProfile,
  GoogleAuthProvider,
  signInWithCredential,
  FirebaseAuthTypes,
  signInWithPhoneNumber,
} from '@react-native-firebase/auth'
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
  provider?: string | null; // How user signed in
}

// Define what our (auth) context provides
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

// Create the context
const AuthContext = createContext<AuthContextType | null>(null);

// Get environment variables from Expo config
const extra = Constants.expoConfig?.extra;

const authInstance = getAuth();

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Configuration for Google Authentication using the extra field
  const googleAuthConfig = {
    webClientId: extra?.GOOGLE_WEB_CLIENT_ID as string,
    androidClientId: extra?.GOOGLE_ANDROID_CLIENT_ID as string,
    iosClientId: extra?.GOOGLE_IOS_CLIENT_ID as string,
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
    const subscriber = onAuthStateChanged(authInstance, (firebaseUser) => {
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
      const credential = GoogleAuthProvider.credential(id_token);
      setIsLoading(true);
      signInWithCredential(authInstance, credential)
        .then(() => {

        })
        .catch((error) => {
          console.error("Firebase credential error:", error);
        })
        .finally(() => setIsLoading(false));
    }
  }, [response]);

  // Google Sign In trigger
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
      const confirmation = await signInWithPhoneNumber(authInstance, phoneNumber);
      return confirmation;
    } catch (error) {
      console.error('Phone sign-in error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Confirm the phone verification code
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
      await signInWithEmailAndPassword(authInstance, email, password);
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
      const userCredential = await createUserWithEmailAndPassword(authInstance, email, password);
      if (userCredential.user) {
        await firebaseUpdateProfile(userCredential.user, { displayName: displayName });
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
    await firebaseSignOut(authInstance);
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  } finally {
    setIsLoading(false);
  }
};

  const updateProfile = async (updates: Partial<User>) => {
    if (!authInstance.currentUser) return;
    try {
      await firebaseUpdateProfile(authInstance.currentUser, {
        displayName: updates.displayName,
        photoURL: updates.photoURL,
      });
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    } finally {
      setIsLoading(false);
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