import { useState, useRef, useEffect } from 'react'
import type { ChordSegment } from '@/types/transcription'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Play,
  Pause,
  ArrowsOutCardinal,
  ArrowsInCardinal,
  Scissors,
  Trash,
  Minus,
  Plus
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface ChordTimelineEditorProps {
  segments: ChordSegment[]
  audioUrl?: string
  audioDurationMs: number
  onChange: (segments: ChordSegment[]) => void
}

export function ChordTimelineEditor({
  segments,
  audioUrl,
  audioDurationMs,
  onChange
}: ChordTimelineEditorProps) {
  const [playheadMs, setPlayheadMs] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null)
  const [editingSegmentId, setEditingSegmentId] = useState<string | null>(null)
  const [dragState, setDragState] = useState<{
    id: string
    type: 'move' | 'resize-start' | 'resize-end'
    initialX: number
    initialStartMs: number
    initialEndMs: number
  } | null>(null)
  
  const audioRef = useRef<HTMLAudioElement>(null)
  const timelineRef = useRef<HTMLDivElement>(null)
  const animationFrameRef = useRef<number>()
  
  const msToPixels = (ms: number) => {
    const width = timelineRef.current?.offsetWidth || 1000
    return (ms / audioDurationMs) * width * zoom
  }
  
  const pixelsToMs = (px: number) => {
    const width = timelineRef.current?.offsetWidth || 1000
    return (px / (width * zoom)) * audioDurationMs
  }
  
  useEffect(() => {
    if (isPlaying && audioRef.current) {
      const updatePlayhead = () => {
        if (audioRef.current) {
          setPlayheadMs(audioRef.current.currentTime * 1000)
          animationFrameRef.current = requestAnimationFrame(updatePlayhead)
        }
      }
      animationFrameRef.current = requestAnimationFrame(updatePlayhead)
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isPlaying])
  
  const togglePlayPause = () => {
    if (!audioRef.current) return
    
    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }
  
  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return
    
    const rect = timelineRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const ms = pixelsToMs(x)
    
    setPlayheadMs(ms)
    if (audioRef.current) {
      audioRef.current.currentTime = ms / 1000
    }
  }
  
  const handleSegmentMouseDown = (
    e: React.MouseEvent,
    segment: ChordSegment,
    type: 'move' | 'resize-start' | 'resize-end'
  ) => {
    e.stopPropagation()
    setDragState({
      id: segment.id,
      type,
      initialX: e.clientX,
      initialStartMs: segment.startMs,
      initialEndMs: segment.endMs
    })
    setSelectedSegmentId(segment.id)
  }
  
  useEffect(() => {
    if (!dragState) return
    
    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragState.initialX
      const deltaMs = pixelsToMs(deltaX)
      
      const newSegments = segments.map(seg => {
        if (seg.id !== dragState.id) return seg
        
        if (dragState.type === 'move') {
          const duration = dragState.initialEndMs - dragState.initialStartMs
          const newStart = Math.max(0, dragState.initialStartMs + deltaMs)
          const newEnd = Math.min(audioDurationMs, newStart + duration)
          return { ...seg, startMs: newStart, endMs: newEnd }
        } else if (dragState.type === 'resize-start') {
          const newStart = Math.max(0, Math.min(dragState.initialStartMs + deltaMs, seg.endMs - 100))
          return { ...seg, startMs: newStart }
        } else if (dragState.type === 'resize-end') {
          const newEnd = Math.min(audioDurationMs, Math.max(dragState.initialEndMs + deltaMs, seg.startMs + 100))
          return { ...seg, endMs: newEnd }
        }
        return seg
      })
      
      onChange(newSegments)
    }
    
    const handleMouseUp = () => {
      setDragState(null)
    }
    
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [dragState, segments, audioDurationMs, onChange])
  
  const handleDeleteSegment = (id: string) => {
    onChange(segments.filter(s => s.id !== id))
    setSelectedSegmentId(null)
    setEditingSegmentId(null)
  }
  
  const handleSplitSegment = (segment: ChordSegment) => {
    const midpoint = (segment.startMs + segment.endMs) / 2
    const newSegments = segments.flatMap(s => {
      if (s.id !== segment.id) return [s]
      return [
        { ...s, id: crypto.randomUUID(), endMs: midpoint },
        { ...s, id: crypto.randomUUID(), startMs: midpoint }
      ]
    })
    onChange(newSegments)
    setSelectedSegmentId(null)
  }
  
  const handleChordChange = (id: string, newChord: string) => {
    onChange(segments.map(s => s.id === id ? { ...s, chord: newChord } : s))
  }
  
  const selectedSegment = segments.find(s => s.id === selectedSegmentId)
  const editingSegment = segments.find(s => s.id === editingSegmentId)
  
  return (
    <div className="space-y-4">
      {audioUrl && (
        <audio ref={audioRef} src={audioUrl} onEnded={() => setIsPlaying(false)} />
      )}
      
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          onClick={togglePlayPause}
          variant="outline"
          size="sm"
          disabled={!audioUrl}
        >
          {isPlaying ? <Pause size={16} /> : <Play size={16} />}
        </Button>
        
        <div className="flex items-center gap-1">
          <Button
            onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
            variant="outline"
            size="sm"
          >
            <Minus size={16} />
          </Button>
          <span className="text-sm text-muted-foreground min-w-[60px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <Button
            onClick={() => setZoom(Math.min(4, zoom + 0.25))}
            variant="outline"
            size="sm"
          >
            <Plus size={16} />
          </Button>
        </div>
        
        {selectedSegment && (
          <>
            <Button
              onClick={() => handleSplitSegment(selectedSegment)}
              variant="outline"
              size="sm"
            >
              <Scissors size={16} />
            </Button>
            <Button
              onClick={() => handleDeleteSegment(selectedSegment.id)}
              variant="outline"
              size="sm"
            >
              <Trash size={16} />
            </Button>
            <Button
              onClick={() => setEditingSegmentId(selectedSegment.id)}
              variant="outline"
              size="sm"
            >
              Edit Chord
            </Button>
          </>
        )}
      </div>
      
      <div className="border border-border rounded-md p-4 bg-card overflow-x-auto">
        <div
          ref={timelineRef}
          className="relative h-24 bg-muted/20 rounded cursor-pointer"
          onClick={handleTimelineClick}
          style={{ width: `${zoom * 100}%`, minWidth: '100%' }}
        >
          {segments.map(segment => {
            const left = msToPixels(segment.startMs)
            const width = msToPixels(segment.endMs - segment.startMs)
            const isSelected = segment.id === selectedSegmentId
            
            return (
              <div
                key={segment.id}
                className={cn(
                  "absolute top-2 bottom-2 rounded border-2 flex items-center justify-center text-xs font-medium transition-colors cursor-move select-none",
                  isSelected 
                    ? "bg-primary/20 border-primary text-primary" 
                    : "bg-accent/40 border-accent text-accent-foreground hover:bg-accent/60"
                )}
                style={{ left: `${left}px`, width: `${width}px` }}
                onMouseDown={(e) => handleSegmentMouseDown(e, segment, 'move')}
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedSegmentId(segment.id)
                }}
              >
                <div
                  className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-primary/40"
                  onMouseDown={(e) => handleSegmentMouseDown(e, segment, 'resize-start')}
                />
                
                <span className="truncate px-2">{segment.chord}</span>
                
                <div
                  className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-primary/40"
                  onMouseDown={(e) => handleSegmentMouseDown(e, segment, 'resize-end')}
                />
              </div>
            )
          })}
          
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-primary pointer-events-none"
            style={{ left: `${msToPixels(playheadMs)}px` }}
          >
            <div className="absolute -top-1 -left-1 w-2 h-2 bg-primary rounded-full" />
          </div>
        </div>
        
        <div className="mt-2 flex justify-between text-xs text-muted-foreground">
          <span>0:00</span>
          <span>{Math.floor(audioDurationMs / 60000)}:{String(Math.floor((audioDurationMs % 60000) / 1000)).padStart(2, '0')}</span>
        </div>
      </div>
      
      <Dialog open={!!editingSegmentId} onOpenChange={() => setEditingSegmentId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Chord</DialogTitle>
          </DialogHeader>
          {editingSegment && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="chord">Chord Name</Label>
                <Input
                  id="chord"
                  value={editingSegment.chord}
                  onChange={(e) => handleChordChange(editingSegment.id, e.target.value)}
                  placeholder="e.g., Am, C, G7"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start (ms)</Label>
                  <div className="text-sm text-muted-foreground">
                    {Math.round(editingSegment.startMs)}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>End (ms)</Label>
                  <div className="text-sm text-muted-foreground">
                    {Math.round(editingSegment.endMs)}
                  </div>
                </div>
              </div>
              <Button onClick={() => setEditingSegmentId(null)} className="w-full">
                Done
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
