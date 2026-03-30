/**
 * Deep Link Handler
 *
 * When a user taps a magic link (e.g. https://meetme-2.netlify.app/api/auth/magic?token=...)
 * iOS opens the app via the associated domain. This hook intercepts that URL and
 * navigates to the WebViewAuthScreen so the token can be exchanged in the same
 * cookie-aware environment.
 *
 * Set up in _layout.tsx via useDeepLinkHandler().
 */

import { useEffect } from 'react';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';

export function useDeepLinkHandler() {
  const router = useRouter();

  useEffect(() => {
    // Handle URLs when app is already open
    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleUrl(url, router);
    });

    // Handle URL that launched the app
    Linking.getInitialURL().then(url => {
      if (url) handleUrl(url, router);
    });

    return () => subscription.remove();
  }, [router]);
}

function handleUrl(url: string, router: ReturnType<typeof import('expo-router').useRouter>) {
  // Magic link pattern: .../api/auth/magic?token=...
  if (url.includes('/api/auth/magic') || url.includes('/api/auth/verify')) {
    router.push({
      pathname: '/(auth)/webview-auth',
      params: { mode: 'magic', url },
    });
  }
}
