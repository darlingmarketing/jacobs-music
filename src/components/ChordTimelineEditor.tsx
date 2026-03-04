import { useState, useRef, useEffect, useCallback } from 'react'
import type { ChordSegment } from '@/lib/transcribe/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Play,
  Pause,
  Scissors,
  Trash,
  Minus,
  Plus
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { clamp, snapMs, beatGridMs } from '@/lib/transcribe/timelineMath'
import { searchChords } from '@/lib/chordDatabase'

type DragType = 'move' | 'resize-start' | 'resize-end'

interface DragState {
  id: string
  type: DragType
  initialX: number
  initialStartMs: number
  initialEndMs: number
}

export type Props = {
  audioDurationMs: number
  segments: ChordSegment[]
  tempoBpm?: number
  timeSig?: { beats: number; beatValue: number }
  onChange(segments: ChordSegment[]): void
  onSeekMs?(ms: number): void
  seekMs?: number
  audioUrl?: string
}

const DEFAULT_GRID_MS = 250
const MIN_SEGMENT_MS = 100

export function ChordTimelineEditor({
  audioDurationMs,
  segments,
  tempoBpm,
  timeSig,
  onChange,
  onSeekMs,
  seekMs,
  audioUrl,
}: Props) {
  const [playheadMs, setPlayheadMs] = useState(seekMs ?? 0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null)
  const [editingSegmentId, setEditingSegmentId] = useState<string | null>(null)
  const [editingChord, setEditingChord] = useState('')
  const [snapToBeat, setSnapToBeat] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])

  const audioRef = useRef<HTMLAudioElement>(null)
  const timelineRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const animationFrameRef = useRef<number>()
  const dragRef = useRef<DragState | null>(null)
  const segmentsRef = useRef(segments)
  segmentsRef.current = segments

  // Sync controlled seekMs
  useEffect(() => {
    if (seekMs !== undefined) setPlayheadMs(seekMs)
  }, [seekMs])

  const getGridMs = useCallback(() => {
    if (snapToBeat && tempoBpm && timeSig) {
      return beatGridMs(tempoBpm, timeSig)
    }
    return DEFAULT_GRID_MS
  }, [snapToBeat, tempoBpm, timeSig])

  const msToPixels = useCallback((ms: number) => {
    const width = timelineRef.current?.offsetWidth || 1000
    return (ms / audioDurationMs) * width * zoom
  }, [audioDurationMs, zoom])

  const pixelsToMs = useCallback((px: number) => {
    const width = timelineRef.current?.offsetWidth || 1000
    return (px / (width * zoom)) * audioDurationMs
  }, [audioDurationMs, zoom])

  // Audio playback sync
  useEffect(() => {
    if (isPlaying && audioRef.current) {
      const updatePlayhead = () => {
        if (audioRef.current) {
          const ms = audioRef.current.currentTime * 1000
          setPlayheadMs(ms)
          onSeekMs?.(ms)
          animationFrameRef.current = requestAnimationFrame(updatePlayhead)
        }
      }
      animationFrameRef.current = requestAnimationFrame(updatePlayhead)
    }
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
    }
  }, [isPlaying, onSeekMs])

  const seekTo = (ms: number) => {
    const clamped = clamp(ms, 0, audioDurationMs)
    setPlayheadMs(clamped)
    onSeekMs?.(clamped)
    if (audioRef.current) audioRef.current.currentTime = clamped / 1000
  }

  const togglePlayPause = () => {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  // Pointer events for playhead scrubbing on timeline background
  const handleTimelinePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).dataset.segment) return
    if (!timelineRef.current) return
    const rect = timelineRef.current.getBoundingClientRect()
    seekTo(pixelsToMs(e.clientX - rect.left))
  }

  // Segment pointer events — store drag in ref for perf
  const handleSegmentPointerDown = (
    e: React.PointerEvent,
    segment: ChordSegment,
    type: DragType
  ) => {
    e.stopPropagation()
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    dragRef.current = {
      id: segment.id,
      type,
      initialX: e.clientX,
      initialStartMs: segment.startMs,
      initialEndMs: segment.endMs,
    }
    setSelectedSegmentId(segment.id)
  }

  const handleSegmentPointerMove = (e: React.PointerEvent) => {
    const drag = dragRef.current
    if (!drag) return
    const deltaMs = pixelsToMs(e.clientX - drag.initialX)
    const gridMs = getGridMs()
    const segs = segmentsRef.current

    const updated = segs.map((seg) => {
      if (seg.id !== drag.id) return seg
      if (drag.type === 'move') {
        const dur = drag.initialEndMs - drag.initialStartMs
        const rawStart = drag.initialStartMs + deltaMs
        const snapped = snapMs(rawStart, gridMs)
        const newStart = clamp(snapped, 0, audioDurationMs - dur)
        return { ...seg, startMs: newStart, endMs: newStart + dur }
      } else if (drag.type === 'resize-start') {
        const raw = drag.initialStartMs + deltaMs
        const snapped = snapMs(raw, gridMs)
        const newStart = clamp(snapped, 0, seg.endMs - MIN_SEGMENT_MS)
        return { ...seg, startMs: newStart }
      } else {
        const raw = drag.initialEndMs + deltaMs
        const snapped = snapMs(raw, gridMs)
        const newEnd = clamp(snapped, seg.startMs + MIN_SEGMENT_MS, audioDurationMs)
        return { ...seg, endMs: newEnd }
      }
    })
    onChange(updated)
  }

  const handleSegmentPointerUp = () => {
    dragRef.current = null
  }

  // Keyboard support
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!selectedSegmentId) return
      const seg = segmentsRef.current.find((s) => s.id === selectedSegmentId)
      if (!seg) return

      if (e.key === 'Delete' || e.key === 'Backspace') {
        deleteSegment(seg)
        return
      }
      if (e.key === 'Enter') {
        setEditingSegmentId(selectedSegmentId)
        setEditingChord(seg.chord)
        return
      }
      const gridMs = getGridMs()
      const delta =
        e.key === 'ArrowRight' ? gridMs :
        e.key === 'ArrowLeft' ? -gridMs : 0
      if (delta === 0) return
      e.preventDefault()
      const dur = seg.endMs - seg.startMs
      const newStart = clamp(seg.startMs + delta, 0, audioDurationMs - dur)
      onChange(
        segmentsRef.current.map((s) =>
          s.id === selectedSegmentId
            ? { ...s, startMs: newStart, endMs: newStart + dur }
            : s
        )
      )
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedSegmentId, audioDurationMs, onChange, getGridMs])

  const openEditor = (seg: ChordSegment) => {
    setEditingSegmentId(seg.id)
    setEditingChord(seg.chord)
    setSuggestions([])
  }

  const deleteSegment = (seg: ChordSegment) => {
    if (window.confirm(`Remove segment "${seg.chord}"?`)) {
      onChange(segmentsRef.current.filter((s) => s.id !== seg.id))
      setSelectedSegmentId(null)
      setEditingSegmentId(null)
    }
  }

  const commitEdit = () => {
    if (editingSegmentId && editingChord.trim()) {
      onChange(
        segmentsRef.current.map((s) =>
          s.id === editingSegmentId ? { ...s, chord: editingChord.trim() } : s
        )
      )
    }
    setEditingSegmentId(null)
    setSuggestions([])
  }

  const handleChordInput = (val: string) => {
    setEditingChord(val)
    if (val.trim().length > 0) {
      setSuggestions(searchChords(val).map((c) => c.name).slice(0, 8))
    } else {
      setSuggestions([])
    }
  }

  const selectedSegment = segments.find((s) => s.id === selectedSegmentId)
  const editingSegment = segments.find((s) => s.id === editingSegmentId)
  const canSnapToBeat = !!(tempoBpm && timeSig)

  const formatTime = (ms: number) =>
    `${Math.floor(ms / 60000)}:${String(Math.floor((ms % 60000) / 1000)).padStart(2, '0')}`

  return (
    <div
      className="space-y-3 outline-none"
      ref={containerRef}
      tabIndex={-1}
    >
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onEnded={() => setIsPlaying(false)}
        />
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button onClick={togglePlayPause} variant="outline" size="sm" disabled={!audioUrl}>
          {isPlaying ? <Pause size={16} /> : <Play size={16} />}
        </Button>

        {/* Zoom */}
        <div className="flex items-center gap-1">
          <Button onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))} variant="outline" size="sm">
            <Minus size={16} />
          </Button>
          <span className="text-xs text-muted-foreground min-w-[44px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <Button onClick={() => setZoom((z) => Math.min(8, z + 0.25))} variant="outline" size="sm">
            <Plus size={16} />
          </Button>
        </div>

        {/* Snap controls */}
        {canSnapToBeat && (
          <Button
            onClick={() => setSnapToBeat((v) => !v)}
            variant={snapToBeat ? 'default' : 'outline'}
            size="sm"
          >
            {snapToBeat ? 'Snap: Beat' : 'Snap: 250ms'}
          </Button>
        )}

        {/* Selected segment actions */}
        {selectedSegment && (
          <>
            <Button
              onClick={() => {
                const mid = (selectedSegment.startMs + selectedSegment.endMs) / 2
                const next = segments.flatMap((s) =>
                  s.id !== selectedSegment.id
                    ? [s]
                    : [
                        { ...s, id: crypto.randomUUID(), endMs: mid },
                        { ...s, id: crypto.randomUUID(), startMs: mid },
                      ]
                )
                onChange(next)
                setSelectedSegmentId(null)
              }}
              variant="outline"
              size="sm"
            >
              <Scissors size={16} />
            </Button>
            <Button
              onClick={() => deleteSegment(selectedSegment)}
              variant="outline"
              size="sm"
            >
              <Trash size={16} />
            </Button>
            <Button onClick={() => openEditor(selectedSegment)} variant="outline" size="sm">
              Edit Chord
            </Button>
          </>
        )}
      </div>

      {/* Timeline */}
      <div className="border border-border rounded-md bg-card overflow-x-auto">
        <div
          ref={timelineRef}
          className="relative h-24 bg-muted/20 rounded cursor-crosshair select-none"
          style={{ width: `${zoom * 100}%`, minWidth: '100%' }}
          onPointerDown={handleTimelinePointerDown}
        >
          {segments.map((segment) => {
            const left = msToPixels(segment.startMs)
            const width = Math.max(4, msToPixels(segment.endMs - segment.startMs))
            const isSelected = segment.id === selectedSegmentId
            const isEditing = segment.id === editingSegmentId

            return (
              <div
                key={segment.id}
                data-segment="1"
                className={cn(
                  'absolute top-2 bottom-2 rounded border-2 flex items-center justify-center text-xs font-medium cursor-move select-none touch-none',
                  isSelected
                    ? 'bg-primary/20 border-primary text-primary z-10'
                    : 'bg-accent/40 border-accent text-accent-foreground hover:bg-accent/60'
                )}
                style={{ left: `${left}px`, width: `${width}px` }}
                onPointerDown={(e) => handleSegmentPointerDown(e, segment, 'move')}
                onPointerMove={handleSegmentPointerMove}
                onPointerUp={handleSegmentPointerUp}
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedSegmentId(segment.id)
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation()
                  openEditor(segment)
                }}
              >
                {/* Resize left handle */}
                <div
                  data-segment="1"
                  className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-primary/40 z-20"
                  onPointerDown={(e) => {
                    e.stopPropagation()
                    handleSegmentPointerDown(e, segment, 'resize-start')
                  }}
                  onPointerMove={handleSegmentPointerMove}
                  onPointerUp={handleSegmentPointerUp}
                />

                {isEditing ? (
                  <div className="relative px-1 z-30" onClick={(e) => e.stopPropagation()}>
                    <Input
                      className="h-6 text-xs w-20 px-1"
                      value={editingChord}
                      autoFocus
                      onChange={(e) => handleChordInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') commitEdit()
                        if (e.key === 'Escape') setEditingSegmentId(null)
                      }}
                      onBlur={() => setTimeout(commitEdit, 150)}
                    />
                    {suggestions.length > 0 && (
                      <div className="absolute top-full left-0 mt-0.5 bg-popover border border-border rounded shadow z-50 min-w-[80px]">
                        {suggestions.map((s) => (
                          <div
                            key={s}
                            className="px-2 py-1 text-xs hover:bg-accent cursor-pointer"
                            onMouseDown={(e) => {
                              e.preventDefault()
                              setEditingChord(s)
                              setSuggestions([])
                            }}
                          >
                            {s}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <span className="truncate px-3">{segment.chord}</span>
                )}

                {/* Resize right handle */}
                <div
                  data-segment="1"
                  className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-primary/40 z-20"
                  onPointerDown={(e) => {
                    e.stopPropagation()
                    handleSegmentPointerDown(e, segment, 'resize-end')
                  }}
                  onPointerMove={handleSegmentPointerMove}
                  onPointerUp={handleSegmentPointerUp}
                />
              </div>
            )
          })}

          {/* Playhead */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-primary z-20 cursor-ew-resize"
            style={{ left: `${msToPixels(playheadMs)}px` }}
            onPointerDown={(e) => {
              e.stopPropagation()
              ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
            }}
            onPointerMove={(e) => {
              if (e.buttons === 0) return
              if (!timelineRef.current) return
              const rect = timelineRef.current.getBoundingClientRect()
              seekTo(pixelsToMs(e.clientX - rect.left))
            }}
          >
            <div className="absolute -top-1 -left-1.5 w-3 h-3 bg-primary rounded-full" />
            <div className="absolute top-4 -translate-x-1/2 text-[10px] text-primary bg-card px-1 rounded whitespace-nowrap">
              {formatTime(playheadMs)}
            </div>
          </div>
        </div>

        <div className="px-2 pb-1 flex justify-between text-[10px] text-muted-foreground">
          <span>0:00</span>
          <span>{formatTime(audioDurationMs)}</span>
        </div>
      </div>

      {/* Edit panel */}
      {editingSegment && editingSegmentId && (
        <div className="border border-border rounded-md p-3 bg-card space-y-2">
          <Label className="text-sm font-medium">Edit Chord — {formatTime(editingSegment.startMs)} → {formatTime(editingSegment.endMs)}</Label>
          <div className="relative">
            <Input
              value={editingChord}
              autoFocus
              onChange={(e) => handleChordInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitEdit()
                if (e.key === 'Escape') setEditingSegmentId(null)
              }}
              placeholder="e.g., Am, C, G7"
            />
            {suggestions.length > 0 && (
              <div className="absolute top-full left-0 mt-0.5 bg-popover border border-border rounded shadow z-50 w-full">
                {suggestions.map((s) => (
                  <div
                    key={s}
                    className="px-3 py-1.5 text-sm hover:bg-accent cursor-pointer"
                    onMouseDown={(e) => {
                      e.preventDefault()
                      setEditingChord(s)
                      setSuggestions([])
                    }}
                  >
                    {s}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={commitEdit}>Save</Button>
            <Button size="sm" variant="ghost" onClick={() => setEditingSegmentId(null)}>Cancel</Button>
          </div>
        </div>
      )}

      <p className="text-[11px] text-muted-foreground">
        Arrow keys move · Delete removes · Enter/double-click edits chord
      </p>
    </div>
  )
}
