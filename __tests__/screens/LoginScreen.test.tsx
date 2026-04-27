import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native';
import LoginScreen from '@/app/(auth)/login';

// Mock API
jest.mock('@/api/auth', () => ({
  sendMagicLink: jest.fn(),
}));

// Mock expo-web-browser — must use jest.fn() inside factory (mock is hoisted before variables)
jest.mock('expo-web-browser', () => ({
  openAuthSessionAsync: jest.fn(),
}));

// Mock AuthContext
const mockOnAuthSuccess = jest.fn();
jest.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ onAuthSuccess: mockOnAuthSuccess }),
}));

// Mock router
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => ({}),
}));

import * as authApi from '@/api/auth';
import * as WebBrowser from 'expo-web-browser';

const mockSendMagicLink = authApi.sendMagicLink as jest.Mock;
const mockOpenAuthSession = WebBrowser.openAuthSessionAsync as jest.Mock;

afterEach(() => {
  jest.resetAllMocks();
  mockPush.mockReset();
});

describe('LoginScreen', () => {
  it('renders email input and send button', () => {
    render(<LoginScreen />);
    expect(screen.getByTestId('email-input')).toBeTruthy();
    expect(screen.getByTestId('send-link-button')).toBeTruthy();
  });

  it('renders Google sign-in button', () => {
    render(<LoginScreen />);
    expect(screen.getByTestId('google-signin-button')).toBeTruthy();
  });

  it('send button is disabled when email is empty', () => {
    render(<LoginScreen />);
    const btn = screen.getByTestId('send-link-button');
    expect(btn.props.accessibilityState?.disabled).toBe(true);
  });

  it('send button is disabled for an invalid email', () => {
    render(<LoginScreen />);
    fireEvent.changeText(screen.getByTestId('email-input'), 'notanemail');
    const btn = screen.getByTestId('send-link-button');
    expect(btn.props.accessibilityState?.disabled).toBe(true);
  });

  it('send button is enabled for a valid email', () => {
    render(<LoginScreen />);
    fireEvent.changeText(screen.getByTestId('email-input'), 'alice@example.com');
    const btn = screen.getByTestId('send-link-button');
    expect(btn.props.accessibilityState?.disabled).toBe(false);
  });

  it('calls sendMagicLink and navigates to email-sent on success', async () => {
    mockSendMagicLink.mockResolvedValue({ message: 'sent' });
    render(<LoginScreen />);

    fireEvent.changeText(screen.getByTestId('email-input'), 'alice@example.com');
    fireEvent.press(screen.getByTestId('send-link-button'));

    await waitFor(() => {
      expect(mockSendMagicLink).toHaveBeenCalledWith('alice@example.com');
      expect(mockPush).toHaveBeenCalledWith(
        expect.objectContaining({ pathname: '/(auth)/email-sent' }),
      );
    });
  });

  it('shows error flash on API failure', async () => {
    mockSendMagicLink.mockRejectedValue(new Error('Rate limited'));
    render(<LoginScreen />);

    fireEvent.changeText(screen.getByTestId('email-input'), 'alice@example.com');
    fireEvent.press(screen.getByTestId('send-link-button'));

    await waitFor(() => {
      expect(screen.getByText('Rate limited')).toBeTruthy();
    });
  });

  it('opens ASWebAuthenticationSession on Google button press', async () => {
    mockOpenAuthSession.mockResolvedValue({ type: 'success', url: 'meetme://auth/google/done' });
    mockOnAuthSuccess.mockResolvedValue(undefined);
    render(<LoginScreen />);

    await act(async () => {
      fireEvent.press(screen.getByTestId('google-signin-button'));
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(mockOpenAuthSession).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/google/start?mobile=1'),
        'meetme://',
      );
    });
    expect(mockOnAuthSuccess).toHaveBeenCalled();
  });

  it('does not call onAuthSuccess when Google auth is cancelled', async () => {
    mockOpenAuthSession.mockResolvedValue({ type: 'cancel' });
    render(<LoginScreen />);

    await act(async () => {
      fireEvent.press(screen.getByTestId('google-signin-button'));
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(mockOpenAuthSession).toHaveBeenCalled();
    });
    expect(mockOnAuthSuccess).not.toHaveBeenCalled();
  });

  it('trims and lowercases email before sending', async () => {
    mockSendMagicLink.mockResolvedValue({ message: 'sent' });
    render(<LoginScreen />);

    fireEvent.changeText(screen.getByTestId('email-input'), '  ALICE@EXAMPLE.COM  ');
    fireEvent.press(screen.getByTestId('send-link-button'));

    await waitFor(() => {
      expect(mockSendMagicLink).toHaveBeenCalledWith('alice@example.com');
    });
  });
});
