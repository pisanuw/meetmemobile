import React from 'react';
import { render, screen } from '@testing-library/react-native';

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: jest.fn(), push: jest.fn() }),
  useLocalSearchParams: () => ({}),
}));

import PrivacyScreen from '@/app/(tabs)/privacy';

describe('PrivacyScreen', () => {
  it('renders the Privacy Policy heading', () => {
    render(<PrivacyScreen />);
    expect(screen.getByText('Privacy Policy')).toBeTruthy();
  });

  it('shows all required sections', () => {
    render(<PrivacyScreen />);
    const sections = [
      'Overview',
      'Information We Collect',
      'How We Use Your Information',
      'Data Storage',
      'Data Sharing',
      'Data Retention',
      'Your Rights',
      'Contact',
    ];
    sections.forEach(section => {
      expect(screen.getByText(section)).toBeTruthy();
    });
  });

  it('mentions email as collected data', () => {
    render(<PrivacyScreen />);
    expect(screen.getByText(/Email address/)).toBeTruthy();
  });

  it('shows the contact email address', () => {
    render(<PrivacyScreen />);
    expect(screen.getAllByText(/privacy@meetme\.pisan\.me/).length).toBeGreaterThan(0);
  });

  it('mentions Google Calendar in the data collection section', () => {
    render(<PrivacyScreen />);
    expect(screen.getByText(/Google Calendar \(optional\)/)).toBeTruthy();
  });
});
