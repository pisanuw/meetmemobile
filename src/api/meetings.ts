import { get, post } from './client';
import {
  Meeting,
  MeetingListItem,
  MeetingsListResponse,
  CreateMeetingPayload,
  AnonymousCreateMeetingPayload,
  AnonymousCreateResponse,
  AvailabilityPayload,
  FinalizePayload,
  FinalizedSlot,
  ParticipantAvailability,
  TimeSlot,
} from '../types';
import { slotToTimeStr, timeStrToSlot } from '../config';

// ─── Raw backend shapes ───────────────────────────────────────────────────────

interface RawMeeting {
  id: string;
  title: string;
  description?: string;
  creator_id: string;
  creator_name?: string;
  meeting_type: string;         // "specific_dates" | "days_of_week"
  dates_or_days: string[];
  start_time: string;           // "HH:MM"
  end_time: string;             // "HH:MM"
  timezone?: string;
  duration_minutes?: number;
  finalized_date?: string | null;
  finalized_slot?: string | null; // "HH:MM"
  note?: string;
  is_finalized?: boolean;
  created_at?: string;
}

interface RawParticipant {
  name: string;
  slot_count: number;
  responded: boolean;
  slots: string[];   // "YYYY-MM-DD_HH:MM" or "Monday_HH:MM"
  email?: string;
}

interface RawInvite {
  user_id?: string;
  email?: string;
  name?: string;
  responded?: boolean;
}

interface RawMeetingDetailResponse {
  meeting: RawMeeting;
  is_creator: boolean;
  my_slots: string[];
  slot_counts: Record<string, number>;
  total_invited: number;
  participants: RawParticipant[];
  all_invites: RawInvite[];
  respond_count: number;
  invite_count: number;
}

interface RawListItem extends RawMeeting {
  respond_count: number;
  invite_count: number;
  user_has_responded?: boolean;
}

interface RawListResponse {
  my_meetings: RawListItem[];
  invited_meetings: RawListItem[];
}

interface RawCreateResponse {
  success: boolean;
  meeting_id: string;
  invite_results?: unknown[];
  email_failures?: string[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseSlotString(slotStr: string): TimeSlot {
  const idx = slotStr.lastIndexOf('_');
  if (idx === -1) {
    console.warn(`parseSlotString: unexpected format "${slotStr}"`);
    return { date: slotStr, slot: 0 };
  }
  const date = slotStr.slice(0, idx);
  const time = slotStr.slice(idx + 1);
  return { date, slot: timeStrToSlot(time) };
}

function buildFinalizedSlot(m: RawMeeting): FinalizedSlot | null {
  if (!m.is_finalized || !m.finalized_date) return null;
  return {
    date: m.finalized_date,
    slot: timeStrToSlot(m.finalized_slot ?? '00:00'),
    durationMinutes: m.duration_minutes ?? 60,
    note: m.note ?? '',
  };
}

function mapScheduleMode(meetingType: string): 'specific' | 'weekly' {
  return meetingType === 'days_of_week' ? 'weekly' : 'specific';
}

function mapListItem(raw: RawListItem, role: 'creator' | 'invitee'): MeetingListItem {
  return {
    id: raw.id,
    title: raw.title,
    scheduleMode: mapScheduleMode(raw.meeting_type),
    dates: raw.dates_or_days ?? [],
    finalized: buildFinalizedSlot(raw),
    participantCount: raw.invite_count ?? 0,
    respondedCount: raw.respond_count ?? 0,
    createdAt: raw.created_at ?? '',
    role,
  };
}

function mapMeeting(raw: RawMeeting, participants: ParticipantAvailability[], invitedEmails: string[]): Meeting {
  return {
    id: raw.id,
    title: raw.title,
    description: raw.description ?? '',
    creatorId: raw.creator_id,
    creatorName: raw.creator_name ?? '',
    scheduleMode: mapScheduleMode(raw.meeting_type),
    dates: raw.dates_or_days ?? [],
    startSlot: timeStrToSlot(raw.start_time ?? '08:00'),
    endSlot: timeStrToSlot(raw.end_time ?? '20:00'),
    invitedEmails,
    participants,
    finalized: buildFinalizedSlot(raw),
    createdAt: raw.created_at ?? '',
    updatedAt: raw.created_at ?? '',
  };
}

// ─── API functions ────────────────────────────────────────────────────────────

/** List all meetings (created + invited). */
export async function listMeetings(): Promise<MeetingsListResponse> {
  const raw = await get<RawListResponse>('/api/meetings');
  return {
    myMeetings: (raw.my_meetings ?? []).map(m => mapListItem(m, 'creator')),
    invitedMeetings: (raw.invited_meetings ?? []).map(m => mapListItem(m, 'invitee')),
  };
}

/** Get full meeting details including availability grid. */
export async function getMeeting(id: string): Promise<Meeting> {
  const response = await get<RawMeetingDetailResponse>(`/api/meetings/${id}`);
  const { meeting: raw, participants: rawParticipants, all_invites } = response;

  // Build lookup by email so pairing is order-independent.
  const inviteByEmail = new Map(
    (all_invites ?? [])
      .filter((inv): inv is RawInvite & { email: string } => !!inv.email)
      .map(inv => [inv.email, inv]),
  );

  const participants: ParticipantAvailability[] = rawParticipants.map(p => {
    const invite = p.email ? inviteByEmail.get(p.email) : undefined;
    return {
      userId: invite?.user_id ?? '',
      name: p.name,
      email: p.email ?? invite?.email ?? '',
      slots: p.slots.map(parseSlotString),
      hasResponded: p.responded,
    };
  });

  const invitedEmails = (all_invites ?? [])
    .map((inv) => inv.email)
    .filter((e): e is string => !!e);

  return mapMeeting(raw, participants, invitedEmails);
}

/** Create a new meeting. Returns an object with the new meeting's id. */
export async function createMeeting(payload: CreateMeetingPayload): Promise<Pick<Meeting, 'id'>> {
  const raw = await post<RawCreateResponse>('/api/meetings', {
    title: payload.title,
    description: payload.description,
    meeting_type: payload.scheduleMode === 'weekly' ? 'days_of_week' : 'specific_dates',
    dates_or_days: payload.dates,
    start_time: slotToTimeStr(payload.startSlot),
    end_time: slotToTimeStr(payload.endSlot),
    invite_emails: payload.invitedEmails,
  });
  return { id: raw.meeting_id };
}

/** Create a meeting without an account. Returns tokens for sharing and admin access. */
export async function createMeetingAnonymous(
  payload: AnonymousCreateMeetingPayload,
): Promise<AnonymousCreateResponse> {
  return post<AnonymousCreateResponse>('/api/public/meetings', {
    title: payload.title,
    description: payload.description,
    meeting_type: payload.scheduleMode === 'weekly' ? 'days_of_week' : 'specific_dates',
    dates_or_days: payload.dates,
    start_time: slotToTimeStr(payload.startSlot),
    end_time: slotToTimeStr(payload.endSlot),
    creator_name: payload.creatorName,
  });
}

/** Delete a meeting (creator only). Backend uses POST .../delete, not DELETE. */
export async function deleteMeeting(id: string): Promise<void> {
  return post<void>(`/api/meetings/${id}/delete`);
}

/** Leave a meeting as an invitee. */
export async function leaveMeeting(id: string): Promise<void> {
  return post<void>(`/api/meetings/${id}/leave`);
}

/** Submit or update availability for a meeting.
 *  Translates TimeSlot[] → string[] format ("YYYY-MM-DD_HH:MM") expected by backend.
 */
export async function submitAvailability(
  meetingId: string,
  payload: AvailabilityPayload,
): Promise<void> {
  const slots = payload.slots.map(s => `${s.date}_${slotToTimeStr(s.slot)}`);
  return post<void>(`/api/meetings/${meetingId}/availability`, { slots });
}

/** Finalize a meeting (creator only).
 *  Translates mobile payload fields to backend snake_case format.
 */
export async function finalizeMeeting(
  meetingId: string,
  payload: FinalizePayload,
): Promise<void> {
  return post<void>(`/api/meetings/${meetingId}/finalize`, {
    date_or_day: payload.date,
    time_slot: slotToTimeStr(payload.slot),
    duration_minutes: payload.durationMinutes,
    note: payload.note ?? '',
  });
}

/** Send reminder emails to non-responders (creator only). */
export async function sendReminders(meetingId: string): Promise<void> {
  return post<void>(`/api/meetings/${meetingId}/remind-pending`);
}
