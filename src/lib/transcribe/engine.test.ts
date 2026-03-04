import { describe, it, expect } from "vitest";
import { MockEngine, EssentiaEngine, getAvailableEngines } from "./engine";

// Minimal AudioBuffer stub for unit tests (no browser API available in Node).
function makeAudioBuffer(durationSeconds: number): AudioBuffer {
  return {
    duration: durationSeconds,
    length: Math.floor(durationSeconds * 44100),
    numberOfChannels: 1,
    sampleRate: 44100,
    getChannelData: () => new Float32Array(Math.floor(durationSeconds * 44100)),
    copyFromChannel: () => {},
    copyToChannel: () => {},
  } as unknown as AudioBuffer;
}

describe("MockEngine", () => {
  it("has id='mock'", () => {
    const engine = new MockEngine();
    expect(engine.id).toBe("mock");
  });

  it("returns segments with non-decreasing startMs", async () => {
    const engine = new MockEngine();
    const buf = makeAudioBuffer(4); // 4-second audio
    const result = await engine.transcribe(buf, { sourceFileName: "test.mp3" });

    expect(result.segments.length).toBeGreaterThan(0);
    for (let i = 1; i < result.segments.length; i++) {
      expect(result.segments[i].startMs).toBeGreaterThanOrEqual(
        result.segments[i - 1].startMs
      );
    }
  });

  it("sets sourceFileName on result", async () => {
    const engine = new MockEngine();
    const buf = makeAudioBuffer(2);
    const result = await engine.transcribe(buf, { sourceFileName: "demo.wav" });
    expect(result.sourceFileName).toBe("demo.wav");
  });

  it("each segment has startMs < endMs", async () => {
    const engine = new MockEngine();
    const buf = makeAudioBuffer(8);
    const result = await engine.transcribe(buf);
    for (const seg of result.segments) {
      expect(seg.startMs).toBeLessThan(seg.endMs);
    }
  });
});

describe("EssentiaEngine", () => {
  it("has id='essentia'", () => {
    const engine = new EssentiaEngine();
    expect(engine.id).toBe("essentia");
  });

  it("throws when transcribe is called (stub)", async () => {
    const engine = new EssentiaEngine();
    const buf = makeAudioBuffer(1);
    await expect(engine.transcribe(buf)).rejects.toThrow("EssentiaEngine not enabled");
  });
});

describe("getAvailableEngines", () => {
  it("always includes MockEngine", () => {
    const engines = getAvailableEngines();
    const ids = engines.map((e) => e.id);
    expect(ids).toContain("mock");
  });

  it("does NOT include EssentiaEngine when flag is false", () => {
    // In the test environment VITE_ENABLE_ESSENTIA_ENGINE is not set to 'true'
    const engines = getAvailableEngines();
    const ids = engines.map((e) => e.id);
    expect(ids).not.toContain("essentia");
  });
});
