import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { AvailabilityGrid } from '@/components/AvailabilityGrid';
import { TimeSlot } from '@/types';

jest.unmock('@/components/AvailabilityGrid');

const DATES = ['2024-03-11', '2024-03-12'];
// slot 32 = 32 * 15 min = 480 min = 8:00 AM  →  slotToTime(32) === "8:00 AM"
const START_SLOT = 32; // 8:00 AM
const END_SLOT = 36;   // 9:00 AM — 4 slots

function makeSlot(date: string, slot: number): TimeSlot {
  return { date, slot };
}

describe('AvailabilityGrid', () => {
  it('renders date columns for each date', () => {
    const onChange = jest.fn();
    render(
      <AvailabilityGrid
        dates={DATES}
        startSlot={START_SLOT}
        endSlot={END_SLOT}
        scheduleMode="specific"
        initialSlots={[]}
        onChange={onChange}
      />,
    );
    // Both MM-DD date headers should appear (specific mode slices off year prefix)
    expect(screen.getByText('03-11')).toBeTruthy();
    expect(screen.getByText('03-12')).toBeTruthy();
  });

  it('renders full date label when scheduleMode is weekly', () => {
    const onChange = jest.fn();
    render(
      <AvailabilityGrid
        dates={['Monday', 'Tuesday']}
        startSlot={START_SLOT}
        endSlot={END_SLOT}
        scheduleMode="weekly"
        initialSlots={[]}
        onChange={onChange}
      />,
    );
    expect(screen.getByText('Monday')).toBeTruthy();
    expect(screen.getByText('Tuesday')).toBeTruthy();
  });

  it('shows 0 slots selected summary initially', () => {
    const onChange = jest.fn();
    render(
      <AvailabilityGrid
        dates={DATES}
        startSlot={START_SLOT}
        endSlot={END_SLOT}
        scheduleMode="specific"
        initialSlots={[]}
        onChange={onChange}
      />,
    );
    expect(screen.getByText('0 slots selected')).toBeTruthy();
  });

  it('shows hours in summary when slots are selected', () => {
    const onChange = jest.fn();
    // 4 slots × 15 min = 60 min = 1.0h
    const initialSlots = [
      makeSlot('2024-03-11', 32),
      makeSlot('2024-03-11', 33),
      makeSlot('2024-03-11', 34),
      makeSlot('2024-03-11', 35),
    ];
    render(
      <AvailabilityGrid
        dates={DATES}
        startSlot={START_SLOT}
        endSlot={END_SLOT}
        scheduleMode="specific"
        initialSlots={initialSlots}
        onChange={onChange}
      />,
    );
    expect(screen.getByText('4 slots selected (1h)')).toBeTruthy();
  });

  it('uses singular "slot" when exactly 1 slot selected', () => {
    const onChange = jest.fn();
    render(
      <AvailabilityGrid
        dates={DATES}
        startSlot={START_SLOT}
        endSlot={END_SLOT}
        scheduleMode="specific"
        initialSlots={[makeSlot('2024-03-11', 32)]}
        onChange={onChange}
      />,
    );
    expect(screen.getByText(/^1 slot selected/)).toBeTruthy();
  });

  it('adds a slot when an unselected cell is pressed', () => {
    const onChange = jest.fn();
    render(
      <AvailabilityGrid
        dates={DATES}
        startSlot={START_SLOT}
        endSlot={END_SLOT}
        scheduleMode="specific"
        initialSlots={[]}
        onChange={onChange}
      />,
    );

    // slot 32 = 8:00 AM  →  slotToTime(32) === "8:00 AM"
    const cell = screen.getByLabelText(`8:00 AM on 2024-03-11: unavailable`);
    fireEvent.press(cell);

    expect(onChange).toHaveBeenCalledTimes(1);
    const slots: TimeSlot[] = onChange.mock.calls[0][0];
    expect(slots).toContainEqual({ date: '2024-03-11', slot: 32 });
  });

  it('removes a slot when an already-selected cell is pressed', () => {
    const onChange = jest.fn();
    render(
      <AvailabilityGrid
        dates={DATES}
        startSlot={START_SLOT}
        endSlot={END_SLOT}
        scheduleMode="specific"
        initialSlots={[makeSlot('2024-03-11', 32)]}
        onChange={onChange}
      />,
    );

    const cell = screen.getByLabelText(`8:00 AM on 2024-03-11: available`);
    fireEvent.press(cell);

    expect(onChange).toHaveBeenCalledTimes(1);
    const slots: TimeSlot[] = onChange.mock.calls[0][0];
    expect(slots).not.toContainEqual({ date: '2024-03-11', slot: 32 });
  });

  it('toggling does not affect other selected slots', () => {
    const onChange = jest.fn();
    render(
      <AvailabilityGrid
        dates={DATES}
        startSlot={START_SLOT}
        endSlot={END_SLOT}
        scheduleMode="specific"
        initialSlots={[makeSlot('2024-03-11', 32), makeSlot('2024-03-11', 33)]}
        onChange={onChange}
      />,
    );

    // Deselect slot 32; slot 33 should remain
    const cell = screen.getByLabelText(`8:00 AM on 2024-03-11: available`);
    fireEvent.press(cell);

    const slots: TimeSlot[] = onChange.mock.calls[0][0];
    expect(slots).toContainEqual({ date: '2024-03-11', slot: 33 });
    expect(slots).not.toContainEqual({ date: '2024-03-11', slot: 32 });
  });

  it('cells at slot%4===0 positions are rendered (hour marker)', () => {
    const onChange = jest.fn();
    // slot 32 % 4 === 0 → hour marker cell; slotToTime(32) === "8:00 AM"
    render(
      <AvailabilityGrid
        dates={DATES}
        startSlot={32}
        endSlot={36}
        scheduleMode="specific"
        initialSlots={[]}
        onChange={onChange}
      />,
    );
    const cell = screen.getByLabelText(`8:00 AM on 2024-03-11: unavailable`);
    expect(cell).toBeTruthy();
  });
});
