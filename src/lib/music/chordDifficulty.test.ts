import { describe, it, expect } from "vitest";
import { scoreVoicing, difficultyTier } from "./chordDifficulty";

describe("scoreVoicing", () => {
  it("open E chord scores as easy", () => {
    // E: 0 2 2 1 0 0
    const score = scoreVoicing({ frets: [0, 2, 2, 1, 0, 0] });
    expect(difficultyTier(score)).toBe("easy");
  });

  it("muted strings add a small penalty", () => {
    const noMute = scoreVoicing({ frets: [0, 2, 2, 1, 0, 0] });
    const withMute = scoreVoicing({ frets: [-1, 2, 2, 1, 0, 0] });
    expect(withMute).toBeGreaterThan(noMute);
  });

  it("barre chord adds a penalty", () => {
    const noBarre = scoreVoicing({ frets: [0, 2, 2, 1, 0, 0] });
    const barre = scoreVoicing({
      frets: [1, 1, 2, 3, 3, 1],
      barre: { fret: 1, fromString: 0, toString: 5 },
    });
    expect(barre).toBeGreaterThan(noBarre);
  });

  it("open strings reduce score", () => {
    const noOpen = scoreVoicing({ frets: [2, 2, 2, 2, 2, 2] });
    const withOpen = scoreVoicing({ frets: [0, 2, 2, 1, 0, 0] });
    expect(withOpen).toBeLessThan(noOpen);
  });
});

describe("difficultyTier", () => {
  it("score 0 → easy", () => expect(difficultyTier(0)).toBe("easy"));
  it("score 3.5 → easy", () => expect(difficultyTier(3.5)).toBe("easy"));
  it("score 3.6 → medium", () => expect(difficultyTier(3.6)).toBe("medium"));
  it("score 7.0 → medium", () => expect(difficultyTier(7.0)).toBe("medium"));
  it("score 7.1 → advanced", () => expect(difficultyTier(7.1)).toBe("advanced"));
});
