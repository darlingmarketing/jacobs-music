export type Voicing = {
  /** Fret numbers per string; -1 = muted, 0 = open */
  frets: number[];
  /** Finger numbers per string; 0 = open/muted */
  fingers?: (number | null)[];
  barre?: { fret: number; fromString: number; toString: number };
};

/** Lower score = easier. */
export function scoreVoicing(v: Voicing): number {
  const frets = v.frets.filter(f => f >= 0);
  const muted = v.frets.filter(f => f < 0).length;
  const opens = v.frets.filter(f => f === 0).length;

  const maxF = frets.length ? Math.max(...frets) : 0;
  const playedFrets = frets.filter(f => f > 0);
  const minF = playedFrets.length ? Math.min(...playedFrets) : 0;
  const span = Math.max(0, maxF - minF);

  const fingerCount =
    (v.fingers?.filter(x => x != null && (x as number) > 0).length) ??
    playedFrets.length;
  const hasBarre = !!v.barre;

  let score = 0;
  score += span * 1.2;
  score += fingerCount * 1.0;
  score += hasBarre ? 2.5 : 0;
  score += muted * 0.3;
  score -= opens * 0.6;
  score += Math.max(0, minF - 1) * 0.4;

  return score;
}

export function difficultyTier(score: number): "easy" | "medium" | "advanced" {
  if (score <= 3.5) return "easy";
  if (score <= 7.0) return "medium";
  return "advanced";
}
