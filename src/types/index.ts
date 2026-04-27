// ─── Auth & User ─────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  name: string;
  /** Only present after the user completes profile setup; defaults to 'UTC' in UI */
  timezone?: string;
  isAdmin: boolean;
}

// ─── Meetings ─────────────────────────────────────────────────────────────────

export type ScheduleMode = 'specific' | 'weekly';

export interface TimeSlot {
  /** ISO date string (YYYY-MM-DD) for specific mode, or full day name ("Monday", "Tuesday", …) for weekly */
  date: string;
  /** 15-minute slot index within the day (0–95) */
  slot: number;
}

export interface ParticipantAvailability {
  userId: string;
  name: string;
  email: string;
  slots: TimeSlot[];
  /** True when the backend confirms this participant has submitted a response. */
  hasResponded: boolean;
}

export interface FinalizedSlot {
  date: string;
  slot: number;
  durationMinutes: number;
  note: string;
}

export interface Meeting {
  id: string;
  title: string;
  description: string;
  creatorId: string;
  creatorName: string;
  scheduleMode: ScheduleMode;
  /** ISO date strings for specific mode, or day-names for weekly */
  dates: string[];
  /** Earliest slot index available per day (0–95) */
  startSlot: number;
  /** Latest slot index available per day (0–95, exclusive) */
  endSlot: number;
  invitedEmails: string[];
  participants: ParticipantAvailability[];
  finalized: FinalizedSlot | null;
  createdAt: string;
  updatedAt: string;
}

export interface MeetingListItem {
  id: string;
  title: string;
  scheduleMode: ScheduleMode;
  dates: string[];
  finalized: FinalizedSlot | null;
  participantCount: number;
  respondedCount: number;
  createdAt: string;
  role: 'creator' | 'invitee';
}

// ─── API responses ────────────────────────────────────────────────────────────

export interface ApiError {
  error: string;
  details?: string;
}

export interface MeetingsListResponse {
  myMeetings: MeetingListItem[];
  invitedMeetings: MeetingListItem[];
}

export interface CreateMeetingPayload {
  title: string;
  description?: string;
  scheduleMode: ScheduleMode;
  dates: string[];
  startSlot: number;
  endSlot: number;
  invitedEmails: string[];
}

export interface AnonymousCreateMeetingPayload {
  title: string;
  description?: string;
  scheduleMode: ScheduleMode;
  dates: string[];
  startSlot: number;
  endSlot: number;
  creatorName: string;
}

export interface AnonymousCreateResponse {
  meeting_id: string;
  participation_token: string;
  admin_token: string;
  participation_url: string;
  admin_url: string;
}

export interface AvailabilityPayload {
  slots: TimeSlot[];
}

export interface FinalizePayload {
  date: string;
  slot: number;
  durationMinutes: number;
  note?: string;
}

export interface ProfileUpdatePayload {
  name?: string;
  timezone?: string;
}

// ─── Navigation param types ───────────────────────────────────────────────────

export type RootStackParamList = {
  '(auth)': undefined;
  '(tabs)': undefined;
};

export type AuthStackParamList = {
  login: undefined;
  'email-sent': { email: string };
};

export type TabParamList = {
  index: undefined;
  'create-meeting': undefined;
  profile: undefined;
};

export type MeetingStackParamList = {
  '[id]': { id: string };
};
