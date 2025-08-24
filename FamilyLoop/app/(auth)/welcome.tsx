import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';

export default function WelcomeScreen() {
  const goToLogin = () => {
    router.push('/(auth)/login');
  };

  const goToSignUp = () => {
    router.push('/(auth)/signup');
  };

  return (
    <View style={styles.container}>
      {/* Hero Section */}
      <View style={styles.heroSection}>
        <Text style={styles.appName}>Family Loop</Text>
        <Text style={styles.tagline}>
          Stay connected with the people who matter most
        </Text>

        <View style={styles.featuresContainer}>
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>🧠</Text>
            <Text style={styles.featureText}>Smart relationship insights</Text>
          </View>

          <View style={styles.feature}>
            <Text style={styles.featureIcon}>👨‍👩‍👧‍👦</Text>
            <Text style={styles.featureText}>Family-first design</Text>
          </View>

          <View style={styles.feature}>
            <Text style={styles.featureIcon}>🧘‍♂️</Text>
            <Text style={styles.featureText}>Calm, mindful experience</Text>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionSection}>
        <TouchableOpacity style={styles.primaryButton} onPress={goToSignUp}>
          <Text style={styles.primaryButtonText}>Create Account</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={goToLogin}>
          <Text style={styles.secondaryButtonText}>I already have an account</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    justifyContent: 'space-between',
    padding: 24,
  },
  heroSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appName: {
    fontSize: 36,
    fontWeight: '800',
    color: '#2C3E50',
    marginBottom: 16,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 18,
    color: '#7F8C8D',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 48,
    maxWidth: 280,
  },
  featuresContainer: {
    alignItems: 'center',
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    maxWidth: 250,
  },
  featureIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  featureText: {
    fontSize: 16,
    color: '#34495E',
    flex: 1,
  },
  actionSection: {
    marginBottom: 32,
  },
  primaryButton: {
    backgroundColor: '#3498DB',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButton: {
    alignItems: 'center',
    padding: 16,
  },
  secondaryButtonText: {
    color: '#3498DB',
    fontSize: 16,
    fontWeight: '500',
  },
});