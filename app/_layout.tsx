import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '@/context/AuthContext';
import { RootNavigator } from '@/navigation/RootNavigator';
import { useDeepLinkHandler } from '@/hooks/useDeepLinkHandler';

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
    <SafeAreaProvider>
      <AuthProvider>
        <AppWithDeepLinks />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
