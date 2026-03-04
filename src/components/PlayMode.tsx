import { useState, useCallback, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import {
  Play,
  Stop,
  ArrowLeft,
  CaretRight,
  CaretUp,
  CaretDown,
  ArrowsClockwise,
  ArrowsCounterClockwise,
  TextAa,
  Guitar,
  MusicNotes,
} from '@phosphor-icons/react'
import type { Song, UserSettings } from '@/types'
import { transposeChord } from '@/lib/chordParser'
import { cn } from '@/lib/utils'
import { useAutoscroll } from '@/hooks/useAutoscroll'
import { PracticeLoop } from '@/components/PracticeLoop'
import { FavoriteButton } from '@/components/FavoriteButton'
import { usePracticeSession } from '@/hooks/usePracticeSession'
import { suggestNextChords } from '@/lib/music/progressionSuggest'

interface PlayModeProps {
  song: Song
  settings?: Partial<UserSettings>
  onExit: () => void
  /** Called when the user advances to the next song in a setlist */
  onNextSong?: () => void
  /** Position info when playing a setlist, e.g. { current: 2, total: 5 } */
  setlistPosition?: { current: number; total: number }
}

// Regex to detect lines that only contain chord notation (no lyrics).
// Uses a two-step approach to avoid catastrophic backtracking:
// 1. Strip valid chord tokens
// 2. Check only bar/space separators remain
const CHORD_TOKEN_RE = /[A-G][#b]?(?:maj7?|m7?|dim7?|aug|sus[24]?|add\d{1,2}|\d{1,2})?(?:\/[A-G][#b]?)?/g
const CHORD_SEPARATOR_RE = /^[|\s/]*$/

// Approximate monospace character width in em units for chord overlay positioning
const CHORD_CHAR_WIDTH_EM = 0.6

// Parse a chord-line of the form "| G | D | Am | F |" into an array of chords
function parseMeasures(line: string): string[] {
  const measures: string[] = []
  const parts = line.split('|')
  for (const part of parts) {
    const trimmed = part.trim()
    if (trimmed) measures.push(trimmed)
  }
  return measures
}

// Check if a line looks like a bar-notation chord line
function isBarChordLine(line: string): boolean {
  return line.includes('|') && /[A-G]/.test(line)
}

// Detect if content is a chord block (no inline [chord] markers, just bar notation or plain chords)
function isChordOnlyContent(content: string): boolean {
  return content.split('\n').every(line => {
    const stripped = line.trim()
    if (!stripped) return true
    // Remove recognized chord tokens, then check only separators remain
    const afterChords = stripped.replace(CHORD_TOKEN_RE, '')
    return CHORD_SEPARATOR_RE.test(afterChords)
  })
}

interface LyricLine {
  lyrics: string
  chords: Array<{ chord: string; charIndex: number }>
}

// Parse content that mixes "[Chord] lyrics" inline notation into structured lines
function parseLyricLines(content: string, semitones: number): LyricLine[] {
  return content.split('\n').map(line => {
    const chords: Array<{ chord: string; charIndex: number }> = []
    let clean = ''
    let pos = 0
    let i = 0

    while (i < line.length) {
      if (line[i] === '[') {
        const end = line.indexOf(']', i)
        if (end !== -1) {
          const raw = line.slice(i + 1, end)
          chords.push({
            chord: semitones !== 0 ? transposeChord(raw, semitones) : raw,
            charIndex: pos,
          })
          i = end + 1
          continue
        }
      }
      clean += line[i]
      pos++
      i++
    }

    return { lyrics: clean, chords }
  })
}

function getCapoSuggestions(
  semitones: number,
  songKey?: string
): { capo: number; playKey: string; label: string }[] {
  const suggestions: { capo: number; playKey: string; label: string }[] = []
  const openKeys = ['C', 'D', 'E', 'G', 'A']
  for (let capo = 1; capo <= 7; capo++) {
    const playKey = songKey ? transposeChord(songKey, semitones - capo) : null
    if (!playKey) continue
    if (openKeys.includes(playKey)) {
      suggestions.push({ capo, playKey, label: `Capo ${capo} → play in ${playKey}` })
    }
  }
  return suggestions.slice(0, 3)
}

export function PlayMode({ song, settings, onExit, onNextSong, setlistPosition }: PlayModeProps) {
  const [playing, setPlaying] = useState(false)
  const [semitones, setSemitones] = useState(0)
  const [loop, setLoop] = useState(false)
  const [scrollMode, setScrollMode] = useState<'manual' | 'bpm'>('manual')
  const [speed, setSpeed] = useState(settings?.autoscrollSpeed ?? 30)
  const [pxPerBeat, setPxPerBeat] = useState(40)
  const [activeLine, setActiveLine] = useState<string | null>(null)
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null)
  const [showPracticeLoop, setShowPracticeLoop] = useState(false)
  const [showChordSuggest, setShowChordSuggest] = useState(false)
  // Font size: use settings.fontSize if provided (min 12, max 24), default 16
  const [fontSize, setFontSize] = useState<number>(settings?.fontSize ?? 16)
  // Left-handed mode from settings
  const leftHanded = settings?.leftHandedMode ?? false

  const practiceSession = usePracticeSession('play', { songId: song.id })

  // Start session on mount
  useEffect(() => {
    practiceSession.start()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const containerRef = useAutoscroll(playing, speed, {
    pauseAtSections: true,
    mode: scrollMode,
    tempoBpm: song.tempo,
    pxPerBeat,
  })

  const transposedKey = song.key ? transposeChord(song.key, semitones) : null
  const capoSuggestions = getCapoSuggestions(semitones, song.key)

  const chordSuggestions = useMemo(
    () => (transposedKey ? suggestNextChords(transposedKey) : []),
    [transposedKey],
  )

  const handleLineClick = useCallback((lineId: string) => {
    setActiveLine(prev => (prev === lineId ? null : lineId))
  }, [])

  const semitoneLabel = semitones > 0 ? `+${semitones}` : String(semitones)

  return (
    <div className="fixed inset-0 z-50 bg-gray-950 text-gray-100 flex flex-col overflow-hidden dark">
      {/* Controls bar */}
      <div className="shrink-0 border-b border-gray-800 px-4 py-3 flex flex-wrap items-center gap-3 bg-gray-900">
        <Button
          variant="ghost"
          size="sm"
          onClick={onExit}
          className="text-gray-300 hover:text-white gap-1"
          aria-label="Exit play mode"
        >
          <ArrowLeft size={18} />
          Exit
        </Button>

        <FavoriteButton
          refId={song.id}
          type="song"
          className="text-gray-300 hover:text-yellow-400"
        />

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setPlaying(p => !p)}
            className={cn(
              'gap-1',
              playing
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-primary hover:bg-primary/90 text-white'
            )}
            aria-label={playing ? 'Stop autoscroll' : 'Start autoscroll'}
          >
            {playing ? <Stop size={16} /> : <Play size={16} />}
            {playing ? 'Stop' : 'Start'}
          </Button>

          <Button
            size="sm"
            variant={loop ? 'secondary' : 'outline'}
            onClick={() => setLoop(l => !l)}
            className="gap-1 text-gray-300 border-gray-700"
            aria-label="Toggle loop"
          >
            <ArrowsCounterClockwise size={16} />
            Loop
          </Button>

          <Button
            size="sm"
            variant={showPracticeLoop ? 'secondary' : 'outline'}
            onClick={() => setShowPracticeLoop(v => !v)}
            className="gap-1 text-gray-300 border-gray-700"
            aria-label="Toggle practice loop panel"
          >
            <Guitar size={16} />
            Practice
          </Button>

          {transposedKey && (
            <Button
              size="sm"
              variant={showChordSuggest ? 'secondary' : 'outline'}
              onClick={() => setShowChordSuggest(v => !v)}
              className="gap-1 text-gray-300 border-gray-700"
              aria-label="Toggle chord suggestions panel"
            >
              <MusicNotes size={16} />
              Suggest
            </Button>
          )}
        </div>

        {/* Scroll mode + speed controls */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={scrollMode === 'manual' ? 'secondary' : 'outline'}
            onClick={() => setScrollMode('manual')}
            className="text-xs border-gray-700 text-gray-300 px-2"
            aria-label="Manual scroll mode"
          >
            Manual
          </Button>
          <Button
            size="sm"
            variant={scrollMode === 'bpm' ? 'secondary' : 'outline'}
            onClick={() => setScrollMode('bpm')}
            className="text-xs border-gray-700 text-gray-300 px-2"
            aria-pressed={scrollMode === 'bpm'}
            aria-label="BPM scroll mode"
          >
            BPM
          </Button>
        </div>

        {scrollMode === 'manual' ? (
          <div className="flex items-center gap-2 min-w-[140px]">
            <span className="text-xs text-gray-400 shrink-0">Speed</span>
            <Slider
              min={5}
              max={120}
              step={5}
              value={[speed]}
              onValueChange={([v]) => setSpeed(v)}
              className="w-24"
              aria-label="Autoscroll speed"
            />
            <span className="text-xs text-gray-400 tabular-nums w-6">{speed}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 min-w-[160px]">
            <span className="text-xs text-gray-400 shrink-0">px/beat</span>
            <Slider
              min={10}
              max={120}
              step={5}
              value={[pxPerBeat]}
              onValueChange={([v]) => setPxPerBeat(v)}
              className="w-24"
              aria-label="Pixels per beat"
            />
            <span className="text-xs text-gray-400 tabular-nums w-6">{pxPerBeat}</span>
          </div>
        )}

        {/* Font size controls */}
        <div className="flex items-center gap-1">
          <TextAa size={16} className="text-gray-400 shrink-0" />
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setFontSize(f => Math.max(12, f - 1))}
            className="text-gray-400 px-1.5"
            aria-label="Decrease font size"
          >
            −
          </Button>
          <span className="text-xs text-gray-400 tabular-nums w-5 text-center">{fontSize}</span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setFontSize(f => Math.min(24, f + 1))}
            className="text-gray-400 px-1.5"
            aria-label="Increase font size"
          >
            +
          </Button>
        </div>

        {/* Transpose controls */}
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setSemitones(s => s - 1)}
            className="border-gray-700 text-gray-300"
            aria-label="Transpose down"
          >
            <CaretDown size={14} />
          </Button>
          <span
            className={cn(
              'min-w-[2.5rem] text-center text-sm font-bold tabular-nums',
              semitones !== 0 ? 'text-primary' : 'text-gray-400'
            )}
          >
            {semitoneLabel}
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setSemitones(s => s + 1)}
            className="border-gray-700 text-gray-300"
            aria-label="Transpose up"
          >
            <CaretUp size={14} />
          </Button>
          {semitones !== 0 && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSemitones(0)}
              className="text-gray-400"
              aria-label="Reset transposition"
            >
              <ArrowsClockwise size={14} />
            </Button>
          )}
        </div>

        {transposedKey && (
          <Badge className="bg-gray-800 text-gray-200 border-gray-700 font-mono">
            Key: {transposedKey}
          </Badge>
        )}

        {song.capo !== undefined && song.capo > 0 && (
          <Badge variant="outline" className="border-gray-700 text-gray-300">
            Capo {song.capo}
          </Badge>
        )}

        {setlistPosition && (
          <Badge className="bg-gray-800 text-gray-400 border-gray-700">
            {setlistPosition.current} / {setlistPosition.total}
          </Badge>
        )}

        {onNextSong && (
          <Button
            size="sm"
            variant="outline"
            onClick={onNextSong}
            className="gap-1 border-gray-700 text-gray-300 hover:text-white ml-auto"
            aria-label="Next song in setlist"
          >
            Next
            <CaretRight size={14} />
          </Button>
        )}

        {/* Capo suggestions */}
        {semitones !== 0 && capoSuggestions.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {capoSuggestions.map(s => (
              <Badge
                key={s.capo}
                variant="outline"
                className="cursor-pointer hover:bg-gray-700 text-xs border-gray-600 text-gray-300"
                onClick={() => setSemitones(s.capo)}
                title={`Set capo to ${s.capo} and reset transposition`}
              >
                {s.label}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Practice Loop panel */}
      {showPracticeLoop && (
        <div className="shrink-0 border-b border-gray-800 bg-gray-900 px-4 py-3 max-h-[50vh] overflow-y-auto">
          <PracticeLoop
            sections={song.sections}
            tempo={song.tempo}
            timeSignature={song.timeSignature}
            activeSectionId={activeSectionId}
            onSectionChange={id => setActiveSectionId(id)}
          />
        </div>
      )}

      {/* Chord Suggestions panel */}
      {showChordSuggest && transposedKey && chordSuggestions.length > 0 && (
        <div className="shrink-0 border-b border-gray-800 bg-gray-900 px-4 py-3">
          <p className="text-xs text-gray-400 mb-2 font-medium uppercase tracking-wider">
            Diatonic chords — {transposedKey}
          </p>
          <div className="flex flex-wrap gap-2">
            {chordSuggestions.map(s => (
              <Badge
                key={s.chord}
                variant="outline"
                className={cn(
                  'cursor-default border-gray-600 text-sm font-mono',
                  s.category === 'cadence'
                    ? 'bg-primary/10 text-primary border-primary/40'
                    : 'text-gray-300',
                )}
                title={s.category === 'cadence' ? 'Common in progressions' : 'Diatonic chord'}
              >
                {s.label}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Song content */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto px-4 py-6 md:px-10"
        style={{ fontSize: `${fontSize}px` }}
      >
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Song header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white">{song.title}</h1>
            {song.artist && (
              <p className="text-gray-400 mt-1 text-lg">{song.artist}</p>
            )}
            <div className="flex flex-wrap justify-center gap-2 mt-3">
              {song.tempo && (
                <Badge className="bg-gray-800 border-gray-700 text-gray-300">
                  ♩ {song.tempo} BPM
                </Badge>
              )}
              {song.timeSignature && (
                <Badge className="bg-gray-800 border-gray-700 text-gray-300">
                  {song.timeSignature}
                </Badge>
              )}
            </div>
          </div>

          {song.sections.map(section => {
            const isSectionActive = activeSectionId === section.id
            return (
              <section
                key={section.id}
                data-section={section.id}
                className={cn(
                  'space-y-4 rounded-lg transition-colors',
                  isSectionActive ? 'ring-1 ring-primary/40 bg-primary/5 p-2' : ''
                )}
              >
                <h2
                  className={cn(
                    'text-sm font-semibold uppercase tracking-widest border-b pb-1 cursor-pointer',
                    isSectionActive
                      ? 'text-primary border-primary/30'
                      : 'text-primary/70 border-gray-800'
                  )}
                  onClick={() =>
                    setActiveSectionId(prev => (prev === section.id ? null : section.id))
                  }
                >
                  {section.name}
                </h2>

              {section.blocks.map(block => {
                if (block.type === 'heading') {
                  const level = block.meta?.headingLevel ?? 2
                  const Tag = `h${level}` as keyof JSX.IntrinsicElements
                  const sizeClass =
                    level === 1 ? 'text-2xl' : level === 2 ? 'text-xl' : 'text-lg'
                  return (
                    <Tag
                      key={block.id}
                      className={cn('font-bold text-white', sizeClass)}
                    >
                      {block.content}
                    </Tag>
                  )
                }

                if (block.type === 'note') {
                  return (
                    <p
                      key={block.id}
                      className="text-sm italic text-gray-500 border-l-2 border-gray-700 pl-3"
                    >
                      {block.content}
                    </p>
                  )
                }

                if (block.type === 'chords' || isChordOnlyContent(block.content)) {
                  // Bar-notation chord blocks
                  const lines = block.content.split('\n')
                  return (
                    <div key={block.id} className="space-y-1 font-mono">
                      {lines.map((line, li) => {
                        const lineId = `${block.id}-${li}`
                        const isActive = activeLine === lineId

                        if (isBarChordLine(line)) {
                          const measures = parseMeasures(line)
                          return (
                            <div
                              key={lineId}
                              role="button"
                              tabIndex={0}
                              onClick={() => handleLineClick(lineId)}
                              onKeyDown={e => e.key === 'Enter' && handleLineClick(lineId)}
                              className={cn(
                                'flex flex-wrap gap-2 py-1 px-2 rounded cursor-pointer transition-colors',
                                isActive ? 'bg-primary/10' : 'hover:bg-gray-800/50'
                              )}
                            >
                              {measures.map((chord, mi) => (
                                <span
                                  key={mi}
                                  className={cn(
                                    'font-bold text-yellow-300 min-w-[2rem] text-center',
                                    leftHanded ? 'scale-x-[-1]' : ''
                                  )}
                                >
                                  {semitones !== 0 ? transposeChord(chord.trim(), semitones) : chord.trim()}
                                </span>
                              ))}
                            </div>
                          )
                        }

                        // Plain chord line
                        return (
                          <div
                            key={lineId}
                            role="button"
                            tabIndex={0}
                            onClick={() => handleLineClick(lineId)}
                            onKeyDown={e => e.key === 'Enter' && handleLineClick(lineId)}
                            className={cn(
                              'py-1 px-2 rounded cursor-pointer transition-colors',
                              isActive ? 'bg-primary/10' : 'hover:bg-gray-800/50'
                            )}
                          >
                            <span className="font-bold text-yellow-300">
                              {semitones !== 0
                                ? line
                                    .split(/\s+/)
                                    .map(w =>
                                      /^[A-G]/.test(w) ? transposeChord(w, semitones) : w
                                    )
                                    .join(' ')
                                : line}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  )
                }

                // Lyrics block with inline [Chord] markers
                const lyricLines = parseLyricLines(block.content, semitones)
                return (
                  <div key={block.id} className="space-y-3 font-mono">
                    {lyricLines.map((ll, li) => {
                      const lineId = `${block.id}-${li}`
                      const isActive = activeLine === lineId
                      const hasChords = ll.chords.length > 0

                      return (
                        <div
                          key={lineId}
                          role="button"
                          tabIndex={0}
                          onClick={() => handleLineClick(lineId)}
                          onKeyDown={e => e.key === 'Enter' && handleLineClick(lineId)}
                          className={cn(
                            'relative py-1 px-2 rounded cursor-pointer transition-colors',
                            isActive ? 'bg-primary/10' : 'hover:bg-gray-800/50'
                          )}
                        >
                          {hasChords && (
                            <div
                              className="relative h-6 text-sm font-bold text-yellow-300 select-none"
                              aria-hidden
                            >
                              {ll.chords.map((c, ci) => (
                                <span
                                  key={ci}
                                  className="absolute"
                                  style={{ left: `${c.charIndex * CHORD_CHAR_WIDTH_EM}em` }}
                                >
                                  {c.chord}
                                </span>
                              ))}
                            </div>
                          )}
                          <div className="text-gray-100 whitespace-pre-wrap">
                            {ll.lyrics || '\u00A0'}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </section>
            )
          })}

          {/* Bottom padding for scroll */}
          <div className="h-screen" aria-hidden />
        </div>
      </div>
    </div>
  )
}
