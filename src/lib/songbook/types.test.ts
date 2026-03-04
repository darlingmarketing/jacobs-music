import { describe, it, expect } from "vitest";
import type { Song, SongMeta, SongBlock, SongSection } from "./types";

describe("songbook types — smoke", () => {
  it("constructs a valid Song object", () => {
    const meta: SongMeta = {
      title: "Test Song",
      key: "G",
      tempoBpm: 120,
      timeSignature: { beats: 4, beatValue: 4 },
      capo: 0,
      tuning: { name: "Standard", strings: ["E", "A", "D", "G", "B", "E"] },
      tags: ["rock"],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const blocks: SongBlock[] = [
      { id: "b1", type: "heading", text: "Verse 1" },
      { id: "b2", type: "lyrics_chords", source: "[G]Hello [D]world" },
      {
        id: "b3",
        type: "chord_grid",
        measures: [{ beats: 4, chords: ["G", "D", "Em", "C"] }],
      },
    ];

    const section: SongSection = {
      id: "s1",
      name: "Verse",
      blocks,
    };

    const song: Song = {
      id: "song-1",
      meta,
      sections: [section],
    };

    expect(song.id).toBe("song-1");
    expect(song.meta.title).toBe("Test Song");
    expect(song.sections).toHaveLength(1);
    expect(song.sections[0].blocks).toHaveLength(3);
  });

  it("supports all block types", () => {
    const blocks: SongBlock[] = [
      { id: "b1", type: "heading", text: "Chorus" },
      { id: "b2", type: "note", markdown: "Play softly" },
      { id: "b3", type: "lyrics_chords", source: "[Am]Dark [F]horse", renderMode: "brackets" },
      { id: "b4", type: "chord_grid", measures: [{ chords: ["Am", "F"] }] },
      { id: "b5", type: "tab", ascii: "e|--0--|\nB|--1--|" },
      {
        id: "b6",
        type: "audio_ref",
        recordingId: "rec-abc",
        title: "Rough idea",
        startMs: 0,
        endMs: 5000,
      },
    ];

    expect(blocks).toHaveLength(6);
    const types = blocks.map((b) => b.type);
    expect(types).toContain("heading");
    expect(types).toContain("note");
    expect(types).toContain("lyrics_chords");
    expect(types).toContain("chord_grid");
    expect(types).toContain("tab");
    expect(types).toContain("audio_ref");
  });
});
