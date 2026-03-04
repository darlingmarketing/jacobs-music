import { describe, it, expect, vi, beforeEach } from 'vitest'
import { saveSession, listSessions, getDailyMinutes, getBpmHistory, getSummary, deleteSession } from '../repo'
import type { PracticeSession } from '../types'

// Mock idb-keyval (used by @/lib/storage/kv)
const store: Record<string, unknown> = {}
vi.mock('@/lib/storage/kv', () => ({
  kvGet: vi.fn(async (key: string) => store[key]),
  kvSet: vi.fn(async (key: string, value: unknown) => { store[key] = value }),
}))

function makeSession(overrides: Partial<PracticeSession> = {}): PracticeSession {
  return {
    id: crypto.randomUUID(),
    mode: 'loop',
    startedAt: new Date().toISOString(),
    endedAt: new Date().toISOString(),
    durationSec: 300,
    bpmStart: 80,
    bpmEnd: 100,
    loopsCompleted: 5,
    ...overrides,
  }
}

beforeEach(() => {
  // Reset in-memory store between tests
  for (const k of Object.keys(store)) delete store[k]
})

describe('practice/repo', () => {
  it('saves and lists sessions', async () => {
    const s = makeSession()
    await saveSession(s)
    const sessions = await listSessions()
    expect(sessions).toHaveLength(1)
    expect(sessions[0].id).toBe(s.id)
  })

  it('updates an existing session', async () => {
    const s = makeSession()
    await saveSession(s)
    await saveSession({ ...s, durationSec: 600 })
    const sessions = await listSessions()
    expect(sessions).toHaveLength(1)
    expect(sessions[0].durationSec).toBe(600)
  })

  it('deletes a session', async () => {
    const s = makeSession()
    await saveSession(s)
    await deleteSession(s.id)
    const sessions = await listSessions()
    expect(sessions).toHaveLength(0)
  })

  it('filters sessions by mode', async () => {
    await saveSession(makeSession({ mode: 'loop' }))
    await saveSession(makeSession({ mode: 'metronome' }))
    const loops = await listSessions({ mode: 'loop' })
    expect(loops).toHaveLength(1)
    expect(loops[0].mode).toBe('loop')
  })

  it('filters sessions by songId', async () => {
    await saveSession(makeSession({ songId: 'song-1' }))
    await saveSession(makeSession({ songId: 'song-2' }))
    const results = await listSessions({ songId: 'song-1' })
    expect(results).toHaveLength(1)
    expect(results[0].songId).toBe('song-1')
  })

  it('getDailyMinutes returns entries for requested days', async () => {
    const today = new Date().toISOString()
    await saveSession(makeSession({ startedAt: today, durationSec: 120 }))
    const daily = await getDailyMinutes(7)
    expect(daily).toHaveLength(7)
    const todayDate = today.slice(0, 10)
    const todayEntry = daily.find((d) => d.date === todayDate)
    expect(todayEntry?.minutes).toBe(2)
  })

  it('getDailyMinutes returns zeros when no sessions', async () => {
    const daily = await getDailyMinutes(7)
    expect(daily).toHaveLength(7)
    expect(daily.every((d) => d.minutes === 0)).toBe(true)
  })

  it('getBpmHistory returns loop sessions with bpmEnd', async () => {
    await saveSession(makeSession({ mode: 'loop', bpmEnd: 120 }))
    await saveSession(makeSession({ mode: 'play' }))
    await saveSession(makeSession({ mode: 'loop', bpmEnd: undefined }))
    const history = await getBpmHistory()
    expect(history).toHaveLength(1)
    expect(history[0].bpm).toBe(120)
  })

  it('getSummary returns zeros for empty store', async () => {
    const summary = await getSummary()
    expect(summary.totalSeconds).toBe(0)
    expect(summary.sessions).toBe(0)
    expect(summary.currentStreakDays).toBe(0)
  })

  it('getSummary tallies totalSeconds', async () => {
    await saveSession(makeSession({ durationSec: 300 }))
    await saveSession(makeSession({ durationSec: 600 }))
    const summary = await getSummary()
    expect(summary.totalSeconds).toBe(900)
    expect(summary.sessions).toBe(2)
  })
})
