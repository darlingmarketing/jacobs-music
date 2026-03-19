import { useState } from 'react'
import { motion } from 'framer-motion'
import { useKV } from '@github/spark/hooks'
import { Song, AudioRecording } from '@/types'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  Plus, MagnifyingGlass, Clock, Microphone, Play, Trash, Guitar, Compass,
  Waveform, Wrench, MusicNote, Metronome, BookBookmark, ArrowRight, Fire,
  Star, Lightning, TrendUp, WaveformSlash, Record
} from '@phosphor-icons/react'
import { AppState } from '@/App'
import { AudioRecorder } from '@/components/AudioRecorder'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface DashboardProps {
  onNavigate: (page: AppState['currentPage'], songId?: string) => void
}

const QUICK_ACTIONS = [
  {
    label: 'New Song',
    description: 'Write & compose',
    icon: Plus,
    page: 'editor' as AppState['currentPage'],
    gradient: 'from-violet-500/20 to-violet-500/5 border-violet-500/20',
    iconColor: 'text-violet-400',
  },
  {
    label: 'Discover',
    description: 'Find tabs & lyrics',
    icon: Compass,
    page: 'discover' as AppState['currentPage'],
    gradient: 'from-blue-500/20 to-blue-500/5 border-blue-500/20',
    iconColor: 'text-blue-400',
  },
  {
    label: 'Transcribe',
    description: 'Detect chords',
    icon: WaveformSlash,
    page: 'transcribe' as AppState['currentPage'],
    gradient: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/20',
    iconColor: 'text-emerald-400',
  },
  {
    label: 'Chords',
    description: 'Browse & learn',
    icon: Guitar,
    page: 'chords' as AppState['currentPage'],
    gradient: 'from-orange-500/20 to-orange-500/5 border-orange-500/20',
    iconColor: 'text-orange-400',
  },
  {
    label: 'Tools',
    description: 'Tuner & metronome',
    icon: Metronome,
    page: 'tools' as AppState['currentPage'],
    gradient: 'from-pink-500/20 to-pink-500/5 border-pink-500/20',
    iconColor: 'text-pink-400',
  },
  {
    label: 'Library',
    description: 'Favorites & setlists',
    icon: BookBookmark,
    page: 'library' as AppState['currentPage'],
    gradient: 'from-amber-500/20 to-amber-500/5 border-amber-500/20',
    iconColor: 'text-amber-400',
  },
]

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  medium: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  hard: 'bg-red-500/15 text-red-400 border-red-500/30',
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const [songs] = useKV<Song[]>('songs', [])
  const [recordings, setRecordings] = useKV<AudioRecording[]>('audio-recordings', [])
  const [isRecording, setIsRecording] = useState(false)
  const [playingRecording, setPlayingRecording] = useState<string | null>(null)

  const allSongs = songs ?? []
  const allRecordings = recordings ?? []

  const recentSongs = [...allSongs]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 6)

  const recentRecordings = [...allRecordings]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3)

  const handleDeleteRecording = (id: string) => {
    setRecordings(current => (current ?? []).filter(r => r.id !== id))
    toast.success('Recording deleted')
  }

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const getSongStats = () => {
    const withChords = allSongs.filter(s => s.sections?.some(sec => sec.blocks?.some(b => b.type === 'chords'))).length
    const withTabs = allSongs.filter(s => s.sections?.some(sec => sec.blocks?.some(b => b.type === 'tab'))).length
    const totalSections = allSongs.reduce((acc, s) => acc + (s.sections?.length ?? 0), 0)
    return { withChords, withTabs, totalSections }
  }

  const stats = getSongStats()

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:pt-8 space-y-8">

        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-primary/30 via-primary/10 to-background border border-primary/20 p-6 md:p-8"
        >
          {/* Background decoration */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-4 right-8 w-40 h-40 bg-primary/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-1/3 w-60 h-24 bg-accent/10 rounded-full blur-2xl" />
            {/* Musical staff lines */}
            <svg className="absolute inset-0 w-full h-full opacity-5" preserveAspectRatio="none">
              {[20, 35, 50, 65, 80].map(y => (
                <line key={y} x1="0" y1={`${y}%`} x2="100%" y2={`${y}%`} stroke="currentColor" strokeWidth="1" />
              ))}
            </svg>
          </div>

          <div className="relative flex items-start justify-between gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground font-medium">{getGreeting()},</p>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                <span className="text-gradient">Jacob's Music</span>
              </h1>
              <p className="text-muted-foreground mt-2 max-w-md">
                Your AI-powered studio for writing songs, learning tabs, and discovering music.
              </p>
            </div>
            <div className="hidden md:flex items-center gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{allSongs.length}</div>
                <div className="text-xs text-muted-foreground">Songs</div>
              </div>
              <div className="w-px h-10 bg-border" />
              <div className="text-center">
                <div className="text-3xl font-bold text-accent">{allRecordings.length}</div>
                <div className="text-xs text-muted-foreground">Ideas</div>
              </div>
            </div>
          </div>

          <div className="relative mt-4 flex gap-2 flex-wrap">
            <Button onClick={() => onNavigate('editor')} size="sm" className="gap-2">
              <Plus size={16} weight="bold" />
              New Song
            </Button>
            <Button onClick={() => setIsRecording(true)} size="sm" variant="outline" className="gap-2 border-accent/40 text-accent hover:bg-accent/10">
              <Record size={16} weight="fill" />
              Quick Record
            </Button>
            <Button onClick={() => onNavigate('discover')} size="sm" variant="outline" className="gap-2">
              <Compass size={16} />
              Discover
            </Button>
          </div>
        </motion.div>

        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3"
        >
          <Card className="p-4 bg-gradient-to-br from-primary/10 to-transparent border-primary/15">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Total Songs</p>
                <p className="text-2xl font-bold text-primary mt-1">{allSongs.length}</p>
              </div>
              <MusicNote size={20} className="text-primary/50" />
            </div>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-accent/10 to-transparent border-accent/15">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Audio Ideas</p>
                <p className="text-2xl font-bold text-accent mt-1">{allRecordings.length}</p>
              </div>
              <Waveform size={20} className="text-accent/50" />
            </div>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-violet-500/10 to-transparent border-violet-500/15">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">With Chords</p>
                <p className="text-2xl font-bold text-violet-400 mt-1">{stats.withChords}</p>
              </div>
              <Guitar size={20} className="text-violet-400/50" />
            </div>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-emerald-500/10 to-transparent border-emerald-500/15">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Total Sections</p>
                <p className="text-2xl font-bold text-emerald-400 mt-1">{stats.totalSections}</p>
              </div>
              <TrendUp size={20} className="text-emerald-400/50" />
            </div>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Lightning size={18} className="text-primary" weight="fill" />
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {QUICK_ACTIONS.map((action, i) => {
              const Icon = action.icon
              return (
                <motion.div
                  key={action.page}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.15 + i * 0.05 }}
                >
                  <Card
                    className={cn(
                      'p-4 cursor-pointer hover:scale-[1.03] transition-all duration-200 hover:shadow-lg',
                      'bg-gradient-to-br border',
                      action.gradient
                    )}
                    onClick={() => onNavigate(action.page)}
                  >
                    <Icon size={24} className={cn('mb-2', action.iconColor)} weight="duotone" />
                    <p className="font-semibold text-sm">{action.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{action.description}</p>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* Recent Songs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Clock size={18} className="text-muted-foreground" />
              Recent Songs
            </h2>
            {allSongs.length > 0 && (
              <Button variant="ghost" size="sm" onClick={() => onNavigate('songs')} className="gap-1 text-primary">
                View All <ArrowRight size={14} />
              </Button>
            )}
          </div>

          {recentSongs.length === 0 ? (
            <Card className="p-12 text-center border-dashed">
              <Guitar size={40} className="mx-auto text-muted-foreground/40 mb-3" weight="duotone" />
              <p className="text-lg font-medium text-muted-foreground">No songs yet</p>
              <p className="text-sm text-muted-foreground/70 mb-4">Start writing your first song or discover music to learn</p>
              <div className="flex gap-2 justify-center">
                <Button onClick={() => onNavigate('editor')} className="gap-2">
                  <Plus size={18} weight="bold" />
                  Create Song
                </Button>
                <Button onClick={() => onNavigate('discover')} variant="outline" className="gap-2">
                  <Compass size={18} />
                  Discover
                </Button>
              </div>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {recentSongs.map((song, i) => (
                <motion.div
                  key={song.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 + i * 0.05 }}
                >
                  <Card
                    className="p-4 hover:border-primary/40 hover:bg-card/80 transition-all cursor-pointer group h-full"
                    onClick={() => onNavigate('editor', song.id)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold leading-tight group-hover:text-primary transition-colors truncate">
                          {song.title}
                        </h3>
                        {song.artist && (
                          <p className="text-sm text-muted-foreground mt-0.5">{song.artist}</p>
                        )}
                      </div>
                      {song.difficulty && (
                        <Badge
                          variant="outline"
                          className={cn('text-xs shrink-0 capitalize', DIFFICULTY_COLORS[song.difficulty])}
                        >
                          {song.difficulty}
                        </Badge>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 mt-3">
                      {song.key && (
                        <span className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                          Key: {song.key}
                        </span>
                      )}
                      {song.tempo && (
                        <span className="inline-flex items-center gap-1 text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                          {song.tempo} BPM
                        </span>
                      )}
                      {song.sections?.length > 0 && (
                        <span className="text-xs text-muted-foreground/70">
                          {song.sections.length} section{song.sections.length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>

                    {song.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {song.tags.slice(0, 3).map(tag => (
                          <span key={tag} className="text-xs bg-secondary/50 text-secondary-foreground px-1.5 py-0.5 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/50">
                      <span className="text-xs text-muted-foreground/60">
                        {new Date(song.updatedAt).toLocaleDateString()}
                      </span>
                      <span className="text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                        Open →
                      </span>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Recent Audio Ideas */}
        {recentRecordings.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Waveform size={18} className="text-accent" />
                Recent Audio Ideas
              </h2>
              <Button variant="ghost" size="sm" onClick={() => onNavigate('audio')} className="gap-1 text-primary">
                View All <ArrowRight size={14} />
              </Button>
            </div>

            <div className="grid md:grid-cols-3 gap-3">
              {recentRecordings.map((recording) => {
                const audioUrl = recording.blobData
                  ? URL.createObjectURL(recording.blobData)
                  : recording.storageRef

                return (
                  <Card key={recording.id} className="p-4 bg-card/50">
                    <div className="flex items-start gap-3">
                      <button
                        className={cn(
                          'w-9 h-9 rounded-full flex items-center justify-center shrink-0',
                          'bg-accent/15 hover:bg-accent/25 transition-colors',
                          playingRecording === recording.id && 'bg-accent/30 text-accent'
                        )}
                        onClick={() => setPlayingRecording(
                          playingRecording === recording.id ? null : recording.id
                        )}
                      >
                        <Play size={16} weight="fill" className="text-accent ml-0.5" />
                      </button>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm truncate">{recording.title}</h3>
                        <div className="flex gap-2 mt-0.5 text-xs text-muted-foreground">
                          <span>{formatDuration(recording.durationMs)}</span>
                          <span>·</span>
                          <span>{new Date(recording.createdAt).toLocaleDateString()}</span>
                        </div>
                        {audioUrl && playingRecording === recording.id && (
                          <audio
                            src={audioUrl}
                            autoPlay
                            controls
                            className="w-full mt-2 h-8"
                            onEnded={() => setPlayingRecording(null)}
                          />
                        )}
                      </div>

                      <button
                        className="text-muted-foreground/40 hover:text-destructive transition-colors shrink-0"
                        onClick={() => handleDeleteRecording(recording.id)}
                      >
                        <Trash size={16} />
                      </button>
                    </div>
                  </Card>
                )
              })}
            </div>
          </motion.div>
        )}

        {/* Discover Promo + Practice */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="grid md:grid-cols-2 gap-4"
        >
          <Card
            className="p-6 bg-gradient-to-br from-blue-500/15 to-violet-500/5 border-blue-500/20 cursor-pointer hover:border-blue-500/40 transition-all"
            onClick={() => onNavigate('discover')}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center shrink-0">
                <Compass size={20} className="text-blue-400" weight="duotone" />
              </div>
              <div>
                <h3 className="font-semibold">Discover Songs & Tabs</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Search MusicBrainz, LRCLIB, and tab providers for lyrics, chords, and guitar tabs from your favorite artists.
                </p>
                <span className="text-xs text-blue-400 mt-2 inline-block">Explore now →</span>
              </div>
            </div>
          </Card>

          <Card
            className="p-6 bg-gradient-to-br from-emerald-500/15 to-teal-500/5 border-emerald-500/20 cursor-pointer hover:border-emerald-500/40 transition-all"
            onClick={() => onNavigate('tools')}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
                <Metronome size={20} className="text-emerald-400" weight="duotone" />
              </div>
              <div>
                <h3 className="font-semibold">Practice Tools</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Tune your guitar, practice with a metronome, train chord changes, and explore scales.
                </p>
                <span className="text-xs text-emerald-400 mt-2 inline-block">Open tools →</span>
              </div>
            </div>
          </Card>
        </motion.div>

      </div>

      {/* Floating Record Button */}
      <button
        onClick={() => setIsRecording(true)}
        className={cn(
          'fixed bottom-24 right-6 md:bottom-8 md:right-8',
          'w-14 h-14 rounded-full shadow-lg shadow-accent/30',
          'bg-accent hover:bg-accent/90 text-accent-foreground',
          'flex items-center justify-center',
          'transition-all hover:scale-110 active:scale-95',
          'z-50'
        )}
        title="Quick Record"
      >
        <Microphone size={24} weight="fill" />
      </button>

      <Dialog open={isRecording} onOpenChange={setIsRecording}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Microphone size={24} className="text-accent" />
              Quick Record Audio Idea
            </DialogTitle>
          </DialogHeader>
          <AudioRecorder onSave={() => setIsRecording(false)} />
        </DialogContent>
      </Dialog>
    </>
  )
}
