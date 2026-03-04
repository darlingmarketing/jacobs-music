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
    if (!FLAGS.enableEssentiaEngine) {
      throw new Error(
        "EssentiaEngine not enabled. Set VITE_ENABLE_ESSENTIA_ENGINE=true to enable."
      );
    }
    try {
      // Dynamic import keeps this file compilable without essentia.js installed.
      const mod = await import("essentia.js" as any);
      const Essentia = mod?.default ?? mod;
      if (!Essentia) {
        throw new Error("essentia.js loaded but default export not found.");
      }
      // Placeholder: return stub segments since full HPCP pipeline
      // requires further integration work.
      const durMs = Math.max(1, Math.floor(_audio.duration * 1000));
      const step = Math.max(1000, Math.floor(durMs / 8));
      const chords = ["Am", "F", "C", "G", "Dm", "Em", "F", "G"];
      const segments: ChordSegment[] = [];
      let t = 0;
      let i = 0;
      while (t < durMs) {
        const start = t;
        const end = Math.min(durMs, t + step);
        segments.push({ id: `seg_${i}`, startMs: start, endMs: end, chord: chords[i % chords.length], confidence: 0.5 });
        t = end;
        i++;
      }
      return {
        id: `tx_essentia_${Date.now()}`,
        sourceRecordingId: _opts?.sourceRecordingId,
        sourceFileName: _opts?.sourceFileName,
        segments,
        createdAt: new Date().toISOString(),
      };
    } catch (err: any) {
      if (err?.message?.includes("EssentiaEngine not enabled")) throw err;
      throw new Error(
        `essentia.js failed to load. Install it (npm i essentia.js) and enable the flag. Details: ${err?.message ?? err}`
      );
    }
  }
}

// Engine registry
export function getAvailableEngines(): TranscribeEngine[] {
  const engines: TranscribeEngine[] = [new MockEngine()];
  if (FLAGS.enableEssentiaEngine) engines.push(new EssentiaEngine());
  return engines;
}
