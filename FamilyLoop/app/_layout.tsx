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

  // Handle navigation when auth state changes
  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        console.log('User not authenticated, navigating to onboarding');
        router.replace('/(auth)/onboarding');
      } else {
        console.log('User authenticated, navigating to main app');
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
          fontSize: 32,
          fontWeight: '800',
          color: '#2C3E50',
          marginBottom: 8
        }}>
          Family Loop
        </Text>
        <Text style={{
          fontSize: 16,
          color: '#7F8C8D',
          marginBottom: 20
        }}>
          Checking authentication...
        </Text>

        {/* Loading indicator */}
        <View style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          borderWidth: 3,
          borderColor: '#E8F4FD',
          borderTopColor: '#3498DB',
        }} />
      </View>
    );
  }

  // Show all possible routes - navigation will handle which one to show
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
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
          fontSize: 24,
          fontWeight: 'bold',
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