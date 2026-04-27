import React from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { FlashMessage } from '@/components/FlashMessage';
import { COLORS, SPACING, TYPOGRAPHY } from '@/config';
import { useProfileForm, TIMEZONES } from '@/hooks/useProfileForm';

export default function ProfileScreen() {
  const router = useRouter();
  const {
    user,
    name, setName,
    timezone,
    isSaving,
    showTzPicker, setShowTzPicker, selectTimezone,
    handleSaveProfile, handleLogout, handleDeleteAccount,
    feedbackText, setFeedbackText,
    feedbackType, setFeedbackType,
    isSendingFeedback, handleSendFeedback,
    flash, clearFlash,
  } = useProfileForm();

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
                  onPress={() => selectTimezone(tz)}
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

        {/* App info + legal links */}
        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>MeetMe v1.0.0</Text>
          <Text style={styles.appInfoText}>meetme.pisan.me</Text>
          <View style={styles.legalLinks}>
            <TouchableOpacity onPress={() => router.push('/(tabs)/privacy')} testID="privacy-link">
              <Text style={styles.legalLink}>Privacy Policy</Text>
            </TouchableOpacity>
            <Text style={styles.legalSeparator}>·</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/tos')} testID="tos-link">
              <Text style={styles.legalLink}>Terms of Service</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Danger zone */}
        <Card style={styles.dangerCard}>
          <Text style={styles.dangerTitle}>Danger Zone</Text>
          <Text style={styles.dangerHint}>
            Deleting your account is permanent and cannot be undone. All your meetings,
            availability data, and profile information will be removed.
          </Text>
          <Button
            title="Delete Account"
            variant="outline"
            onPress={handleDeleteAccount}
            style={styles.deleteButton}
            testID="delete-account-button"
          />
        </Card>
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
    color: COLORS.surface,
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
  legalLinks: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  legalLink: { fontSize: TYPOGRAPHY.fontSizes.xs, color: COLORS.primary, textDecorationLine: 'underline' },
  legalSeparator: { fontSize: TYPOGRAPHY.fontSizes.xs, color: COLORS.textMuted },
  dangerCard: { borderColor: COLORS.error, borderWidth: 1, gap: SPACING.xs },
  dangerTitle: { fontSize: TYPOGRAPHY.fontSizes.sm, fontWeight: TYPOGRAPHY.fontWeights.semibold, color: COLORS.error },
  dangerHint: { fontSize: TYPOGRAPHY.fontSizes.xs, color: COLORS.textMuted, lineHeight: 18 },
  deleteButton: { marginTop: SPACING.xs, borderColor: COLORS.error },
});
