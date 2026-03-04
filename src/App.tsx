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

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
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

      <BottomNav currentPage={state.currentPage} onNavigate={navigateTo} />

      <nav className="hidden md:block fixed top-0 left-0 right-0 bg-card border-b border-border z-10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center gap-8">
          <h1 className="text-xl font-bold text-primary">Jacobs Music</h1>
          <div className="flex gap-1">
            {navItems.map(item => {
              const Icon = item.icon
              const isActive = state.currentPage === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => navigateTo(item.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-md transition-colors",
                    isActive 
                      ? "bg-primary/10 text-primary" 
                      : "text-muted-foreground hover:bg-secondary"
                  )}
                >
                  <Icon size={20} weight={isActive ? "fill" : "regular"} />
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </nav>

      <div className="hidden md:block h-16" />
      <Toaster />
    </div>
  )
}

export default App
