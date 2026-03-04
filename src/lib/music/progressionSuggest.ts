import { normalizeNote, transposeNote, type NoteName } from "./notes";

// Diatonic intervals for major and natural minor
const MAJOR_INTERVALS = [0, 2, 4, 5, 7, 9, 11];
const MINOR_INTERVALS = [0, 2, 3, 5, 7, 8, 10];

const MAJOR_QUALITIES = ["", "m", "m", "", "", "m", "dim"] as const;
const MINOR_QUALITIES = ["m", "dim", "", "m", "m", "", ""] as const;

const ROMAN_MAJOR = ["I", "ii", "iii", "IV", "V", "vi", "vii°"] as const;
const ROMAN_MINOR = ["i", "ii°", "III", "iv", "v", "VI", "VII"] as const;

// Common pop progressions by degree index
const COMMON_CADENCES_MAJOR: number[][] = [
  [0, 4, 5, 3], // I–V–vi–IV
  [5, 3, 0, 4], // vi–IV–I–V
  [1, 4, 0],    // ii–V–I
];
const COMMON_CADENCES_MINOR: number[][] = [
  [0, 5, 3, 6], // i–VI–iv–VII
  [0, 6, 5, 3], // i–VII–VI–iv
  [1, 4, 0],    // ii°–v–i
];

export type ChordSuggestion = {
  chord: string;
  label: string;
  romanNumeral: string;
  category: "diatonic" | "cadence" | "borrowed";
};

function buildDiatonic(
  root: NoteName,
  isMinor: boolean,
): { chord: string; roman: string }[] {
  const intervals = isMinor ? MINOR_INTERVALS : MAJOR_INTERVALS;
  const qualities = isMinor ? MINOR_QUALITIES : MAJOR_QUALITIES;
  const romans = isMinor ? ROMAN_MINOR : ROMAN_MAJOR;
  return intervals.map((interval, idx) => ({
    chord: transposeNote(root, interval) + qualities[idx],
    roman: romans[idx],
  }));
}

/**
 * Return up to 6 ranked chord suggestions for the given key.
 * Pass `currentChord` to prioritise likely next chords.
 */
export function suggestNextChords(
  key: string,
  currentChord?: string,
): ChordSuggestion[] {
  const isMinor = /m(in(or)?)?$/i.test(key.trim());
  const rootStr = key.trim().replace(/m(in(or)?)?$/i, "");
  const root = normalizeNote(rootStr);

  const diatonic = buildDiatonic(root, isMinor);
  const cadencePatterns = isMinor
    ? COMMON_CADENCES_MINOR
    : COMMON_CADENCES_MAJOR;

  const suggestions: ChordSuggestion[] = diatonic.map(d => ({
    chord: d.chord,
    label: `${d.chord} (${d.roman})`,
    romanNumeral: d.roman,
    category: "diatonic" as const,
  }));

  // Upgrade chords that appear in common cadences to "cadence"
  for (const cadence of cadencePatterns) {
    for (const idx of cadence) {
      const s = suggestions[idx];
      if (s) s.category = "cadence";
    }
  }

  // If currentChord is known, bring likely followers to the front
  if (currentChord) {
    const currentIdx = diatonic.findIndex(d => d.chord === currentChord.trim());
    if (currentIdx >= 0) {
      for (const cadence of cadencePatterns) {
        const posInCadence = cadence.indexOf(currentIdx);
        if (posInCadence >= 0 && posInCadence < cadence.length - 1) {
          const nextIdx = cadence[posInCadence + 1];
          const existingIdx = suggestions.findIndex(
            s => s.chord === diatonic[nextIdx]?.chord,
          );
          if (existingIdx > 0) {
            const [item] = suggestions.splice(existingIdx, 1);
            item.category = "cadence";
            suggestions.unshift(item);
          }
        }
      }
    }
  }

  return suggestions.slice(0, 6);
}
