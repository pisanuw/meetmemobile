import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';

const mockReplace = jest.fn();
const mockBack = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace, back: mockBack, push: jest.fn() }),
  useLocalSearchParams: () => ({}),
}));

jest.mock('@/api/meetings', () => ({
  createMeeting: jest.fn(),
}));

import CreateMeetingScreen from '@/app/(tabs)/create-meeting';
import * as meetingsApi from '@/api/meetings';

const mockCreate = meetingsApi.createMeeting as jest.Mock;

afterEach(() => jest.clearAllMocks());

describe('CreateMeetingScreen', () => {
  it('renders title input', () => {
    render(<CreateMeetingScreen />);
    expect(screen.getByTestId('title-input')).toBeTruthy();
  });

  it('renders create button', () => {
    render(<CreateMeetingScreen />);
    expect(screen.getByTestId('create-button')).toBeTruthy();
  });

  it('shows error when title is empty and create is pressed', async () => {
    render(<CreateMeetingScreen />);
    fireEvent.press(screen.getByTestId('create-button'));
    await waitFor(() => {
      expect(screen.getByText('Please add a meeting title')).toBeTruthy();
    });
  });

  it('shows error when no dates selected', async () => {
    render(<CreateMeetingScreen />);
    fireEvent.changeText(screen.getByTestId('title-input'), 'My Meeting');
    fireEvent.press(screen.getByTestId('create-button'));
    await waitFor(() => {
      expect(screen.getByText('Please select at least one date')).toBeTruthy();
    });
  });

  it('toggles schedule mode between specific and weekly', () => {
    render(<CreateMeetingScreen />);
    fireEvent.press(screen.getByTestId('mode-weekly'));
    // Should now show day chips (full names used as testIDs)
    expect(screen.getByTestId('day-chip-Monday')).toBeTruthy();
    fireEvent.press(screen.getByTestId('mode-specific'));
    // Should show date chips again
    expect(screen.queryByTestId('day-chip-Monday')).toBeNull();
  });

  it('selects and deselects days in weekly mode', () => {
    render(<CreateMeetingScreen />);
    fireEvent.press(screen.getByTestId('mode-weekly'));
    const monChip = screen.getByTestId('day-chip-Monday');
    fireEvent.press(monChip);
    fireEvent.press(monChip); // deselect
    // no crash = pass
  });

  it('calls createMeeting with correct payload and navigates on success', async () => {
    const newMeeting = { id: 'new-123', title: 'Test' };
    mockCreate.mockResolvedValue(newMeeting);

    render(<CreateMeetingScreen />);
    fireEvent.changeText(screen.getByTestId('title-input'), 'Test Meeting');

    // Switch to weekly mode and select Monday
    fireEvent.press(screen.getByTestId('mode-weekly'));
    fireEvent.press(screen.getByTestId('day-chip-Monday'));

    fireEvent.press(screen.getByTestId('create-button'));

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test Meeting',
          scheduleMode: 'weekly',
          dates: ['Monday'],
        }),
      );
      expect(mockReplace).toHaveBeenCalledWith('/(tabs)/meetings/new-123');
    });
  });

  it('shows error flash when API call fails', async () => {
    mockCreate.mockRejectedValue(new Error('Server error'));

    render(<CreateMeetingScreen />);
    fireEvent.changeText(screen.getByTestId('title-input'), 'Test');
    fireEvent.press(screen.getByTestId('mode-weekly'));
    fireEvent.press(screen.getByTestId('day-chip-Tuesday'));
    fireEvent.press(screen.getByTestId('create-button'));

    await waitFor(() => {
      expect(screen.getByText('Server error')).toBeTruthy();
    });
  });

  it('parses valid emails from emails input', async () => {
    mockCreate.mockResolvedValue({ id: 'x' });

    render(<CreateMeetingScreen />);
    fireEvent.changeText(screen.getByTestId('title-input'), 'Test');
    fireEvent.press(screen.getByTestId('mode-weekly'));
    fireEvent.press(screen.getByTestId('day-chip-Monday'));
    fireEvent.changeText(
      screen.getByTestId('emails-input'),
      'alice@example.com\nbob@example.com',
    );
    fireEvent.press(screen.getByTestId('create-button'));

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          invitedEmails: ['alice@example.com', 'bob@example.com'],
        }),
      );
    });
  });

  it('renders emails count when emails are entered', () => {
    render(<CreateMeetingScreen />);
    fireEvent.changeText(
      screen.getByTestId('emails-input'),
      'a@a.com, b@b.com',
    );
    expect(screen.getByText('2 valid emails')).toBeTruthy();
  });
});
