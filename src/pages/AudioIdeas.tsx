import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import type { AudioRecording } from '@/types'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { AudioRecorder } from '@/components/AudioRecorder'
import { 
  Play, 
  Pause, 
  Trash, 
  MagnifyingGlass, 
  Waveform, 
  Plus,
  X,
  Download,
  MusicNotes
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

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

interface AudioPlayerProps {
  recording: AudioRecording
  onDelete: () => void
}

function AudioPlayer({ recording, onDelete }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null)

  const audioUrl = recording.blobData 
    ? URL.createObjectURL(recording.blobData)
    : recording.storageRef

  const togglePlayback = () => {
    if (!audioElement) {
      const audio = new Audio(audioUrl!)
      audio.addEventListener('ended', () => setIsPlaying(false))
      audio.addEventListener('pause', () => setIsPlaying(false))
      audio.addEventListener('play', () => setIsPlaying(true))
      setAudioElement(audio)
      audio.play()
      setIsPlaying(true)
    } else {
      if (isPlaying) {
        audioElement.pause()
      } else {
        audioElement.play()
      }
    }
  }

  const handleDownload = async () => {
    if (!recording.blobData) {
      toast.error('Cannot download this recording')
      return
    }
    const filename = `${recording.title}-${Date.now()}.${recording.mimeType.split('/')[1]}`
    await saveToDevice(recording.blobData, filename)
  }

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const formatDate = (isoString: string) => {
    const date = new Date(isoString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <Card className="p-4 bg-card hover:bg-card/80 transition-colors border-border">
      <div className="flex items-start gap-4">
        <Button
          onClick={togglePlayback}
          size="lg"
          className={cn(
            "rounded-full w-14 h-14 flex-shrink-0",
            isPlaying ? "bg-accent/20 hover:bg-accent/30 text-accent" : "bg-accent hover:bg-accent/90"
          )}
        >
          {isPlaying ? (
            <Pause size={24} weight="fill" />
          ) : (
            <Play size={24} weight="fill" />
          )}
        </Button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base truncate">{recording.title}</h3>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge variant="secondary" className="text-xs">
                  {formatDuration(recording.durationMs)}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {formatDate(recording.createdAt)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {recording.blobData && (
                <Button
                  onClick={handleDownload}
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0"
                >
                  <Download size={16} />
                </Button>
              )}
              <Button
                onClick={onDelete}
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash size={16} />
              </Button>
            </div>
          </div>

          {recording.notes && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
              {recording.notes}
            </p>
          )}

          {recording.linkedSongId && (
            <Badge variant="outline" className="text-xs">
              <MusicNotes size={12} className="mr-1" />
              Linked to song
            </Badge>
          )}

          {audioUrl && (
            <audio 
              src={audioUrl}
              className="hidden"
              ref={(el) => {
                if (el && !audioElement) {
                  el.addEventListener('ended', () => setIsPlaying(false))
                  el.addEventListener('pause', () => setIsPlaying(false))
                  el.addEventListener('play', () => setIsPlaying(true))
                }
              }}
            />
          )}
        </div>
      </div>
    </Card>
  )
}

export function AudioIdeas() {
  const [recordings, setRecordings] = useKV<AudioRecording[]>('audio-recordings', [])
  const [searchQuery, setSearchQuery] = useState('')
  const [showRecorder, setShowRecorder] = useState(false)

  const filteredRecordings = (recordings || []).filter(recording => {
    const query = searchQuery.toLowerCase()
    return (
      recording.title.toLowerCase().includes(query) ||
      recording.notes?.toLowerCase().includes(query) ||
      recording.tags?.some(tag => tag.toLowerCase().includes(query))
    )
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const deleteRecording = (id: string) => {
    setRecordings(current => (current || []).filter(r => r.id !== id))
    toast.success('Recording deleted')
  }

  const handleRecordingSaved = () => {
    setShowRecorder(false)
  }

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Audio Ideas</h1>
          <p className="text-muted-foreground mt-1">
            Capture and organize your musical ideas
          </p>
        </div>
        <Button 
          onClick={() => setShowRecorder(!showRecorder)}
          size="lg"
          className={cn(
            "gap-2",
            showRecorder ? "bg-secondary hover:bg-secondary/90 text-secondary-foreground" : ""
          )}
        >
          {showRecorder ? (
            <>
              <X size={20} />
              Close Recorder
            </>
          ) : (
            <>
              <Plus size={20} />
              New Recording
            </>
          )}
        </Button>
      </div>

      {showRecorder && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-300">
          <AudioRecorder onSave={handleRecordingSaved} />
        </div>
      )}

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <MagnifyingGlass 
            size={20} 
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" 
          />
          <Input
            placeholder="Search recordings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        {searchQuery && (
          <Button
            onClick={() => setSearchQuery('')}
            variant="ghost"
            size="sm"
          >
            Clear
          </Button>
        )}
      </div>

      {filteredRecordings.length === 0 && !showRecorder && (
        <Card className="p-12 text-center bg-card/50">
          <div className="flex flex-col items-center gap-4 max-w-md mx-auto">
            <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center">
              <Waveform size={32} className="text-accent" />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">
                {searchQuery ? 'No recordings found' : 'No audio ideas yet'}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchQuery 
                  ? 'Try adjusting your search terms'
                  : 'Start capturing your musical ideas by creating your first recording'
                }
              </p>
              {!searchQuery && (
                <Button onClick={() => setShowRecorder(true)} className="gap-2">
                  <Plus size={18} />
                  Record Your First Idea
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}

      {filteredRecordings.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              {filteredRecordings.length} {filteredRecordings.length === 1 ? 'recording' : 'recordings'}
            </p>
          </div>
          
          <ScrollArea className="h-[calc(100vh-20rem)]">
            <div className="space-y-3 pr-4">
              {filteredRecordings.map(recording => (
                <AudioPlayer
                  key={recording.id}
                  recording={recording}
                  onDelete={() => deleteRecording(recording.id)}
                />
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  )
}
