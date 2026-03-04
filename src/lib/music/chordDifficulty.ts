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

/**
 * Convenience wrapper that scores a `ChordVoicing` (from @/types) directly.
 * Reads the `barre` tag from `voicing.tags` to apply the barre penalty.
 */
export function chordVoicingDifficulty(voicing: {
  frets: (number | -1)[];
  fingers?: (number | null)[];
  tags?: string[];
}): "easy" | "medium" | "advanced" {
  return difficultyTier(
    scoreVoicing({
      frets: voicing.frets as number[],
      fingers: voicing.fingers?.map(f => f ?? 0),
      barre: voicing.tags?.includes("barre")
        ? { fret: 1, fromString: 0, toString: 5 }
        : undefined,
    }),
  );
}
