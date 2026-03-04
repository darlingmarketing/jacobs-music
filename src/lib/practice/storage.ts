import { kvGet, kvSet } from "@/lib/storage/kv";
import type { PracticeSession, PracticeSummary } from "./types";

const SESSIONS_KEY = "practice:sessions";

function toDateStr(iso: string): string {
  return iso.slice(0, 10); // YYYY-MM-DD
}

export async function saveSession(session: PracticeSession): Promise<void> {
  const existing = (await kvGet<PracticeSession[]>(SESSIONS_KEY)) ?? [];
  const idx = existing.findIndex((s) => s.id === session.id);
  if (idx >= 0) {
    existing[idx] = session;
  } else {
    existing.push(session);
  }
  await kvSet(SESSIONS_KEY, existing);
}

export async function listSessions(opts?: {
  since?: string;
  mode?: PracticeSession["mode"];
  songId?: string;
}): Promise<PracticeSession[]> {
  const all = (await kvGet<PracticeSession[]>(SESSIONS_KEY)) ?? [];
  return all.filter((s) => {
    if (opts?.since && s.startedAt < opts.since) return false;
    if (opts?.mode && s.mode !== opts.mode) return false;
    if (opts?.songId && s.songId !== opts.songId) return false;
    return true;
  });
}

export async function getSummary(): Promise<PracticeSummary> {
  const all = (await kvGet<PracticeSession[]>(SESSIONS_KEY)) ?? [];

  const totalSeconds = all.reduce((acc, s) => acc + (s.durationSec ?? 0), 0);

  // Streak calculation
  const practiceDays = new Set(all.map((s) => toDateStr(s.startedAt)));
  const sortedDays = Array.from(practiceDays).sort();

  let currentStreakDays = 0;
  let longestStreakDays = 0;
  const lastPracticeDate = sortedDays[sortedDays.length - 1];

  if (sortedDays.length > 0) {
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

    // Build streak from end
    let streak = 0;
    let prev: string | null = null;
    for (const day of [...sortedDays].reverse()) {
      if (prev === null) {
        if (day === today || day === yesterday) {
          streak = 1;
          prev = day;
        } else {
          break;
        }
      } else {
        const prevDate = new Date(prev);
        const curDate = new Date(day);
        const diffDays = Math.round(
          (prevDate.getTime() - curDate.getTime()) / 86400000
        );
        if (diffDays === 1) {
          streak++;
          prev = day;
        } else {
          break;
        }
      }
    }
    currentStreakDays = streak;

    // Longest streak
    let longest = 1;
    let cur = 1;
    for (let i = 1; i < sortedDays.length; i++) {
      const a = new Date(sortedDays[i - 1]);
      const b = new Date(sortedDays[i]);
      const diff = Math.round((b.getTime() - a.getTime()) / 86400000);
      if (diff === 1) {
        cur++;
        if (cur > longest) longest = cur;
      } else {
        cur = 1;
      }
    }
    longestStreakDays = longest;
  }

  // BPM improvement over last 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
  const recentLoop = all.filter(
    (s) =>
      s.mode === "loop" &&
      s.startedAt >= sevenDaysAgo &&
      s.bpmStart != null &&
      s.bpmEnd != null
  );
  const bpmImprovement7d =
    recentLoop.length > 0
      ? recentLoop.reduce(
          (acc, s) => acc + ((s.bpmEnd ?? 0) - (s.bpmStart ?? 0)),
          0
        )
      : undefined;

  return {
    totalSeconds,
    sessions: all.length,
    currentStreakDays,
    longestStreakDays,
    lastPracticeDate,
    bpmImprovement7d: recentLoop.length > 0 ? bpmImprovement7d : undefined,
  };
}
