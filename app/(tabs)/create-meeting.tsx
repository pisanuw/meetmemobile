import React, { useState } from 'react';
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
import { createMeeting } from '@/api/meetings';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { FlashMessage } from '@/components/FlashMessage';
import { useFlash } from '@/hooks/useFlash';
import { COLORS, SPACING, TYPOGRAPHY, slotToTime } from '@/config';
import { ScheduleMode } from '@/types';

// Backend accepts full day names only
const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_SHORT: Record<string, string> = {
  Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed', Thursday: 'Thu',
  Friday: 'Fri', Saturday: 'Sat', Sunday: 'Sun',
};

/** Return next N dates from today as YYYY-MM-DD strings using local date to avoid UTC shift */
function nextNDates(n: number): string[] {
  const dates: string[] = [];
  const d = new Date();
  while (dates.length < n) {
    d.setDate(d.getDate() + 1);
    const y = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    dates.push(`${y}-${mo}-${day}`);
  }
  return dates;
}

export default function CreateMeetingScreen() {
  const router = useRouter();
  const { flash, showFlash, clearFlash } = useFlash();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [scheduleMode, setScheduleMode] = useState<ScheduleMode>('specific');
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [startSlot, setStartSlot] = useState(32); // 8 AM
  const [endSlot, setEndSlot] = useState(68);     // 5 PM
  const [emailsText, setEmailsText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Candidate dates for the picker (next 14 days)
  const candidateDates = nextNDates(14);

  function toggleDate(date: string) {
    setSelectedDates(prev =>
      prev.includes(date) ? prev.filter(d => d !== date) : [...prev, date],
    );
  }

  function toggleDay(day: string) {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day],
    );
  }

  function parseEmails(): string[] {
    return emailsText
      .split(/[\n,;]+/)
      .map(e => e.trim().toLowerCase())
      .filter(e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
  }

  async function handleCreate() {
    if (!title.trim()) {
      showFlash('Please add a meeting title', 'error');
      return;
    }

    const dates = scheduleMode === 'specific' ? selectedDates : selectedDays;
    if (dates.length === 0) {
      showFlash(
        scheduleMode === 'specific'
          ? 'Please select at least one date'
          : 'Please select at least one day of the week',
        'error',
      );
      return;
    }

    if (endSlot <= startSlot) {
      showFlash('End time must be after start time', 'error');
      return;
    }

    const invitedEmails = parseEmails();

    setIsLoading(true);
    try {
      const meeting = await createMeeting({
        title: title.trim(),
        description: description.trim() || undefined,
        scheduleMode,
        dates,
        startSlot,
        endSlot,
        invitedEmails,
      });
      router.replace(`/(tabs)/meetings/${meeting.id}`);
    } catch (err: unknown) {
      showFlash(err instanceof Error ? err.message : 'Failed to create meeting', 'error');
    } finally {
      setIsLoading(false);
    }
  }

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
          onPress={() => onChange(Math.max(min, value - 4))}
          style={styles.slotButton}
          testID={`${label}-decrement`}
        >
          <Ionicons name="remove" size={18} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.slotValue}>{slotToTime(value)}</Text>
        <TouchableOpacity
          onPress={() => onChange(Math.min(max, value + 4))}
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
            onChange={setStartSlot}
            min={0}
            max={endSlot - 4}
          />
          <SlotPicker
            label="End"
            value={endSlot}
            onChange={setEndSlot}
            min={startSlot + 4}
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
              {parseEmails().length} valid email{parseEmails().length !== 1 ? 's' : ''}
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
