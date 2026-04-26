import { get, post, del } from './client';
import {
  Meeting,
  MeetingsListResponse,
  CreateMeetingPayload,
  AvailabilityPayload,
  FinalizePayload,
} from '../types';

/** List all meetings (created + invited). */
export async function listMeetings(): Promise<MeetingsListResponse> {
  return get<MeetingsListResponse>('/api/meetings');
}

/** Get full meeting details including availability grid. */
export async function getMeeting(id: string): Promise<Meeting> {
  return get<Meeting>(`/api/meetings/${id}`);
}

/** Create a new meeting. */
export async function createMeeting(payload: CreateMeetingPayload): Promise<Meeting> {
  return post<Meeting>('/api/meetings', payload);
}

/** Delete a meeting (creator only). */
export async function deleteMeeting(id: string): Promise<void> {
  return del<void>(`/api/meetings/${id}`);
}

/** Leave a meeting as an invitee. */
export async function leaveMeeting(id: string): Promise<void> {
  return post<void>(`/api/meetings/${id}/leave`);
}

/** Submit or update availability for a meeting. */
export async function submitAvailability(
  meetingId: string,
  payload: AvailabilityPayload,
): Promise<void> {
  return post<void>(`/api/meetings/${meetingId}/availability`, payload);
}

/** Finalize a meeting (creator only). */
export async function finalizeMeeting(
  meetingId: string,
  payload: FinalizePayload,
): Promise<Meeting> {
  return post<Meeting>(`/api/meetings/${meetingId}/finalize`, payload);
}

/** Send reminder emails to non-responders (creator only). */
export async function sendReminders(meetingId: string): Promise<void> {
  return post<void>(`/api/meetings/${meetingId}/remind-pending`);
}
