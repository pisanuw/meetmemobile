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
const mockDel = client.del as jest.Mock;

afterEach(() => jest.resetAllMocks());

const MOCK_MEETING = {
  id: 'm1',
  title: 'Team Sync',
  description: '',
  creatorId: 'u1',
  creatorName: 'Alice',
  scheduleMode: 'specific' as const,
  dates: ['2024-06-10', '2024-06-11'],
  startSlot: 32,
  endSlot: 68,
  invitedEmails: ['bob@example.com'],
  participants: [],
  finalized: null,
  createdAt: '2024-06-01T00:00:00Z',
  updatedAt: '2024-06-01T00:00:00Z',
};

const MOCK_LIST_ITEM = {
  id: 'm1',
  title: 'Team Sync',
  scheduleMode: 'specific' as const,
  dates: ['2024-06-10'],
  finalized: null,
  participantCount: 3,
  respondedCount: 1,
  createdAt: '2024-06-01T00:00:00Z',
  role: 'creator' as const,
};

describe('listMeetings()', () => {
  it('fetches from /api/meetings', async () => {
    mockGet.mockResolvedValue({ myMeetings: [MOCK_LIST_ITEM], invitedMeetings: [] });
    const result = await listMeetings();
    expect(mockGet).toHaveBeenCalledWith('/api/meetings');
    expect(result.myMeetings).toHaveLength(1);
    expect(result.invitedMeetings).toHaveLength(0);
  });
});

describe('getMeeting()', () => {
  it('fetches from /api/meetings/:id', async () => {
    mockGet.mockResolvedValue(MOCK_MEETING);
    const result = await getMeeting('m1');
    expect(mockGet).toHaveBeenCalledWith('/api/meetings/m1');
    expect(result.id).toBe('m1');
    expect(result.title).toBe('Team Sync');
  });
});

describe('createMeeting()', () => {
  it('posts to /api/meetings with payload', async () => {
    mockPost.mockResolvedValue(MOCK_MEETING);
    const payload = {
      title: 'Team Sync',
      scheduleMode: 'specific' as const,
      dates: ['2024-06-10'],
      startSlot: 32,
      endSlot: 68,
      invitedEmails: [],
    };
    const result = await createMeeting(payload);
    expect(mockPost).toHaveBeenCalledWith('/api/meetings', payload);
    expect(result.id).toBe('m1');
  });
});

describe('deleteMeeting()', () => {
  it('sends DELETE to /api/meetings/:id', async () => {
    mockDel.mockResolvedValue(undefined);
    await deleteMeeting('m1');
    expect(mockDel).toHaveBeenCalledWith('/api/meetings/m1');
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
  it('posts slots to /api/meetings/:id/availability', async () => {
    mockPost.mockResolvedValue(undefined);
    const slots = [{ date: '2024-06-10', slot: 32 }];
    await submitAvailability('m1', { slots });
    expect(mockPost).toHaveBeenCalledWith('/api/meetings/m1/availability', { slots });
  });

  it('accepts empty slots array to clear availability', async () => {
    mockPost.mockResolvedValue(undefined);
    await submitAvailability('m1', { slots: [] });
    expect(mockPost).toHaveBeenCalledWith('/api/meetings/m1/availability', { slots: [] });
  });
});

describe('finalizeMeeting()', () => {
  it('posts to /api/meetings/:id/finalize', async () => {
    const finalizedMeeting = {
      ...MOCK_MEETING,
      finalized: { date: '2024-06-10', slot: 36, durationMinutes: 60, note: '' },
    };
    mockPost.mockResolvedValue(finalizedMeeting);
    const payload = { date: '2024-06-10', slot: 36, durationMinutes: 60 };
    const result = await finalizeMeeting('m1', payload);
    expect(mockPost).toHaveBeenCalledWith('/api/meetings/m1/finalize', payload);
    expect(result.finalized).not.toBeNull();
  });
});

describe('sendReminders()', () => {
  it('posts to /api/meetings/:id/remind-pending', async () => {
    mockPost.mockResolvedValue(undefined);
    await sendReminders('m1');
    expect(mockPost).toHaveBeenCalledWith('/api/meetings/m1/remind-pending');
  });
});
