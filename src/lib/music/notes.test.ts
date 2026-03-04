import { describe, it, expect } from "vitest";
import {
  normalizeNote,
  noteIndex,
  transposeNote,
  noteAtStringFret,
  intervalName,
  type NoteName,
} from "./notes";

describe("normalizeNote", () => {
  it("returns the note unchanged for sharp names", () => {
    expect(normalizeNote("C#")).toBe("C#");
    expect(normalizeNote("F#")).toBe("F#");
  });

  it("converts flat notation to equivalent sharp", () => {
    expect(normalizeNote("Db")).toBe("C#");
    expect(normalizeNote("Eb")).toBe("D#");
    expect(normalizeNote("Gb")).toBe("F#");
    expect(normalizeNote("Ab")).toBe("G#");
    expect(normalizeNote("Bb")).toBe("A#");
  });

  it("handles lowercase input", () => {
    expect(normalizeNote("c")).toBe("C");
    expect(normalizeNote("eb")).toBe("D#");
  });

  it("falls back to C for unknown notes", () => {
    expect(normalizeNote("X")).toBe("C");
  });
});

describe("noteIndex", () => {
  it("returns 0 for C", () => expect(noteIndex("C")).toBe(0));
  it("returns 11 for B", () => expect(noteIndex("B")).toBe(11));
  it("returns 4 for E", () => expect(noteIndex("E")).toBe(4));
});

describe("transposeNote", () => {
  it("transposes C up by 2 semitones → D", () => {
    expect(transposeNote("C", 2)).toBe("D");
  });

  it("wraps around the octave", () => {
    expect(transposeNote("B", 1)).toBe("C");
  });

  it("handles negative offsets with large modulus", () => {
    expect(transposeNote("C", -1)).toBe("B");
  });

  it("transposes E up 7 semitones → B (perfect fifth)", () => {
    expect(transposeNote("E", 7)).toBe("B");
  });
});

describe("noteAtStringFret", () => {
  const tuning: NoteName[] = ["E", "A", "D", "G", "B", "E"];

  it("open E string is E", () => {
    expect(noteAtStringFret(tuning, 0, 0)).toBe("E");
  });

  it("E string fret 3 is G", () => {
    expect(noteAtStringFret(tuning, 0, 3)).toBe("G");
  });

  it("A string fret 3 is C", () => {
    expect(noteAtStringFret(tuning, 1, 3)).toBe("C");
  });

  it("G string fret 4 is B", () => {
    expect(noteAtStringFret(tuning, 3, 4)).toBe("B");
  });
});

describe("intervalName", () => {
  it("root is R", () => expect(intervalName("C", "C")).toBe("R"));
  it("C to G is 5", () => expect(intervalName("C", "G")).toBe("5"));
  it("C to Eb is b3", () => expect(intervalName("C", "D#")).toBe("b3"));
  it("C to B is 7", () => expect(intervalName("C", "B")).toBe("7"));
});
