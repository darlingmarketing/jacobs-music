import { describe, it, expect } from "vitest";
import { clamp, snapMs, beatGridMs } from "./timelineMath";

describe("clamp", () => {
  it("returns value when within range", () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });
  it("clamps to min", () => {
    expect(clamp(-5, 0, 10)).toBe(0);
  });
  it("clamps to max", () => {
    expect(clamp(15, 0, 10)).toBe(10);
  });
});

describe("snapMs", () => {
  it("rounds to nearest grid unit", () => {
    expect(snapMs(130, 250)).toBe(250);
    expect(snapMs(100, 250)).toBe(0);
    expect(snapMs(125, 250)).toBe(250);
  });
  it("returns exact grid value unchanged", () => {
    expect(snapMs(500, 250)).toBe(500);
  });
});

describe("beatGridMs", () => {
  it("returns correct beat duration for 4/4 at 120 bpm", () => {
    // 120 bpm => 500ms per beat, beatValue=4 => factor 4/4=1 => 500ms
    expect(beatGridMs(120, { beats: 4, beatValue: 4 })).toBeCloseTo(500);
  });
  it("returns correct beat duration for 6/8 at 120 bpm", () => {
    // beatValue=8 => factor 4/8=0.5 => 250ms per eighth-note beat
    expect(beatGridMs(120, { beats: 6, beatValue: 8 })).toBeCloseTo(250);
  });
});
