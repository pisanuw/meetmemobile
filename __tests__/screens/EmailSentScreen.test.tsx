import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';

const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace, back: jest.fn(), push: jest.fn() }),
  useLocalSearchParams: () => ({ email: 'alice@example.com' }),
}));

import EmailSentScreen from '@/app/(auth)/email-sent';

afterEach(() => jest.resetAllMocks());

describe('EmailSentScreen', () => {
  it('renders the check-your-email title', () => {
    render(<EmailSentScreen />);
    expect(screen.getByText('Check your email')).toBeTruthy();
  });

  it('shows the email address passed as a param', () => {
    render(<EmailSentScreen />);
    expect(screen.getByText('alice@example.com')).toBeTruthy();
  });

  it('shows the expiry hint', () => {
    render(<EmailSentScreen />);
    expect(screen.getByText(/15 minutes/)).toBeTruthy();
  });

  it('has a back-to-sign-in button', () => {
    render(<EmailSentScreen />);
    expect(screen.getByTestId('back-to-login-button')).toBeTruthy();
  });

  it('navigates to login when back button is pressed', () => {
    render(<EmailSentScreen />);
    fireEvent.press(screen.getByTestId('back-to-login-button'));
    expect(mockReplace).toHaveBeenCalledWith('/(auth)/login');
  });
});
