export const API_BASE_URL = 'https://meetme.pisan.me';

export const COLORS = {
  primary: '#10b981',      // emerald-500
  primaryDark: '#059669',  // emerald-600
  primaryLight: '#d1fae5', // emerald-100
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
export const SLOTS_PER_DAY = 96; // 24h × 4 slots/h

/** Convert a slot index to a human-readable time string (e.g. 32 → "8:00 AM") */
export function slotToTime(slot: number): string {
  const totalMinutes = slot * SLOT_MINUTES;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const period = hours < 12 ? 'AM' : 'PM';
  const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  return `${displayHour}:${minutes.toString().padStart(2, '0')} ${period}`;
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
