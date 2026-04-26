import React from 'react';
import { ScrollView, Text, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, TYPOGRAPHY } from '@/config';

export default function PrivacyScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Privacy Policy</Text>
        <Text style={styles.updated}>Last updated: April 2026</Text>

        <Section title="Overview">
          MeetMe helps groups find a common meeting time. We collect the minimum
          data necessary to provide this service and never sell your personal
          information.
        </Section>

        <Section title="Information We Collect">
          {`• Email address — used to identify you and send magic-link sign-in emails and meeting invitations.\n• Display name — shown to other meeting participants.\n• Timezone — used to display availability in your local time.\n• Availability slots — the times you mark as available within a meeting.\n• Google Calendar (optional) — if you connect Google Calendar, we read free/busy data only; we never read event titles or descriptions.`}
        </Section>

        <Section title="How We Use Your Information">
          {`• To authenticate you via magic link or Google OAuth.\n• To display your name and availability to other meeting participants.\n• To send meeting invitations and reminder emails on your behalf.\n• To show aggregated availability across all participants.`}
        </Section>

        <Section title="Data Storage">
          Your data is stored securely on Netlify infrastructure. Google Calendar
          OAuth tokens are encrypted at rest using AES-256-GCM. Session tokens are
          signed JWTs stored in HttpOnly cookies and are never accessible to
          JavaScript.
        </Section>

        <Section title="Data Sharing">
          We do not sell or share your personal data with third parties, except:
          {`\n• Resend (email delivery service) — receives your email address to deliver messages you request.\n• Google — if you connect Google Calendar, OAuth tokens are exchanged with Google's servers.`}
        </Section>

        <Section title="Data Retention">
          {`• Active meeting data is retained as long as the meeting exists.\n• Anonymous meetings are automatically deleted after 30 days of inactivity.\n• You may delete your meetings or leave meetings you were invited to at any time.\n• To request full account deletion, email privacy@meetme.pisan.me.`}
        </Section>

        <Section title="Your Rights">
          You may request access to, correction of, or deletion of your personal
          data at any time by contacting us at privacy@meetme.pisan.me.
        </Section>

        <Section title="Contact">
          Questions about this policy? Email privacy@meetme.pisan.me.
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.body}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING['2xl'],
  },
  title: {
    fontSize: TYPOGRAPHY.fontSizes['2xl'],
    fontWeight: TYPOGRAPHY.fontWeights.bold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  updated: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.textMuted,
    marginBottom: SPACING.lg,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSizes.base,
    fontWeight: TYPOGRAPHY.fontWeights.semibold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  body: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.textMuted,
    lineHeight: 22,
  },
});
