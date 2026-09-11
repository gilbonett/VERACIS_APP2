/**
 * Time constants and helpers.
 *
 * Different libraries expect different units for the "same" concept of time:
 *  - BullMQ `delay` / `lockDuration` / timers      → milliseconds
 *  - JWT `expiresIn`, cache-manager `ttl`, Redis `EXPIRE` → seconds
 *  - `setTimeout` / `setInterval`                  → milliseconds
 *
 * Instead of scattering `45 * 60 * 1000` (or forgetting to convert to seconds
 * somewhere else), centralize the base unit here and derive whichever unit a
 * given API expects from a single source of truth.
 *
 * Usage:
 *   import { minutes, MS, SECONDS, msToSeconds } from '@/shared/constants/time.constants';
 *
 *   // BullMQ (expects ms)
 *   await queue.add('job', data, { delay: minutes(45) });
 *
 *   // cache-manager / Redis (expects seconds)
 *   await cache.set(key, value, { ttl: msToSeconds(minutes(45)) });
 *
 *   // Raw lookup table, if you prefer constants over function calls
 *   const fiveMinutesMs = 5 * MS.MINUTE;
 */

/** Base unit lookup table, in milliseconds. */
export const MS = {
  MILLISECOND: 1,
  SECOND: 1_000,
  MINUTE: 60 * 1_000,
  HOUR: 60 * 60 * 1_000,
  DAY: 24 * 60 * 60 * 1_000,
  WEEK: 7 * 24 * 60 * 60 * 1_000,
} as const;

/** Base unit lookup table, in seconds — for APIs that expect seconds (JWT, Redis TTL, cache-manager). */
export const SECONDS = {
  SECOND: 1,
  MINUTE: 60,
  HOUR: 60 * 60,
  DAY: 24 * 60 * 60,
  WEEK: 7 * 24 * 60 * 60,
} as const;

/** Converts a millisecond duration to whole seconds (rounded down). */
export function msToSeconds(ms: number): number {
  return Math.floor(ms / MS.SECOND);
}

/** Converts a second duration to milliseconds. */
export function secondsToMs(value: number): number {
  return value * MS.SECOND;
}

export function milliseconds(value: number): number {
  return value;
}

export function seconds(value: number): number {
  return value * MS.SECOND;
}

export function minutes(value: number): number {
  return value * MS.MINUTE;
}

export function hours(value: number): number {
  return value * MS.HOUR;
}

export function days(value: number): number {
  return value * MS.DAY;
}

export function weeks(value: number): number {
  return value * MS.WEEK;
}
