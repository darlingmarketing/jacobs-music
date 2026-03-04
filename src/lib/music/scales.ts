import type { NoteName } from "./notes";
import { transposeNote } from "./notes";

export type ScaleDef = { id: string; label: string; intervals: number[] };

export const SCALES: ScaleDef[] = [
  { id: "major",         label: "Major (Ionian)",          intervals: [0,2,4,5,7,9,11] },
  { id: "natural_minor", label: "Natural Minor (Aeolian)", intervals: [0,2,3,5,7,8,10] },
  { id: "minor_pent",    label: "Minor Pentatonic",        intervals: [0,3,5,7,10] },
  { id: "major_pent",    label: "Major Pentatonic",        intervals: [0,2,4,7,9] },
  { id: "blues",         label: "Blues",                   intervals: [0,3,5,6,7,10] },
];

export function scaleNotes(root: NoteName, intervals: number[]): NoteName[] {
  return intervals.map(i => transposeNote(root, i));
}
