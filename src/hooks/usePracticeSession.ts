import { useRef, useCallback, useEffect } from "react";
import type { PracticeMode, PracticeSession } from "@/lib/practice/types";
import { saveSession } from "@/lib/practice/storage";

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

interface UsePracticeSessionOptions {
  songId?: string;
  setlistId?: string;
  bpmStart?: number;
}

interface PracticeSessionControls {
  start: () => void;
  stop: () => void;
  markLoopComplete: () => void;
  setBpm: (bpm: number) => void;
}

export function usePracticeSession(
  mode: PracticeMode,
  options: UsePracticeSessionOptions = {}
): PracticeSessionControls {
  const sessionRef = useRef<PracticeSession | null>(null);

  const start = useCallback(() => {
    const session: PracticeSession = {
      id: generateId(),
      mode,
      songId: options.songId,
      setlistId: options.setlistId,
      startedAt: new Date().toISOString(),
      bpmStart: options.bpmStart,
      loopsCompleted: 0,
    };
    sessionRef.current = session;
  }, [mode, options.songId, options.setlistId, options.bpmStart]);

  const stop = useCallback(() => {
    const session = sessionRef.current;
    if (!session) return;
    const endedAt = new Date().toISOString();
    const durationSec = Math.round(
      (new Date(endedAt).getTime() - new Date(session.startedAt).getTime()) / 1000
    );
    const completed: PracticeSession = {
      ...session,
      endedAt,
      durationSec,
    };
    sessionRef.current = null;
    saveSession(completed).catch(() => {});
  }, []);

  const markLoopComplete = useCallback(() => {
    if (!sessionRef.current) return;
    sessionRef.current = {
      ...sessionRef.current,
      loopsCompleted: (sessionRef.current.loopsCompleted ?? 0) + 1,
    };
  }, []);

  const setBpm = useCallback((bpm: number) => {
    if (!sessionRef.current) return;
    const session = sessionRef.current;
    // Set bpmStart on first call, bpmEnd on subsequent
    if (session.bpmStart == null) {
      sessionRef.current = { ...session, bpmStart: bpm };
    } else {
      sessionRef.current = { ...session, bpmEnd: bpm };
    }
  }, []);

  // Auto-stop on page unload / visibility change
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden && sessionRef.current) stop();
    };
    const handleUnload = () => {
      if (sessionRef.current) stop();
    };
    window.addEventListener("beforeunload", handleUnload);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.removeEventListener("beforeunload", handleUnload);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [stop]);

  // Stop on unmount
  useEffect(() => {
    return () => {
      if (sessionRef.current) stop();
    };
  }, [stop]);

  return { start, stop, markLoopComplete, setBpm };
}
