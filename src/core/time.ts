/**
 * Time-zone aware calendar helpers.
 *
 * Conventions:
 * - Instants are `Date` / ISO strings (stored as `timestamptz`).
 * - Calendar dates are `YYYY-MM-DD` strings and months `YYYY-MM`; they are compared as
 *   strings or via pure calendar math, never by turning them into local `Date`s.
 * - "Today" / "this month" always depend on the user's IANA time zone.
 */

export type Ymd = string; // YYYY-MM-DD
export type YearMonth = string; // YYYY-MM

export type MonthRange = {
  ym: YearMonth;
  /** Inclusive start instant (first day 00:00 in the time zone). */
  start: Date;
  /** Exclusive end instant (first day of next month 00:00 in the time zone). */
  end: Date;
};

type WallClock = { year: number; month: number; day: number; hour: number; minute: number; second: number };

const MS_PER_DAY = 86_400_000;
const formatterCache = new Map<string, Intl.DateTimeFormat>();

function formatterFor(timeZone: string): Intl.DateTimeFormat {
  let f = formatterCache.get(timeZone);
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    formatterCache.set(timeZone, f);
  }
  return f;
}

export function isValidTimeZone(timeZone: string): boolean {
  try {
    formatterFor(timeZone);
    return true;
  } catch {
    return false;
  }
}

function wallClockAt(instant: Date, timeZone: string): WallClock {
  const parts: Record<string, number> = {};
  for (const p of formatterFor(timeZone).formatToParts(instant)) {
    if (p.type !== 'literal') parts[p.type] = Number(p.value);
  }
  return {
    year: parts.year!,
    month: parts.month!,
    day: parts.day!,
    hour: parts.hour! % 24,
    minute: parts.minute!,
    second: parts.second!,
  };
}

function offsetMs(instant: Date, timeZone: string): number {
  const w = wallClockAt(instant, timeZone);
  const asUtc = Date.UTC(w.year, w.month - 1, w.day, w.hour, w.minute, w.second);
  return asUtc - Math.floor(instant.getTime() / 1000) * 1000;
}

/** The instant at which the wall clock in `timeZone` shows the given time. */
export function zonedWallClockToInstant(w: WallClock, timeZone: string): Date {
  const guess = Date.UTC(w.year, w.month - 1, w.day, w.hour, w.minute, w.second);
  let instant = guess - offsetMs(new Date(guess), timeZone);
  // Re-check once: the offset can differ on the other side of a DST transition.
  const corrected = guess - offsetMs(new Date(instant), timeZone);
  if (corrected !== instant) instant = corrected;
  return new Date(instant);
}

const pad = (n: number, len = 2) => String(n).padStart(len, '0');

function toYmd(year: number, month: number, day: number): Ymd {
  return `${pad(year, 4)}-${pad(month)}-${pad(day)}`;
}

export function isYmd(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number) as [number, number, number];
  return m >= 1 && m <= 12 && d >= 1 && d <= daysInMonth(y, m);
}

export function isYearMonth(value: string): boolean {
  if (!/^\d{4}-\d{2}$/.test(value)) return false;
  const m = Number(value.slice(5, 7));
  return m >= 1 && m <= 12;
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** Calendar date of `instant` in `timeZone`. */
export function ymdInZone(instant: Date | string, timeZone: string): Ymd {
  const w = wallClockAt(typeof instant === 'string' ? new Date(instant) : instant, timeZone);
  return toYmd(w.year, w.month, w.day);
}

export function todayYmd(timeZone: string, now: Date = new Date()): Ymd {
  return ymdInZone(now, timeZone);
}

export function currentYearMonth(timeZone: string, now: Date = new Date()): YearMonth {
  return todayYmd(timeZone, now).slice(0, 7);
}

export function addMonths(ym: YearMonth, delta: number): YearMonth {
  const y = Number(ym.slice(0, 4));
  const m = Number(ym.slice(5, 7)) - 1 + delta;
  const year = y + Math.floor(m / 12);
  const month = ((m % 12) + 12) % 12;
  return `${pad(year, 4)}-${pad(month + 1)}`;
}

/** Same day of the month `delta` months later, clamped to that month's last day (Jan 31 + 1 → Feb 28). */
export function addMonthsToYmd(ymd: Ymd, delta: number): Ymd {
  const [year, month] = addMonths(ymd.slice(0, 7), delta).split('-').map(Number) as [number, number];
  return toYmd(year, month, Math.min(Number(ymd.slice(8, 10)), daysInMonth(year, month)));
}

export function addDays(ymd: Ymd, delta: number): Ymd {
  const d = new Date(ymdToUtcMs(ymd) + delta * MS_PER_DAY);
  return toYmd(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
}

function ymdToUtcMs(ymd: Ymd): number {
  const [y, m, d] = ymd.split('-').map(Number) as [number, number, number];
  return Date.UTC(y, m - 1, d);
}

/** Whole calendar days from `from` to `to` (negative if `to` is earlier). */
export function daysBetween(from: Ymd, to: Ymd): number {
  return Math.round((ymdToUtcMs(to) - ymdToUtcMs(from)) / MS_PER_DAY);
}

/** ISO weekday: 1 = Monday … 7 = Sunday. */
export function isoWeekday(ymd: Ymd): number {
  const day = new Date(ymdToUtcMs(ymd)).getUTCDay();
  return day === 0 ? 7 : day;
}

/** Monday of the week containing `ymd`. */
export function startOfIsoWeek(ymd: Ymd): Ymd {
  return addDays(ymd, 1 - isoWeekday(ymd));
}

export function startOfDayInstant(ymd: Ymd, timeZone: string): Date {
  const [year, month, day] = ymd.split('-').map(Number) as [number, number, number];
  return zonedWallClockToInstant({ year, month, day, hour: 0, minute: 0, second: 0 }, timeZone);
}

export function monthRange(ym: YearMonth, timeZone: string): MonthRange {
  return {
    ym,
    start: startOfDayInstant(`${ym}-01`, timeZone),
    end: startOfDayInstant(`${addMonths(ym, 1)}-01`, timeZone),
  };
}

/** Days left in the current month including today (≥ 1). */
export function remainingDaysInMonth(today: Ymd): number {
  const [y, m, d] = today.split('-').map(Number) as [number, number, number];
  return Math.max(1, daysInMonth(y, m) - d + 1);
}

/**
 * Timestamp to store for a transaction the user dated `ymd`:
 * the current instant when it is today, otherwise local noon of that day
 * (noon keeps the entry on the same calendar day across DST shifts).
 */
export function transactionInstantForDate(ymd: Ymd, timeZone: string, now: Date = new Date()): Date {
  if (ymd === todayYmd(timeZone, now)) return now;
  const [year, month, day] = ymd.split('-').map(Number) as [number, number, number];
  return zonedWallClockToInstant({ year, month, day, hour: 12, minute: 0, second: 0 }, timeZone);
}

/**
 * Display a calendar date. The date is formatted as-is (no time-zone shift), so a
 * `YYYY-MM-DD` always shows the same day on every device.
 */
export function formatYmd(ymd: Ymd, locale: string, options: Intl.DateTimeFormatOptions = { dateStyle: 'medium' }): string {
  return new Intl.DateTimeFormat(locale, { ...options, timeZone: 'UTC' }).format(new Date(ymdToUtcMs(ymd)));
}

/** Display a month, e.g. "October 2026" / "Ekim 2026". */
export function formatYearMonth(ym: YearMonth, locale: string): string {
  return formatYmd(`${ym}-01`, locale, { month: 'long', year: 'numeric' });
}
