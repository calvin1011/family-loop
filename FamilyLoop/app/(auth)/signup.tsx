import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { formatAuthError } from '@/lib/auth/errors';
import {
  savePhoneOtpPending,
  loadPhoneOtpPending,
  clearPhoneOtpPending,
} from '@/lib/auth/phoneOtpPending';
import { router } from 'expo-router';

export default function SignUpScreen() {
  const { signUp, signInWithGoogle, signInWithPhone, verifyPhoneOtp, isLoading } = useAuth();

  const [authMethod, setAuthMethod] = useState<'email' | 'phone' | 'google'>('email');

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneDisplayName, setPhoneDisplayName] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const pending = await loadPhoneOtpPending();
      if (cancelled || !pending || pending.flow !== 'signup') return;
      setAuthMethod('phone');
      setPhoneNumber(pending.phoneRaw);
      setPhoneDisplayName(pending.displayName);
      setOtpSent(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleEmailSignUp = async () => {
    if (!displayName || !email || !password || !confirmPassword) {
      Alert.alert('Missing Information', 'Please fill in all fields.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password should be at least 6 characters.');
      return;
    }

    try {
      const { needsEmailConfirmation } = await signUp(email, password, displayName);
      if (needsEmailConfirmation) {
        Alert.alert(
          'Check your email',
          'We sent a confirmation link. Open it, then sign in with your email and password.'
        );
      }
    } catch (error) {
      Alert.alert('Sign Up Failed', formatAuthError(error));
    }
  };

  const sendOtp = async (isResend = false) => {
    if (!phoneNumber.trim()) {
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
        displayName: phoneDisplayName.trim(),
        flow: 'signup',
      });
      Alert.alert(isResend ? 'Code Resent' : 'Code Sent', 'Enter the verification code we sent to your phone.');
    } catch (error) {
      Alert.alert('Sign Up Failed', formatAuthError(error));
    }
  };

  const handlePhoneSendCode = () => sendOtp(false);
  const handlePhoneResend = () => sendOtp(true);

  const handlePhoneVerify = async () => {
    if (!verificationCode.trim()) {
      Alert.alert('Missing Information', 'Please enter the verification code.');
      return;
    }
    try {
      await verifyPhoneOtp(phoneNumber, verificationCode, phoneDisplayName.trim() || undefined);
      setOtpSent(false);
      await clearPhoneOtpPending();
    } catch (error) {
      const msg = formatAuthError(error);
      const isExpired = /expir|invalid/i.test(msg);
      Alert.alert(
        'Sign Up Failed',
        isExpired ? `${msg}\n\nYou can resend the code or use a different number.` : msg,
      );
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      Alert.alert('Sign Up Failed', formatAuthError(error));
    }
  };

  const goToLogin = () => {
    router.push('/(auth)/login');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>
            Connect with loved ones and strengthen your family bonds
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

        {authMethod === 'email' && (
          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Your Name"
                autoCorrect={false}
                placeholderTextColor="#A0A0A0"
              />
            </View>
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
                placeholder="Create a password"
                secureTextEntry
                placeholderTextColor="#A0A0A0"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm Password</Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm your password"
                secureTextEntry
                placeholderTextColor="#A0A0A0"
              />
            </View>
            <TouchableOpacity
              style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
              onPress={handleEmailSignUp}
              disabled={isLoading}
            >
              <Text style={styles.primaryButtonText}>
                {isLoading ? 'Creating...' : 'Sign Up'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {authMethod === 'phone' && (
          <View style={styles.formContainer}>
            {!otpSent ? (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Name (optional)</Text>
                  <TextInput
                    style={styles.input}
                    value={phoneDisplayName}
                    onChangeText={setPhoneDisplayName}
                    placeholder="How we should address you"
                    autoCorrect={false}
                    placeholderTextColor="#A0A0A0"
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Phone Number</Text>
                  <TextInput
                    style={styles.input}
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    placeholder="+1 555 123 4567"
                    keyboardType="phone-pad"
                    autoCorrect={false}
                    placeholderTextColor="#A0A0A0"
                  />
                </View>
                <TouchableOpacity
                  style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
                  onPress={handlePhoneSendCode}
                  disabled={isLoading}
                >
                  <Text style={styles.primaryButtonText}>
                    {isLoading ? 'Sending...' : 'Send verification code'}
                  </Text>
                </TouchableOpacity>
                <Text style={styles.helpText}>
                  {"We'll text you a code. Use E.164 format or 10-digit US numbers."}
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
                    placeholder="6-digit code"
                    keyboardType="number-pad"
                    placeholderTextColor="#A0A0A0"
                  />
                </View>
                <TouchableOpacity
                  style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
                  onPress={handlePhoneVerify}
                  disabled={isLoading}
                >
                  <Text style={styles.primaryButtonText}>
                    {isLoading ? 'Verifying...' : 'Create account'}
                  </Text>
                </TouchableOpacity>
                <Text style={styles.helpText}>Code sent to {phoneNumber}</Text>

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
          </View>
        )}

        {authMethod === 'google' && (
          <View style={styles.formContainer}>
            <TouchableOpacity
              style={[styles.googleButton, isLoading && styles.buttonDisabled]}
              onPress={handleGoogleSignUp}
              disabled={isLoading}
            >
              <Text style={styles.googleButtonText}>
                {isLoading ? 'Connecting...' : 'Continue with Google'}
              </Text>
            </TouchableOpacity>
            <Text style={styles.helpText}>Uses your Google account to create Family Loop access.</Text>
          </View>
        )}

        {authMethod === 'email' && (
          <>
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>
            <View style={styles.socialButtons}>
              <TouchableOpacity
                style={[styles.googleButton, isLoading && styles.buttonDisabled]}
                onPress={handleGoogleSignUp}
                disabled={isLoading}
              >
                <Text style={styles.googleButtonText}>
                  {isLoading ? 'Connecting...' : 'Continue with Google'}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account?</Text>
          <TouchableOpacity onPress={goToLogin}>
            <Text style={styles.linkText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F2EE',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  methodSelector: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  methodButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  methodButtonActive: {
    backgroundColor: '#E8F5E9',
  },
  methodText: {
    fontSize: 15,
    color: '#888',
    fontWeight: '500',
  },
  methodTextActive: {
    color: '#34A853',
    fontWeight: '600',
  },
  formContainer: {
    width: '100%',
    alignItems: 'center',
  },
  inputGroup: {
    width: '100%',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#444',
    marginBottom: 8,
  },
  input: {
    width: '100%',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  primaryButton: {
    width: '100%',
    backgroundColor: '#34A853',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  helpText: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 8,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    marginHorizontal: 10,
    color: '#888',
    fontSize: 14,
  },
  socialButtons: {
    width: '100%',
  },
  googleButton: {
    width: '100%',
    backgroundColor: '#F5F5F5',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  googleButtonText: {
    color: '#444',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    marginTop: 'auto',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 16,
    color: '#666',
  },
  linkText: {
    fontSize: 16,
    color: '#34A853',
    fontWeight: 'bold',
  },
  secondaryButton: {
    width: '100%',
    backgroundColor: 'transparent',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#34A853',
  },
  secondaryButtonText: {
    color: '#34A853',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
