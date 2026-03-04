export function clamp(n: number, a: number, b: number): number {
  return Math.max(a, Math.min(b, n));
}

export function snapMs(ms: number, gridMs: number): number {
  return Math.round(ms / gridMs) * gridMs;
}

export function beatGridMs(tempoBpm: number, timeSig: { beats: number; beatValue: number }): number {
  const beatMs = 60000 / tempoBpm;
  // snap to one beat (not full measure)
  return beatMs * (4 / timeSig.beatValue);
}
