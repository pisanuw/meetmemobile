import { renderHook, act } from '@testing-library/react-native';

const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

jest.mock('@/api/meetings', () => ({
  createMeeting: jest.fn(),
}));

import { useCreateMeetingForm, nextNDates, DAYS_OF_WEEK, DAY_SHORT } from '@/hooks/useCreateMeetingForm';
import * as meetingsApi from '@/api/meetings';

const mockCreate = meetingsApi.createMeeting as jest.Mock;

afterEach(() => jest.clearAllMocks());

describe('nextNDates()', () => {
  it('returns n future dates as YYYY-MM-DD strings', () => {
    const dates = nextNDates(3);
    expect(dates).toHaveLength(3);
    expect(dates[0]).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('dates are all different and plausibly in the near future', () => {
    const dates = nextNDates(7);
    // All dates should be unique
    expect(new Set(dates).size).toBe(7);
    // Each date should follow its predecessor
    for (let i = 1; i < dates.length; i++) {
      expect(dates[i] > dates[i - 1]).toBe(true);
    }
  });
});

describe('DAYS_OF_WEEK / DAY_SHORT', () => {
  it('contains 7 full day names', () => {
    expect(DAYS_OF_WEEK).toHaveLength(7);
    expect(DAYS_OF_WEEK).toContain('Monday');
  });

  it('DAY_SHORT maps full names to abbreviations', () => {
    expect(DAY_SHORT['Monday']).toBe('Mon');
    expect(DAY_SHORT['Sunday']).toBe('Sun');
  });
});

describe('useCreateMeetingForm', () => {
  it('initialises with empty title, weekly mode, and Mon-Fri selected', () => {
    const { result } = renderHook(() => useCreateMeetingForm());
    expect(result.current.title).toBe('');
    expect(result.current.scheduleMode).toBe('weekly');
    expect(result.current.selectedDays).toEqual([
      'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday',
    ]);
    expect(result.current.isLoading).toBe(false);
  });

  it('toggleDate adds and removes a date', () => {
    const { result } = renderHook(() => useCreateMeetingForm());
    act(() => result.current.toggleDate('2025-06-01'));
    expect(result.current.selectedDates).toContain('2025-06-01');
    act(() => result.current.toggleDate('2025-06-01'));
    expect(result.current.selectedDates).not.toContain('2025-06-01');
  });

  it('toggleDay removes a pre-selected day and adds it back', () => {
    const { result } = renderHook(() => useCreateMeetingForm());
    // Monday is pre-selected — first toggle removes it
    act(() => result.current.toggleDay('Monday'));
    expect(result.current.selectedDays).not.toContain('Monday');
    // second toggle adds it back
    act(() => result.current.toggleDay('Monday'));
    expect(result.current.selectedDays).toContain('Monday');
  });

  it('changeStartSlot clamps to 0', () => {
    const { result } = renderHook(() => useCreateMeetingForm());
    act(() => result.current.changeStartSlot(-10));
    expect(result.current.startSlot).toBe(0);
  });

  it('changeEndSlot clamps to 95', () => {
    const { result } = renderHook(() => useCreateMeetingForm());
    act(() => result.current.changeEndSlot(200));
    expect(result.current.endSlot).toBe(95);
  });

  it('parsedEmailCount is 0 with no emails entered', () => {
    const { result } = renderHook(() => useCreateMeetingForm());
    expect(result.current.parsedEmailCount).toBe(0);
  });

  it('parsedEmailCount counts valid emails', () => {
    const { result } = renderHook(() => useCreateMeetingForm());
    act(() => result.current.setEmailsText('a@a.com, b@b.com, notanemail'));
    expect(result.current.parsedEmailCount).toBe(2);
  });

  it('handleCreate shows error when title is empty', async () => {
    const { result } = renderHook(() => useCreateMeetingForm());
    await act(async () => { await result.current.handleCreate(); });
    expect(result.current.flash?.message).toBe('Please add a meeting title');
  });

  it('handleCreate shows error when no dates selected in specific mode', async () => {
    const { result } = renderHook(() => useCreateMeetingForm());
    act(() => {
      result.current.setTitle('My Meeting');
      result.current.setScheduleMode('specific'); // switch away from default weekly
    });
    await act(async () => { await result.current.handleCreate(); });
    expect(result.current.flash?.message).toContain('select at least one date');
  });

  it('handleCreate shows error when no days selected in weekly mode', async () => {
    const { result } = renderHook(() => useCreateMeetingForm());
    // Deselect all pre-selected days
    act(() => {
      result.current.setTitle('My Meeting');
      ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].forEach(
        d => result.current.toggleDay(d),
      );
    });
    await act(async () => { await result.current.handleCreate(); });
    expect(result.current.flash?.message).toContain('day of the week');
  });

  it('handleCreate calls createMeeting and navigates on success', async () => {
    mockCreate.mockResolvedValue({ id: 'new-id' });
    const { result } = renderHook(() => useCreateMeetingForm());
    // Default is weekly with Mon-Fri pre-selected — just set the title
    act(() => result.current.setTitle('Test'));
    await act(async () => { await result.current.handleCreate(); });
    expect(mockCreate).toHaveBeenCalled();
    expect(mockReplace).toHaveBeenCalledWith('/(tabs)/meetings/new-id');
  });

  it('handleCreate sets flash on API error', async () => {
    mockCreate.mockRejectedValue(new Error('Server down'));
    const { result } = renderHook(() => useCreateMeetingForm());
    act(() => {
      result.current.setTitle('Test');
      result.current.setScheduleMode('weekly');
      result.current.toggleDay('Tuesday');
    });
    await act(async () => { await result.current.handleCreate(); });
    expect(result.current.flash?.message).toBe('Server down');
    expect(result.current.isLoading).toBe(false);
  });

  it('handleCreate sets flash with fallback when error is not an Error instance', async () => {
    mockCreate.mockRejectedValue('string error');
    const { result } = renderHook(() => useCreateMeetingForm());
    act(() => {
      result.current.setTitle('Test');
      result.current.setScheduleMode('weekly');
      result.current.toggleDay('Wednesday');
    });
    await act(async () => { await result.current.handleCreate(); });
    expect(result.current.flash?.message).toBe('Failed to create meeting');
  });
});
