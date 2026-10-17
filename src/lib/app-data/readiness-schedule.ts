export const READINESS_PROBE_DELAYS_MS = [1_000, 2_000, 3_000, 5_000] as const;

export const READINESS_PROBE_MAX_TOTAL_MS = 3 * 60_000;

export function readinessProbeDelayMs(attempt: number): number {
  const idx = Math.max(0, Math.min(attempt, READINESS_PROBE_DELAYS_MS.length - 1));
  return READINESS_PROBE_DELAYS_MS[idx]!;
}

export function readinessProbeExhausted(startedAt: number, now: number): boolean {
  return now - startedAt >= READINESS_PROBE_MAX_TOTAL_MS;
}
