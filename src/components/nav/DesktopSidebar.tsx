import { motion } from 'framer-motion'
import {
  House, MusicNotes, BookBookmark, Compass, Waveform, WaveformSlash,
  Guitar, Wrench, ChartBar, GearSix, CaretLeft, CaretRight, MusicNote
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import type { NavPage } from './BottomNav'

interface DesktopSidebarProps {
  currentPage: string
  onNavigate: (page: NavPage) => void
  collapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
}

const NAV_SECTIONS = [
  {
    label: 'Create',
    items: [
      { id: 'dashboard' as NavPage, icon: House, label: 'Home' },
      { id: 'songs' as NavPage, icon: MusicNotes, label: 'My Songs' },
      { id: 'audio' as NavPage, icon: Waveform, label: 'Audio Ideas' },
    ],
  },
  {
    label: 'Learn',
    items: [
      { id: 'discover' as NavPage, icon: Compass, label: 'Discover' },
      { id: 'chords' as NavPage, icon: Guitar, label: 'Chords' },
      { id: 'transcribe' as NavPage, icon: WaveformSlash, label: 'Transcribe' },
    ],
  },
  {
    label: 'Practice',
    items: [
      { id: 'tools' as NavPage, icon: Wrench, label: 'Tools' },
      { id: 'library' as NavPage, icon: BookBookmark, label: 'Library' },
      { id: 'progress' as NavPage, icon: ChartBar, label: 'Progress' },
    ],
  },
]

export function DesktopSidebar({ currentPage, onNavigate, collapsed = false, onCollapsedChange }: DesktopSidebarProps) {
  const setCollapsed = (val: boolean | ((prev: boolean) => boolean)) => {
    const next = typeof val === 'function' ? val(collapsed) : val
    onCollapsedChange?.(next)
  }

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 64 : 220 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 bg-card border-r border-border z-20 overflow-hidden shrink-0"
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-border shrink-0">
        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
          <MusicNote size={16} className="text-primary" weight="fill" />
        </div>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="ml-3 overflow-hidden"
          >
            <span className="font-bold text-sm tracking-tight text-gradient whitespace-nowrap">
              STRUM AI
            </span>
            <p className="text-xs text-muted-foreground whitespace-nowrap">Jacob's Music</p>
          </motion.div>
        )}
      </div>

      {/* Nav items */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4 px-2">
        {NAV_SECTIONS.map(section => (
          <div key={section.label}>
            {!collapsed && (
              <p className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-widest px-2 mb-1">
                {section.label}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map(item => {
                const Icon = item.icon
                const isActive = currentPage === item.id
                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      'w-full flex items-center gap-3 px-2 py-2 rounded-lg transition-all text-sm font-medium',
                      isActive
                        ? 'bg-primary/15 text-primary'
                        : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground',
                      collapsed && 'justify-center px-0'
                    )}
                  >
                    <Icon
                      size={18}
                      weight={isActive ? 'fill' : 'regular'}
                      className="shrink-0"
                    />
                    {!collapsed && (
                      <span className="truncate">{item.label}</span>
                    )}
                    {isActive && !collapsed && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom: Settings + Collapse */}
      <div className="border-t border-border p-2 space-y-0.5 shrink-0">
        <button
          onClick={() => onNavigate('settings')}
          title={collapsed ? 'Settings' : undefined}
          className={cn(
            'w-full flex items-center gap-3 px-2 py-2 rounded-lg transition-all text-sm font-medium',
            currentPage === 'settings'
              ? 'bg-primary/15 text-primary'
              : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground',
            collapsed && 'justify-center px-0'
          )}
        >
          <GearSix size={18} weight={currentPage === 'settings' ? 'fill' : 'regular'} className="shrink-0" />
          {!collapsed && <span>Settings</span>}
        </button>

        <button
          onClick={() => setCollapsed(c => !c)}
          className={cn(
            'w-full flex items-center gap-3 px-2 py-2 rounded-lg transition-all text-sm',
            'text-muted-foreground/60 hover:text-muted-foreground hover:bg-secondary/40',
            collapsed && 'justify-center px-0'
          )}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <CaretRight size={16} className="shrink-0" />
          ) : (
            <>
              <CaretLeft size={16} className="shrink-0" />
              <span className="text-xs">Collapse</span>
            </>
          )}
        </button>
      </div>
    </motion.aside>
  )
}
