import { useState, useEffect, useRef } from 'react'
import type { BlockType } from '@/types'
import { Card } from '@/components/ui/card'
import { 
  TextAa, 
  MusicNotes, 
  Code, 
  Note, 
  Waveform, 
  TextHOne,
  Minus
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

export interface SlashCommand {
  id: BlockType | 'heading1' | 'heading2' | 'heading3'
  type: BlockType
  label: string
  description: string
  icon: any
  keywords: string[]
}

interface SlashCommandMenuProps {
  onSelect: (command: SlashCommand) => void
  onClose: () => void
  filter?: string
  position?: { top: number; left: number }
}

const COMMANDS: SlashCommand[] = [
  {
    id: 'lyrics',
    type: 'lyrics',
    label: 'Lyrics',
    description: 'Add lyrics with inline chord tags [G]',
    icon: TextAa,
    keywords: ['lyrics', 'text', 'words', 'song']
  },
  {
    id: 'chords',
    type: 'chords',
    label: 'Chords',
    description: 'Add chord progression | G | D | Em |',
    icon: MusicNotes,
    keywords: ['chords', 'progression', 'music']
  },
  {
    id: 'tab',
    type: 'tab',
    label: 'Tab',
    description: 'Add guitar tablature',
    icon: Code,
    keywords: ['tab', 'tablature', 'guitar', 'bass']
  },
  {
    id: 'note',
    type: 'note',
    label: 'Note',
    description: 'Add a note or comment',
    icon: Note,
    keywords: ['note', 'comment', 'reminder']
  },
  {
    id: 'audio',
    type: 'audio',
    label: 'Audio',
    description: 'Record or attach audio idea',
    icon: Waveform,
    keywords: ['audio', 'recording', 'voice', 'memo']
  },
  {
    id: 'heading1',
    type: 'heading',
    label: 'Heading 1',
    description: 'Large section heading',
    icon: TextHOne,
    keywords: ['heading', 'h1', 'title', 'header']
  },
  {
    id: 'divider',
    type: 'divider',
    label: 'Divider',
    description: 'Visual separator line',
    icon: Minus,
    keywords: ['divider', 'separator', 'line', 'hr']
  }
]

export function SlashCommandMenu({ 
  onSelect, 
  onClose, 
  filter = '',
  position 
}: SlashCommandMenuProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const menuRef = useRef<HTMLDivElement>(null)

  const filteredCommands = COMMANDS.filter(cmd => {
    if (!filter) return true
    const searchTerm = filter.toLowerCase()
    return (
      cmd.label.toLowerCase().includes(searchTerm) ||
      cmd.description.toLowerCase().includes(searchTerm) ||
      cmd.keywords.some(k => k.includes(searchTerm))
    )
  })

  useEffect(() => {
    setSelectedIndex(0)
  }, [filter])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(i => Math.min(i + 1, filteredCommands.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(i => Math.max(i - 1, 0))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (filteredCommands[selectedIndex]) {
          onSelect(filteredCommands[selectedIndex])
        }
      } else if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedIndex, filteredCommands, onSelect, onClose])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  if (filteredCommands.length === 0) {
    return (
      <Card
        ref={menuRef}
        className="absolute z-50 w-80 p-2 bg-popover border shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-150"
        style={position}
      >
        <div className="p-3 text-sm text-muted-foreground text-center">
          No commands found
        </div>
      </Card>
    )
  }

  return (
    <Card
      ref={menuRef}
      className="absolute z-50 w-80 p-2 bg-popover border shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-150"
      style={position}
    >
      <div className="flex flex-col gap-1">
        {filteredCommands.map((command, index) => {
          const Icon = command.icon
          return (
            <button
              key={command.id}
              onClick={() => onSelect(command)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={cn(
                "flex items-start gap-3 p-3 rounded-md transition-colors text-left",
                "hover:bg-accent focus:bg-accent outline-none",
                selectedIndex === index && "bg-accent"
              )}
            >
              <Icon size={20} className="text-primary mt-0.5 flex-shrink-0" weight="bold" />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">{command.label}</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {command.description}
                </div>
              </div>
            </button>
          )
        })}
      </div>
      
      <div className="mt-2 pt-2 border-t border-border px-3 py-1">
        <div className="text-xs text-muted-foreground flex items-center gap-2">
          <span>↑↓ Navigate</span>
          <span>•</span>
          <span>↵ Select</span>
          <span>•</span>
          <span>Esc Close</span>
        </div>
      </div>
    </Card>
  )
}
