import { useState } from 'react'
import {
  House, MusicNotes, Compass, Guitar, WaveformSlash,
  BookBookmark, Waveform, Wrench, ChartBar, GearSix, DotsThree
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

export type NavPage = 'dashboard' | 'songs' | 'library' | 'discover' | 'audio' | 'transcribe' | 'chords' | 'tools' | 'progress' | 'settings'

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
  { id: 'settings', icon: GearSix, label: 'Settings' },
]

// Primary items shown in the bottom bar (5 max)
const PRIMARY_NAV: NavPage[] = ['dashboard', 'songs', 'discover', 'tools', 'chords']

// Secondary items shown in "more" menu
const SECONDARY_NAV: NavPage[] = ['library', 'audio', 'transcribe', 'progress', 'settings']

interface BottomNavProps {
  currentPage: string
  onNavigate: (page: NavPage) => void
}

export function BottomNav({ currentPage, onNavigate }: BottomNavProps) {
  const [showMore, setShowMore] = useState(false)

  const primaryItems = navItems.filter(item => PRIMARY_NAV.includes(item.id))
  const secondaryItems = navItems.filter(item => SECONDARY_NAV.includes(item.id))
  const isSecondaryActive = SECONDARY_NAV.includes(currentPage as NavPage)

  const handleNavigate = (page: NavPage) => {
    onNavigate(page)
    setShowMore(false)
  }

  return (
    <>
      {/* More menu overlay */}
      <AnimatePresence>
        {showMore && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/60 backdrop-blur-sm z-40 md:hidden"
              onClick={() => setShowMore(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.2 }}
              className="fixed bottom-16 left-0 right-0 z-50 md:hidden bg-card border-t border-border pb-2"
            >
              <div className="grid grid-cols-5 gap-1 p-3">
                {secondaryItems.map(item => {
                  const Icon = item.icon
                  const isActive = currentPage === item.id
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavigate(item.id)}
                      className={cn(
                        'flex flex-col items-center justify-center gap-1 p-3 rounded-xl transition-colors',
                        isActive
                          ? 'bg-primary/15 text-primary'
                          : 'text-muted-foreground hover:bg-secondary/40 hover:text-foreground'
                      )}
                    >
                      <Icon size={22} weight={isActive ? 'fill' : 'regular'} />
                      <span className="text-[10px] font-medium leading-none">{item.label}</span>
                    </button>
                  )
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bottom nav bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t border-border md:hidden z-30"
        aria-label="Bottom navigation"
      >
        <div className="flex justify-around items-center h-16">
          {primaryItems.map(item => {
            const Icon = item.icon
            const isActive = currentPage === item.id
            return (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 px-3 py-2 min-w-0 transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute w-8 h-0.5 bg-primary rounded-full top-0"
                  />
                )}
                <Icon size={22} weight={isActive ? 'fill' : 'regular'} />
                <span className="text-[10px] font-medium leading-none truncate">{item.label}</span>
              </button>
            )
          })}

          {/* More button */}
          <button
            onClick={() => setShowMore(prev => !prev)}
            className={cn(
              'flex flex-col items-center justify-center gap-1 px-3 py-2 transition-colors relative',
              (showMore || isSecondaryActive) ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            <DotsThree size={22} weight={showMore ? 'fill' : 'regular'} />
            <span className="text-[10px] font-medium leading-none">More</span>
            {isSecondaryActive && !showMore && (
              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-primary" />
            )}
          </button>
        </div>
      </nav>
    </>
  )
}
