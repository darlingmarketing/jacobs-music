import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useKV } from '@github/spark/hooks'
import { Toaster } from '@/components/ui/sonner'
import { cn } from '@/lib/utils'
import { Dashboard } from '@/pages/Dashboard'
import { MySongs } from '@/pages/MySongs'
import { Library } from '@/pages/Library'
import { Discover } from '@/pages/Discover'
import { ChordsNew } from '@/pages/ChordsNew'
import { Tools } from '@/pages/Tools'
import { SongEditorV2 as SongEditor } from '@/pages/SongEditorV2'
import { AudioIdeas } from '@/pages/AudioIdeas'
import { Transcribe } from '@/pages/Transcribe'
import { TranscribeTimeline } from '@/pages/TranscribeTimeline'
import { PlayMode } from '@/components/PlayMode'
import { Progress } from '@/pages/Progress'
import { Settings } from '@/pages/Settings'
import { StyleGuide } from '@/pages/StyleGuide'
import { BottomNav, navItems } from '@/components/nav/BottomNav'
import { DesktopSidebar } from '@/components/nav/DesktopSidebar'
import { useSettings } from '@/hooks/useSettings'
import { registerKeyboardShortcuts, registerShortcut } from '@/lib/keyboardShortcuts'
import type { Song, Setlist } from '@/types'

type Page = 'dashboard' | 'songs' | 'library' | 'discover' | 'chords' | 'tools' | 'audio' | 'editor' | 'transcribe' | 'transcribe-timeline' | 'play' | 'progress' | 'settings' | 'style-guide'

export interface AppState {
  currentPage: Page
  editingSongId?: string
  /** Setlist being played (for auto-advance) */
  setlistId?: string
  /** Current position within the setlist */
  setlistIndex?: number
  /** Transcription id for the timeline page */
  transcriptionId?: string
}

function App() {
  const [state, setState] = useState<AppState>({ currentPage: 'dashboard' })
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [songs] = useKV<Song[]>('songs', [])
  const [setlists] = useKV<Setlist[]>('setlists', [])

  // Apply persisted settings (theme, font size, accessibility, etc.)
  useSettings()

  const navigateTo = (page: Page, songId?: string, transcriptionId?: string) => {
    setState({ currentPage: page, editingSongId: songId, transcriptionId })
  }

  // Register global keyboard shortcuts
  useEffect(() => {
    const cleanupListener = registerKeyboardShortcuts()
    const cleanupSave = registerShortcut('save-song', {
      description: 'Save current song',
      combo: 'ctrl+s',
      handler: e => {
        // SongEditor handles its own save; prevent browser default
        e.preventDefault()
      },
    })
    const cleanupHelp = registerShortcut('open-help', {
      description: 'Open keyboard shortcut help',
      combo: '?',
      handler: () => {
        // Future: open help overlay
      },
    })
    return () => {
      cleanupListener()
      cleanupSave()
      cleanupHelp()
    }
  }, [])

  const launchSetlist = (setlistId: string, index: number) => {
    const setlist = (setlists ?? []).find(s => s.id === setlistId)
    if (!setlist || setlist.songIds.length === 0) return
    const songId = setlist.songIds[index]
    if (!songId) return
    setState({ currentPage: 'play', editingSongId: songId, setlistId, setlistIndex: index })
  }

  const renderPage = () => {
    // Full-screen play mode – rendered outside normal layout
    if (state.currentPage === 'play') {
      const song = (songs ?? []).find(s => s.id === state.editingSongId)
      if (song) {
        const activeSetlist = state.setlistId
          ? (setlists ?? []).find(s => s.id === state.setlistId)
          : null
        const currentIndex = state.setlistIndex ?? 0
        const hasNextSong =
          !!activeSetlist &&
          currentIndex < activeSetlist.songIds.length - 1

        const handleNextSong = hasNextSong
          ? () => launchSetlist(state.setlistId!, currentIndex + 1)
          : undefined

        return (
          <PlayMode
            song={song}
            onExit={() => navigateTo('editor', song.id)}
            onNextSong={handleNextSong}
            setlistPosition={
              activeSetlist
                ? { current: currentIndex + 1, total: activeSetlist.songIds.length }
                : undefined
            }
          />
        )
      }
      // Fallback if song not found
      return <Dashboard onNavigate={navigateTo} />
    }

    switch (state.currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={navigateTo} />
      case 'songs':
        return <MySongs onNavigate={navigateTo} />
      case 'library':
        return <Library onNavigate={navigateTo} onLaunchSetlist={launchSetlist} />
      case 'discover':
        return <Discover onNavigate={navigateTo} />
      case 'chords':
        return <ChordsNew />
      case 'tools':
        return <Tools />
      case 'audio':
        return <AudioIdeas />
      case 'transcribe':
        return <Transcribe onNavigate={navigateTo} />
      case 'transcribe-timeline':
        return state.transcriptionId
          ? <TranscribeTimeline transcriptionId={state.transcriptionId} onNavigate={navigateTo} />
          : <Transcribe onNavigate={navigateTo} />
      case 'editor':
        return <SongEditor songId={state.editingSongId} onNavigate={navigateTo} />
      case 'progress':
        return <Progress />
      case 'settings':
        return <Settings />
      case 'style-guide':
        return <StyleGuide />
      default:
        return <Dashboard onNavigate={navigateTo} />
    }
  }

  const [isBooting, setIsBooting] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setIsBooting(false), 1500)
    return () => clearTimeout(timer)
  }, [])

  if (isBooting) {
    return (
      <div className="fixed inset-0 bg-background z-[100] flex flex-col items-center justify-center gap-8">
        {/* Background glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-accent/5 rounded-full blur-3xl pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative w-28 h-28"
        >
          {/* Outer glow ring */}
          <motion.div
            animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.15, 0.3] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 bg-primary/30 blur-2xl rounded-full"
          />
          <svg viewBox="0 0 100 100" className="w-full h-full fill-none stroke-[2]">
            {/* Outer hexagon */}
            <motion.path
              d="M50 8 L88 30 L88 70 L50 92 L12 70 L12 30 Z"
              className="stroke-primary/30"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
            />
            {/* Inner hexagon */}
            <motion.path
              d="M50 20 L76 36 L76 64 L50 80 L24 64 L24 36 Z"
              className="stroke-primary"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
            />
            {/* Waveform */}
            <motion.path
              d="M25 50 Q 35 35, 45 50 T 55 50 T 65 50 T 75 50"
              className="stroke-accent stroke-[1.5]"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.8 }}
              transition={{ duration: 0.8, delay: 0.8, ease: "easeOut" }}
            />
          </svg>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="text-center space-y-2"
        >
          <h1 className="text-3xl font-bold tracking-[0.25em] font-display text-gradient">STRUM AI</h1>
          <p className="text-xs text-muted-foreground/70 font-mono tracking-[0.2em] uppercase">Jacob's Music Studio</p>
        </motion.div>

        {/* Progress bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="w-48"
        >
          <div className="h-0.5 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 1.2, delay: 0.3, ease: "easeInOut" }}
            />
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Desktop sidebar */}
      <DesktopSidebar
        currentPage={state.currentPage}
        onNavigate={navigateTo}
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
      />

      {/* Main content - shifts with sidebar */}
      <div className={cn(
        'flex-1 flex flex-col transition-all duration-250',
        sidebarCollapsed ? 'md:ml-16' : 'md:ml-[220px]'
      )}>
        <main className="flex-1 pb-20 md:pb-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${state.currentPage}-${state.editingSongId ?? 'none'}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderPage()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <BottomNav currentPage={state.currentPage} onNavigate={navigateTo} />

      <Toaster />
    </div>
  )
}

export default App
