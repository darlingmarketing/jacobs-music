import type { TranscriptionResult, ChordSegment } from "./types";
import { FLAGS } from "../config/flags";

export interface TranscribeEngine {
  id: string;
  label: string;
  transcribe(
    audio: AudioBuffer,
    opts?: { sourceRecordingId?: string; sourceFileName?: string }
  ): Promise<TranscriptionResult>;
}

function isoNow() {
  return new Date().toISOString();
}

function seg(
  id: string,
  startMs: number,
  endMs: number,
  chord: string,
  confidence = 0.9
): ChordSegment {
  return { id, startMs, endMs, chord, confidence };
}

export class MockEngine implements TranscribeEngine {
  id = "mock";
  label = "Mock (deterministic)";

  async transcribe(
    audio: AudioBuffer,
    opts?: { sourceRecordingId?: string; sourceFileName?: string }
  ): Promise<TranscriptionResult> {
    const durMs = Math.max(1, Math.floor(audio.duration * 1000));
    const step = Math.max(1000, Math.floor(durMs / 8)); // 8 segments minimum
    const chords = ["Am", "F", "C", "G", "Dm", "Em", "F", "G"];
    const segments: ChordSegment[] = [];

    let t = 0;
    let i = 0;
    while (t < durMs) {
      const start = t;
      const end = Math.min(durMs, t + step);
      segments.push(
        seg(
          `seg_${i}`,
          start,
          end,
          chords[i % chords.length],
          0.75 + (i % 3) * 0.08
        )
      );
      t = end;
      i++;
    }

    return {
      id: `tx_${Date.now()}`,
      sourceRecordingId: opts?.sourceRecordingId,
      sourceFileName: opts?.sourceFileName,
      tempoBpm: 120,
      key: "C",
      segments,
      createdAt: isoNow(),
    };
  }
}

// Optional EssentiaEngine: must be behind a feature flag and dynamically imported.
export class EssentiaEngine implements TranscribeEngine {
  id = "essentia";
  label = "Essentia (AGPL)";

  async transcribe(
    _audio: AudioBuffer,
    _opts?: { sourceRecordingId?: string; sourceFileName?: string }
  ): Promise<TranscriptionResult> {
    // IMPORTANT: keep this as a stub unless FLAG enabled and dependency installed.
    // This file should compile even when essentia.js is not installed.
    throw new Error(
      "EssentiaEngine not implemented. Enable flag + install essentia.js to use."
    );
  }
}

// Engine registry
export function getAvailableEngines(): TranscribeEngine[] {
  const engines: TranscribeEngine[] = [new MockEngine()];
  if (FLAGS.enableEssentiaEngine) engines.push(new EssentiaEngine());
  return engines;
}
