import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockBack = jest.fn();
const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack, replace: mockReplace, push: jest.fn() }),
  useLocalSearchParams: () => ({ id: 'meeting-abc' }),
}));

jest.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-1', name: 'Alice', email: 'alice@example.com' },
  }),
}));

const mockMeeting = {
  id: 'meeting-abc',
  title: 'Team Sync',
  description: 'Our weekly sync',
  creatorId: 'user-1',
  creatorName: 'Alice',
  scheduleMode: 'specific' as const,
  dates: ['2025-06-02'],
  startSlot: 32,
  endSlot: 52,
  invitedEmails: ['bob@example.com'],
  participants: [
    {
      userId: 'user-1',
      name: 'Alice',
      email: 'alice@example.com',
      slots: [{ date: '2025-06-02', slot: 32 }],
      submittedAt: '2025-05-28T10:00:00Z',
    },
    {
      userId: 'user-2',
      name: 'Bob',
      email: 'bob@example.com',
      slots: [],
      submittedAt: null,
    },
  ],
  finalized: null,
  createdAt: '2025-05-28T09:00:00Z',
  updatedAt: '2025-05-28T10:00:00Z',
};

const mockRefresh = jest.fn().mockResolvedValue(undefined);

jest.mock('@/hooks/useMeeting', () => ({
  useMeeting: jest.fn(() => ({
    meeting: mockMeeting,
    isLoading: false,
    error: null,
    refresh: mockRefresh,
  })),
}));

jest.mock('@/api/meetings', () => ({
  submitAvailability: jest.fn().mockResolvedValue(undefined),
  finalizeMeeting: jest.fn().mockResolvedValue({ ...mockMeeting, finalized: { date: '2025-06-02', slot: 32, durationMinutes: 60, note: '' } }),
  deleteMeeting: jest.fn().mockResolvedValue(undefined),
  leaveMeeting: jest.fn().mockResolvedValue(undefined),
  sendReminders: jest.fn().mockResolvedValue(undefined),
}));

import MeetingDetailScreen from '@/app/(tabs)/meetings/[id]';
import * as meetingsApi from '@/api/meetings';
import { useMeeting } from '@/hooks/useMeeting';

const mockUseMeeting = useMeeting as jest.Mock;

afterEach(() => jest.clearAllMocks());

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('MeetingDetailScreen', () => {
  it('renders the meeting title', () => {
    render(<MeetingDetailScreen />);
    expect(screen.getByText('Team Sync')).toBeTruthy();
  });

  it('shows loading screen while loading', () => {
    mockUseMeeting.mockReturnValueOnce({ meeting: null, isLoading: true, error: null, refresh: jest.fn() });
    render(<MeetingDetailScreen />);
    expect(screen.getByTestId('loading-screen')).toBeTruthy();
  });

  it('shows error state when error is present', () => {
    mockUseMeeting.mockReturnValueOnce({ meeting: null, isLoading: false, error: 'Not found', refresh: jest.fn() });
    render(<MeetingDetailScreen />);
    expect(screen.getByText('Not found')).toBeTruthy();
  });

  it('renders group view and my availability tabs', () => {
    render(<MeetingDetailScreen />);
    expect(screen.getByTestId('tab-heatmap')).toBeTruthy();
    expect(screen.getByTestId('tab-my-availability')).toBeTruthy();
  });

  it('switches to my-availability view on tab press', () => {
    render(<MeetingDetailScreen />);
    fireEvent.press(screen.getByTestId('tab-my-availability'));
    expect(screen.getByTestId('save-availability-button')).toBeTruthy();
  });

  it('shows participant list with responded/total count', () => {
    render(<MeetingDetailScreen />);
    expect(screen.getByText('Participants (1/2 responded)')).toBeTruthy();
  });

  it('shows description when present', () => {
    render(<MeetingDetailScreen />);
    expect(screen.getByText('Our weekly sync')).toBeTruthy();
  });

  it('saves availability when save button is pressed', async () => {
    render(<MeetingDetailScreen />);
    fireEvent.press(screen.getByTestId('tab-my-availability'));
    fireEvent.press(screen.getByTestId('save-availability-button'));

    await waitFor(() => {
      expect(meetingsApi.submitAvailability).toHaveBeenCalledWith(
        'meeting-abc',
        expect.objectContaining({ slots: expect.any(Array) }),
      );
    });
  });

  it('shows creator actions (send reminders) for meeting creator', () => {
    render(<MeetingDetailScreen />);
    // heatmap is default, creator actions visible
    expect(screen.getByTestId('remind-button')).toBeTruthy();
  });

  it('calls sendReminders on remind button press', async () => {
    render(<MeetingDetailScreen />);
    fireEvent.press(screen.getByTestId('remind-button'));

    await waitFor(() => {
      expect(meetingsApi.sendReminders).toHaveBeenCalledWith('meeting-abc');
    });
  });

  it('shows delete button for creator', () => {
    render(<MeetingDetailScreen />);
    expect(screen.getByTestId('delete-button')).toBeTruthy();
  });

  it('shows finalized banner when meeting is finalized', () => {
    mockUseMeeting.mockReturnValueOnce({
      meeting: {
        ...mockMeeting,
        finalized: { date: '2025-06-02', slot: 32, durationMinutes: 60, note: 'Room B' },
      },
      isLoading: false,
      error: null,
      refresh: jest.fn(),
    });
    render(<MeetingDetailScreen />);
    expect(screen.getByText('Meeting Scheduled')).toBeTruthy();
    expect(screen.getByText('Room B')).toBeTruthy();
  });

  it('hides mode toggle when meeting is finalized', () => {
    mockUseMeeting.mockReturnValueOnce({
      meeting: {
        ...mockMeeting,
        finalized: { date: '2025-06-02', slot: 32, durationMinutes: 60, note: '' },
      },
      isLoading: false,
      error: null,
      refresh: jest.fn(),
    });
    render(<MeetingDetailScreen />);
    expect(screen.queryByTestId('tab-heatmap')).toBeNull();
    expect(screen.queryByTestId('tab-my-availability')).toBeNull();
  });

  it('shows leave button for non-creator', () => {
    mockUseMeeting.mockReturnValueOnce({
      meeting: { ...mockMeeting, creatorId: 'other-user' },
      isLoading: false,
      error: null,
      refresh: jest.fn(),
    });
    render(<MeetingDetailScreen />);
    expect(screen.getByTestId('leave-button')).toBeTruthy();
    expect(screen.queryByTestId('delete-button')).toBeNull();
  });
});
