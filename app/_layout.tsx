import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '@/context/AuthContext';
import { RootNavigator } from '@/navigation/RootNavigator';
import { useDeepLinkHandler } from '@/hooks/useDeepLinkHandler';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function AppWithDeepLinks() {
  useDeepLinkHandler();
  return (
    <>
      <StatusBar style="light" />
      <RootNavigator />
    </>
  );
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <AuthProvider>
          <AppWithDeepLinks />
        </AuthProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
