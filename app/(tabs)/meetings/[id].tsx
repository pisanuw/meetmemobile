import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useMeeting } from '@/hooks/useMeeting';
import { submitAvailability, finalizeMeeting, deleteMeeting, leaveMeeting, sendReminders } from '@/api/meetings';
import { HeatmapGrid } from '@/components/HeatmapGrid';
import { AvailabilityGrid } from '@/components/AvailabilityGrid';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { LoadingScreen } from '@/components/LoadingScreen';
import { FlashMessage } from '@/components/FlashMessage';
import { useFlash } from '@/hooks/useFlash';
import { TimeSlot } from '@/types';
import { COLORS, SPACING, TYPOGRAPHY, slotToTime, getDateLabel } from '@/config';

type ViewMode = 'heatmap' | 'my-availability';

export default function MeetingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { meeting, isLoading, error, refresh } = useMeeting(id ?? '');
  const { flash, showFlash, clearFlash } = useFlash();

  const [viewMode, setViewMode] = useState<ViewMode>('heatmap');
  const [mySlots, setMySlots] = useState<TimeSlot[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [finalizeSlot, setFinalizeSlot] = useState<{ date: string; slot: number } | null>(null);
  const [finalizeDuration, setFinalizeDuration] = useState(60);
  const [finalizeNote, setFinalizeNote] = useState('');
  const [isFinalizing, setIsFinalizing] = useState(false);
  // Track which meeting id we last seeded slots for, so we re-seed when
  // navigating between different meetings (prevents stale slot state).
  const [slotsMeetingId, setSlotsMeetingId] = useState<string | null>(null);

  React.useEffect(() => {
    if (meeting && user && meeting.id !== slotsMeetingId) {
      const myParticipant = meeting.participants.find(p => p.userId === user.id);
      setMySlots(myParticipant?.slots ?? []);
      setSlotsMeetingId(meeting.id);
    }
  }, [meeting, user, slotsMeetingId]);

  if (isLoading) return <LoadingScreen message="Loading meeting..." />;
  if (error || !meeting) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={COLORS.error} />
          <Text style={styles.errorText}>{error ?? 'Meeting not found'}</Text>
          <Button title="Go Back" onPress={() => router.back()} variant="outline" />
        </View>
      </SafeAreaView>
    );
  }

  const isCreator = meeting.creatorId === user?.id;
  const isFinalized = meeting.finalized !== null;
  const respondedCount = meeting.participants.filter(p => p.submittedAt).length;

  async function handleSaveAvailability() {
    setIsSaving(true);
    try {
      await submitAvailability(meeting.id, { slots: mySlots });
      showFlash('Availability saved!', 'success');
      // Reset seed ID so the refreshed participant data re-seeds mySlots
      setSlotsMeetingId(null);
      await refresh();
    } catch (err: unknown) {
      showFlash(err instanceof Error ? err.message : 'Failed to save', 'error');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSendReminders() {
    try {
      await sendReminders(meeting.id);
      showFlash('Reminder emails sent!', 'success');
    } catch (err: unknown) {
      showFlash(err instanceof Error ? err.message : 'Failed to send reminders', 'error');
    }
  }

  async function handleDelete() {
    Alert.alert('Delete Meeting', 'Are you sure? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await deleteMeeting(meeting.id);
            router.replace('/(tabs)');
          } catch (err: unknown) {
            showFlash(err instanceof Error ? err.message : 'Failed to delete', 'error');
          }
        },
      },
    ]);
  }

  async function handleLeave() {
    Alert.alert('Leave Meeting', 'Remove yourself from this meeting?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Leave', style: 'destructive',
        onPress: async () => {
          try {
            await leaveMeeting(meeting.id);
            router.replace('/(tabs)');
          } catch (err: unknown) {
            showFlash(err instanceof Error ? err.message : 'Failed to leave', 'error');
          }
        },
      },
    ]);
  }

  function handleCellPress(date: string, slot: number) {
    if (!isCreator || isFinalized) return;
    setFinalizeSlot({ date, slot });
    setShowFinalizeModal(true);
  }

  async function handleFinalize() {
    if (!finalizeSlot) return;
    setIsFinalizing(true);
    try {
      await finalizeMeeting(meeting.id, {
        date: finalizeSlot.date,
        slot: finalizeSlot.slot,
        durationMinutes: finalizeDuration,
        note: finalizeNote.trim() || undefined,
      });
      setShowFinalizeModal(false);
      showFlash('Meeting finalized!', 'success');
      await refresh();
    } catch (err: unknown) {
      showFlash(err instanceof Error ? err.message : 'Failed to finalize', 'error');
    } finally {
      setIsFinalizing(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} testID="back-button">
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>{meeting.title}</Text>
          {isFinalized && (
            <View style={styles.finalizedBadge}>
              <Ionicons name="checkmark-circle" size={12} color={COLORS.primary} />
              <Text style={styles.finalizedBadgeText}>Scheduled</Text>
            </View>
          )}
        </View>
        {isCreator ? (
          <TouchableOpacity onPress={handleDelete} testID="delete-button">
            <Ionicons name="trash-outline" size={22} color={COLORS.error} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={handleLeave} testID="leave-button">
            <Ionicons name="exit-outline" size={22} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {flash && (
        <FlashMessage message={flash.message} type={flash.type} onDismiss={clearFlash} />
      )}

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Finalized banner */}
        {isFinalized && meeting.finalized && (
          <Card style={styles.finalizedCard}>
            <View style={styles.finalizedHeader}>
              <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
              <Text style={styles.finalizedTitle}>Meeting Scheduled</Text>
            </View>
            <Text style={styles.finalizedDate}>
              {getDateLabel(meeting.finalized.date, meeting.scheduleMode)} · {slotToTime(meeting.finalized.slot)}
            </Text>
            <Text style={styles.finalizedDuration}>
              Duration: {meeting.finalized.durationMinutes} minutes
            </Text>
            {meeting.finalized.note ? (
              <Text style={styles.finalizedNote}>{meeting.finalized.note}</Text>
            ) : null}
          </Card>
        )}

        {meeting.description ? (
          <Card>
            <Text style={styles.desc}>{meeting.description}</Text>
          </Card>
        ) : null}

        {/* Mode toggle (hidden when finalized) */}
        {!isFinalized && (
          <View style={styles.modeToggle}>
            {(['heatmap', 'my-availability'] as ViewMode[]).map(mode => (
              <TouchableOpacity
                key={mode}
                style={[styles.modeTab, viewMode === mode && styles.modeTabActive]}
                onPress={() => setViewMode(mode)}
                testID={`tab-${mode}`}
              >
                <Ionicons
                  name={mode === 'heatmap' ? 'people' : 'person'}
                  size={14}
                  color={viewMode === mode ? COLORS.primary : COLORS.textMuted}
                />
                <Text style={[styles.modeTabText, viewMode === mode && styles.modeTabTextActive]}>
                  {mode === 'heatmap' ? 'Group View' : 'My Availability'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Grid */}
        <Card style={styles.gridCard}>
          {viewMode === 'heatmap' || isFinalized ? (
            <HeatmapGrid
              meeting={meeting}
              onCellPress={isCreator && !isFinalized ? handleCellPress : undefined}
            />
          ) : (
            <AvailabilityGrid
              dates={meeting.dates}
              startSlot={meeting.startSlot}
              endSlot={meeting.endSlot}
              scheduleMode={meeting.scheduleMode}
              initialSlots={mySlots}
              onChange={setMySlots}
            />
          )}
        </Card>

        {viewMode === 'my-availability' && !isFinalized && (
          <Button
            title="Save My Availability"
            onPress={handleSaveAvailability}
            loading={isSaving}
            testID="save-availability-button"
          />
        )}

        {isCreator && !isFinalized && viewMode === 'heatmap' && (
          <Card style={styles.actionsCard}>
            <Text style={styles.actionsTitle}>Creator Actions</Text>
            <Text style={styles.actionsHint}>
              Tap any heatmap cell to schedule that time slot.
            </Text>
            <Button
              title={`Send Reminders (${meeting.participants.length - respondedCount} pending)`}
              variant="outline"
              onPress={handleSendReminders}
              disabled={respondedCount >= meeting.participants.length}
              style={{ marginTop: SPACING.sm }}
              testID="remind-button"
            />
          </Card>
        )}

        {/* Participants list */}
        <Card>
          <Text style={styles.sectionTitle}>
            Participants ({respondedCount}/{meeting.participants.length} responded)
          </Text>
          {meeting.participants.map(p => (
            <View key={p.userId} style={styles.participantRow}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarLetter}>
                  {(p.name || p.email)[0].toUpperCase()}
                </Text>
              </View>
              <View style={styles.participantInfo}>
                <Text style={styles.participantName}>{p.name || p.email}</Text>
                <Text style={styles.participantStatus}>
                  {p.submittedAt ? `${p.slots.length} slots selected` : 'No response yet'}
                </Text>
              </View>
              <Ionicons
                name={p.submittedAt ? 'checkmark-circle' : 'time-outline'}
                size={18}
                color={p.submittedAt ? COLORS.primary : COLORS.border}
              />
            </View>
          ))}
        </Card>
      </ScrollView>

      {/* Finalize Modal */}
      <Modal
        visible={showFinalizeModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFinalizeModal(false)}
      >
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowFinalizeModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Finalize Meeting</Text>
            <View style={{ width: 60 }} />
          </View>
          <ScrollView contentContainerStyle={styles.modalScroll}>
            {finalizeSlot && (
              <Text style={styles.finalizeTime}>
                {getDateLabel(finalizeSlot.date, meeting.scheduleMode)} at {slotToTime(finalizeSlot.slot)}
              </Text>
            )}
            <Text style={styles.modalLabel}>Duration</Text>
            <View style={styles.durationRow}>
              {[30, 45, 60, 90, 120].map(d => (
                <TouchableOpacity
                  key={d}
                  style={[styles.durationChip, finalizeDuration === d && styles.durationChipActive]}
                  onPress={() => setFinalizeDuration(d)}
                  testID={`duration-${d}`}
                >
                  <Text style={[styles.durationChipText, finalizeDuration === d && styles.durationChipTextActive]}>
                    {d}m
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.modalLabel}>Note (optional)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Conference room B"
              placeholderTextColor={COLORS.textMuted}
              value={finalizeNote}
              onChangeText={setFinalizeNote}
              multiline
              testID="finalize-note-input"
            />
            <Button
              title="Confirm & Schedule"
              onPress={handleFinalize}
              loading={isFinalizing}
              size="lg"
              style={{ marginTop: SPACING.lg }}
              testID="confirm-finalize-button"
            />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md,
    backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  headerCenter: { flex: 1, alignItems: 'center', gap: 3 },
  headerTitle: { fontSize: TYPOGRAPHY.fontSizes.base, fontWeight: TYPOGRAPHY.fontWeights.semibold, color: COLORS.text, maxWidth: 200 },
  finalizedBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: COLORS.primaryLight, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  finalizedBadgeText: { fontSize: 10, color: COLORS.primaryDark, fontWeight: TYPOGRAPHY.fontWeights.semibold },
  scroll: { padding: SPACING.md, gap: SPACING.sm, paddingBottom: SPACING['2xl'] },
  errorContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACING.md, padding: SPACING.xl },
  errorText: { fontSize: TYPOGRAPHY.fontSizes.base, color: COLORS.error, textAlign: 'center' },
  finalizedCard: { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primary, gap: 4 },
  finalizedHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  finalizedTitle: { fontSize: TYPOGRAPHY.fontSizes.base, fontWeight: TYPOGRAPHY.fontWeights.semibold, color: COLORS.primaryDark },
  finalizedDate: { fontSize: TYPOGRAPHY.fontSizes.lg, fontWeight: TYPOGRAPHY.fontWeights.bold, color: COLORS.text },
  finalizedDuration: { fontSize: TYPOGRAPHY.fontSizes.sm, color: COLORS.textMuted },
  finalizedNote: { fontSize: TYPOGRAPHY.fontSizes.sm, color: COLORS.text, fontStyle: 'italic', marginTop: 4 },
  desc: { fontSize: TYPOGRAPHY.fontSizes.sm, color: COLORS.textMuted, lineHeight: 20 },
  modeToggle: { flexDirection: 'row', backgroundColor: COLORS.surface, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden' },
  modeTab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10 },
  modeTabActive: { backgroundColor: COLORS.primaryLight },
  modeTabText: { fontSize: TYPOGRAPHY.fontSizes.sm, color: COLORS.textMuted },
  modeTabTextActive: { color: COLORS.primary, fontWeight: TYPOGRAPHY.fontWeights.semibold },
  gridCard: { minHeight: 200 },
  actionsCard: { gap: SPACING.xs },
  actionsTitle: { fontSize: TYPOGRAPHY.fontSizes.sm, fontWeight: TYPOGRAPHY.fontWeights.semibold, color: COLORS.text },
  actionsHint: { fontSize: TYPOGRAPHY.fontSizes.xs, color: COLORS.textMuted },
  sectionTitle: { fontSize: TYPOGRAPHY.fontSizes.sm, fontWeight: TYPOGRAPHY.fontWeights.semibold, color: COLORS.text, marginBottom: 8 },
  participantRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingVertical: 6 },
  avatarCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { fontSize: TYPOGRAPHY.fontSizes.sm, fontWeight: TYPOGRAPHY.fontWeights.bold, color: COLORS.primaryDark },
  participantInfo: { flex: 1 },
  participantName: { fontSize: TYPOGRAPHY.fontSizes.sm, fontWeight: TYPOGRAPHY.fontWeights.medium, color: COLORS.text },
  participantStatus: { fontSize: TYPOGRAPHY.fontSizes.xs, color: COLORS.textMuted },
  modalSafe: { flex: 1, backgroundColor: COLORS.background },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.border, backgroundColor: COLORS.surface },
  modalCancel: { fontSize: TYPOGRAPHY.fontSizes.base, color: COLORS.primary },
  modalTitle: { fontSize: TYPOGRAPHY.fontSizes.base, fontWeight: TYPOGRAPHY.fontWeights.semibold, color: COLORS.text },
  modalScroll: { padding: SPACING.lg, gap: SPACING.sm },
  finalizeTime: { fontSize: TYPOGRAPHY.fontSizes.xl, fontWeight: TYPOGRAPHY.fontWeights.bold, color: COLORS.text, marginBottom: SPACING.sm },
  modalLabel: { fontSize: TYPOGRAPHY.fontSizes.sm, fontWeight: TYPOGRAPHY.fontWeights.semibold, color: COLORS.text, marginTop: SPACING.sm, marginBottom: 4 },
  durationRow: { flexDirection: 'row', gap: SPACING.sm, flexWrap: 'wrap' },
  durationChip: { paddingHorizontal: SPACING.md, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.surface },
  durationChipActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  durationChipText: { fontSize: TYPOGRAPHY.fontSizes.sm, color: COLORS.text },
  durationChipTextActive: { color: COLORS.primary, fontWeight: TYPOGRAPHY.fontWeights.semibold },
  modalInput: { backgroundColor: COLORS.surface, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: SPACING.sm, paddingVertical: 10, fontSize: TYPOGRAPHY.fontSizes.base, color: COLORS.text, textAlignVertical: 'top', minHeight: 80 },
});
