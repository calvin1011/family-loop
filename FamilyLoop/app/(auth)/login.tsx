import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { formatAuthError } from '@/lib/auth/errors';
import {
  savePhoneOtpPending,
  loadPhoneOtpPending,
  clearPhoneOtpPending,
} from '@/lib/auth/phoneOtpPending';
import { router } from 'expo-router';

export default function LoginScreen() {
  const { signInWithGoogle, signInWithPhone, verifyPhoneOtp, signInWithEmail, isLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [authMethod, setAuthMethod] = useState<'email' | 'phone' | 'google'>('email');

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const pending = await loadPhoneOtpPending();
      if (cancelled || !pending || pending.flow !== 'login') return;
      setAuthMethod('phone');
      setPhoneNumber(pending.phoneRaw);
      setOtpSent(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      Alert.alert('Sign In Failed', formatAuthError(error));
    }
  };

  const handleEmailSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Missing Information', 'Please enter both email and password.');
      return;
    }
    try {
      await signInWithEmail(email, password);
    } catch (error) {
      Alert.alert('Sign In Failed', formatAuthError(error));
    }
  };

  const sendOtp = async (isResend = false) => {
    if (!phoneNumber) {
      Alert.alert('Missing Information', 'Please enter your phone number.');
      return;
    }
    try {
      await signInWithPhone(phoneNumber);
      if (!isResend) setOtpSent(true);
      setResendCooldown(60);
      setVerificationCode('');
      await savePhoneOtpPending({
        phoneRaw: phoneNumber.trim(),
        displayName: '',
        flow: 'login',
      });
      Alert.alert(isResend ? 'Code Resent' : 'Code Sent', 'Please enter the verification code sent to your phone.');
    } catch (error) {
      Alert.alert('Sign In Failed', formatAuthError(error));
    }
  };

  const handlePhoneSignIn = () => sendOtp(false);
  const handlePhoneResend = () => sendOtp(true);

  const handlePhoneCodeConfirm = async () => {
    if (!verificationCode) {
      Alert.alert('Missing Information', 'Please enter the verification code.');
      return;
    }
    try {
      await verifyPhoneOtp(phoneNumber, verificationCode);
      setOtpSent(false);
      await clearPhoneOtpPending();
    } catch (error) {
      const msg = formatAuthError(error);
      const isExpired = /expir|invalid/i.test(msg);
      Alert.alert(
        'Sign In Failed',
        isExpired ? `${msg}\n\nYou can resend the code or use a different number.` : msg,
      );
    }
  };

  const goToSignUp = () => {
    router.push('/(auth)/signup');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>
            Continue nurturing your meaningful relationships
          </Text>
        </View>

        {!otpSent && (
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
        )}

        <View style={styles.formContainer}>
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

          {authMethod === 'phone' && (
            <>
              {!otpSent ? (
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
                    {"We'll send you a verification code to confirm your number"}
                  </Text>
                </>
              ) : (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Verification Code</Text>
                    <TextInput
                      style={styles.input}
                      value={verificationCode}
                      onChangeText={setVerificationCode}
                      placeholder="Enter the 6-digit code"
                      keyboardType="numeric"
                      placeholderTextColor="#A0A0A0"
                    />
                  </View>

                  <TouchableOpacity
                    style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
                    onPress={handlePhoneCodeConfirm}
                    disabled={isLoading}
                  >
                    <Text style={styles.primaryButtonText}>
                      {isLoading ? 'Confirming...' : 'Confirm Code'}
                    </Text>
                  </TouchableOpacity>

                  <Text style={styles.helpText}>
                    A code was sent to {phoneNumber}.
                  </Text>

                  <TouchableOpacity
                    style={[styles.secondaryButton, (isLoading || resendCooldown > 0) && styles.buttonDisabled]}
                    onPress={handlePhoneResend}
                    disabled={isLoading || resendCooldown > 0}
                  >
                    <Text style={styles.secondaryButtonText}>
                      {resendCooldown > 0 ? `Resend code (${resendCooldown}s)` : 'Resend code'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={async () => {
                      setOtpSent(false);
                      setVerificationCode('');
                      setResendCooldown(0);
                      await clearPhoneOtpPending();
                    }}
                  >
                    <Text style={styles.linkText}>Use a different number</Text>
                  </TouchableOpacity>
                </>
              )}
            </>
          )}

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
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
    color: '#2C3E50',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#7F8C8D',
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
    backgroundColor: '#E8F4FD',
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
  },
  primaryButton: {
    width: '100%',
    backgroundColor: '#3498DB',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginBottom: 20,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  googleButton: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginBottom: 20,
  },
  googleButtonText: {
    color: '#2C3E50',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    width: '100%',
    backgroundColor: 'transparent',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#3498DB',
  },
  secondaryButtonText: {
    color: '#3498DB',
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
    fontWeight: 'bold',
  },
});
