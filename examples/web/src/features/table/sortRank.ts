/**
 * TanStack Table only treats `undefined` as unranked for `sortUndefined`.
 * `null` goes through the comparator and flips to the top when sort is desc.
 */
export function rankOrUndefined(value: number | null | undefined): number | undefined {
  if (value == null || Number.isNaN(value)) return undefined;
  return value;
}

/** Sensor totals of 0 are unranked (no measured modules). */
export function sensorTotalOrUndefined(value: number | null | undefined): number | undefined {
  if (value == null || Number.isNaN(value) || value <= 0) return undefined;
  return value;
}
