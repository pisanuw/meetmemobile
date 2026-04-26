import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';

const mockBack = jest.fn();
const mockReplace = jest.fn();

// Default params: magic-link mode with a URL
let mockParams: Record<string, string> = { mode: 'magic', url: 'https://meetme.pisan.me/api/auth/magic?token=abc' };
jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack, replace: mockReplace, push: jest.fn() }),
  useLocalSearchParams: () => mockParams,
}));

const mockOnAuthSuccess = jest.fn();
jest.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ onAuthSuccess: mockOnAuthSuccess }),
}));

import WebViewAuthScreen from '@/app/(auth)/webview-auth';

afterEach(() => {
  jest.resetAllMocks();
  mockParams = { mode: 'magic', url: 'https://meetme.pisan.me/api/auth/magic?token=abc' };
});

describe('WebViewAuthScreen', () => {
  it('renders the webview', () => {
    render(<WebViewAuthScreen />);
    expect(screen.getByTestId('auth-webview')).toBeTruthy();
  });

  it('renders close button', () => {
    render(<WebViewAuthScreen />);
    expect(screen.getByTestId('webview-close')).toBeTruthy();
  });

  it('shows "Sign in with Google" header for google mode', () => {
    mockParams = { mode: 'google' };
    render(<WebViewAuthScreen />);
    expect(screen.getByText('Sign in with Google')).toBeTruthy();
  });

  it('shows "Signing in…" header for magic mode', () => {
    mockParams = { mode: 'magic', url: 'https://meetme.pisan.me/api/auth/magic?token=abc' };
    render(<WebViewAuthScreen />);
    expect(screen.getByText('Signing in…')).toBeTruthy();
  });

  it('calls router.back() when close is pressed', () => {
    render(<WebViewAuthScreen />);
    fireEvent.press(screen.getByTestId('webview-close'));
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it('loads the Google OAuth URL in google mode', () => {
    mockParams = { mode: 'google' };
    render(<WebViewAuthScreen />);
    const webview = screen.getByTestId('auth-webview');
    expect(webview.props.source.uri).toContain('/api/auth/google');
  });

  it('loads the deep-link URL in magic mode', () => {
    const magicUrl = 'https://meetme.pisan.me/api/auth/magic?token=xyz';
    mockParams = { mode: 'magic', url: magicUrl };
    render(<WebViewAuthScreen />);
    const webview = screen.getByTestId('auth-webview');
    expect(webview.props.source.uri).toBe(magicUrl);
  });

  it('calls onAuthSuccess when navigation reaches /dashboard.html', async () => {
    mockOnAuthSuccess.mockResolvedValue(undefined);
    render(<WebViewAuthScreen />);
    const webview = screen.getByTestId('auth-webview');
    await waitFor(() => {
      webview.props.onNavigationStateChange({
        url: 'https://meetme.pisan.me/dashboard.html',
        loading: false,
        title: '',
        canGoBack: false,
        canGoForward: false,
        navigationType: 'other',
      });
    });
    expect(mockOnAuthSuccess).toHaveBeenCalledTimes(1);
  });

  it('calls onAuthSuccess when navigation reaches /dashboard', async () => {
    mockOnAuthSuccess.mockResolvedValue(undefined);
    render(<WebViewAuthScreen />);
    const webview = screen.getByTestId('auth-webview');
    await waitFor(() => {
      webview.props.onNavigationStateChange({
        url: 'https://meetme.pisan.me/dashboard',
        loading: false,
        title: '',
        canGoBack: false,
        canGoForward: false,
        navigationType: 'other',
      });
    });
    expect(mockOnAuthSuccess).toHaveBeenCalledTimes(1);
  });

  it('does not call onAuthSuccess for non-dashboard pages', async () => {
    render(<WebViewAuthScreen />);
    const webview = screen.getByTestId('auth-webview');
    await waitFor(() => {
      webview.props.onNavigationStateChange({
        url: 'https://meetme.pisan.me/api/auth/magic?token=abc',
        loading: true,
        title: '',
        canGoBack: false,
        canGoForward: false,
        navigationType: 'other',
      });
    });
    expect(mockOnAuthSuccess).not.toHaveBeenCalled();
  });
});
