import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import WebView, { WebViewNavigation } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { LoadingScreen } from '@/components/LoadingScreen';
import { useAuth } from '@/context/AuthContext';
import { COLORS, SPACING, TYPOGRAPHY, API_BASE_URL } from '@/config';

/**
 * WebViewAuthScreen
 *
 * Used for two flows:
 *  1. magic-link: user taps the link from email → deep-linked into this screen
 *     with a `url` param pointing at the real magic-link URL.
 *  2. google: taps "Continue with Google" → loads the Google OAuth start URL.
 *
 * When the WebView lands on /dashboard.html (post-auth), we call onAuthSuccess()
 * which re-fetches /api/auth/me.  The cookie set by the server is stored in
 * iOS's shared WKWebView cookie store and is automatically included in
 * subsequent native fetch() calls.
 */
export default function WebViewAuthScreen() {
  const { mode, url: deepLinkUrl } = useLocalSearchParams<{
    mode?: 'google' | 'magic';
    url?: string;
  }>();
  const router = useRouter();
  const { onAuthSuccess } = useAuth();
  const webViewRef = useRef<WebView>(null);
  const [isLoading, setIsLoading] = useState(true);

  const startUrl =
    mode === 'google'
      ? `${API_BASE_URL}/api/auth/google/start`
      : deepLinkUrl ?? `${API_BASE_URL}/`;

  async function handleNavigationChange(nav: WebViewNavigation) {
    // Backend redirects returning users to /dashboard.html and new/incomplete
    // users to /profile.html?setup=1 — both indicate successful auth.
    if (
      nav.url.includes('/dashboard.html') ||
      nav.url.endsWith('/dashboard') ||
      nav.url.includes('/profile.html')
    ) {
      await onAuthSuccess();
      // RootNavigator will automatically redirect to (tabs) when isAuthenticated flips
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.closeButton}
          testID="webview-close"
        >
          <Ionicons name="close" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {mode === 'google' ? 'Sign in with Google' : 'Signing in…'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* WebView */}
      <WebView
        ref={webViewRef}
        source={{ uri: startUrl }}
        onNavigationStateChange={handleNavigationChange}
        onLoadStart={() => setIsLoading(true)}
        onLoadEnd={() => setIsLoading(false)}
        sharedCookiesEnabled={true}
        thirdPartyCookiesEnabled={true}
        style={styles.webview}
        testID="auth-webview"
      />

      {isLoading && (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <LoadingScreen message="Loading…" />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.surface },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSizes.base,
    fontWeight: TYPOGRAPHY.fontWeights.semibold,
    color: COLORS.text,
  },
  webview: { flex: 1 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.background,
  },
});
