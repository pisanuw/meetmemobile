import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { updateProfile, submitFeedback } from '@/api/auth';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { FlashMessage } from '@/components/FlashMessage';
import { useFlash } from '@/hooks/useFlash';
import { COLORS, SPACING, TYPOGRAPHY } from '@/config';

const TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Anchorage',
  'Pacific/Honolulu',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Kolkata',
  'Australia/Sydney',
  'UTC',
];

export default function ProfileScreen() {
  const { user, refreshUser, logout } = useAuth();
  const { flash, showFlash, clearFlash } = useFlash();

  const [name, setName] = useState(user?.name ?? '');
  const [timezone, setTimezone] = useState(user?.timezone ?? 'UTC');
  const [isSaving, setIsSaving] = useState(false);
  const [showTzPicker, setShowTzPicker] = useState(false);

  // Feedback state
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackType, setFeedbackType] = useState<'bug' | 'feature' | 'other'>('other');
  const [isSendingFeedback, setIsSendingFeedback] = useState(false);

  async function handleSaveProfile() {
    if (!name.trim()) {
      showFlash('Name cannot be empty', 'error');
      return;
    }
    setIsSaving(true);
    try {
      await updateProfile({ name: name.trim(), timezone });
      await refreshUser();
      showFlash('Profile saved!', 'success');
    } catch (err: unknown) {
      showFlash(err instanceof Error ? err.message : 'Failed to save', 'error');
    } finally {
      setIsSaving(false);
    }
  }

  function handleLogout() {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: () => logout(),
      },
    ]);
  }

  async function handleSendFeedback() {
    if (!feedbackText.trim()) {
      showFlash('Please enter a message', 'error');
      return;
    }
    setIsSendingFeedback(true);
    try {
      await submitFeedback(feedbackText.trim(), feedbackType);
      setFeedbackText('');
      showFlash('Feedback sent — thank you!', 'success');
    } catch (err: unknown) {
      showFlash(err instanceof Error ? err.message : 'Failed to send feedback', 'error');
    } finally {
      setIsSendingFeedback(false);
    }
  }

  if (!user) return null;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity onPress={handleLogout} testID="logout-button">
          <Ionicons name="log-out-outline" size={24} color={COLORS.error} />
        </TouchableOpacity>
      </View>

      {flash && (
        <FlashMessage message={flash.message} type={flash.type} onDismiss={clearFlash} />
      )}

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Avatar + email */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarInitial}>
              {(user.name || user.email)[0].toUpperCase()}
            </Text>
          </View>
          <Text style={styles.email}>{user.email}</Text>
          {user.isAdmin && (
            <View style={styles.adminBadge}>
              <Ionicons name="shield-checkmark" size={12} color={COLORS.primary} />
              <Text style={styles.adminBadgeText}>Admin</Text>
            </View>
          )}
        </View>

        {/* Edit profile */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Edit Profile</Text>

          <Text style={styles.fieldLabel}>Display Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            placeholderTextColor={COLORS.textMuted}
            returnKeyType="done"
            testID="name-input"
          />

          <Text style={[styles.fieldLabel, { marginTop: SPACING.sm }]}>Timezone</Text>
          <TouchableOpacity
            style={styles.tzSelector}
            onPress={() => setShowTzPicker(v => !v)}
            testID="timezone-selector"
          >
            <Ionicons name="globe-outline" size={18} color={COLORS.textMuted} />
            <Text style={styles.tzText}>{timezone}</Text>
            <Ionicons
              name={showTzPicker ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={COLORS.textMuted}
            />
          </TouchableOpacity>

          {showTzPicker && (
            <View style={styles.tzList}>
              {TIMEZONES.map(tz => (
                <TouchableOpacity
                  key={tz}
                  style={[styles.tzOption, timezone === tz && styles.tzOptionSelected]}
                  onPress={() => {
                    setTimezone(tz);
                    setShowTzPicker(false);
                  }}
                  testID={`tz-option-${tz}`}
                >
                  <Text
                    style={[styles.tzOptionText, timezone === tz && styles.tzOptionTextSelected]}
                  >
                    {tz}
                  </Text>
                  {timezone === tz && (
                    <Ionicons name="checkmark" size={16} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Button
            title="Save Profile"
            onPress={handleSaveProfile}
            loading={isSaving}
            style={{ marginTop: SPACING.md }}
            testID="save-profile-button"
          />
        </Card>

        {/* Feedback */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Send Feedback</Text>

          <View style={styles.feedbackTypeRow}>
            {(['bug', 'feature', 'other'] as const).map(type => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.feedbackTypeChip,
                  feedbackType === type && styles.feedbackTypeChipActive,
                ]}
                onPress={() => setFeedbackType(type)}
                testID={`feedback-type-${type}`}
              >
                <Text
                  style={[
                    styles.feedbackTypeText,
                    feedbackType === type && styles.feedbackTypeTextActive,
                  ]}
                >
                  {type === 'bug' ? '🐛 Bug' : type === 'feature' ? '✨ Feature' : '💬 Other'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={[styles.input, styles.textArea]}
            value={feedbackText}
            onChangeText={setFeedbackText}
            placeholder="Tell us what you think…"
            placeholderTextColor={COLORS.textMuted}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            testID="feedback-input"
          />

          <Button
            title="Send Feedback"
            variant="outline"
            onPress={handleSendFeedback}
            loading={isSendingFeedback}
            style={{ marginTop: SPACING.sm }}
            testID="send-feedback-button"
          />
        </Card>

        {/* App info */}
        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>MeetMe v0.1.0</Text>
          <Text style={styles.appInfoText}>meetme.pisan.me</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSizes.xl,
    fontWeight: TYPOGRAPHY.fontWeights.bold,
    color: COLORS.text,
  },
  scroll: { padding: SPACING.md, gap: SPACING.sm, paddingBottom: SPACING['2xl'] },
  avatarSection: { alignItems: 'center', paddingVertical: SPACING.lg },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  avatarInitial: {
    fontSize: TYPOGRAPHY.fontSizes['3xl'],
    fontWeight: TYPOGRAPHY.fontWeights.bold,
    color: '#fff',
  },
  email: {
    fontSize: TYPOGRAPHY.fontSizes.base,
    color: COLORS.textMuted,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: SPACING.xs,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  adminBadgeText: {
    fontSize: TYPOGRAPHY.fontSizes.xs,
    fontWeight: TYPOGRAPHY.fontWeights.semibold,
    color: COLORS.primaryDark,
  },
  section: { gap: SPACING.xs },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSizes.base,
    fontWeight: TYPOGRAPHY.fontWeights.semibold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  fieldLabel: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    fontWeight: TYPOGRAPHY.fontWeights.medium,
    color: COLORS.text,
    marginBottom: 4,
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 10,
    fontSize: TYPOGRAPHY.fontSizes.base,
    color: COLORS.text,
  },
  textArea: { minHeight: 100, paddingTop: 10 },
  tzSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 12,
  },
  tzText: { flex: 1, fontSize: TYPOGRAPHY.fontSizes.base, color: COLORS.text },
  tzList: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
    marginTop: 4,
  },
  tzOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tzOptionSelected: { backgroundColor: COLORS.primaryLight },
  tzOptionText: {
    flex: 1,
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.text,
  },
  tzOptionTextSelected: { color: COLORS.primaryDark, fontWeight: TYPOGRAPHY.fontWeights.semibold },
  feedbackTypeRow: { flexDirection: 'row', gap: SPACING.xs, marginBottom: SPACING.sm },
  feedbackTypeChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  feedbackTypeChipActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  feedbackTypeText: {
    fontSize: TYPOGRAPHY.fontSizes.xs,
    fontWeight: TYPOGRAPHY.fontWeights.medium,
    color: COLORS.textMuted,
  },
  feedbackTypeTextActive: { color: COLORS.primaryDark },
  appInfo: { alignItems: 'center', gap: 4, paddingVertical: SPACING.sm },
  appInfoText: { fontSize: TYPOGRAPHY.fontSizes.xs, color: COLORS.textMuted },
});
