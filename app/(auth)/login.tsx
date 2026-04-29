import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { sendMagicLink } from '@/api/auth';
import { storeAuthToken } from '@/api/client';
import { isValidEmail, isMagicLinkToken } from '@/utils/validation';
import { Button } from '@/components/Button';
import { FlashMessage } from '@/components/FlashMessage';
import { useFlash } from '@/hooks/useFlash';
import { useAuth } from '@/context/AuthContext';
import { COLORS, SPACING, TYPOGRAPHY, API_BASE_URL } from '@/config';

export default function LoginScreen() {
  const router = useRouter();
  const { onAuthSuccess } = useAuth();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { flash, showFlash, clearFlash } = useFlash();

  // State machine: normal → token_detected → token_edited
  // Once the user edits a detected token it never re-qualifies until the field is cleared.
  const [tokenState, setTokenState] = useState<'normal' | 'token_detected' | 'token_edited'>('normal');

  function handleEmailChange(value: string) {
    const looksLikeToken = isMagicLinkToken(value);
    setTokenState(prev => {
      if (prev === 'token_detected') return 'token_edited';  // any edit locks out
      if (!looksLikeToken) return 'normal';
      if (prev === 'normal') return 'token_detected';        // fresh paste/entry
      return prev;                                           // token_edited stays locked out
    });
    setEmail(value);
  }

  const emailIsValid = isValidEmail(email);
  const isToken = tokenState === 'token_detected';
  const canSubmit = emailIsValid || isToken;

  async function handleSendLink() {
    if (isToken) {
      // User pasted a magic-link token directly — verify it via WebView (same flow as deep links)
      const verifyUrl = `${API_BASE_URL}/api/auth/magic-link/verify?token=${encodeURIComponent(email.trim())}`;
      router.push({ pathname: '/(auth)/webview-auth', params: { mode: 'magic', url: verifyUrl } });
      return;
    }
    if (!emailIsValid) {
      showFlash('Please enter a valid email address', 'error');
      return;
    }
    setIsLoading(true);
    try {
      await sendMagicLink(email.trim().toLowerCase());
      router.push({ pathname: '/(auth)/email-sent', params: { email: email.trim() } });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      showFlash(message, 'error');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setIsGoogleLoading(true);
    try {
      // ASWebAuthenticationSession (real Safari) — Google allows this, unlike embedded WebViews.
      // The backend embeds the JWT in the meetme:// callback URL because ASWebAuthenticationSession
      // cookies are NOT shared with URLSession (NSHTTPCookieStorage.shared).
      const result = await WebBrowser.openAuthSessionAsync(
        `${API_BASE_URL}/api/auth/google/start?mobile=1`,
        'meetme://',
      );
      if (result.type === 'success' && result.url) {
        // Extract and persist the token so the API client can send it as Bearer.
        const callbackUrl = new URL(result.url);
        const token = callbackUrl.searchParams.get('token');
        if (token) {
          await storeAuthToken(token);
        }
        await onAuthSuccess();
        // _layout.tsx redirects to (tabs) once isAuthenticated flips
      }
    } catch {
      showFlash('Google sign-in failed. Please try again.', 'error');
    } finally {
      setIsGoogleLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* Hero */}
          <View style={styles.hero}>
            <View style={styles.logoCircle}>
              <Ionicons name="calendar" size={40} color="#fff" />
            </View>
            <Text style={styles.appName}>MeetMe</Text>
            <Text style={styles.tagline}>Find the perfect meeting time</Text>
          </View>

          {/* Flash */}
          {flash && (
            <FlashMessage
              message={flash.message}
              type={flash.type}
              onDismiss={clearFlash}
            />
          )}

          {/* Magic link form */}
          <View style={styles.form}>
            <Text style={styles.sectionLabel}>
              {isToken ? 'Sign in with token' : 'Sign in with email'}
            </Text>
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor={COLORS.textMuted}
              value={email}
              onChangeText={handleEmailChange}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              returnKeyType="send"
              onSubmitEditing={handleSendLink}
              testID="email-input"
            />
            <Button
              title={isToken ? 'Sign In with Token' : 'Send Magic Link'}
              onPress={handleSendLink}
              loading={isLoading}
              disabled={!canSubmit}
              size="lg"
              style={styles.button}
              testID="send-link-button"
            />
          </View>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Google OAuth */}
          <TouchableOpacity
            style={[styles.googleButton, isGoogleLoading && { opacity: 0.6 }]}
            onPress={handleGoogleSignIn}
            activeOpacity={0.8}
            disabled={isGoogleLoading}
            testID="google-signin-button"
          >
            <Ionicons name="logo-google" size={20} color="#4285f4" />
            <Text style={styles.googleButtonText}>
              {isGoogleLoading ? 'Opening Google…' : 'Continue with Google'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.footer}>
            By signing in you agree to our{' '}
            <Text
              style={styles.footerLink}
              onPress={() => router.push('/(tabs)/tos')}
              testID="tos-link"
            >
              Terms of Service
            </Text>
            {' '}and{' '}
            <Text
              style={styles.footerLink}
              onPress={() => router.push('/(tabs)/privacy')}
              testID="privacy-link"
            >
              Privacy Policy
            </Text>
            .
          </Text>

          <TouchableOpacity
            onPress={() => router.push('/(auth)/create-anonymous')}
            style={styles.anonLink}
            testID="create-anonymous-button"
          >
            <Text style={styles.anonLinkText}>Create a meeting without an account</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xl,
    justifyContent: 'center',
  },
  hero: { alignItems: 'center', marginBottom: SPACING['2xl'] },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
    shadowColor: COLORS.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
  },
  appName: {
    fontSize: TYPOGRAPHY.fontSizes['3xl'],
    fontWeight: TYPOGRAPHY.fontWeights.bold,
    color: COLORS.text,
  },
  tagline: {
    fontSize: TYPOGRAPHY.fontSizes.base,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  form: { gap: SPACING.sm },
  sectionLabel: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    fontWeight: TYPOGRAPHY.fontWeights.medium,
    color: COLORS.text,
    marginBottom: 2,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: 14,
    fontSize: TYPOGRAPHY.fontSizes.base,
    color: COLORS.text,
  },
  button: { marginTop: SPACING.xs },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginVertical: SPACING.lg,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerText: { fontSize: TYPOGRAPHY.fontSizes.sm, color: COLORS.textMuted },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingVertical: 14,
  },
  googleButtonText: {
    fontSize: TYPOGRAPHY.fontSizes.base,
    fontWeight: TYPOGRAPHY.fontWeights.medium,
    color: COLORS.text,
  },
  footer: {
    textAlign: 'center',
    fontSize: TYPOGRAPHY.fontSizes.xs,
    color: COLORS.textMuted,
    marginTop: SPACING.xl,
  },
  footerLink: {
    color: COLORS.primary,
    textDecorationLine: 'underline',
  },
  anonLink: {
    alignItems: 'center',
    marginTop: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  anonLinkText: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeights.medium,
  },
});
