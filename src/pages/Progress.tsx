import { useEffect, useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Timer, Fire, TrendUp, MusicNotes, ArrowsClockwise, Metronome, Star } from '@phosphor-icons/react'
import { getSummary, listSessions } from '@/lib/practice/storage'
import type { PracticeSummary, PracticeSession } from '@/lib/practice/types'
import type { Song } from '@/types'
import { cn } from '@/lib/utils'

const MODE_LABELS: Record<PracticeSession['mode'], string> = {
  play: 'Play',
  loop: 'Loop',
  metronome: 'Metronome',
  tuner: 'Tuner',
  chords: 'Chords',
  scales: 'Scales',
}

const MODE_ICONS: Record<PracticeSession['mode'], React.ReactNode> = {
  play: <MusicNotes size={14} />,
  loop: <ArrowsClockwise size={14} />,
  metronome: <Metronome size={14} />,
  tuner: <Star size={14} />,
  chords: <Star size={14} />,
  scales: <Star size={14} />,
}

function fmtDuration(sec: number): string {
  if (sec < 60) return `${sec}s`
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return s > 0 ? `${m}m ${s}s` : `${m}m`
}

function fmtMinutes(sec: number): string {
  return `${Math.round(sec / 60)}m`
}

function todaySeconds(sessions: PracticeSession[]): number {
  const today = new Date().toISOString().slice(0, 10)
  return sessions
    .filter((s) => s.startedAt.startsWith(today))
    .reduce((acc, s) => acc + (s.durationSec ?? 0), 0)
}

function last7dSeconds(sessions: PracticeSession[]): number {
  const since = new Date(Date.now() - 7 * 86400000).toISOString()
  return sessions
    .filter((s) => s.startedAt >= since)
    .reduce((acc, s) => acc + (s.durationSec ?? 0), 0)
}

interface KPICardProps {
  icon: React.ReactNode
  label: string
  value: string
  sub?: string
  accent?: boolean
}

function KPICard({ icon, label, value, sub, accent }: KPICardProps) {
  return (
    <Card className={cn('p-4 flex flex-col gap-1', accent && 'border-primary/50 bg-primary/5')}>
      <div className="flex items-center gap-2 text-muted-foreground text-xs">
        {icon}
        <span>{label}</span>
      </div>
      <div className={cn('text-2xl font-bold', accent && 'text-primary')}>{value}</div>
      {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
    </Card>
  )
}

export function Progress() {
  const [songs] = useKV<Song[]>('songs', [])
  const [summary, setSummary] = useState<PracticeSummary | null>(null)
  const [sessions, setSessions] = useState<PracticeSession[]>([])

  useEffect(() => {
    getSummary().then(setSummary).catch(() => {})
    listSessions().then((all) => {
      const sorted = [...all].sort((a, b) => b.startedAt.localeCompare(a.startedAt))
      setSessions(sorted.slice(0, 20))
    }).catch(() => {})
  }, [])

  const allSongs = songs ?? []
  const allSessions = sessions

  const todaySec = todaySeconds(allSessions)
  const weekSec = last7dSeconds(allSessions)

  const hasSessions = allSessions.length > 0

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-6 py-6 space-y-6">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Progress</h1>
        <p className="text-muted-foreground mt-1">Your local practice history</p>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KPICard
          icon={<Timer size={14} />}
          label="Today"
          value={hasSessions ? fmtMinutes(todaySec) : '—'}
        />
        <KPICard
          icon={<Timer size={14} />}
          label="7 days"
          value={hasSessions ? fmtMinutes(weekSec) : '—'}
        />
        <KPICard
          icon={<Fire size={14} />}
          label="Streak"
          value={summary ? `${summary.currentStreakDays}d` : '—'}
          sub={summary && summary.longestStreakDays > 0 ? `Best: ${summary.longestStreakDays}d` : undefined}
          accent={!!summary && summary.currentStreakDays > 0}
        />
        {summary?.bpmImprovement7d != null ? (
          <KPICard
            icon={<TrendUp size={14} />}
            label="BPM gain (7d)"
            value={`+${summary.bpmImprovement7d}`}
            accent
          />
        ) : (
          <KPICard
            icon={<TrendUp size={14} />}
            label="BPM gain (7d)"
            value="—"
            sub="Start loop sessions to track"
          />
        )}
      </div>

      {/* Recent sessions */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Recent Sessions</h2>

        {allSessions.length === 0 ? (
          <Card className="p-6 text-center text-muted-foreground text-sm">
            No sessions recorded yet. Start playing or use the Practice Loop to track your progress.
          </Card>
        ) : (
          <div className="flex flex-col gap-2">
            {allSessions.map((session) => {
              const song = session.songId
                ? allSongs.find((s) => s.id === session.songId)
                : undefined
              const date = new Date(session.startedAt)
              const dateStr = date.toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              })
              const timeStr = date.toLocaleTimeString(undefined, {
                hour: '2-digit',
                minute: '2-digit',
              })

              return (
                <Card key={session.id} className="p-3 flex items-center gap-3">
                  <div className="text-primary shrink-0">{MODE_ICONS[session.mode]}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-xs px-1.5 py-0">
                        {MODE_LABELS[session.mode]}
                      </Badge>
                      {song && (
                        <span className="text-sm font-medium truncate">{song.title}</span>
                      )}
                      {session.loopsCompleted != null && session.loopsCompleted > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {session.loopsCompleted} loop{session.loopsCompleted !== 1 ? 's' : ''}
                        </span>
                      )}
                      {session.bpmStart != null && session.bpmEnd != null && (
                        <span className="text-xs text-muted-foreground">
                          {session.bpmStart}→{session.bpmEnd} BPM
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {dateStr} {timeStr}
                    </div>
                  </div>
                  <div className="text-sm font-medium tabular-nums shrink-0">
                    {session.durationSec != null ? fmtDuration(session.durationSec) : '—'}
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
