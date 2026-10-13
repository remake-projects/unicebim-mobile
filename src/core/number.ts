/**
 * Convert unknown input (e.g. Postgres `numeric`, which PostgREST may serialize as a string)
 * to a finite number, or null.
 */
export function toFiniteNumber(value: unknown): number | null {
  if (value == null || value === '') return null;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

/** Like toFiniteNumber but falls back to 0. */
export function toNumberOrZero(value: unknown): number {
  return toFiniteNumber(value) ?? 0;
}

/** Round to cents to avoid floating point drift when summing money. */
export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
