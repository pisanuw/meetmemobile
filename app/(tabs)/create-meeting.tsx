import React from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { FlashMessage } from '@/components/FlashMessage';
import { COLORS, SPACING, TYPOGRAPHY, SLOTS_PER_HOUR, slotToTime } from '@/config';
import type { ScheduleMode } from '@/types';
import {
  useCreateMeetingForm,
  DAYS_OF_WEEK,
  DAY_SHORT,
} from '@/hooks/useCreateMeetingForm';

export default function CreateMeetingScreen() {
  const router = useRouter();
  const {
    title, setTitle,
    description, setDescription,
    scheduleMode, setScheduleMode,
    selectedDates,
    selectedDays,
    startSlot, changeStartSlot,
    endSlot, changeEndSlot,
    emailsText, setEmailsText,
    isLoading,
    candidateDates,
    parsedEmailCount,
    toggleDate,
    toggleDay,
    handleCreate,
    flash, clearFlash,
  } = useCreateMeetingForm();

  const SlotPicker = ({
    label,
    value,
    onChange,
    min,
    max,
  }: {
    label: string;
    value: number;
    onChange: (v: number) => void;
    min: number;
    max: number;
  }) => (
    <View style={styles.slotPickerRow}>
      <Text style={styles.slotLabel}>{label}</Text>
      <View style={styles.slotControls}>
        <TouchableOpacity
          onPress={() => onChange(Math.max(min, value - SLOTS_PER_HOUR))}
          style={styles.slotButton}
          testID={`${label}-decrement`}
        >
          <Ionicons name="remove" size={18} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.slotValue}>{slotToTime(value)}</Text>
        <TouchableOpacity
          onPress={() => onChange(Math.min(max, value + SLOTS_PER_HOUR))}
          style={styles.slotButton}
          testID={`${label}-increment`}
        >
          <Ionicons name="add" size={18} color={COLORS.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} testID="back-button">
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Meeting</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {flash && (
          <FlashMessage message={flash.message} type={flash.type} onDismiss={clearFlash} />
        )}

        {/* Title */}
        <Card style={styles.section}>
          <Text style={styles.sectionLabel}>Meeting Title *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Weekly Standup"
            placeholderTextColor={COLORS.textMuted}
            value={title}
            onChangeText={setTitle}
            returnKeyType="next"
            testID="title-input"
          />
          <Text style={[styles.sectionLabel, { marginTop: SPACING.sm }]}>
            Description (optional)
          </Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="What's this meeting about?"
            placeholderTextColor={COLORS.textMuted}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            testID="description-input"
          />
        </Card>

        {/* Schedule mode toggle */}
        <Card style={styles.section}>
          <Text style={styles.sectionLabel}>Schedule Type</Text>
          <View style={styles.modeRow}>
            {(['specific', 'weekly'] as ScheduleMode[]).map(mode => (
              <TouchableOpacity
                key={mode}
                style={[
                  styles.modeButton,
                  scheduleMode === mode && styles.modeButtonActive,
                ]}
                onPress={() => setScheduleMode(mode)}
                testID={`mode-${mode}`}
              >
                <Text
                  style={[
                    styles.modeButtonText,
                    scheduleMode === mode && styles.modeButtonTextActive,
                  ]}
                >
                  {mode === 'specific' ? '📅 Specific Dates' : '📆 Days of Week'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Date / Day picker */}
          <Text style={[styles.sectionLabel, { marginTop: SPACING.sm }]}>
            {scheduleMode === 'specific' ? 'Select Dates' : 'Select Days'}
          </Text>
          <View style={styles.dateGrid}>
            {scheduleMode === 'specific'
              ? candidateDates.map(date => {
                  const isSelected = selectedDates.includes(date);
                  const d = new Date(date + 'T00:00:00');
                  const label = d.toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  });
                  return (
                    <TouchableOpacity
                      key={date}
                      style={[styles.dateChip, isSelected && styles.dateChipSelected]}
                      onPress={() => toggleDate(date)}
                      testID={`date-chip-${date}`}
                    >
                      <Text
                        style={[styles.dateChipText, isSelected && styles.dateChipTextSelected]}
                      >
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })
              : DAYS_OF_WEEK.map(day => {
                  const isSelected = selectedDays.includes(day);
                  return (
                    <TouchableOpacity
                      key={day}
                      style={[styles.dayChip, isSelected && styles.dateChipSelected]}
                      onPress={() => toggleDay(day)}
                      testID={`day-chip-${day}`}
                    >
                      <Text
                        style={[styles.dateChipText, isSelected && styles.dateChipTextSelected]}
                      >
                        {DAY_SHORT[day]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
          </View>
        </Card>

        {/* Time range */}
        <Card style={styles.section}>
          <Text style={styles.sectionLabel}>Available Time Window</Text>
          <SlotPicker
            label="Start"
            value={startSlot}
            onChange={changeStartSlot}
            min={0}
            max={endSlot - SLOTS_PER_HOUR}
          />
          <SlotPicker
            label="End"
            value={endSlot}
            onChange={changeEndSlot}
            min={startSlot + SLOTS_PER_HOUR}
            max={95}
          />
        </Card>

        {/* Invitees */}
        <Card style={styles.section}>
          <Text style={styles.sectionLabel}>Invite People (optional)</Text>
          <Text style={styles.hint}>
            Enter email addresses, one per line or separated by commas.
          </Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder={'alice@example.com\nbob@example.com'}
            placeholderTextColor={COLORS.textMuted}
            value={emailsText}
            onChangeText={setEmailsText}
            multiline
            numberOfLines={4}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            testID="emails-input"
          />
          {emailsText.trim().length > 0 && (
            <Text style={styles.emailCount}>
              {parsedEmailCount} valid email{parsedEmailCount !== 1 ? 's' : ''}
            </Text>
          )}
        </Card>

        <Button
          title="Create Meeting"
          onPress={handleCreate}
          loading={isLoading}
          size="lg"
          style={styles.createButton}
          testID="create-button"
        />
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
    fontSize: TYPOGRAPHY.fontSizes.lg,
    fontWeight: TYPOGRAPHY.fontWeights.semibold,
    color: COLORS.text,
  },
  scroll: { padding: SPACING.md, gap: SPACING.sm, paddingBottom: SPACING['2xl'] },
  section: { gap: SPACING.xs },
  sectionLabel: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    fontWeight: TYPOGRAPHY.fontWeights.semibold,
    color: COLORS.text,
    marginBottom: 2,
  },
  hint: {
    fontSize: TYPOGRAPHY.fontSizes.xs,
    color: COLORS.textMuted,
    marginBottom: SPACING.xs,
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
  textArea: { minHeight: 80, textAlignVertical: 'top', paddingTop: 10 },
  modeRow: { flexDirection: 'row', gap: SPACING.sm },
  modeButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  modeButtonActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  modeButtonText: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    fontWeight: TYPOGRAPHY.fontWeights.medium,
    color: COLORS.textMuted,
  },
  modeButtonTextActive: { color: COLORS.primaryDark },
  dateGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs, marginTop: 4 },
  dateChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  dayChip: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  dateChipSelected: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  dateChipText: {
    fontSize: TYPOGRAPHY.fontSizes.xs,
    color: COLORS.text,
    fontWeight: TYPOGRAPHY.fontWeights.medium,
  },
  dateChipTextSelected: { color: COLORS.primaryDark },
  slotPickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.xs,
  },
  slotLabel: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.text,
    fontWeight: TYPOGRAPHY.fontWeights.medium,
    width: 40,
  },
  slotControls: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  slotButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotValue: {
    fontSize: TYPOGRAPHY.fontSizes.base,
    fontWeight: TYPOGRAPHY.fontWeights.semibold,
    color: COLORS.text,
    minWidth: 80,
    textAlign: 'center',
  },
  emailCount: {
    fontSize: TYPOGRAPHY.fontSizes.xs,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeights.medium,
    marginTop: 4,
  },
  createButton: { marginTop: SPACING.sm },
});
