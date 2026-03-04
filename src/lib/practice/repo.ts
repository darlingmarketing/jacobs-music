/**
 * src/lib/practice/repo.ts
 *
 * Dedicated IndexedDB repository for PracticeSession records.
 * Uses the same idb-keyval store as the rest of the app for consistency.
 */
import { kvGet, kvSet } from '@/lib/storage/kv'
import type { PracticeSession, PracticeSummary } from './types'

const SESSIONS_KEY = 'practice:sessions'

export async function saveSession(session: PracticeSession): Promise<void> {
  const existing = (await kvGet<PracticeSession[]>(SESSIONS_KEY)) ?? []
  const idx = existing.findIndex((s) => s.id === session.id)
  if (idx >= 0) {
    existing[idx] = session
  } else {
    existing.push(session)
  }
  await kvSet(SESSIONS_KEY, existing)
}

export async function deleteSession(id: string): Promise<void> {
  const existing = (await kvGet<PracticeSession[]>(SESSIONS_KEY)) ?? []
  await kvSet(
    SESSIONS_KEY,
    existing.filter((s) => s.id !== id),
  )
}

export async function listSessions(opts?: {
  since?: string
  mode?: PracticeSession['mode']
  songId?: string
}): Promise<PracticeSession[]> {
  const all = (await kvGet<PracticeSession[]>(SESSIONS_KEY)) ?? []
  return all.filter((s) => {
    if (opts?.since && s.startedAt < opts.since) return false
    if (opts?.mode && s.mode !== opts.mode) return false
    if (opts?.songId && s.songId !== opts.songId) return false
    return true
  })
}

/** Aggregate daily minutes for the last N days (for bar charts). */
export async function getDailyMinutes(days = 30): Promise<{ date: string; minutes: number }[]> {
  const since = new Date(Date.now() - days * 86_400_000).toISOString()
  const sessions = await listSessions({ since })

  const map = new Map<string, number>()
  for (const s of sessions) {
    const date = s.startedAt.slice(0, 10)
    map.set(date, (map.get(date) ?? 0) + (s.durationSec ?? 0))
  }

  // Fill all days even if no sessions
  const result: { date: string; minutes: number }[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10)
    result.push({ date: d, minutes: Math.round((map.get(d) ?? 0) / 60) })
  }
  return result
}

/** BPM progress data points for loop sessions (for line charts). */
export async function getBpmHistory(): Promise<{ date: string; bpm: number }[]> {
  const all = await listSessions({ mode: 'loop' })
  return all
    .filter((s) => s.bpmEnd != null)
    .sort((a, b) => a.startedAt.localeCompare(b.startedAt))
    .map((s) => ({ date: s.startedAt.slice(0, 10), bpm: s.bpmEnd! }))
}

export async function getSummary(): Promise<PracticeSummary> {
  const all = (await kvGet<PracticeSession[]>(SESSIONS_KEY)) ?? []

  const totalSeconds = all.reduce((acc, s) => acc + (s.durationSec ?? 0), 0)

  const practiceDays = new Set(all.map((s) => s.startedAt.slice(0, 10)))
  const sortedDays = Array.from(practiceDays).sort()

  let currentStreakDays = 0
  let longestStreakDays = 0
  const lastPracticeDate = sortedDays[sortedDays.length - 1]

  if (sortedDays.length > 0) {
    const today = new Date().toISOString().slice(0, 10)
    const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10)

    let streak = 0
    let prev: string | null = null
    for (const day of [...sortedDays].reverse()) {
      if (prev === null) {
        if (day === today || day === yesterday) {
          streak = 1
          prev = day
        } else {
          break
        }
      } else {
        const diffDays = Math.round(
          (new Date(prev).getTime() - new Date(day).getTime()) / 86_400_000,
        )
        if (diffDays === 1) {
          streak++
          prev = day
        } else {
          break
        }
      }
    }
    currentStreakDays = streak

    let longest = 1
    let cur = 1
    for (let i = 1; i < sortedDays.length; i++) {
      const diff = Math.round(
        (new Date(sortedDays[i]).getTime() - new Date(sortedDays[i - 1]).getTime()) / 86_400_000,
      )
      if (diff === 1) {
        cur++
        if (cur > longest) longest = cur
      } else {
        cur = 1
      }
    }
    longestStreakDays = longest
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000).toISOString()
  const recentLoop = all.filter(
    (s) =>
      s.mode === 'loop' &&
      s.startedAt >= sevenDaysAgo &&
      s.bpmStart != null &&
      s.bpmEnd != null,
  )
  const bpmImprovement7d =
    recentLoop.length > 0
      ? recentLoop.reduce((acc, s) => acc + ((s.bpmEnd ?? 0) - (s.bpmStart ?? 0)), 0)
      : undefined

  return {
    totalSeconds,
    sessions: all.length,
    currentStreakDays,
    longestStreakDays,
    lastPracticeDate,
    bpmImprovement7d,
  }
}
