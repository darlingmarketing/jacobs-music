export type PracticeMode = "play" | "loop" | "metronome" | "tuner" | "chords" | "scales";

export type PracticeSession = {
  id: string;
  mode: PracticeMode;
  songId?: string;
  setlistId?: string;
  startedAt: string;  // ISO
  endedAt?: string;   // ISO
  durationSec?: number;
  bpmStart?: number;
  bpmEnd?: number;
  loopsCompleted?: number;
  notes?: string;
};

export type PracticeSummary = {
  totalSeconds: number;
  sessions: number;
  currentStreakDays: number;
  longestStreakDays: number;
  lastPracticeDate?: string; // YYYY-MM-DD
  bpmImprovement7d?: number; // bpmEnd - bpmStart aggregate
};
