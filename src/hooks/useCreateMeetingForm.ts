import { useState } from 'react';
import { useRouter } from 'expo-router';
import { createMeeting } from '@/api/meetings';
import { isValidEmail } from '@/utils/validation';
import { useFlash } from '@/hooks/useFlash';
import { SLOTS_PER_HOUR } from '@/config';
import type { ScheduleMode } from '@/types';

// Backend accepts full day names only
export const DAYS_OF_WEEK = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
] as const;

export const DAY_SHORT: Record<string, string> = {
  Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed', Thursday: 'Thu',
  Friday: 'Fri', Saturday: 'Sat', Sunday: 'Sun',
};

/** Return next N dates from today as YYYY-MM-DD strings using local date to avoid UTC shift. */
export function nextNDates(n: number): string[] {
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

export function useCreateMeetingForm() {
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
      .filter(isValidEmail);
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

    if (endSlot <= startSlot) {
      showFlash('End time must be after start time', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const meeting = await createMeeting({
        title: title.trim(),
        description: description.trim() || undefined,
        scheduleMode,
        dates,
        startSlot,
        endSlot,
        invitedEmails: parseEmails(),
      });
      router.replace(`/(tabs)/meetings/${meeting.id}`);
    } catch (err: unknown) {
      showFlash(err instanceof Error ? err.message : 'Failed to create meeting', 'error');
    } finally {
      setIsLoading(false);
    }
  }

  return {
    // State
    title, setTitle,
    description, setDescription,
    scheduleMode, setScheduleMode,
    selectedDates,
    selectedDays,
    startSlot, changeStartSlot,
    endSlot, changeEndSlot,
    emailsText, setEmailsText,
    isLoading,
    // Derived
    candidateDates: nextNDates(14),
    parsedEmailCount: parseEmails().length,
    // Handlers
    toggleDate,
    toggleDay,
    handleCreate,
    // Flash
    flash, clearFlash,
  };
}
