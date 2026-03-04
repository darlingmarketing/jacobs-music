const NOTES_SHARP = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"] as const;
export type NoteName = typeof NOTES_SHARP[number];

export function normalizeNote(n: string): NoteName {
  const s = n.trim().toUpperCase()
    .replace("DB","C#").replace("EB","D#").replace("GB","F#")
    .replace("AB","G#").replace("BB","A#");
  const idx = NOTES_SHARP.indexOf(s as NoteName);
  return NOTES_SHARP[idx >= 0 ? idx : 0];
}

export function noteIndex(n: NoteName): number {
  return NOTES_SHARP.indexOf(n);
}

export function transposeNote(n: NoteName, semis: number): NoteName {
  const i = noteIndex(n);
  return NOTES_SHARP[(i + semis + 1200) % 12];
}

export function noteAtStringFret(tuning: NoteName[], stringIndex: number, fret: number): NoteName {
  return transposeNote(tuning[stringIndex], fret);
}

export const INTERVAL_NAMES = ["R","b2","2","b3","3","4","b5","5","b6","6","b7","7"] as const;

export function intervalName(root: NoteName, note: NoteName): string {
  const diff = (noteIndex(note) - noteIndex(root) + 12) % 12;
  return INTERVAL_NAMES[diff];
}
