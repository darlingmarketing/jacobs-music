import { useState } from 'react'
import type { AudioRecording } from '@/types'
import { useKV } from '@github/spark/hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AudioRecorder } from '@/components/AudioRecorder'
import { 
  Play, 
  Pause, 
  Trash, 
  MagnifyingGlass, 
  Plus,
  Download,
  MusicNotes,
  Microphone
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
          variant={isPlaying ? "default" : "outline"}
          className={cn(
            "rounded-full w-12 h-12 flex-shrink-0",
            isPlaying && "bg-accent hover:bg-accent/90"
          )}
        >
          {isPlaying ? (
            <Pause size={20} weight="fill" />
          ) : (
            <Play size={20} weight="fill" />
          )}
        </Button>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg truncate">{recording.title}</h3>
          {recording.notes && (
            <p className="prose prose-sm dark:prose-invert text-muted-foreground line-clamp-2 mt-1">
              {recording.notes}
            </p>
          )}
          <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
            <span>{formatDuration(recording.durationMs)}</span>
            <span>{formatDate(recording.createdAt)}</span>
            {recording.tags.length > 0 && (
              <div className="flex gap-1">
                {recording.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2 flex-shrink-0">
          <Button
            onClick={handleDownload}
            size="sm"
            variant="ghost"
            className="text-muted-foreground hover:text-foreground"
          >
            <Download size={18} />
          </Button>
          <Button
            onClick={onDelete}
            size="sm"
            variant="ghost"
            className="text-destructive hover:text-destructive"
          >
            <Trash size={18} />
          </Button>
        </div>
      </div>
    </Card>
  )
}

export function AudioIdeas() {
  const [recordings, setRecordings] = useKV<AudioRecording[]>('audio-recordings', [])
  const [searchQuery, setSearchQuery] = useState('')
  const [isRecording, setIsRecording] = useState(false)

  const allRecordings = recordings || []
  
  const filteredRecordings = allRecordings.filter(recording => {
    const query = searchQuery.toLowerCase()
    return (
      recording.title.toLowerCase().includes(query) ||
      recording.notes?.toLowerCase().includes(query) ||
      recording.tags.some(tag => tag.toLowerCase().includes(query))
    )
  })

  const handleDeleteRecording = (id: string) => {
    setRecordings(current => (current || []).filter(r => r.id !== id))
    toast.success('Recording deleted')
  }

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Audio Ideas</h1>
            <p className="text-muted-foreground mt-2">
              Record and organize your musical ideas
            </p>
          </div>
          <Button 
            onClick={() => setIsRecording(true)}
            className="gap-2"
          >
            <Plus size={20} weight="bold" />
            <span className="hidden sm:inline">New Recording</span>
          </Button>
        </div>

        <div className="relative flex-1">
          <MagnifyingGlass 
            size={20} 
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            placeholder="Search recordings by title, notes, or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-20"
          />
          {searchQuery && (
            <Button
              onClick={() => setSearchQuery('')}
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 -translate-y-1/2"
            >
              Clear
            </Button>
          )}
        </div>

        {filteredRecordings.length === 0 && (
          <Card className="p-12 text-center bg-card/50">
            <div className="flex flex-col items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center">
                <MusicNotes size={40} className="text-accent" />
              </div>
              <h3 className="font-semibold text-lg">
                {searchQuery ? 'No recordings found' : 'No audio ideas yet'}
              </h3>
              <p className="text-muted-foreground max-w-md">
                {searchQuery 
                  ? 'Try adjusting your search query'
                  : 'Start capturing your musical ideas by recording audio snippets'
                }
              </p>
              {!searchQuery && (
                <Button onClick={() => setIsRecording(true)} className="gap-2 mt-2">
                  <Microphone size={20} weight="fill" />
                  Record Your First Idea
                </Button>
              )}
            </div>
          </Card>
        )}

        {filteredRecordings.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {filteredRecordings.length} {filteredRecordings.length === 1 ? 'recording' : 'recordings'}
              </p>
            </div>
            <ScrollArea className="h-[calc(100vh-300px)]">
              <div className="space-y-3 pr-4">
                {filteredRecordings.map(recording => (
                  <AudioPlayer
                    key={recording.id}
                    recording={recording}
                    onDelete={() => handleDeleteRecording(recording.id)}
                  />
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>

      <Dialog open={isRecording} onOpenChange={setIsRecording}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Microphone size={24} className="text-accent" />
              Record Audio Idea
            </DialogTitle>
          </DialogHeader>
          <AudioRecorder onSave={() => setIsRecording(false)} />
        </DialogContent>
      </Dialog>
    </>
  )
}
