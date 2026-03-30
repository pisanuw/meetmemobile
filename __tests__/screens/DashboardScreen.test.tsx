import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import DashboardScreen from '@/app/(tabs)/index';

// Mock hooks
jest.mock('@/hooks/useMeetings');
jest.mock('@/context/AuthContext');

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => ({}),
}));

import { useMeetings } from '@/hooks/useMeetings';
import { useAuth } from '@/context/AuthContext';

const mockUseMeetings = useMeetings as jest.Mock;
const mockUseAuth = useAuth as jest.Mock;

const MOCK_USER = {
  id: 'u1',
  email: 'alice@example.com',
  name: 'Alice Smith',
  timezone: 'UTC',
  hasGoogleCalendar: false,
  isAdmin: false,
  createdAt: '2024-01-01T00:00:00Z',
};

const MOCK_MEETING = {
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

beforeEach(() => {
  mockUseAuth.mockReturnValue({
    user: MOCK_USER,
    isAuthenticated: true,
    isLoading: false,
  });
});

afterEach(() => {
  jest.resetAllMocks();
  mockPush.mockReset();
});

describe('DashboardScreen', () => {
  it('shows a loading screen while fetching', () => {
    mockUseMeetings.mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
      refresh: jest.fn(),
    });
    render(<DashboardScreen />);
    expect(screen.getByTestId('loading-screen')).toBeTruthy();
  });

  it('greets the user by first name', async () => {
    mockUseMeetings.mockReturnValue({
      data: { myMeetings: [], invitedMeetings: [] },
      isLoading: false,
      error: null,
      refresh: jest.fn(),
    });
    render(<DashboardScreen />);
    expect(screen.getByText(/Hey, Alice/)).toBeTruthy();
  });

  it('shows empty state when no meetings', () => {
    mockUseMeetings.mockReturnValue({
      data: { myMeetings: [], invitedMeetings: [] },
      isLoading: false,
      error: null,
      refresh: jest.fn(),
    });
    render(<DashboardScreen />);
    expect(screen.getAllByTestId('empty-state')).toHaveLength(2);
  });

  it('renders meeting cards when meetings exist', () => {
    mockUseMeetings.mockReturnValue({
      data: { myMeetings: [MOCK_MEETING], invitedMeetings: [] },
      isLoading: false,
      error: null,
      refresh: jest.fn(),
    });
    render(<DashboardScreen />);
    expect(screen.getByTestId('meeting-card-m1')).toBeTruthy();
    expect(screen.getByText('Team Sync')).toBeTruthy();
  });

  it('navigates to meeting detail on card press', () => {
    mockUseMeetings.mockReturnValue({
      data: { myMeetings: [MOCK_MEETING], invitedMeetings: [] },
      isLoading: false,
      error: null,
      refresh: jest.fn(),
    });
    render(<DashboardScreen />);
    fireEvent.press(screen.getByTestId('meeting-card-m1'));
    expect(mockPush).toHaveBeenCalledWith('/(tabs)/meetings/m1');
  });

  it('navigates to create-meeting on FAB press', () => {
    mockUseMeetings.mockReturnValue({
      data: { myMeetings: [], invitedMeetings: [] },
      isLoading: false,
      error: null,
      refresh: jest.fn(),
    });
    render(<DashboardScreen />);
    fireEvent.press(screen.getByTestId('new-meeting-fab'));
    expect(mockPush).toHaveBeenCalledWith('/(tabs)/create-meeting');
  });

  it('shows error banner when fetch fails', () => {
    mockUseMeetings.mockReturnValue({
      data: null,
      isLoading: false,
      error: 'Network error',
      refresh: jest.fn(),
    });
    render(<DashboardScreen />);
    expect(screen.getByText('Network error')).toBeTruthy();
  });

  it('renders both my meetings and invited meetings sections', () => {
    const invitedMeeting = { ...MOCK_MEETING, id: 'm2', role: 'invitee' as const };
    mockUseMeetings.mockReturnValue({
      data: { myMeetings: [MOCK_MEETING], invitedMeetings: [invitedMeeting] },
      isLoading: false,
      error: null,
      refresh: jest.fn(),
    });
    render(<DashboardScreen />);
    expect(screen.getByTestId('meeting-card-m1')).toBeTruthy();
    expect(screen.getByTestId('meeting-card-m2')).toBeTruthy();
  });
});
