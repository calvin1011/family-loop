import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define what a user looks like in our app
interface User {
  id: string;
  email?: string;
  phoneNumber?: string;
  displayName?: string;
  photoURL?: string;
  provider: 'google' | 'phone' | 'email'; // How they signed in
}

// Define what our auth context provides
interface AuthContextType {
  // Current user state
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  // Auth actions
  signInWithGoogle: () => Promise<void>;
  signInWithPhone: (phoneNumber: string) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;

  // User profile actions
  updateProfile: (updates: Partial<User>) => Promise<void>;
}

// Create the context
const AuthContext = createContext<AuthContextType | null>(null);

// Provider component that wraps your app
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start with loading true

  // Check if user is already logged in when app starts
  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      // In real implementation, this would check Firebase auth state
      // For now, we'll simulate checking saved auth state
      const savedUser = await getSavedUser();
      if (savedUser) {
        setUser(savedUser);
      }
    } catch (error) {
      console.error('Error checking auth state:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Simulate getting saved user (in real app, this would be Firebase)
  const getSavedUser = async (): Promise<User | null> => {
    // Simulate async storage check
    return new Promise((resolve) => {
      setTimeout(() => {
        // For now, return null (no saved user)
        // Later this will check Firebase auth state
        resolve(null);
      }, 1000);
    });
  };

  // Google Sign In
  const signInWithGoogle = async () => {
    try {
      setIsLoading(true);

      // TODO: Implement actual Google Sign In with Firebase
      // For now, simulate successful Google sign in
      const mockGoogleUser: User = {
        id: 'google_' + Date.now(),
        email: 'user@gmail.com',
        displayName: 'Test User',
        photoURL: 'https://via.placeholder.com/150',
        provider: 'google'
      };

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      setUser(mockGoogleUser);
      await saveUser(mockGoogleUser);

    } catch (error) {
      console.error('Google sign in error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Phone Sign In
  const signInWithPhone = async (phoneNumber: string) => {
    try {
      setIsLoading(true);

      // TODO: Implement actual phone verification with Firebase
      const mockPhoneUser: User = {
        id: 'phone_' + Date.now(),
        phoneNumber: phoneNumber,
        displayName: 'Phone User',
        provider: 'phone'
      };

      // Simulate verification process
      await new Promise(resolve => setTimeout(resolve, 2000));

      setUser(mockPhoneUser);
      await saveUser(mockPhoneUser);

    } catch (error) {
      console.error('Phone sign in error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Email/Password Sign In
  const signInWithEmail = async (email: string, password: string) => {
    try {
      setIsLoading(true);

      // TODO: Implement actual email sign in with Firebase
      const mockEmailUser: User = {
        id: 'email_' + Date.now(),
        email: email,
        displayName: email.split('@')[0], // Use email prefix as name
        provider: 'email'
      };

      // Simulate sign in process
      await new Promise(resolve => setTimeout(resolve, 1500));

      setUser(mockEmailUser);
      await saveUser(mockEmailUser);

    } catch (error) {
      console.error('Email sign in error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Sign Up with Email
  const signUp = async (email: string, password: string, displayName: string) => {
    try {
      setIsLoading(true);

      // TODO: Implement actual sign up with Firebase
      const newUser: User = {
        id: 'new_' + Date.now(),
        email: email,
        displayName: displayName,
        provider: 'email'
      };

      // Simulate account creation
      await new Promise(resolve => setTimeout(resolve, 2000));

      setUser(newUser);
      await saveUser(newUser);

    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Sign Out
  const signOut = async () => {
    try {
      setIsLoading(true);

      // TODO: Sign out from Firebase
      await clearSavedUser();
      setUser(null);

    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Update User Profile
  const updateProfile = async (updates: Partial<User>) => {
    if (!user) return;

    try {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      await saveUser(updatedUser);
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  };

  // Helper functions for saving/loading user data
  const saveUser = async (user: User) => {
    // TODO: Save to secure storage
    // For now, just log that we would save
    console.log('Would save user to secure storage:', user.id);
  };

  const clearSavedUser = async () => {
    // TODO: Clear from secure storage
    console.log('Would clear saved user from storage');
  };

  // Calculate derived state
  const isAuthenticated = user !== null;

  // Context value
  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    signInWithGoogle,
    signInWithPhone,
    signInWithEmail,
    signUp,
    signOut,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Export the context for direct access if needed
export { AuthContext };