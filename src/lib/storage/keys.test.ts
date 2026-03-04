import { describe, it, expect } from "vitest";
import { DB_KEYS } from "./keys";

describe("DB_KEYS", () => {
  it("has a static songsIndex key", () => {
    expect(DB_KEYS.songsIndex).toBe("songs:index");
  });

  it("generates song key with id", () => {
    expect(DB_KEYS.song("abc-123")).toBe("song:abc-123");
  });

  it("has favorites and setlists keys", () => {
    expect(DB_KEYS.favorites).toBe("favorites");
    expect(DB_KEYS.setlists).toBe("setlists");
  });

  it("has a static recordingsIndex key", () => {
    expect(DB_KEYS.recordingsIndex).toBe("recordings:index");
  });

  it("generates recording key with id", () => {
    expect(DB_KEYS.recording("rec-456")).toBe("recording:rec-456");
  });
});
