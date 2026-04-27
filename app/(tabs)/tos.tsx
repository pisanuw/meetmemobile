import React from 'react';
import { ScrollView, Text, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, TYPOGRAPHY } from '@/config';

export default function TermsOfServiceScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Terms of Service</Text>
        <Text style={styles.updated}>Last updated: April 2026</Text>

        <Section title="1. Acceptance of Terms">
          By creating an account or using MeetMe (&quot;the Service&quot;), you agree to these
          Terms of Service. If you do not agree, do not use the Service.
        </Section>

        <Section title="2. Description of Service">
          MeetMe is a scheduling tool that helps groups find a common meeting time.
          The Service allows you to create meetings, share availability, and schedule
          appointments.
        </Section>

        <Section title="3. Eligibility">
          You must be at least 13 years old to use the Service. By using the Service,
          you represent that you meet this requirement.
        </Section>

        <Section title="4. Account Responsibilities">
          {`• You are responsible for maintaining the confidentiality of your account.\n• You agree to provide accurate information when creating your account.\n• You may not share your account or use another person's account.\n• You are responsible for all activity that occurs under your account.`}
        </Section>

        <Section title="5. Acceptable Use">
          {`You agree not to:\n• Use the Service for any unlawful purpose.\n• Send spam or unsolicited messages to other users.\n• Attempt to gain unauthorized access to any part of the Service.\n• Interfere with or disrupt the Service or servers.\n• Impersonate any person or entity.`}
        </Section>

        <Section title="6. Content">
          You retain ownership of any content you submit (meeting titles, notes,
          availability). By submitting content, you grant us a limited license to
          store and display it solely to provide the Service to you and your meeting
          participants.
        </Section>

        <Section title="7. Privacy">
          Your use of the Service is also governed by our Privacy Policy, which is
          incorporated into these Terms. Please review the Privacy Policy to
          understand our practices.
        </Section>

        <Section title="8. Termination">
          You may delete your account at any time from the Profile screen. We reserve
          the right to suspend or terminate accounts that violate these Terms. Upon
          termination, your data will be deleted in accordance with our Privacy Policy.
        </Section>

        <Section title="9. Disclaimers">
          THE SERVICE IS PROVIDED &quot;AS IS&quot; WITHOUT WARRANTIES OF ANY KIND.
          WE DO NOT GUARANTEE THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE,
          OR SECURE.
        </Section>

        <Section title="10. Limitation of Liability">
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR ANY
          INDIRECT, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES ARISING FROM YOUR
          USE OF THE SERVICE.
        </Section>

        <Section title="11. Changes to Terms">
          We may update these Terms from time to time. Continued use of the Service
          after changes constitutes acceptance of the updated Terms.
        </Section>

        <Section title="12. Contact">
          Questions about these Terms? Email legal@meetme.pisan.me.
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
