import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MeetingListItem } from '@/types';
import { Card } from './Card';
import { COLORS, SPACING, TYPOGRAPHY, getDateLabel } from '@/config';

interface MeetingCardProps {
  meeting: MeetingListItem;
  onPress: () => void;
}

export function MeetingCard({ meeting, onPress }: MeetingCardProps) {
  const isFinalized = meeting.finalized !== null;
  const responseRate =
    meeting.participantCount > 0
      ? Math.round((meeting.respondedCount / meeting.participantCount) * 100)
      : 0;

  const firstDate = meeting.dates[0];
  const dateLabel = firstDate ? getDateLabel(firstDate, meeting.scheduleMode) : '—';
  const moreDates = meeting.dates.length > 1 ? `+${meeting.dates.length - 1} more` : '';

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.75} testID={`meeting-card-${meeting.id}`}>
      <Card style={styles.card}>
        {/* Status badge */}
        <View style={styles.header}>
          <View style={[styles.badge, isFinalized ? styles.badgeFinalized : styles.badgePending]}>
            <Ionicons
              name={isFinalized ? 'checkmark-circle' : 'time-outline'}
              size={12}
              color={isFinalized ? COLORS.primary : COLORS.textMuted}
            />
            <Text style={[styles.badgeText, isFinalized ? styles.badgeFinalizedText : styles.badgePendingText]}>
              {isFinalized ? 'Scheduled' : 'Open'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
        </View>

        {/* Title */}
        <Text style={styles.title} numberOfLines={2}>{meeting.title}</Text>

        {/* Date info */}
        <View style={styles.metaRow}>
          <Ionicons name="calendar-outline" size={14} color={COLORS.textMuted} />
          <Text style={styles.metaText}>
            {dateLabel}
            {moreDates ? `  ${moreDates}` : ''}
          </Text>
        </View>

        {/* Response progress */}
        {!isFinalized && (
          <View style={styles.progressRow}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${responseRate}%` as `${number}%` }]} />
            </View>
            <Text style={styles.progressText}>
              {meeting.respondedCount}/{meeting.participantCount} responded
            </Text>
          </View>
        )}

        {isFinalized && meeting.finalized && (
          <View style={styles.metaRow}>
            <Ionicons name="time-outline" size={14} color={COLORS.textMuted} />
            <Text style={styles.metaText}>
              {getDateLabel(meeting.finalized.date, meeting.scheduleMode)} · {meeting.finalized.durationMinutes} min
            </Text>
          </View>
        )}
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: SPACING.sm },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  badgeFinalized: { backgroundColor: COLORS.primaryLight },
  badgePending: { backgroundColor: '#f3f4f6' },
  badgeText: { fontSize: 11, fontWeight: TYPOGRAPHY.fontWeights.semibold },
  badgeFinalizedText: { color: COLORS.primaryDark },
  badgePendingText: { color: COLORS.textMuted },
  title: {
    fontSize: TYPOGRAPHY.fontSizes.base,
    fontWeight: TYPOGRAPHY.fontWeights.semibold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  metaText: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.textMuted,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 11,
    color: COLORS.textMuted,
    minWidth: 90,
  },
});
