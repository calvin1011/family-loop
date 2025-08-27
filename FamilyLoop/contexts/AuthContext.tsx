import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { Platform } from 'react-native';
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut as firebaseSignOut, updateProfile as firebaseUpdateProfile, GoogleAuthProvider, signInWithCredential, User as FirebaseUser, Auth, setPersistence, browserSessionPersistence, browserLocalPersistence } from 'firebase/auth';
import { useIdTokenAuthRequest } from "expo-auth-session/providers/google";
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';

WebBrowser.maybeCompleteAuthSession();

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Auth with persistence
const auth = getAuth(app);

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
  signInWithPhone: (phoneNumber: string) => Promise<any>;
  confirmPhoneCode: (confirmation: any, code: string) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Get environment variables from Expo config
const extra = Constants.expoConfig?.extra;

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Configuration for Google Authentication
  const googleAuthConfig = {
    webClientId: (extra as any)?.secrets?.GOOGLE_WEB_CLIENT_ID || process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    androidClientId: (extra as any)?.secrets?.GOOGLE_ANDROID_CLIENT_ID || process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    iosClientId: (extra as any)?.secrets?.GOOGLE_IOS_CLIENT_ID || process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    scopes: ["profile", "email"] as string[],
  } as const;

  const [request, response, promptAsync] = useIdTokenAuthRequest({
    clientId: Platform.select({
      web: googleAuthConfig.webClientId,
      android: googleAuthConfig.androidClientId,
      ios: googleAuthConfig.iosClientId,
    }),
    scopes: googleAuthConfig.scopes,
  });

  // Set up Firebase Auth persistence
  useEffect(() => {
    if (Platform.OS === 'web') {
      setPersistence(auth, browserLocalPersistence)
        .then(() => {
          console.log('Firebase persistence set to local storage');
        })
        .catch((error) => {
          console.error('Failed to set Firebase persistence:', error);
        });
    }
  }, []);

  // Firebase auth state listener - handles automatic persistence
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      console.log('Auth state changed:', firebaseUser ? 'User logged in' : 'User logged out');

      if (firebaseUser) {
        const appUser: User = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          provider: firebaseUser.providerData?.[0]?.providerId
        };
        setUser(appUser);
        console.log('User restored:', appUser.displayName || appUser.email);
      } else {
        setUser(null);
      }

      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  // Google sign in response handler
  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      const credential = GoogleAuthProvider.credential(id_token);
      setIsLoading(true);
      signInWithCredential(auth, credential)
        .catch((error) => {
          console.error("Firebase credential error:", error);
        })
        .finally(() => setIsLoading(false));
    }
  }, [response]);

  const signInWithGoogle = async () => {
    if (!googleAuthConfig.androidClientId && Platform.OS === 'android') {
      throw new Error('Missing androidClientId for Google auth');
    }
    try {
      setIsLoading(true);
      await promptAsync();
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithPhone = async (phoneNumber: string): Promise<any> => {
    setIsLoading(true);
    try {
      // Note: Phone auth with Firebase Web SDK requires additional setup
      // For now, this is a placeholder - you'll need to implement phone auth differently
      throw new Error('Phone authentication not yet implemented with Firebase Web SDK');
    } finally {
      setIsLoading(false);
    }
  };

  const confirmPhoneCode = async (confirmation: any, code: string) => {
    setIsLoading(true);
    try {
      // Placeholder for phone code confirmation
      throw new Error('Phone code confirmation not yet implemented with Firebase Web SDK');
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Firebase automatically persists the session
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      if (userCredential.user) {
        await firebaseUpdateProfile(userCredential.user, { displayName: displayName });
      }
      // Firebase automatically persists the session
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await firebaseSignOut(auth);
      // Firebase automatically clears the persisted session
      console.log('User signed out');
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    setIsLoading(true);
    try {
      await firebaseUpdateProfile(currentUser, {
        displayName: updates.displayName,
        photoURL: updates.photoURL,
      });

      // Update local user state
      if (user) {
        const updatedUser = { ...user, ...updates };
        setUser(updatedUser);
      }
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