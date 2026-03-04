import { useState, useRef, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import type { AudioRecording, StorageType } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Microphone, Pause, Stop, Play, FloppyDisk, Download } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface AudioRecorderProps {
  onSave?: (recording: AudioRecording) => void
  linkedSongId?: string
  linkedSectionId?: string
}

type RecordingState = 'idle' | 'recording' | 'paused' | 'stopped'

const getSupportedMimeType = (): string => {
  const types = ['audio/webm', 'audio/ogg', 'audio/wav', 'audio/mp4']
  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type
    }
  }
  return 'audio/webm'
}

const saveToDevice = async (blob: Blob, filename: string) => {
  if ('showSaveFilePicker' in window) {
    try {
      const handle = await (window as any).showSaveFilePicker({
        suggestedName: filename,
        types: [{
          description: 'Audio files',
          accept: { [blob.type]: [`.${blob.type.split('/')[1]}`] }
        }]
      })
      const writable = await handle.createWritable()
      await writable.write(blob)
      await writable.close()
      toast.success('Audio saved to device')
      return true
    } catch (error: any) {
      if (error.name === 'AbortError') {
        toast.info('Save cancelled')
        return false
      }
      throw error
    }
  } else {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('Audio downloaded')
    return true
  }
}

export function AudioRecorder({ onSave, linkedSongId, linkedSectionId }: AudioRecorderProps) {
  const [recordings, setRecordings] = useKV<AudioRecording[]>('audio-recordings', [])
  const [state, setState] = useState<RecordingState>('idle')
  const [duration, setDuration] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [tagsInput, setTagsInput] = useState('')
  const [permissionDenied, setPermissionDenied] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number>(0)

  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl)
      }
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [audioUrl])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = getSupportedMimeType()
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType })
        setAudioBlob(blob)
        const url = URL.createObjectURL(blob)
        setAudioUrl(url)
        setState('stopped')
        
        stream.getTracks().forEach(track => track.stop())
        
        if (timerRef.current) {
          clearInterval(timerRef.current)
        }
      }

      mediaRecorder.start()
      setState('recording')
      startTimeRef.current = Date.now()
      
      timerRef.current = setInterval(() => {
        setDuration(Date.now() - startTimeRef.current)
      }, 100)

      setPermissionDenied(false)
      toast.success('Recording started')
    } catch (error: any) {
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setPermissionDenied(true)
        toast.error('Microphone permission denied. Please enable it in browser settings.')
      } else if (error.name === 'NotFoundError') {
        toast.error('No microphone detected. Please connect a microphone.')
      } else if (!MediaRecorder.isTypeSupported(getSupportedMimeType())) {
        toast.error('Audio recording is not supported in this browser.')
      } else {
        toast.error('Failed to start recording: ' + error.message)
      }
    }
  }

  const pauseRecording = () => {
    if (mediaRecorderRef.current && state === 'recording') {
      mediaRecorderRef.current.pause()
      setState('paused')
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      toast.info('Recording paused')
    }
  }

  const resumeRecording = () => {
    if (mediaRecorderRef.current && state === 'paused') {
      mediaRecorderRef.current.resume()
      setState('recording')
      
      const pausedDuration = duration
      startTimeRef.current = Date.now() - pausedDuration
      
      timerRef.current = setInterval(() => {
        setDuration(Date.now() - startTimeRef.current)
      }, 100)
      
      toast.info('Recording resumed')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
    }
  }

  const saveRecording = async () => {
    if (!audioBlob) return
    if (!title.trim()) {
      toast.error('Please enter a title')
      return
    }

    const recording: AudioRecording = {
      id: `audio-${Date.now()}`,
      userId: 'local-user',
      title: title.trim(),
      notes,
      tags: tagsInput.split(',').map(t => t.trim()).filter(Boolean),
      mimeType: audioBlob.type,
      durationMs: duration,
      storageType: 'indexeddb' as StorageType,
      blobData: audioBlob,
      linkedSongId,
      linkedSectionId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    setRecordings(current => [...(current || []), recording])
    toast.success('Recording saved!')
    
    if (onSave) {
      onSave(recording)
    }

    resetRecorder()
  }

  const downloadRecording = async () => {
    if (!audioBlob) return
    const filename = `${title.trim() || 'recording'}-${Date.now()}.${audioBlob.type.split('/')[1]}`
    await saveToDevice(audioBlob, filename)
  }

  const resetRecorder = () => {
    setState('idle')
    setDuration(0)
    setAudioBlob(null)
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
      setAudioUrl(null)
    }
    setTitle('')
    setNotes('')
    setTagsInput('')
    chunksRef.current = []
  }

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  if (permissionDenied) {
    return (
      <Card className="p-6 bg-card border-destructive">
        <div className="flex flex-col items-center gap-4 text-center">
          <Microphone size={48} className="text-destructive" />
          <div>
            <h3 className="font-semibold text-lg mb-2">Microphone Access Denied</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Please enable microphone permissions in your browser settings to record audio.
            </p>
            <Button onClick={() => setPermissionDenied(false)} variant="outline">
              Try Again
            </Button>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6 bg-card">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">Audio Recorder</h3>
          <Badge variant={state === 'recording' ? 'default' : 'secondary'}>
            {formatDuration(duration)}
          </Badge>
        </div>

        <div className="flex items-center justify-center gap-3">
          {state === 'idle' && (
            <Button
              onClick={startRecording}
              size="lg"
              className={cn(
                "rounded-full w-16 h-16 bg-accent hover:bg-accent/90",
                "transition-transform hover:scale-105"
              )}
            >
              <Microphone size={28} weight="fill" />
            </Button>
          )}

          {state === 'recording' && (
            <>
              <Button
                onClick={pauseRecording}
                size="lg"
                variant="secondary"
                className="rounded-full w-14 h-14"
              >
                <Pause size={24} weight="fill" />
              </Button>
              <Button
                onClick={stopRecording}
                size="lg"
                variant="destructive"
                className={cn(
                  "rounded-full w-16 h-16",
                  "animate-pulse"
                )}
              >
                <Stop size={28} weight="fill" />
              </Button>
            </>
          )}

          {state === 'paused' && (
            <>
              <Button
                onClick={resumeRecording}
                size="lg"
                className="rounded-full w-14 h-14 bg-accent hover:bg-accent/90"
              >
                <Microphone size={24} weight="fill" />
              </Button>
              <Button
                onClick={stopRecording}
                size="lg"
                variant="destructive"
                className="rounded-full w-14 h-14"
              >
                <Stop size={24} weight="fill" />
              </Button>
            </>
          )}
        </div>

        {state === 'recording' && (
          <div className="flex items-center justify-center gap-2 text-accent animate-pulse">
            <div className="w-2 h-2 rounded-full bg-accent" />
            <span className="text-sm font-medium">Recording...</span>
          </div>
        )}

        {state === 'stopped' && audioUrl && (
          <div className="flex flex-col gap-3 p-4 bg-secondary rounded-lg">
            <audio src={audioUrl} controls className="w-full" />
            
            <Input
              placeholder="Recording title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-background"
            />
            
            <Textarea
              placeholder="Notes (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="bg-background min-h-[80px]"
            />

            <Input
              placeholder="Tags (comma-separated, e.g. riff, verse, chorus)"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="bg-background"
            />

            <div className="flex gap-2">
              <Button onClick={saveRecording} className="flex-1">
                <FloppyDisk size={18} className="mr-2" />
                Save
              </Button>
              <Button onClick={downloadRecording} variant="outline" className="flex-1">
                <Download size={18} className="mr-2" />
                Download
              </Button>
            </div>

            <Button onClick={resetRecorder} variant="ghost" size="sm">
              Record New
            </Button>
          </div>
        )}

        {duration > 600000 && state !== 'stopped' && (
          <div className="text-xs text-muted-foreground text-center">
            Recording longer than 10 minutes. File size: ~{Math.round(duration / 1000 * 12 / 1024)}MB
          </div>
        )}
      </div>
    </Card>
  )
}
