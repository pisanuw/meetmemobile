import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Meeting, TimeSlot } from '@/types';
import { COLORS, SPACING, TYPOGRAPHY, slotToTime } from '@/config';

interface HeatmapGridProps {
  meeting: Meeting;
  onCellPress?: (date: string, slot: number) => void;
}

/** Returns a color from white → dark green based on fraction 0..1 */
function heatColor(fraction: number): string {
  if (fraction === 0) return '#f9fafb';
  if (fraction <= 0.25) return '#bbf7d0';
  if (fraction <= 0.5) return '#4ade80';
  if (fraction <= 0.75) return '#16a34a';
  return '#064e3b';
}

/** Build a lookup: "date:slot" → count of available participants */
function buildHeatmap(meeting: Meeting): Map<string, number> {
  const map = new Map<string, number>();
  for (const participant of meeting.participants) {
    for (const { date, slot } of participant.slots) {
      const key = `${date}:${slot}`;
      map.set(key, (map.get(key) ?? 0) + 1);
    }
  }
  return map;
}

/** Time labels shown every 4 slots (= every hour) */
function buildTimeLabels(startSlot: number, endSlot: number): Array<{ slot: number; label: string }> {
  const labels: Array<{ slot: number; label: string }> = [];
  for (let s = startSlot; s < endSlot; s++) {
    if ((s - startSlot) % 4 === 0) {
      labels.push({ slot: s, label: slotToTime(s) });
    }
  }
  return labels;
}

const CELL_SIZE = 18;
const TIME_COL_WIDTH = 52;
const DATE_HEADER_HEIGHT = 40;

export function HeatmapGrid({ meeting, onCellPress }: HeatmapGridProps) {
  const { dates, startSlot, endSlot, participants, scheduleMode } = meeting;
  const totalSlots = endSlot - startSlot;
  const respondedCount = participants.filter(p => p.slots.length > 0 || p.submittedAt).length;

  const heatmap = useMemo(() => buildHeatmap(meeting), [meeting]);
  const timeLabels = useMemo(
    () => buildTimeLabels(startSlot, endSlot),
    [startSlot, endSlot],
  );

  const gridHeight = totalSlots * CELL_SIZE;

  return (
    <View style={styles.container}>
      <Text style={styles.caption}>
        {respondedCount} of {participants.length} responded
      </Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {/* Time labels column */}
        <View style={[styles.timeCol, { width: TIME_COL_WIDTH, height: gridHeight + DATE_HEADER_HEIGHT }]}>
          <View style={{ height: DATE_HEADER_HEIGHT }} />
          {timeLabels.map(({ slot, label }) => (
            <View
              key={slot}
              style={[styles.timeLabel, { top: DATE_HEADER_HEIGHT + (slot - startSlot) * CELL_SIZE }]}
            >
              <Text style={styles.timeLabelText}>{label}</Text>
            </View>
          ))}
        </View>

        {/* Date columns */}
        {dates.map(date => (
          <View key={date} style={styles.dateCol}>
            {/* Date header */}
            <View style={[styles.dateHeader, { height: DATE_HEADER_HEIGHT }]}>
              <Text style={styles.dateHeaderText} numberOfLines={2}>
                {scheduleMode === 'weekly' ? date : date.slice(5)}
              </Text>
            </View>

            {/* Cells */}
            {Array.from({ length: totalSlots }, (_, i) => {
              const slot = startSlot + i;
              const count = heatmap.get(`${date}:${slot}`) ?? 0;
              const fraction = participants.length > 0 ? count / participants.length : 0;
              const bg = heatColor(fraction);
              const isHourBoundary = (slot % 4) === 0;

              return (
                <TouchableOpacity
                  key={slot}
                  onPress={() => onCellPress?.(date, slot)}
                  style={[
                    styles.cell,
                    { backgroundColor: bg },
                    isHourBoundary && styles.cellHourBoundary,
                  ]}
                  activeOpacity={0.7}
                  accessibilityLabel={`${date} ${slotToTime(slot)}: ${count} available`}
                />
              );
            })}
          </View>
        ))}
      </ScrollView>

      {/* Legend */}
      <View style={styles.legend}>
        <Text style={styles.legendLabel}>0%</Text>
        {[0, 0.25, 0.5, 0.75, 1].map(f => (
          <View
            key={f}
            style={[styles.legendSwatch, { backgroundColor: heatColor(f) }]}
          />
        ))}
        <Text style={styles.legendLabel}>100%</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  caption: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.textMuted,
    marginBottom: SPACING.sm,
  },
  timeCol: { position: 'relative' },
  timeLabel: {
    position: 'absolute',
    left: 0,
    right: 4,
  },
  timeLabelText: {
    fontSize: 9,
    color: COLORS.textMuted,
    textAlign: 'right',
  },
  dateCol: { width: CELL_SIZE + 2, marginHorizontal: 1 },
  dateHeader: {
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 4,
  },
  dateHeaderText: {
    fontSize: 9,
    color: COLORS.text,
    fontWeight: TYPOGRAPHY.fontWeights.medium,
    textAlign: 'center',
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: 2,
    marginBottom: 1,
  },
  cellHourBoundary: {
    marginTop: 1,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: SPACING.sm,
    justifyContent: 'center',
  },
  legendSwatch: {
    width: 16,
    height: 16,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  legendLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
});
