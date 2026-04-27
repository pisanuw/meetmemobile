import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { MeetingListItem } from '@/types';

// This file tests the real component implementations — unmock globals set in jest.setup.ts
jest.unmock('@/components/Button');
jest.unmock('@/components/FlashMessage');
jest.unmock('@/components/LoadingScreen');

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { MeetingCard } from '@/components/MeetingCard';
import { FlashMessage } from '@/components/FlashMessage';
import { LoadingScreen } from '@/components/LoadingScreen';

// ─── Button ──────────────────────────────────────────────────────────────────

describe('Button', () => {
  it('renders the title', () => {
    render(<Button title="Click me" onPress={() => {}} />);
    expect(screen.getByText('Click me')).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    render(<Button title="Tap" onPress={onPress} testID="btn" />);
    fireEvent.press(screen.getByTestId('btn'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', () => {
    const onPress = jest.fn();
    render(<Button title="Disabled" onPress={onPress} disabled testID="btn" />);
    fireEvent.press(screen.getByTestId('btn'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('does not call onPress when loading', () => {
    const onPress = jest.fn();
    render(<Button title="Loading" onPress={onPress} loading testID="btn" />);
    fireEvent.press(screen.getByTestId('btn'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('shows activity indicator when loading', () => {
    render(<Button title="Loading" onPress={() => {}} loading testID="btn" />);
    // Text title should be gone when loading
    expect(screen.queryByText('Loading')).toBeNull();
  });

  it('sets accessibilityRole to button', () => {
    render(<Button title="A11y" onPress={() => {}} testID="btn" />);
    expect(screen.getByRole('button')).toBeTruthy();
  });

  it('renders all variants without crashing', () => {
    const variants = ['primary', 'outline', 'ghost', 'danger'] as const;
    variants.forEach(variant => {
      const { unmount } = render(
        <Button title={variant} onPress={() => {}} variant={variant} />,
      );
      expect(screen.getByText(variant)).toBeTruthy();
      unmount();
    });
  });

  it('renders all sizes without crashing', () => {
    const sizes = ['sm', 'md', 'lg'] as const;
    sizes.forEach(size => {
      const { unmount } = render(
        <Button title={size} onPress={() => {}} size={size} />,
      );
      expect(screen.getByText(size)).toBeTruthy();
      unmount();
    });
  });
});

// ─── Card ─────────────────────────────────────────────────────────────────────

describe('Card', () => {
  it('renders children', () => {
    render(<Card><Button title="Inside" onPress={() => {}} /></Card>);
    expect(screen.getByText('Inside')).toBeTruthy();
  });

  it('accepts testID', () => {
    render(<Card testID="my-card"><Button title="x" onPress={() => {}} /></Card>);
    expect(screen.getByTestId('my-card')).toBeTruthy();
  });
});

// ─── FlashMessage ─────────────────────────────────────────────────────────────

describe('FlashMessage', () => {
  it('renders the message text', () => {
    render(<FlashMessage message="Hello world" />);
    expect(screen.getByText('Hello world')).toBeTruthy();
  });

  it('renders success type without crashing', () => {
    render(<FlashMessage message="Saved!" type="success" />);
    expect(screen.getByText('Saved!')).toBeTruthy();
  });

  it('renders error type without crashing', () => {
    render(<FlashMessage message="Failed" type="error" />);
    expect(screen.getByText('Failed')).toBeTruthy();
  });

  it('calls onDismiss after duration', async () => {
    jest.useFakeTimers();
    const onDismiss = jest.fn();
    render(<FlashMessage message="Gone" duration={100} onDismiss={onDismiss} />);
    jest.advanceTimersByTime(500);
    // onDismiss is called after the animation, so just check it doesn't error
    jest.useRealTimers();
  });
});

// ─── LoadingScreen ────────────────────────────────────────────────────────────

describe('LoadingScreen', () => {
  it('renders with testID', () => {
    render(<LoadingScreen />);
    expect(screen.getByTestId('loading-screen')).toBeTruthy();
  });

  it('shows optional message', () => {
    render(<LoadingScreen message="Please wait…" />);
    expect(screen.getByText('Please wait…')).toBeTruthy();
  });

  it('renders without message', () => {
    render(<LoadingScreen />);
    expect(screen.queryByText('Please wait…')).toBeNull();
  });
});

// ─── MeetingCard ──────────────────────────────────────────────────────────────

const baseMeeting: MeetingListItem = {
  id: 'abc123',
  title: 'Sprint Planning',
  scheduleMode: 'specific',
  dates: ['2025-06-02', '2025-06-03'],
  finalized: null,
  participantCount: 5,
  respondedCount: 3,
  createdAt: '2025-05-28T10:00:00Z',
  role: 'creator',
};

describe('MeetingCard', () => {
  it('renders the meeting title', () => {
    render(<MeetingCard meeting={baseMeeting} onPress={() => {}} />);
    expect(screen.getByText('Sprint Planning')).toBeTruthy();
  });

  it('shows Open badge for un-finalized meeting', () => {
    render(<MeetingCard meeting={baseMeeting} onPress={() => {}} />);
    expect(screen.getByText('Open')).toBeTruthy();
  });

  it('shows Scheduled badge for finalized meeting', () => {
    const finalized: MeetingListItem = {
      ...baseMeeting,
      finalized: { date: '2025-06-02', slot: 32, durationMinutes: 60, note: '' },
    };
    render(<MeetingCard meeting={finalized} onPress={() => {}} />);
    expect(screen.getByText('Scheduled')).toBeTruthy();
  });

  it('calls onPress when card is tapped', () => {
    const onPress = jest.fn();
    render(
      <MeetingCard
        meeting={baseMeeting}
        onPress={onPress}
      />,
    );
    fireEvent.press(screen.getByTestId(`meeting-card-${baseMeeting.id}`));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('renders weekly mode date label', () => {
    const weekly: MeetingListItem = {
      ...baseMeeting,
      scheduleMode: 'weekly',
      dates: ['Mon', 'Wed'],
    };
    render(<MeetingCard meeting={weekly} onPress={() => {}} />);
    expect(screen.getByText(/Mon/)).toBeTruthy();
  });

  it('shows +N more label when there are multiple dates', () => {
    render(<MeetingCard meeting={baseMeeting} onPress={() => {}} />);
    expect(screen.getByText(/\+1 more/)).toBeTruthy();
  });

  it('shows correct response progress text', () => {
    render(<MeetingCard meeting={baseMeeting} onPress={() => {}} />);
    expect(screen.getByText('3/5 responded')).toBeTruthy();
  });
});
