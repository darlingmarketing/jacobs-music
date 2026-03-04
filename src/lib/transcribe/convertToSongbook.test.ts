import { describe, it, expect } from "vitest";
import { transcriptionToSongDraft } from "./convertToSongbook";
import type { TranscriptionResult } from "./types";

function makeTx(overrides: Partial<TranscriptionResult> = {}): TranscriptionResult {
  return {
    id: "tx_test",
    segments: [
      { id: "s1", startMs: 0, endMs: 2000, chord: "Am", confidence: 0.9 },
      { id: "s2", startMs: 2000, endMs: 4000, chord: "F", confidence: 0.85 },
      { id: "s3", startMs: 4000, endMs: 6000, chord: "C", confidence: 0.8 },
      { id: "s4", startMs: 6000, endMs: 8000, chord: "G", confidence: 0.88 },
    ],
    createdAt: "2024-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("transcriptionToSongDraft", () => {
  it("creates a song with one section named Transcription", () => {
    const song = transcriptionToSongDraft(makeTx());
    expect(song.sections).toHaveLength(1);
    expect(song.sections[0].name).toBe("Transcription");
  });

  it("includes a chord_grid block", () => {
    const song = transcriptionToSongDraft(makeTx());
    const blocks = song.sections[0].blocks as any[];
    const grid = blocks.find((b) => b.type === "chord_grid");
    expect(grid).toBeDefined();
    expect(grid.measures.length).toBeGreaterThan(0);
  });

  it("uses segment-per-measure when tempoBpm is absent", () => {
    const tx = makeTx();
    const song = transcriptionToSongDraft(tx);
    const blocks = song.sections[0].blocks as any[];
    const grid = blocks.find((b) => b.type === "chord_grid");
    // No tempo: 4 segments => 4 measures
    expect(grid.measures).toHaveLength(4);
    expect(grid.measures[0].beats).toBeUndefined();
  });

  it("uses tempo to compute measures when tempoBpm is given", () => {
    const tx = makeTx({ tempoBpm: 120 });
    const song = transcriptionToSongDraft(tx, { timeSig: { beats: 4, beatValue: 4 } });
    const blocks = song.sections[0].blocks as any[];
    const grid = blocks.find((b) => b.type === "chord_grid");
    // 120 bpm, 4/4: measure = 2000ms; 8000ms total => 4 measures
    expect(grid.measures).toHaveLength(4);
    expect(grid.measures[0].beats).toBe(4);
  });

  it("does not crash when key is missing", () => {
    const tx = makeTx({ key: undefined });
    expect(() => transcriptionToSongDraft(tx)).not.toThrow();
  });

  it("uses opts.title if provided", () => {
    const song = transcriptionToSongDraft(makeTx(), { title: "My Song" });
    expect((song.meta as any).title).toBe("My Song");
  });

  it("falls back to sourceFileName in title", () => {
    const tx = makeTx({ sourceFileName: "demo.mp3" });
    const song = transcriptionToSongDraft(tx);
    expect((song.meta as any).title).toContain("demo.mp3");
  });
});
