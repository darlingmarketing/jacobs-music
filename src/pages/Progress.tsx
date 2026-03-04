import { useKV } from '@github/spark/hooks'
import { useQuery } from '@tanstack/react-query'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Timer, Fire, TrendUp, MusicNotes, ArrowsClockwise, Metronome, Star } from '@phosphor-icons/react'
import { getSummary, listSessions } from '@/lib/practice/repo'
import { getDailyMinutes, getBpmHistory } from '@/lib/practice/repo'
import type { PracticeSession } from '@/lib/practice/types'
import type { Song } from '@/types'
import { cn } from '@/lib/utils'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts'

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

  const { data: summary = null } = useQuery({
    queryKey: ['practice-summary'],
    queryFn: getSummary,
  })

  const { data: allSessions = [] } = useQuery({
    queryKey: ['practice-sessions'],
    queryFn: () =>
      listSessions().then((all) =>
        [...all].sort((a, b) => b.startedAt.localeCompare(a.startedAt)).slice(0, 20),
      ),
  })

  const { data: dailyMinutes = [] } = useQuery({
    queryKey: ['practice-daily-minutes'],
    queryFn: () => getDailyMinutes(14),
  })

  const { data: bpmHistory = [] } = useQuery({
    queryKey: ['practice-bpm-history'],
    queryFn: getBpmHistory,
  })

  const allSongs = songs ?? []

  const today = new Date().toISOString().slice(0, 10)
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString()

  const todaySec = allSessions
    .filter((s) => s.startedAt.startsWith(today))
    .reduce((acc, s) => acc + (s.durationSec ?? 0), 0)
  const weekSec = allSessions
    .filter((s) => s.startedAt >= weekAgo)
    .reduce((acc, s) => acc + (s.durationSec ?? 0), 0)

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

      {/* Daily practice bar chart */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Daily Practice (last 14 days)</h2>
        {dailyMinutes.every((d) => d.minutes === 0) ? (
          <Card className="p-6 text-center text-muted-foreground text-sm">
            No practice data yet. Start a session to see your daily chart.
          </Card>
        ) : (
          <Card className="p-4">
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={dailyMinutes} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <XAxis
                  dataKey="date"
                  tickFormatter={(v: string) => v.slice(5)}
                  tick={{ fontSize: 10 }}
                  interval={2}
                />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip
                  formatter={(v: number) => [`${v}m`, 'Practice']}
                  labelFormatter={(l: string) => l}
                />
                <Bar dataKey="minutes" fill="var(--color-primary, #6366f1)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}
      </div>

      {/* BPM progress line chart */}
      {bpmHistory.length > 1 && (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">BPM Progress</h2>
          <Card className="p-4">
            <ResponsiveContainer width="100%" height={140}>
              <LineChart data={bpmHistory} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis
                  dataKey="date"
                  tickFormatter={(v: string) => v.slice(5)}
                  tick={{ fontSize: 10 }}
                  interval="preserveStartEnd"
                />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v: number) => [`${v} BPM`, 'BPM']} />
                <Line
                  type="monotone"
                  dataKey="bpm"
                  stroke="var(--color-primary, #6366f1)"
                  dot={false}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}

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
