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
import { sendMagicLink } from '@/api/auth';
import { Button } from '@/components/Button';
import { FlashMessage } from '@/components/FlashMessage';
import { useFlash } from '@/hooks/useFlash';
import { COLORS, SPACING, TYPOGRAPHY, API_BASE_URL } from '@/config';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { flash, showFlash, clearFlash } = useFlash();

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  async function handleSendLink() {
    if (!isValidEmail) {
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

  function handleGoogleSignIn() {
    // Navigate to WebView screen that loads Google OAuth
    router.push({ pathname: '/(auth)/webview-auth', params: { mode: 'google' } });
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
            <Text style={styles.sectionLabel}>Sign in with email</Text>
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor={COLORS.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              returnKeyType="send"
              onSubmitEditing={handleSendLink}
              testID="email-input"
            />
            <Button
              title="Send Magic Link"
              onPress={handleSendLink}
              loading={isLoading}
              disabled={!isValidEmail}
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
            style={styles.googleButton}
            onPress={handleGoogleSignIn}
            activeOpacity={0.8}
            testID="google-signin-button"
          >
            <Ionicons name="logo-google" size={20} color="#4285f4" />
            <Text style={styles.googleButtonText}>Continue with Google</Text>
          </TouchableOpacity>

          <Text style={styles.footer}>
            By signing in you agree to our Terms of Service.
          </Text>
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
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
    shadowColor: COLORS.primary,
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
});
