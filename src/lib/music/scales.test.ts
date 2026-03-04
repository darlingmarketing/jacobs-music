import { describe, it, expect } from "vitest";
import { scaleNotes, SCALES } from "./scales";

describe("scaleNotes", () => {
  it("major scale of C has 7 notes", () => {
    const major = SCALES.find(s => s.id === "major")!;
    const notes = scaleNotes("C", major.intervals);
    expect(notes).toHaveLength(7);
  });

  it("C major scale is C D E F G A B", () => {
    const major = SCALES.find(s => s.id === "major")!;
    expect(scaleNotes("C", major.intervals)).toEqual([
      "C","D","E","F","G","A","B",
    ]);
  });

  it("A natural minor scale is A B C D E F G", () => {
    const minor = SCALES.find(s => s.id === "natural_minor")!;
    expect(scaleNotes("A", minor.intervals)).toEqual([
      "A","B","C","D","E","F","G",
    ]);
  });

  it("A minor pentatonic is A C D E G", () => {
    const pent = SCALES.find(s => s.id === "minor_pent")!;
    expect(scaleNotes("A", pent.intervals)).toEqual([
      "A","C","D","E","G",
    ]);
  });

  it("G major pentatonic is G A B D E", () => {
    const pent = SCALES.find(s => s.id === "major_pent")!;
    expect(scaleNotes("G", pent.intervals)).toEqual([
      "G","A","B","D","E",
    ]);
  });
});
