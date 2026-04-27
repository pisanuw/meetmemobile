import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Share,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { COLORS, SPACING, TYPOGRAPHY, API_BASE_URL } from '@/config';

export default function MeetingCreatedScreen() {
  const router = useRouter();
  const { meetingId, adminToken, participationToken, title } = useLocalSearchParams<{
    meetingId: string;
    adminToken: string;
    participationToken: string;
    title: string;
  }>();

  const participationUrl = `${API_BASE_URL}/meeting.html?id=${encodeURIComponent(meetingId)}&t=${encodeURIComponent(participationToken)}`;
  const adminUrl = `${API_BASE_URL}/meeting.html?id=${encodeURIComponent(meetingId)}&t=${encodeURIComponent(adminToken)}`;

  async function handleShareInvite() {
    await Share.share({
      message: `You're invited to fill in your availability for "${title}": ${participationUrl}`,
    });
  }

  async function handleShareAdmin() {
    await Share.share({
      message: `Your admin link for "${title}" (keep this private): ${adminUrl}`,
    });
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Success banner */}
        <View style={styles.successBanner}>
          <View style={styles.checkCircle}>
            <Ionicons name="checkmark" size={36} color="#fff" />
          </View>
          <Text style={styles.successTitle}>Meeting Created!</Text>
          <Text style={styles.successSubtitle}>{title}</Text>
        </View>

        {/* Invite link */}
        <Card style={styles.section}>
          <Text style={styles.sectionLabel}>Invite Link</Text>
          <Text style={styles.hint}>
            Share this with people you want to invite. Anyone with this link can fill in
            their availability.
          </Text>
          <TouchableOpacity style={styles.linkBox} onPress={handleShareInvite} activeOpacity={0.7}>
            <Text style={styles.linkText} numberOfLines={2}>{participationUrl}</Text>
            <Ionicons name="share-outline" size={18} color={COLORS.primary} />
          </TouchableOpacity>
          <Button
            title="Share Invite Link"
            onPress={handleShareInvite}
            size="md"
            style={styles.shareButton}
          />
        </Card>

        {/* Admin link */}
        <Card style={styles.section}>
          <View style={styles.adminHeader}>
            <Ionicons name="key-outline" size={16} color={COLORS.warning} />
            <Text style={[styles.sectionLabel, { color: COLORS.warning, marginBottom: 0 }]}>
              Your Admin Link
            </Text>
          </View>
          <Text style={styles.hint}>
            This link lets you finalize and manage the meeting. Save it somewhere safe — you
            won&apos;t be able to recover it.
          </Text>
          <TouchableOpacity style={styles.linkBox} onPress={handleShareAdmin} activeOpacity={0.7}>
            <Text style={styles.linkText} numberOfLines={2}>{adminUrl}</Text>
            <Ionicons name="copy-outline" size={18} color={COLORS.primary} />
          </TouchableOpacity>
          <Button
            title="Copy Admin Link"
            onPress={handleShareAdmin}
            variant="outline"
            size="md"
            style={styles.shareButton}
          />
        </Card>

        {/* Sign in to claim */}
        <Card style={styles.section}>
          <Text style={styles.sectionLabel}>Want a dashboard?</Text>
          <Text style={styles.hint}>
            Sign in to claim this meeting and manage it from your account alongside your other
            meetings.
          </Text>
          <Button
            title="Sign In to Claim Meeting"
            onPress={() => router.replace('/(auth)/login')}
            variant="outline"
            size="md"
          />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: SPACING.md, gap: SPACING.md, paddingBottom: SPACING['2xl'] },
  successBanner: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  checkCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
  },
  successTitle: {
    fontSize: TYPOGRAPHY.fontSizes['2xl'],
    fontWeight: TYPOGRAPHY.fontWeights.bold,
    color: COLORS.text,
  },
  successSubtitle: {
    fontSize: TYPOGRAPHY.fontSizes.base,
    color: COLORS.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
  section: { gap: SPACING.xs },
  adminHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: 2,
  },
  sectionLabel: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    fontWeight: TYPOGRAPHY.fontWeights.semibold,
    color: COLORS.text,
    marginBottom: 2,
  },
  hint: {
    fontSize: TYPOGRAPHY.fontSizes.xs,
    color: COLORS.textMuted,
    lineHeight: 18,
  },
  linkBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    marginTop: SPACING.xs,
  },
  linkText: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSizes.xs,
    color: COLORS.primary,
  },
  shareButton: { marginTop: SPACING.xs },
});
