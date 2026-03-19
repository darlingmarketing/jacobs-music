import { useState, useEffect, useRef } from 'react'
import { useKV } from '@github/spark/hooks'
import type { AudioRecording, Song } from '@/types'
import type { TranscriptionResult, ChordSegment } from '@/lib/transcribe/types'
import { getTranscription, saveTranscription } from '@/lib/transcribe/repo'
import { ChordTimelineEditor } from '@/components/ChordTimelineEditor'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import {
  ArrowLeft,
  FloppyDisk,
  MusicNote,
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import type { AppState } from '@/App'
import { transcriptionToSongDraft } from '@/lib/transcribe/convertToSongbook'

interface TranscribeTimelineProps {
  transcriptionId: string
  onNavigate: (page: AppState['currentPage'], songId?: string) => void
}

export function TranscribeTimeline({ transcriptionId, onNavigate }: TranscribeTimelineProps) {
  const [songs, setSongs] = useKV<Song[]>('songs', [])
  const [recordings] = useKV<AudioRecording[]>('audio-recordings', [])
  const [tx, setTx] = useState<TranscriptionResult | null>(null)
  const [segments, setSegments] = useState<ChordSegment[]>([])
  const [audioDurationMs, setAudioDurationMs] = useState(0)
  const [seekMs, setSeekMs] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const [isConverting, setIsConverting] = useState(false)
  const audioUrlRef = useRef<string | undefined>(undefined)

  useEffect(() => {
    getTranscription(transcriptionId).then((result) => {
      if (!result) {
        toast.error('Transcription not found')
        return
      }
      setTx(result)
      setSegments(result.segments)
      const lastMs = result.segments.reduce((m, s) => Math.max(m, s.endMs), 0)
      setAudioDurationMs(lastMs || 60000)
    })
  }, [transcriptionId])

  // Resolve audio URL from linked recording (if present)
  useEffect(() => {
    // cleanup previous object URL
    return () => {
      if (audioUrlRef.current?.startsWith('blob:')) {
        URL.revokeObjectURL(audioUrlRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!tx?.sourceRecordingId) return
    const rec = (recordings ?? []).find(r => r.id === tx.sourceRecordingId)
    if (!rec) return

    if (audioUrlRef.current?.startsWith('blob:')) {
      URL.revokeObjectURL(audioUrlRef.current)
    }

    audioUrlRef.current = rec.blobData
      ? URL.createObjectURL(rec.blobData)
      : rec.storageRef
  }, [tx?.sourceRecordingId, recordings])

  const handleSave = async () => {
    if (!tx) return
    setIsSaving(true)
    try {
      const updated: TranscriptionResult = { ...tx, segments }
      await saveTranscription(updated)
      setTx(updated)
      toast.success('Transcription saved')
    } catch {
      toast.error('Failed to save')
    } finally {
      setIsSaving(false)
    }
  }

  const timeSig = tx?.tempoBpm
    ? { beats: 4, beatValue: 4 }
    : undefined

  const handleConvertToSong = async () => {
    if (!tx || segments.length === 0) {
      toast.error('No chord segments to convert')
      return
    }
    setIsConverting(true)
    try {
      const sbSong = transcriptionToSongDraft(
        { ...tx, segments },
        timeSig ? { timeSig } : undefined
      )
      // Map songbook Song to the legacy Song schema used by the app
      const user = await window.spark.user()
      const chordContent = sbSong.sections[0]?.blocks
        .filter((b: any) => b.type === 'chord_grid')
        .map((b: any) =>
          (b.measures as Array<{ chords: string[] }>)
            .map((m) => m.chords.join(' '))
            .join(' | ')
        )
        .join('\n') ?? ''

      const newSong: Song = {
        id: sbSong.id,
        userId: user.login,
        title: (sbSong.meta as any).title,
        description: (sbSong.meta as any).description,
        key: (sbSong.meta as any).key,
        tempo: (sbSong.meta as any).tempoBpm,
        timeSignature: timeSig ? `${timeSig.beats}/${timeSig.beatValue}` : '4/4',
        tuning: 'Standard',
        tags: ['transcribed'],
        sections: [
          {
            id: sbSong.sections[0].id,
            name: 'Transcription',
            type: 'custom',
            order: 0,
            blocks: [
              {
                id: crypto.randomUUID(),
                type: 'chords',
                content: chordContent,
              },
            ],
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      setSongs((current) => [...(current ?? []), newSong])
      toast.success('Song draft created!')
      setTimeout(() => onNavigate('editor', newSong.id), 400)
    } catch (err) {
      toast.error(`Failed to convert: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setIsConverting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button variant="ghost" size="sm" onClick={() => onNavigate('transcribe')}>
          <ArrowLeft size={16} className="mr-1" />
          Back
        </Button>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold truncate">
            {tx?.sourceFileName ?? 'Timeline Editor'}
          </h2>
          {tx?.tempoBpm && (
            <div className="flex items-center gap-2 mt-0.5">
              <Badge variant="secondary">{tx.tempoBpm} BPM</Badge>
              {tx.key && <Badge variant="outline">{tx.key}</Badge>}
            </div>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSave}
          disabled={isSaving}
        >
          <FloppyDisk size={16} className="mr-1" />
          {isSaving ? 'Saving…' : 'Save'}
        </Button>
        <Button
          size="sm"
          onClick={handleConvertToSong}
          disabled={isConverting || segments.length === 0}
        >
          <MusicNote size={16} className="mr-1" />
          {isConverting ? 'Converting…' : 'Convert to Song Draft'}
        </Button>
      </div>

      {/* Timeline */}
      <Card className="p-4">
        {tx ? (
          <ChordTimelineEditor
            audioDurationMs={audioDurationMs}
            segments={segments}
            tempoBpm={tx.tempoBpm}
            timeSig={timeSig}
            onChange={setSegments}
            onSeekMs={setSeekMs}
            seekMs={seekMs}
            audioUrl={audioUrlRef.current}
          />
        ) : (
          <div className="h-24 flex items-center justify-center text-muted-foreground text-sm">
            Loading…
          </div>
        )}
      </Card>

      {/* Segment list summary */}
      {segments.length > 0 && (
        <Card className="p-3">
          <p className="text-xs text-muted-foreground mb-2">
            {segments.length} segments · click to select · drag edges to resize · drag body to move
          </p>
          <div className="flex flex-wrap gap-1">
            {segments.map((s) => (
              <Badge key={s.id} variant="outline" className="text-xs">
                {s.chord}
              </Badge>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
