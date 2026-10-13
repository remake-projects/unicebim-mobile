import { describe, expect, it } from 'vitest';

import {
  addDays,
  addMonths,
  currentYearMonth,
  daysBetween,
  isYmd,
  isoWeekday,
  monthRange,
  remainingDaysInMonth,
  startOfIsoWeek,
  todayYmd,
  transactionInstantForDate,
  ymdInZone,
} from './time';

describe('today / month in a time zone', () => {
  // 2026-01-31 22:30 UTC is already Feb 1st in Istanbul (UTC+3) but still Jan 31st in New York.
  const now = new Date('2026-01-31T22:30:00Z');

  it('uses the user time zone, not UTC', () => {
    expect(todayYmd('Europe/Istanbul', now)).toBe('2026-02-01');
    expect(todayYmd('America/New_York', now)).toBe('2026-01-31');
    expect(currentYearMonth('Europe/Istanbul', now)).toBe('2026-02');
    expect(currentYearMonth('UTC', now)).toBe('2026-01');
  });

  it('builds month ranges at local midnight', () => {
    const r = monthRange('2026-02', 'Europe/Istanbul');
    expect(r.start.toISOString()).toBe('2026-01-31T21:00:00.000Z');
    expect(r.end.toISOString()).toBe('2026-02-28T21:00:00.000Z');
  });

  it('handles DST transitions', () => {
    // New York switches to DST on 2026-03-08.
    const r = monthRange('2026-03', 'America/New_York');
    expect(r.start.toISOString()).toBe('2026-03-01T05:00:00.000Z');
    expect(r.end.toISOString()).toBe('2026-04-01T04:00:00.000Z');
  });

  it('reads the calendar date of an instant', () => {
    expect(ymdInZone('2026-05-10T23:30:00Z', 'Asia/Tokyo')).toBe('2026-05-11');
  });
});

describe('calendar math', () => {
  it('adds months across years', () => {
    expect(addMonths('2026-01', -1)).toBe('2025-12');
    expect(addMonths('2025-11', 3)).toBe('2026-02');
  });

  it('adds days and counts days between dates', () => {
    expect(addDays('2026-02-28', 1)).toBe('2026-03-01');
    expect(daysBetween('2026-02-27', '2026-03-02')).toBe(3);
    expect(daysBetween('2026-03-02', '2026-02-27')).toBe(-3);
  });

  it('computes ISO weeks', () => {
    expect(isoWeekday('2026-10-13')).toBe(2); // Tuesday
    expect(startOfIsoWeek('2026-10-18')).toBe('2026-10-12');
  });

  it('counts remaining days including today', () => {
    expect(remainingDaysInMonth('2026-01-13')).toBe(19);
    expect(remainingDaysInMonth('2026-01-31')).toBe(1);
  });

  it('validates dates', () => {
    expect(isYmd('2026-02-29')).toBe(false);
    expect(isYmd('2028-02-29')).toBe(true);
    expect(isYmd('2026-13-01')).toBe(false);
  });
});

describe('transactionInstantForDate', () => {
  const now = new Date('2026-10-13T08:15:00Z');

  it('keeps the current instant for today', () => {
    expect(transactionInstantForDate('2026-10-13', 'Europe/Istanbul', now)).toBe(now);
  });

  it('uses local noon for other days', () => {
    expect(transactionInstantForDate('2026-10-01', 'Europe/Istanbul', now).toISOString()).toBe(
      '2026-10-01T09:00:00.000Z'
    );
  });
});
