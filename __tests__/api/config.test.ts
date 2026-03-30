import { slotToTime, formatDate, getDateLabel, SLOTS_PER_DAY, SLOT_MINUTES } from '@/config';

describe('slotToTime()', () => {
  it('converts slot 0 to 12:00 AM', () => {
    expect(slotToTime(0)).toBe('12:00 AM');
  });

  it('converts slot 32 to 8:00 AM', () => {
    expect(slotToTime(32)).toBe('8:00 AM');
  });

  it('converts slot 48 to 12:00 PM', () => {
    expect(slotToTime(48)).toBe('12:00 PM');
  });

  it('converts slot 68 to 5:00 PM', () => {
    expect(slotToTime(68)).toBe('5:00 PM');
  });

  it('converts slot 79 to 7:45 PM', () => {
    expect(slotToTime(79)).toBe('7:45 PM');
  });

  it('converts slot 95 to 11:45 PM', () => {
    expect(slotToTime(95)).toBe('11:45 PM');
  });

  it('handles slot 36 (9:00 AM)', () => {
    expect(slotToTime(36)).toBe('9:00 AM');
  });

  it('handles slot 53 (1:15 PM)', () => {
    expect(slotToTime(53)).toBe('1:15 PM');
  });
});

describe('formatDate()', () => {
  it('formats an ISO date string to readable short format', () => {
    // 2024-06-10 is a Monday
    const result = formatDate('2024-06-10');
    expect(result).toContain('Jun');
    expect(result).toContain('10');
  });

  it('includes day of week abbreviation', () => {
    const result = formatDate('2024-06-10');
    expect(result).toMatch(/Mon|Tue|Wed|Thu|Fri|Sat|Sun/);
  });
});

describe('getDateLabel()', () => {
  it('returns the day name unchanged for weekly mode', () => {
    expect(getDateLabel('Mon', 'weekly')).toBe('Mon');
    expect(getDateLabel('Fri', 'weekly')).toBe('Fri');
  });

  it('formats the date for specific mode', () => {
    const result = getDateLabel('2024-06-10', 'specific');
    expect(result).toContain('Jun');
    expect(result).toContain('10');
  });
});

describe('Constants', () => {
  it('has 96 slots per day', () => {
    expect(SLOTS_PER_DAY).toBe(96);
  });

  it('has 15 minutes per slot', () => {
    expect(SLOT_MINUTES).toBe(15);
  });

  it('slots × minutes = 1440 (24h)', () => {
    expect(SLOTS_PER_DAY * SLOT_MINUTES).toBe(1440);
  });
});
