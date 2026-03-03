import { useState, useCallback, useRef } from 'react'
import type { Section, Block, SectionType, BlockType } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Trash, DotsSixVertical } from '@phosphor-icons/react'
import { BlockEditor } from '@/components/BlockEditor'
import { cn } from '@/lib/utils'

const BLOCK_TYPES: BlockType[] = ['lyrics', 'chords', 'tab', 'note', 'audio', 'heading', 'divider']
const TAB_DEFAULT = 'e|---|\nB|---|\nG|---|\nD|---|\nA|---|\nE|---|'

interface SectionEditorProps {
  sections: Section[]
  semitones?: number
  onChange: (sections: Section[]) => void
}

function generateId() {
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

export function SectionEditor({ sections, semitones = 0, onChange }: SectionEditorProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const dragNodeRef = useRef<HTMLDivElement | null>(null)

  const updateSection = useCallback(
    (sectionId: string, updates: Partial<Section>) => {
      onChange(sections.map(s => (s.id === sectionId ? { ...s, ...updates } : s)))
    },
    [sections, onChange]
  )

  const deleteSection = useCallback(
    (sectionId: string) => {
      onChange(sections.filter(s => s.id !== sectionId))
    },
    [sections, onChange]
  )

  const addSection = () => {
    const newSection: Section = {
      id: generateId(),
      name: `Section ${sections.length + 1}`,
      type: 'verse',
      order: sections.length,
      blocks: []
    }
    onChange([...sections, newSection])
  }

  const addBlock = useCallback(
    (sectionId: string, type: BlockType) => {
      const newBlock: Block = {
        id: generateId(),
        type,
        content: type === 'tab' ? TAB_DEFAULT : ''
      }
      onChange(
        sections.map(s =>
          s.id === sectionId ? { ...s, blocks: [...s.blocks, newBlock] } : s
        )
      )
    },
    [sections, onChange]
  )

  const updateBlock = useCallback(
    (sectionId: string, blockId: string, updates: Partial<Block>) => {
      onChange(
        sections.map(s =>
          s.id === sectionId
            ? {
                ...s,
                blocks: s.blocks.map(b => (b.id === blockId ? { ...b, ...updates } : b))
              }
            : s
        )
      )
    },
    [sections, onChange]
  )

  const deleteBlock = useCallback(
    (sectionId: string, blockId: string) => {
      onChange(
        sections.map(s =>
          s.id === sectionId
            ? { ...s, blocks: s.blocks.filter(b => b.id !== blockId) }
            : s
        )
      )
    },
    [sections, onChange]
  )

  const convertBlock = useCallback(
    (sectionId: string, blockId: string, type: BlockType) => {
      onChange(
        sections.map(s =>
          s.id === sectionId
            ? {
                ...s,
                blocks: s.blocks.map(b =>
                  b.id === blockId ? { ...b, type, content: type === 'tab' ? TAB_DEFAULT : b.content } : b
                )
              }
            : s
        )
      )
    },
    [sections, onChange]
  )

  // Drag-and-drop handlers for sections
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDragIndex(index)
    e.dataTransfer.effectAllowed = 'move'
    dragNodeRef.current = e.currentTarget as HTMLDivElement
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverIndex(index)
  }

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault()
    if (dragIndex === null || dragIndex === targetIndex) {
      setDragIndex(null)
      setDragOverIndex(null)
      return
    }
    const reordered = [...sections]
    const [moved] = reordered.splice(dragIndex, 1)
    reordered.splice(targetIndex, 0, moved)
    onChange(reordered.map((s, i) => ({ ...s, order: i })))
    setDragIndex(null)
    setDragOverIndex(null)
  }

  const handleDragEnd = () => {
    setDragIndex(null)
    setDragOverIndex(null)
  }

  return (
    <div className="space-y-4">
      {sections.map((section, index) => (
        <Card
          key={section.id}
          draggable
          onDragStart={(e) => handleDragStart(e, index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDrop={(e) => handleDrop(e, index)}
          onDragEnd={handleDragEnd}
          className={cn(
            'p-4 transition-all duration-150',
            dragIndex === index && 'opacity-40',
            dragOverIndex === index && dragIndex !== index && 'border-primary shadow-md'
          )}
        >
          {/* Section header */}
          <div className="flex items-center gap-2 mb-4">
            <div
              className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
              title="Drag to reorder"
            >
              <DotsSixVertical size={20} />
            </div>
            <Input
              value={section.name}
              onChange={(e) => updateSection(section.id, { name: e.target.value })}
              className="font-semibold max-w-[160px]"
              aria-label="Section name"
            />
            <Select
              value={section.type}
              onValueChange={(value: SectionType) => updateSection(section.id, { type: value })}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="intro">Intro</SelectItem>
                <SelectItem value="verse">Verse</SelectItem>
                <SelectItem value="chorus">Chorus</SelectItem>
                <SelectItem value="bridge">Bridge</SelectItem>
                <SelectItem value="solo">Solo</SelectItem>
                <SelectItem value="outro">Outro</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex-1" />
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive hover:text-destructive"
              onClick={() => deleteSection(section.id)}
              title="Delete section"
            >
              <Trash size={16} />
            </Button>
          </div>

          {/* Blocks */}
          <div className="space-y-3">
            {section.blocks.map(block => (
              <BlockEditor
                key={block.id}
                block={block}
                semitones={semitones}
                onChange={(updates) => updateBlock(section.id, block.id, updates)}
                onDelete={() => deleteBlock(section.id, block.id)}
                onConvert={(type) => convertBlock(section.id, block.id, type)}
              />
            ))}

            {/* Add block buttons */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {BLOCK_TYPES.map(type => (
                <Button
                  key={type}
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs gap-1"
                  onClick={() => addBlock(section.id, type)}
                >
                  <Plus size={12} />
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </Card>
      ))}

      <Button onClick={addSection} variant="outline" className="w-full gap-2">
        <Plus size={16} />
        Add Section
      </Button>
    </div>
  )
}
