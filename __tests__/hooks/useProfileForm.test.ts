import { renderHook, act } from '@testing-library/react-native';

const mockRefreshUser = jest.fn();
const mockLogout = jest.fn();
const MOCK_USER = {
  id: 'u1',
  email: 'alice@example.com',
  name: 'Alice',
  timezone: 'America/New_York',
  isAdmin: false,
};

jest.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: MOCK_USER,
    refreshUser: mockRefreshUser,
    logout: mockLogout,
  }),
}));

jest.mock('@/api/auth', () => ({
  updateProfile: jest.fn(),
  submitFeedback: jest.fn(),
  deleteAccount: jest.fn(),
}));

// Alert is exported as .default from the internal path — wrap accordingly
jest.mock('react-native/Libraries/Alert/Alert', () => {
  const alertFn = jest.fn((_title: string, _msg: string, buttons?: Array<{ style?: string; onPress?: () => void }>) => {
    const destructiveBtn = (buttons ?? []).find((b) => b.style === 'destructive');
    destructiveBtn?.onPress?.();
  });
  return { default: { alert: alertFn } };
});

import { useProfileForm, TIMEZONES } from '@/hooks/useProfileForm';
import * as authApi from '@/api/auth';

const mockUpdateProfile = authApi.updateProfile as jest.Mock;
const mockSubmitFeedback = authApi.submitFeedback as jest.Mock;

afterEach(() => jest.clearAllMocks());

describe('TIMEZONES', () => {
  it('includes common timezones', () => {
    expect(TIMEZONES).toContain('America/New_York');
    expect(TIMEZONES).toContain('UTC');
  });
});

describe('useProfileForm', () => {
  it('initialises name and timezone from user', () => {
    const { result } = renderHook(() => useProfileForm());
    expect(result.current.name).toBe('Alice');
    expect(result.current.timezone).toBe('America/New_York');
  });

  it('selectTimezone updates timezone and closes picker', () => {
    const { result } = renderHook(() => useProfileForm());
    act(() => result.current.setShowTzPicker(true));
    expect(result.current.showTzPicker).toBe(true);
    act(() => result.current.selectTimezone('Europe/London'));
    expect(result.current.timezone).toBe('Europe/London');
    expect(result.current.showTzPicker).toBe(false);
  });

  it('handleSaveProfile shows error when name is empty', async () => {
    const { result } = renderHook(() => useProfileForm());
    act(() => result.current.setName(''));
    await act(async () => { await result.current.handleSaveProfile(); });
    expect(result.current.flash?.message).toBe('Name cannot be empty');
    expect(mockUpdateProfile).not.toHaveBeenCalled();
  });

  it('handleSaveProfile calls updateProfile and refreshUser on success', async () => {
    mockUpdateProfile.mockResolvedValue({});
    mockRefreshUser.mockResolvedValue(undefined);
    const { result } = renderHook(() => useProfileForm());
    await act(async () => { await result.current.handleSaveProfile(); });
    expect(mockUpdateProfile).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Alice', timezone: 'America/New_York' }),
    );
    expect(mockRefreshUser).toHaveBeenCalled();
    expect(result.current.flash?.message).toBe('Profile saved!');
  });

  it('handleSaveProfile shows error flash on API failure', async () => {
    mockUpdateProfile.mockRejectedValue(new Error('Network error'));
    const { result } = renderHook(() => useProfileForm());
    await act(async () => { await result.current.handleSaveProfile(); });
    expect(result.current.flash?.message).toBe('Network error');
    expect(result.current.isSaving).toBe(false);
  });

  it('handleSaveProfile shows fallback message when non-Error is thrown', async () => {
    mockUpdateProfile.mockRejectedValue('unexpected');
    const { result } = renderHook(() => useProfileForm());
    await act(async () => { await result.current.handleSaveProfile(); });
    expect(result.current.flash?.message).toBe('Failed to save');
  });

  it('handleLogout calls logout after confirmation', async () => {
    const { result } = renderHook(() => useProfileForm());
    act(() => result.current.handleLogout());
    expect(mockLogout).toHaveBeenCalled();
  });

  it('handleSendFeedback shows error when text is empty', async () => {
    const { result } = renderHook(() => useProfileForm());
    await act(async () => { await result.current.handleSendFeedback(); });
    expect(result.current.flash?.message).toBe('Please enter a message');
    expect(mockSubmitFeedback).not.toHaveBeenCalled();
  });

  it('handleSendFeedback calls submitFeedback with email', async () => {
    mockSubmitFeedback.mockResolvedValue(undefined);
    const { result } = renderHook(() => useProfileForm());
    act(() => result.current.setFeedbackText('Great app!'));
    await act(async () => { await result.current.handleSendFeedback(); });
    expect(mockSubmitFeedback).toHaveBeenCalledWith(
      'Great app!', 'other', 'alice@example.com',
    );
    expect(result.current.feedbackText).toBe('');
    expect(result.current.flash?.message).toBe('Feedback sent — thank you!');
  });

  it('handleSendFeedback shows error flash on API failure', async () => {
    mockSubmitFeedback.mockRejectedValue(new Error('Send failed'));
    const { result } = renderHook(() => useProfileForm());
    act(() => result.current.setFeedbackText('test'));
    await act(async () => { await result.current.handleSendFeedback(); });
    expect(result.current.flash?.message).toBe('Send failed');
    expect(result.current.isSendingFeedback).toBe(false);
  });

  it('handleSendFeedback shows fallback message when non-Error is thrown', async () => {
    mockSubmitFeedback.mockRejectedValue('unexpected');
    const { result } = renderHook(() => useProfileForm());
    act(() => result.current.setFeedbackText('test'));
    await act(async () => { await result.current.handleSendFeedback(); });
    expect(result.current.flash?.message).toBe('Failed to send feedback');
  });
});
