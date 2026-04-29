// Read the API base URL baked in at build time via app.config.js extra.apiBaseUrl.
// Falls back to the production URL so the value is always a valid string.
import Constants from 'expo-constants';
export const API_BASE_URL: string =
  (Constants.expoConfig?.extra?.apiBaseUrl as string | undefined) ??
  'https://meetme.pisan.me';

export const COLORS = {
  primary: '#3b82f6',      // blue-500
  primaryDark: '#2563eb',  // blue-600
  primaryLight: '#dbeafe', // blue-100
  background: '#f9fafb',   // gray-50
  surface: '#ffffff',
  border: '#e5e7eb',       // gray-200
  text: '#111827',         // gray-900
  textMuted: '#6b7280',    // gray-500
  error: '#ef4444',        // red-500
  errorLight: '#fee2e2',   // red-100
  warning: '#f59e0b',      // amber-500
  success: '#10b981',
  heatmap: {
    0: '#ffffff',
    25: '#bbf7d0',
    50: '#4ade80',
    75: '#16a34a',
    100: '#064e3b',
  },
} as const;

export const TYPOGRAPHY = {
  fontSizes: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
  },
  fontWeights: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
} as const;

export const SLOT_MINUTES = 15;
export const SLOTS_PER_HOUR = 4;  // 60 min / 15 min
export const SLOTS_PER_DAY = 96;  // 24h × 4 slots/h

/** Convert a slot index to a human-readable time string (e.g. 32 → "8:00 AM") */
export function slotToTime(slot: number): string {
  const totalMinutes = slot * SLOT_MINUTES;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const period = hours < 12 ? 'AM' : 'PM';
  const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  return `${displayHour}:${minutes.toString().padStart(2, '0')} ${period}`;
}

/** Convert a slot index to a 24-hour HH:MM string for backend payloads (e.g. 32 → "08:00") */
export function slotToTimeStr(slot: number): string {
  const totalMinutes = slot * SLOT_MINUTES;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

/** Convert a backend HH:MM string to a slot index (e.g. "08:00" → 32) */
export function timeStrToSlot(time: string): number {
  const parts = time.split(':');
  if (parts.length !== 2) {
    console.warn(`timeStrToSlot: unexpected format "${time}"`);
    return 0;
  }
  const h = Number(parts[0]);
  const m = Number(parts[1]);
  if (isNaN(h) || isNaN(m)) {
    console.warn(`timeStrToSlot: non-numeric parts in "${time}"`);
    return 0;
  }
  return Math.round((h * 60 + m) / SLOT_MINUTES);
}

/** Format an ISO date string to a short display (e.g. "Mon, Jan 6") */
export function formatDate(isoDate: string): string {
  const d = new Date(isoDate + 'T00:00:00');
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

/** Get the display label for a date in a meeting (specific vs weekly) */
export function getDateLabel(date: string, mode: 'specific' | 'weekly'): string {
  if (mode === 'weekly') return date; // "Mon", "Tue", etc.
  return formatDate(date);
}
