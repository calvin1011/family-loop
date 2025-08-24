import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

// Component that handles authentication routing
function RootLayoutNav() {
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        // User not logged in - redirect to welcome screen
        router.replace('/(auth)/welcome');
      } else {
        // User is logged in - redirect to main app
        router.replace('/(tabs)');
      }
    }
  }, [isAuthenticated, isLoading]);

  // Show loading screen while checking authentication status
  if (isLoading) {
    return (
      <View style={{
        flex: 1,
        backgroundColor: '#F8F9FA',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <Text style={{
          fontSize: 24,
          fontWeight: 'bold',
          color: '#2C3E50',
          marginBottom: 8
        }}>
          Family Loop
        </Text>
        <Text style={{
          fontSize: 16,
          color: '#7F8C8D'
        }}>
          Loading...
        </Text>
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Authentication screens - shown when not logged in */}
      <Stack.Screen name="(auth)" />

      {/* Main app screens - shown when logged in */}
      <Stack.Screen name="(tabs)" />

      {/* Error handling */}
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
    // Show loading screen while fonts load
    return (
      <View style={{
        flex: 1,
        backgroundColor: '#F8F9FA',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <Text style={{
          fontSize: 20,
          color: '#2C3E50'
        }}>
          Loading fonts...
        </Text>
      </View>
    );
  }

  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <RootLayoutNav />
        <StatusBar style="auto" />
      </ThemeProvider>
    </AuthProvider>
  );
}