import type { TranscriptionResult } from "./types";
import type { Song, SongSection } from "../songbook/types";

function isoNow() {
  return new Date().toISOString();
}

function measureDurationMs(tempoBpm: number, beatsPerMeasure: number) {
  const beatMs = 60000 / tempoBpm;
  return beatMs * beatsPerMeasure;
}

function pickChordForWindow(
  segments: { startMs: number; endMs: number; chord: string }[],
  winStart: number,
  winEnd: number
) {
  const mid = (winStart + winEnd) / 2;
  const covering = segments.find((s) => s.startMs <= mid && s.endMs >= mid);
  if (covering) return covering.chord;

  // fallback: max-overlap
  let best = segments[0]?.chord ?? "N.C.";
  let bestOverlap = 0;
  for (const s of segments) {
    const overlap = Math.max(
      0,
      Math.min(s.endMs, winEnd) - Math.max(s.startMs, winStart)
    );
    if (overlap > bestOverlap) {
      bestOverlap = overlap;
      best = s.chord;
    }
  }
  return best;
}

export function transcriptionToSongDraft(
  tx: TranscriptionResult,
  opts?: {
    title?: string;
    timeSig?: { beats: number; beatValue: number };
    tuning?: { name?: string; strings: string[] };
  }
): Song {
  const now = isoNow();
  const songId = `song_${Date.now()}`;

  const beats = opts?.timeSig?.beats ?? 4;

  const measures: Array<{ beats?: number; chords: string[] }> = [];
  if (tx.tempoBpm && tx.tempoBpm > 0) {
    const mDur = measureDurationMs(tx.tempoBpm, beats);
    const endMs = tx.segments.reduce((m, s) => Math.max(m, s.endMs), 0);
    const count = Math.max(1, Math.ceil(endMs / mDur));
    for (let i = 0; i < count; i++) {
      const start = i * mDur;
      const end = (i + 1) * mDur;
      const chord = pickChordForWindow(tx.segments, start, end);
      measures.push({ beats, chords: [chord] });
    }
  } else {
    for (const s of tx.segments) {
      measures.push({ beats: undefined, chords: [s.chord] });
    }
  }

  const section: SongSection = {
    id: `sec_${Date.now()}`,
    name: "Transcription",
    blocks: [
      { id: `blk_${Date.now()}_h`, type: "heading", text: "Transcription" },
      { id: `blk_${Date.now()}_g`, type: "chord_grid", measures },
    ] as any,
  };

  const song: Song = {
    id: songId,
    meta: {
      title:
        opts?.title ??
        (tx.sourceFileName
          ? `Transcription: ${tx.sourceFileName}`
          : "New Transcription"),
      description:
        "Generated from audio transcription. Review and correct chords.",
      key: tx.key,
      tempoBpm: tx.tempoBpm,
      timeSignature: opts?.timeSig ?? { beats, beatValue: 4 },
      tuning: opts?.tuning ?? { strings: ["E", "A", "D", "G", "B", "E"] },
      createdAt: now,
      updatedAt: now,
    } as any,
    sections: [section],
  };

  return song;
}
