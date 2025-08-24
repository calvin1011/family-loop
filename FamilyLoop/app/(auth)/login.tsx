import React, { useState } from 'react';
import {View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform,} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';

export default function LoginScreen() {
  const { signInWithGoogle, signInWithPhone, signInWithEmail, isLoading } = useAuth();

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [authMethod, setAuthMethod] = useState<'email' | 'phone' | 'google'>('email');

  // Handle Google Sign In
  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      // Navigation will be handled by (auth) state change
    } catch (error) {
      Alert.alert('Sign In Failed', 'Unable to sign in with Google. Please try again.');
    }
  };

  // Handle Email Sign In
  const handleEmailSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Missing Information', 'Please enter both email and password.');
      return;
    }

    try {
      await signInWithEmail(email, password);
    } catch (error) {
      Alert.alert('Sign In Failed', 'Invalid email or password. Please try again.');
    }
  };

  // Handle Phone Sign In
  const handlePhoneSignIn = async () => {
    if (!phoneNumber) {
      Alert.alert('Missing Information', 'Please enter your phone number.');
      return;
    }

    try {
      await signInWithPhone(phoneNumber);
    } catch (error) {
      Alert.alert('Sign In Failed', 'Unable to verify phone number. Please try again.');
    }
  };

  // Navigate to sign up
  const goToSignUp = () => {
    router.push('/(auth)/signup');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Header - Calm and welcoming */}
        <View style={styles.header}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>
            Continue nurturing your meaningful relationships
          </Text>
        </View>

        {/* Auth Method Selection */}
        <View style={styles.methodSelector}>
          <TouchableOpacity
            style={[styles.methodButton, authMethod === 'email' && styles.methodButtonActive]}
            onPress={() => setAuthMethod('email')}
          >
            <Text style={[styles.methodText, authMethod === 'email' && styles.methodTextActive]}>
              Email
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.methodButton, authMethod === 'phone' && styles.methodButtonActive]}
            onPress={() => setAuthMethod('phone')}
          >
            <Text style={[styles.methodText, authMethod === 'phone' && styles.methodTextActive]}>
              Phone
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.methodButton, authMethod === 'google' && styles.methodButtonActive]}
            onPress={() => setAuthMethod('google')}
          >
            <Text style={[styles.methodText, authMethod === 'google' && styles.methodTextActive]}>
              Google
            </Text>
          </TouchableOpacity>
        </View>

        {/* Form Content */}
        <View style={styles.formContainer}>

          {/* Email Sign In Form */}
          {authMethod === 'email' && (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="your@email.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholderTextColor="#A0A0A0"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  secureTextEntry
                  placeholderTextColor="#A0A0A0"
                />
              </View>

              <TouchableOpacity
                style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
                onPress={handleEmailSignIn}
                disabled={isLoading}
              >
                <Text style={styles.primaryButtonText}>
                  {isLoading ? 'Signing In...' : 'Sign In'}
                </Text>
              </TouchableOpacity>
            </>
          )}

          {/* Phone Sign In Form */}
          {authMethod === 'phone' && (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone Number</Text>
                <TextInput
                  style={styles.input}
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  placeholder="+1 (555) 123-4567"
                  keyboardType="phone-pad"
                  autoCorrect={false}
                  placeholderTextColor="#A0A0A0"
                />
              </View>

              <TouchableOpacity
                style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
                onPress={handlePhoneSignIn}
                disabled={isLoading}
              >
                <Text style={styles.primaryButtonText}>
                  {isLoading ? 'Sending Code...' : 'Send Verification Code'}
                </Text>
              </TouchableOpacity>

              <Text style={styles.helpText}>
                We'll send you a verification code to confirm your number
              </Text>
            </>
          )}

          {/* Google Sign In */}
          {authMethod === 'google' && (
            <>
              <TouchableOpacity
                style={[styles.googleButton, isLoading && styles.buttonDisabled]}
                onPress={handleGoogleSignIn}
                disabled={isLoading}
              >
                <Text style={styles.googleButtonText}>
                  {isLoading ? 'Connecting...' : 'Continue with Google'}
                </Text>
              </TouchableOpacity>

              <Text style={styles.helpText}>
                Sign in securely using your Google account
              </Text>
            </>
          )}

        </View>

        {/* Sign Up Link - Subtle, not pushy */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>New to Family Loop?</Text>
          <TouchableOpacity onPress={goToSignUp}>
            <Text style={styles.linkText}>Create an account</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// Anti-addictive design styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA', // Soft, calming background
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    marginBottom: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2C3E50', // Calm, readable color
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#7F8C8D', // Muted, non-urgent
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
  },
  methodSelector: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  methodButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  methodButtonActive: {
    backgroundColor: '#E8F4FD', // Soft blue, not aggressive
  },
  methodText: {
    fontSize: 16,
    color: '#7F8C8D',
    fontWeight: '500',
  },
  methodTextActive: {
    color: '#3498DB',
  },
  formContainer: {
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#2C3E50',
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#2C3E50',
    // No aggressive focus colors
  },
  primaryButton: {
    backgroundColor: '#3498DB',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  googleButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  googleButtonText: {
    color: '#2C3E50',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  helpText: {
    fontSize: 14,
    color: '#95A5A6',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 20,
  },
  footer: {
    alignItems: 'center',
    marginTop: 20,
  },
  footerText: {
    fontSize: 16,
    color: '#7F8C8D',
    marginBottom: 8,
  },
  linkText: {
    fontSize: 16,
    color: '#3498DB',
    fontWeight: '500',
    // No underline or aggressive styling
  },
});