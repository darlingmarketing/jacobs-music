import { useState } from 'react'
import { House, MusicNotes, BookBookmark, MagnifyingGlass, Guitar, Wrench, Waveform, WaveformSlash } from '@phosphor-icons/react'
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

type Page = 'dashboard' | 'songs' | 'library' | 'discover' | 'chords' | 'tools' | 'audio' | 'editor' | 'transcribe'

export interface AppState {
  currentPage: Page
  editingSongId?: string
}

function App() {
  const [state, setState] = useState<AppState>({ currentPage: 'dashboard' })

  const navigateTo = (page: Page, songId?: string) => {
    setState({ currentPage: page, editingSongId: songId })
  }

  const renderPage = () => {
    switch (state.currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={navigateTo} />
      case 'songs':
        return <MySongs onNavigate={navigateTo} />
      case 'library':
        return <Library onNavigate={navigateTo} />
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
      case 'editor':
        return <SongEditor songId={state.editingSongId} onNavigate={navigateTo} />
      default:
        return <Dashboard onNavigate={navigateTo} />
    }
  }

  const navItems = [
    { id: 'dashboard' as const, icon: House, label: 'Home' },
    { id: 'songs' as const, icon: MusicNotes, label: 'Songs' },
    { id: 'audio' as const, icon: Waveform, label: 'Audio' },
    { id: 'transcribe' as const, icon: WaveformSlash, label: 'Transcribe' },
    { id: 'chords' as const, icon: Guitar, label: 'Chords' },
    { id: 'tools' as const, icon: Wrench, label: 'Tools' }
  ]

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <main className="flex-1 pb-20 md:pb-6">
        {renderPage()}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border md:hidden">
        <div className="flex justify-around items-center h-16">
          {navItems.map(item => {
            const Icon = item.icon
            const isActive = state.currentPage === item.id
            return (
              <button
                key={item.id}
                onClick={() => navigateTo(item.id)}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 px-3 py-2 transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Icon size={24} weight={isActive ? "fill" : "regular"} />
                <span className="text-xs">{item.label}</span>
              </button>
            )
          })}
        </div>
      </nav>

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
    </div>
  )
}

export default App
