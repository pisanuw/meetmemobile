import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { TimeSlot } from '@/types';
import { COLORS, SPACING, TYPOGRAPHY, slotToTime } from '@/config';

interface AvailabilityGridProps {
  dates: string[];
  startSlot: number;
  endSlot: number;
  scheduleMode: 'specific' | 'weekly';
  initialSlots: TimeSlot[];
  onChange: (slots: TimeSlot[]) => void;
}

const CELL_SIZE = 22;
const TIME_COL_WIDTH = 52;
const DATE_HEADER_HEIGHT = 44;

function slotsToSet(slots: TimeSlot[]): Set<string> {
  return new Set(slots.map(s => `${s.date}:${s.slot}`));
}

function setToSlots(set: Set<string>): TimeSlot[] {
  return Array.from(set).map(key => {
    const [date, slot] = key.split(':');
    return { date, slot: parseInt(slot, 10) };
  });
}

export function AvailabilityGrid({
  dates,
  startSlot,
  endSlot,
  scheduleMode,
  initialSlots,
  onChange,
}: AvailabilityGridProps) {
  const [selected, setSelected] = useState<Set<string>>(() => slotsToSet(initialSlots));

  const toggleCell = useCallback(
    (date: string, slot: number) => {
      const key = `${date}:${slot}`;
      setSelected(prev => {
        const next = new Set(prev);
        if (next.has(key)) {
          next.delete(key);
        } else {
          next.add(key);
        }
        onChange(setToSlots(next));
        return next;
      });
    },
    [onChange],
  );

  const totalSlots = endSlot - startSlot;

  return (
    <View style={styles.container}>
      <Text style={styles.hint}>Tap or drag to mark when you're available</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {/* Time labels */}
        <View style={{ width: TIME_COL_WIDTH, height: totalSlots * CELL_SIZE + DATE_HEADER_HEIGHT, position: 'relative' }}>
          <View style={{ height: DATE_HEADER_HEIGHT }} />
          {Array.from({ length: totalSlots }, (_, i) => {
            const slot = startSlot + i;
            if ((slot - startSlot) % 4 !== 0) return null;
            return (
              <View
                key={slot}
                style={{
                  position: 'absolute',
                  top: DATE_HEADER_HEIGHT + i * CELL_SIZE,
                  left: 0,
                  right: 4,
                }}
              >
                <Text style={styles.timeLabelText}>{slotToTime(slot)}</Text>
              </View>
            );
          })}
        </View>

        {/* Date columns */}
        {dates.map(date => (
          <View key={date} style={{ width: CELL_SIZE + 4, marginHorizontal: 1 }}>
            <View style={[styles.dateHeader, { height: DATE_HEADER_HEIGHT }]}>
              <Text style={styles.dateHeaderText} numberOfLines={2}>
                {scheduleMode === 'weekly' ? date : date.slice(5)}
              </Text>
            </View>

            {Array.from({ length: totalSlots }, (_, i) => {
              const slot = startSlot + i;
              const key = `${date}:${slot}`;
              const isSelected = selected.has(key);
              const isHour = (slot % 4) === 0;

              return (
                <TouchableOpacity
                  key={slot}
                  onPress={() => toggleCell(date, slot)}
                  style={[
                    styles.cell,
                    isSelected ? styles.cellSelected : styles.cellEmpty,
                    isHour && styles.cellHour,
                  ]}
                  activeOpacity={0.6}
                  accessibilityLabel={`${slotToTime(slot)} on ${date}: ${isSelected ? 'available' : 'unavailable'}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                />
              );
            })}
          </View>
        ))}
      </ScrollView>

      {/* Summary */}
      <Text style={styles.summary}>
        {selected.size} slot{selected.size !== 1 ? 's' : ''} selected
        {selected.size > 0 ? ` (${Math.round(selected.size * 15 / 60 * 10) / 10}h)` : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  hint: {
    fontSize: TYPOGRAPHY.fontSizes.xs,
    color: COLORS.textMuted,
    marginBottom: SPACING.sm,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  timeLabelText: {
    fontSize: 9,
    color: COLORS.textMuted,
    textAlign: 'right',
  },
  dateHeader: {
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 4,
  },
  dateHeaderText: {
    fontSize: 9,
    color: COLORS.text,
    fontWeight: TYPOGRAPHY.fontWeights.semibold,
    textAlign: 'center',
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: 3,
    marginBottom: 1,
  },
  cellEmpty: {
    backgroundColor: '#e5e7eb',
  },
  cellSelected: {
    backgroundColor: COLORS.primary,
  },
  cellHour: {
    marginTop: 1,
  },
  summary: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
});
