import {
  listMeetings,
  getMeeting,
  createMeeting,
  deleteMeeting,
  leaveMeeting,
  submitAvailability,
  finalizeMeeting,
  sendReminders,
} from '@/api/meetings';

jest.mock('@/api/client', () => ({
  get: jest.fn(),
  post: jest.fn(),
  del: jest.fn(),
}));

import * as client from '@/api/client';

const mockGet = client.get as jest.Mock;
const mockPost = client.post as jest.Mock;

afterEach(() => jest.resetAllMocks());

// ─── Raw backend shapes ───────────────────────────────────────────────────────

const RAW_MEETING = {
  id: 'm1',
  title: 'Team Sync',
  description: '',
  creator_id: 'u1',
  creator_name: 'Alice',
  meeting_type: 'specific_dates',
  dates_or_days: ['2024-06-10', '2024-06-11'],
  start_time: '08:00',
  end_time: '17:00',
  timezone: 'America/New_York',
  duration_minutes: 60,
  finalized_date: null,
  finalized_slot: null,
  note: '',
  is_finalized: false,
  created_at: '2024-06-01T00:00:00Z',
};

const RAW_LIST_ITEM = {
  ...RAW_MEETING,
  respond_count: 1,
  invite_count: 3,
};

const RAW_DETAIL = {
  meeting: RAW_MEETING,
  is_creator: true,
  my_slots: ['2024-06-10_09:00'],
  slot_counts: {},
  total_invited: 2,
  participants: [
    { name: 'Alice', slot_count: 1, responded: true, slots: ['2024-06-10_09:00'], email: 'alice@example.com' },
    { name: 'Bob', slot_count: 0, responded: false, slots: [] },
  ],
  all_invites: [
    { user_id: 'u1', email: 'alice@example.com', name: 'Alice', responded: true },
    { user_id: 'u2', email: 'bob@example.com', name: 'Bob', responded: false },
  ],
  respond_count: 1,
  invite_count: 2,
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('listMeetings()', () => {
  it('fetches /api/meetings and maps snake_case to camelCase', async () => {
    mockGet.mockResolvedValue({
      my_meetings: [RAW_LIST_ITEM],
      invited_meetings: [],
    });
    const result = await listMeetings();
    expect(mockGet).toHaveBeenCalledWith('/api/meetings');
    expect(result.myMeetings).toHaveLength(1);
    expect(result.invitedMeetings).toHaveLength(0);
  });

  it('maps meeting_type to scheduleMode', async () => {
    mockGet.mockResolvedValue({ my_meetings: [RAW_LIST_ITEM], invited_meetings: [] });
    const { myMeetings } = await listMeetings();
    expect(myMeetings[0].scheduleMode).toBe('specific');
  });

  it('maps days_of_week meeting_type to weekly', async () => {
    mockGet.mockResolvedValue({
      my_meetings: [{ ...RAW_LIST_ITEM, meeting_type: 'days_of_week' }],
      invited_meetings: [],
    });
    const { myMeetings } = await listMeetings();
    expect(myMeetings[0].scheduleMode).toBe('weekly');
  });

  it('maps respond_count/invite_count to respondedCount/participantCount', async () => {
    mockGet.mockResolvedValue({ my_meetings: [RAW_LIST_ITEM], invited_meetings: [] });
    const { myMeetings } = await listMeetings();
    expect(myMeetings[0].respondedCount).toBe(1);
    expect(myMeetings[0].participantCount).toBe(3);
  });

  it('assigns role creator for my_meetings and invitee for invited_meetings', async () => {
    mockGet.mockResolvedValue({ my_meetings: [RAW_LIST_ITEM], invited_meetings: [RAW_LIST_ITEM] });
    const { myMeetings, invitedMeetings } = await listMeetings();
    expect(myMeetings[0].role).toBe('creator');
    expect(invitedMeetings[0].role).toBe('invitee');
  });
});

describe('getMeeting()', () => {
  it('fetches /api/meetings/:id and unwraps the detail wrapper', async () => {
    mockGet.mockResolvedValue(RAW_DETAIL);
    const result = await getMeeting('m1');
    expect(mockGet).toHaveBeenCalledWith('/api/meetings/m1');
    expect(result.id).toBe('m1');
    expect(result.title).toBe('Team Sync');
  });

  it('maps creator_id to creatorId', async () => {
    mockGet.mockResolvedValue(RAW_DETAIL);
    const result = await getMeeting('m1');
    expect(result.creatorId).toBe('u1');
  });

  it('converts start_time/end_time HH:MM to slot indexes', async () => {
    mockGet.mockResolvedValue(RAW_DETAIL);
    const result = await getMeeting('m1');
    expect(result.startSlot).toBe(32); // 08:00 = 32
    expect(result.endSlot).toBe(68);   // 17:00 = 68
  });

  it('maps participant slots from string to TimeSlot objects', async () => {
    mockGet.mockResolvedValue(RAW_DETAIL);
    const result = await getMeeting('m1');
    expect(result.participants[0].slots[0]).toEqual({ date: '2024-06-10', slot: 36 }); // 09:00 = 36
  });

  it('maps participant userId from all_invites', async () => {
    mockGet.mockResolvedValue(RAW_DETAIL);
    const result = await getMeeting('m1');
    expect(result.participants[0].userId).toBe('u1');
    expect(result.participants[1].userId).toBe('u2');
  });

  it('extracts invitedEmails from all_invites', async () => {
    mockGet.mockResolvedValue(RAW_DETAIL);
    const result = await getMeeting('m1');
    expect(result.invitedEmails).toContain('alice@example.com');
    expect(result.invitedEmails).toContain('bob@example.com');
  });
});

describe('createMeeting()', () => {
  it('translates mobile payload to backend snake_case format', async () => {
    mockPost.mockResolvedValue({ success: true, meeting_id: 'm1', invite_results: [], email_failures: [] });
    const payload = {
      title: 'Team Sync',
      scheduleMode: 'specific' as const,
      dates: ['2024-06-10'],
      startSlot: 32,
      endSlot: 68,
      invitedEmails: ['bob@example.com'],
    };
    await createMeeting(payload);
    expect(mockPost).toHaveBeenCalledWith('/api/meetings', {
      title: 'Team Sync',
      description: undefined,
      meeting_type: 'specific_dates',
      dates_or_days: ['2024-06-10'],
      start_time: '08:00',
      end_time: '17:00',
      invite_emails: ['bob@example.com'],
    });
  });

  it('translates weekly scheduleMode to days_of_week meeting_type', async () => {
    mockPost.mockResolvedValue({ success: true, meeting_id: 'm2', invite_results: [], email_failures: [] });
    await createMeeting({
      title: 'Weekly',
      scheduleMode: 'weekly',
      dates: ['Monday', 'Friday'],
      startSlot: 32,
      endSlot: 68,
      invitedEmails: [],
    });
    expect(mockPost).toHaveBeenCalledWith('/api/meetings', expect.objectContaining({
      meeting_type: 'days_of_week',
    }));
  });

  it('returns { id } from meeting_id in backend response', async () => {
    mockPost.mockResolvedValue({ success: true, meeting_id: 'm1', invite_results: [], email_failures: [] });
    const result = await createMeeting({
      title: 'Team Sync',
      scheduleMode: 'specific',
      dates: [],
      startSlot: 32,
      endSlot: 68,
      invitedEmails: [],
    });
    expect(result.id).toBe('m1');
  });
});

describe('deleteMeeting()', () => {
  it('uses POST to /api/meetings/:id/delete (not DELETE method)', async () => {
    mockPost.mockResolvedValue(undefined);
    await deleteMeeting('m1');
    expect(mockPost).toHaveBeenCalledWith('/api/meetings/m1/delete');
  });
});

describe('leaveMeeting()', () => {
  it('posts to /api/meetings/:id/leave', async () => {
    mockPost.mockResolvedValue(undefined);
    await leaveMeeting('m1');
    expect(mockPost).toHaveBeenCalledWith('/api/meetings/m1/leave');
  });
});

describe('submitAvailability()', () => {
  it('converts TimeSlot[] to "date_time" string format', async () => {
    mockPost.mockResolvedValue(undefined);
    await submitAvailability('m1', { slots: [{ date: '2024-06-10', slot: 36 }] });
    expect(mockPost).toHaveBeenCalledWith('/api/meetings/m1/availability', {
      slots: ['2024-06-10_09:00'],
    });
  });

  it('sends empty array to clear availability', async () => {
    mockPost.mockResolvedValue(undefined);
    await submitAvailability('m1', { slots: [] });
    expect(mockPost).toHaveBeenCalledWith('/api/meetings/m1/availability', { slots: [] });
  });
});

describe('finalizeMeeting()', () => {
  it('translates mobile payload to backend snake_case format', async () => {
    mockPost.mockResolvedValue(undefined);
    await finalizeMeeting('m1', { date: '2024-06-10', slot: 36, durationMinutes: 60 });
    expect(mockPost).toHaveBeenCalledWith('/api/meetings/m1/finalize', {
      date_or_day: '2024-06-10',
      time_slot: '09:00',
      duration_minutes: 60,
      note: '',
    });
  });

  it('passes note through when provided', async () => {
    mockPost.mockResolvedValue(undefined);
    await finalizeMeeting('m1', { date: '2024-06-10', slot: 36, durationMinutes: 90, note: 'Room B' });
    expect(mockPost).toHaveBeenCalledWith('/api/meetings/m1/finalize', expect.objectContaining({
      note: 'Room B',
    }));
  });
});

describe('sendReminders()', () => {
  it('posts to /api/meetings/:id/remind-pending', async () => {
    mockPost.mockResolvedValue(undefined);
    await sendReminders('m1');
    expect(mockPost).toHaveBeenCalledWith('/api/meetings/m1/remind-pending');
  });
});
