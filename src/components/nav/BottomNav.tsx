import { House, MusicNotes, BookBookmark, Compass, Waveform, WaveformSlash, Guitar, Wrench, ChartBar } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

export type NavPage = 'dashboard' | 'songs' | 'library' | 'discover' | 'audio' | 'transcribe' | 'chords' | 'tools' | 'progress'

export const navItems: { id: NavPage; icon: React.ComponentType<{ size: number; weight: 'fill' | 'regular' }>; label: string }[] = [
  { id: 'dashboard', icon: House, label: 'Home' },
  { id: 'songs', icon: MusicNotes, label: 'Songs' },
  { id: 'library', icon: BookBookmark, label: 'Library' },
  { id: 'discover', icon: Compass, label: 'Discover' },
  { id: 'audio', icon: Waveform, label: 'Audio' },
  { id: 'transcribe', icon: WaveformSlash, label: 'Transcribe' },
  { id: 'chords', icon: Guitar, label: 'Chords' },
  { id: 'tools', icon: Wrench, label: 'Tools' },
  { id: 'progress', icon: ChartBar, label: 'Progress' },
]

interface BottomNavProps {
  currentPage: string
  onNavigate: (page: NavPage) => void
}

export function BottomNav({ currentPage, onNavigate }: BottomNavProps) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-card border-t border-border md:hidden"
      aria-label="Bottom navigation"
    >
      <div className="flex justify-around items-center h-16">
        {navItems.map(item => {
          const Icon = item.icon
          const isActive = currentPage === item.id
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex flex-col items-center justify-center gap-1 px-3 py-2 transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <Icon size={24} weight={isActive ? 'fill' : 'regular'} />
              <span className="text-xs">{item.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
