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
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { FlashMessage } from '@/components/FlashMessage';
import { COLORS, SPACING, TYPOGRAPHY, SLOTS_PER_HOUR, slotToTime } from '@/config';
import type { ScheduleMode } from '@/types';
import { DAYS_OF_WEEK, DAY_SHORT, nextNDates } from '@/hooks/useCreateMeetingForm';
import { createMeetingAnonymous } from '@/api/meetings';
import { useFlash } from '@/hooks/useFlash';

export default function CreateAnonymousScreen() {
  const router = useRouter();
  const { flash, showFlash, clearFlash } = useFlash();

  const [creatorName, setCreatorName] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [scheduleMode, setScheduleMode] = useState<ScheduleMode>('weekly');
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [selectedDays, setSelectedDays] = useState<string[]>([
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday',
  ]);
  const [startSlot, setStartSlot] = useState(32); // 8 AM
  const [endSlot, setEndSlot] = useState(68);     // 5 PM
  const [isLoading, setIsLoading] = useState(false);

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

  function changeStartSlot(v: number) {
    setStartSlot(Math.max(0, Math.min(v, endSlot - SLOTS_PER_HOUR)));
  }

  function changeEndSlot(v: number) {
    setEndSlot(Math.max(startSlot + SLOTS_PER_HOUR, Math.min(v, 95)));
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

    setIsLoading(true);
    try {
      const result = await createMeetingAnonymous({
        title: title.trim(),
        description: description.trim() || undefined,
        scheduleMode,
        dates,
        startSlot,
        endSlot,
        creatorName: creatorName.trim(),
      });
      router.replace({
        pathname: '/(auth)/meeting-created',
        params: {
          meetingId: result.meeting_id,
          adminToken: result.admin_token,
          participationToken: result.participation_token,
          title: title.trim(),
        },
      });
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
          onPress={() => onChange(Math.max(min, value - SLOTS_PER_HOUR))}
          style={styles.slotButton}
        >
          <Ionicons name="remove" size={18} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.slotValue}>{slotToTime(value)}</Text>
        <TouchableOpacity
          onPress={() => onChange(Math.min(max, value + SLOTS_PER_HOUR))}
          style={styles.slotButton}
        >
          <Ionicons name="add" size={18} color={COLORS.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View style={{ width: 24 }} />
        <Text style={styles.headerTitle}>New Meeting</Text>
        <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
          <Text style={styles.signInLink}>Sign in</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {flash && (
          <FlashMessage message={flash.message} type={flash.type} onDismiss={clearFlash} />
        )}

        {/* Your name */}
        <Card style={styles.section}>
          <Text style={styles.sectionLabel}>Your Name (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Alex"
            placeholderTextColor={COLORS.textMuted}
            value={creatorName}
            onChangeText={setCreatorName}
            returnKeyType="next"
            testID="creator-name-input"
          />
        </Card>

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
                style={[styles.modeButton, scheduleMode === mode && styles.modeButtonActive]}
                onPress={() => setScheduleMode(mode)}
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

          <Text style={[styles.sectionLabel, { marginTop: SPACING.sm }]}>
            {scheduleMode === 'specific' ? 'Select Dates' : 'Select Days'}
          </Text>

          {scheduleMode === 'specific' ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.dateRow}
            >
              {candidateDates.map(date => {
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
                  >
                    <Text style={[styles.dateChipText, isSelected && styles.dateChipTextSelected]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          ) : (
            <View style={styles.dayGrid}>
              {DAYS_OF_WEEK.map(day => {
                const isSelected = selectedDays.includes(day);
                return (
                  <TouchableOpacity
                    key={day}
                    style={[styles.dayChip, isSelected && styles.dateChipSelected]}
                    onPress={() => toggleDay(day)}
                  >
                    <Text style={[styles.dateChipText, isSelected && styles.dateChipTextSelected]}>
                      {DAY_SHORT[day]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
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
  modeButtonActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  modeButtonText: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    fontWeight: TYPOGRAPHY.fontWeights.medium,
    color: COLORS.textMuted,
  },
  modeButtonTextActive: { color: COLORS.primaryDark },
  dateRow: { flexDirection: 'row', gap: SPACING.xs, paddingVertical: 4, alignItems: 'center' },
  dayGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs, marginTop: 4 },
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
  dateChipSelected: { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primary },
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
  createButton: { marginTop: SPACING.sm },
  signInLink: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    fontWeight: TYPOGRAPHY.fontWeights.medium,
    color: COLORS.primary,
  },
});
