import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/Button';
import { COLORS, SPACING, TYPOGRAPHY } from '@/config';

export default function EmailSentScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.iconCircle}>
          <Ionicons name="mail" size={48} color={COLORS.primary} />
        </View>

        <Text style={styles.title}>Check your email</Text>
        <Text style={styles.body}>
          {email
            ? <>We sent a sign-in link to{'\n'}<Text style={styles.email}>{email}</Text></>
            : 'We sent a sign-in link to your email address.'}
        </Text>
        <Text style={styles.hint}>
          The link expires in 15 minutes and can only be used once.
          Tap it on this device to be signed in automatically.
        </Text>

        <Button
          title="Back to Sign In"
          variant="outline"
          onPress={() => router.replace('/(auth)/login')}
          style={styles.button}
          testID="back-to-login-button"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
    gap: SPACING.md,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSizes['2xl'],
    fontWeight: TYPOGRAPHY.fontWeights.bold,
    color: COLORS.text,
    textAlign: 'center',
  },
  body: {
    fontSize: TYPOGRAPHY.fontSizes.base,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 24,
  },
  email: {
    fontWeight: TYPOGRAPHY.fontWeights.semibold,
    color: COLORS.text,
  },
  hint: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: SPACING.sm,
  },
  button: { marginTop: SPACING.lg, alignSelf: 'stretch' },
});
