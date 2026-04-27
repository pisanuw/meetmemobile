import { renderHook, act } from '@testing-library/react-native';
import { useFlash } from '@/hooks/useFlash';
import { useMeetings } from '@/hooks/useMeetings';
import { useMeeting } from '@/hooks/useMeeting';

// ─── useFlash ─────────────────────────────────────────────────────────────────

describe('useFlash', () => {
  it('starts with no flash', () => {
    const { result } = renderHook(() => useFlash());
    expect(result.current.flash).toBeNull();
  });

  it('showFlash sets message and type', () => {
    const { result } = renderHook(() => useFlash());
    act(() => {
      result.current.showFlash('Hello', 'success');
    });
    expect(result.current.flash).toEqual({ message: 'Hello', type: 'success' });
  });

  it('defaults to type info', () => {
    const { result } = renderHook(() => useFlash());
    act(() => {
      result.current.showFlash('Info message');
    });
    expect(result.current.flash?.type).toBe('info');
  });

  it('clearFlash resets to null', () => {
    const { result } = renderHook(() => useFlash());
    act(() => {
      result.current.showFlash('To be cleared', 'error');
    });
    act(() => {
      result.current.clearFlash();
    });
    expect(result.current.flash).toBeNull();
  });

  it('showFlash overwrites previous flash', () => {
    const { result } = renderHook(() => useFlash());
    act(() => result.current.showFlash('First', 'success'));
    act(() => result.current.showFlash('Second', 'error'));
    expect(result.current.flash).toEqual({ message: 'Second', type: 'error' });
  });
});

// ─── useMeetings ──────────────────────────────────────────────────────────────

const mockMeetingsData = {
  myMeetings: [{ id: 'm1', title: 'Meeting 1' }],
  invitedMeetings: [],
};

jest.mock('@/api/meetings', () => ({
  listMeetings: jest.fn(),
  getMeeting: jest.fn(),
}));

import * as meetingsApi from '@/api/meetings';
const mockListMeetings = meetingsApi.listMeetings as jest.Mock;
const mockGetMeeting = meetingsApi.getMeeting as jest.Mock;

afterEach(() => jest.resetAllMocks());

describe('useMeetings', () => {
  it('starts loading and then returns data', async () => {
    mockListMeetings.mockResolvedValue(mockMeetingsData);

    const { result } = renderHook(() => useMeetings());
    expect(result.current.isLoading).toBe(true);

    await act(async () => {});

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toEqual(mockMeetingsData);
    expect(result.current.error).toBeNull();
  });

  it('sets error on failure', async () => {
    mockListMeetings.mockRejectedValue(new Error('Network down'));

    const { result } = renderHook(() => useMeetings());
    await act(async () => {});

    expect(result.current.error).toBe('Network down');
    expect(result.current.data).toBeNull();
  });

  it('uses fallback message when rejection value is not an Error instance', async () => {
    mockListMeetings.mockRejectedValue('plain string rejection');

    const { result } = renderHook(() => useMeetings());
    await act(async () => {});

    expect(result.current.error).toBe('Failed to load meetings');
  });

  it('refresh re-fetches data', async () => {
    mockListMeetings.mockResolvedValue(mockMeetingsData);

    const { result } = renderHook(() => useMeetings());
    await act(async () => {});

    await act(async () => {
      await result.current.refresh();
    });

    expect(mockListMeetings).toHaveBeenCalledTimes(2);
  });
});

// ─── useMeeting ───────────────────────────────────────────────────────────────

const mockMeeting = {
  id: 'abc',
  title: 'Test Meeting',
  participants: [],
};

describe('useMeeting', () => {
  it('fetches meeting by id', async () => {
    mockGetMeeting.mockResolvedValue(mockMeeting);

    const { result } = renderHook(() => useMeeting('abc'));
    await act(async () => {});

    expect(mockGetMeeting).toHaveBeenCalledWith('abc');
    expect(result.current.meeting).toEqual(mockMeeting);
  });

  it('sets error if fetch fails', async () => {
    mockGetMeeting.mockRejectedValue(new Error('Not found'));

    const { result } = renderHook(() => useMeeting('bad-id'));
    await act(async () => {});

    expect(result.current.error).toBe('Not found');
    expect(result.current.meeting).toBeNull();
  });

  it('does not fetch with empty id', async () => {
    const { result } = renderHook(() => useMeeting(''));
    await act(async () => {});
    expect(mockGetMeeting).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
  });
});
