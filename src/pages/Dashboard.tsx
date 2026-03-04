import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Song, AudioRecording } from '@/types'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Plus, MagnifyingGlass, Clock, Microphone, Play, Trash } from '@phosphor-icons/react'
import { AppState } from '@/App'
import { AudioRecorder } from '@/components/AudioRecorder'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface DashboardProps {
  onNavigate: (page: AppState['currentPage'], songId?: string) => void
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const [songs] = useKV<Song[]>('songs', [])
  const [recordings, setRecordings] = useKV<AudioRecording[]>('audio-recordings', [])
  const [isRecording, setIsRecording] = useState(false)
  const [playingRecording, setPlayingRecording] = useState<string | null>(null)

  const allSongs = songs || []
  const recentSongs = [...allSongs].sort((a, b) => 
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  ).slice(0, 5)

  const allRecordings = recordings || []
  const recentRecordings = [...allRecordings].sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  ).slice(0, 3)

  const handleDeleteRecording = (id: string) => {
    setRecordings(current => (current || []).filter(r => r.id !== id))
    toast.success('Recording deleted')
  }

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:pt-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-2">Welcome back to Jacobs Music</p>
          </div>
          <Button 
            onClick={() => onNavigate('editor')}
            className="gap-2"
          >
            <Plus size={20} weight="bold" />
            <span className="hidden sm:inline">New Song</span>
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="p-6 bg-gradient-to-br from-primary/20 to-primary/5 border-primary/20">
            <div className="text-sm font-medium text-muted-foreground">Total Songs</div>
            <div className="text-3xl font-bold text-primary mt-2">{allSongs.length}</div>
          </Card>
          <Card className="p-6 bg-gradient-to-br from-accent/20 to-accent/5 border-accent/20">
            <div className="text-sm font-medium text-muted-foreground">Audio Ideas</div>
            <div className="text-3xl font-bold text-accent mt-2">{allRecordings.length}</div>
          </Card>
          <Card className="p-6 bg-gradient-to-br from-secondary/40 to-secondary/10 border-secondary/30">
            <div className="text-sm font-medium text-muted-foreground">Tools</div>
            <Button 
              variant="ghost" 
              className="mt-2 p-0 h-auto font-semibold hover:text-primary"
              onClick={() => onNavigate('tools')}
            >
              Tuner & Metronome →
            </Button>
          </Card>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold">Recent Songs</h2>
            <Button 
              variant="ghost" 
              onClick={() => onNavigate('songs')}
              className="text-primary"
            >
              View All →
            </Button>
          </div>
          
          {recentSongs.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="text-muted-foreground space-y-4">
                <p className="text-lg">No songs yet</p>
                <Button onClick={() => onNavigate('editor')} className="gap-2">
                  <Plus size={20} weight="bold" />
                  Create Your First Song
                </Button>
              </div>
            </Card>
          ) : (
            <div className="space-y-3">
              {recentSongs.map(song => (
                <Card 
                  key={song.id}
                  className="p-4 hover:border-primary/50 transition-colors cursor-pointer"
                  onClick={() => onNavigate('editor', song.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{song.title}</h3>
                      {song.artist && (
                        <p className="text-sm text-muted-foreground">{song.artist}</p>
                      )}
                      <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                        {song.key && <span>Key: {song.key}</span>}
                        {song.tempo && <span>Tempo: {song.tempo} BPM</span>}
                        {song.tags.length > 0 && (
                          <span className="flex gap-1">
                            {song.tags.map(tag => (
                              <span key={tag} className="px-2 py-0.5 bg-secondary rounded text-xs">
                                {tag}
                              </span>
                            ))}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock size={14} />
                      <span>{new Date(song.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {recentRecordings.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold">Recent Audio Ideas</h2>
            </div>
            
            <div className="space-y-3">
              {recentRecordings.map(recording => {
                const audioUrl = recording.blobData 
                  ? URL.createObjectURL(recording.blobData) 
                  : recording.storageRef
                
                return (
                  <Card 
                    key={recording.id}
                    className="p-4 bg-card/50"
                  >
                    <div className="flex items-start gap-4">
                      <Button
                        size="sm"
                        variant="ghost"
                        className={cn(
                          "rounded-full w-10 h-10 flex-shrink-0",
                          playingRecording === recording.id && "text-accent"
                        )}
                        onClick={() => {
                          if (playingRecording === recording.id) {
                            setPlayingRecording(null)
                          } else {
                            setPlayingRecording(recording.id)
                          }
                        }}
                      >
                        <Play size={20} weight="fill" />
                      </Button>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{recording.title}</h3>
                        {recording.notes && (
                          <p className="prose prose-sm dark:prose-invert text-muted-foreground truncate">{recording.notes}</p>
                        )}
                        <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                          <span>{formatDuration(recording.durationMs)}</span>
                          <span>{new Date(recording.createdAt).toLocaleDateString()}</span>
                        </div>
                        {audioUrl && playingRecording === recording.id && (
                          <audio 
                            src={audioUrl} 
                            autoPlay 
                            controls 
                            className="w-full mt-2"
                            onEnded={() => setPlayingRecording(null)}
                          />
                        )}
                      </div>

                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive flex-shrink-0"
                        onClick={() => handleDeleteRecording(recording.id)}
                      >
                        <Trash size={18} />
                      </Button>
                    </div>
                  </Card>
                )
              })}
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="font-semibold text-lg mb-4">Quick Search</h3>
            <div className="relative">
              <MagnifyingGlass size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder="Search your songs..." 
                className="pl-10"
                onFocus={() => onNavigate('songs')}
              />
            </div>
          </Card>
          
          <Card className="p-6">
            <h3 className="font-semibold text-lg mb-4">Discover New Songs</h3>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => onNavigate('discover')}
            >
              <MagnifyingGlass size={20} className="mr-2" />
              Explore Songs
            </Button>
          </Card>
        </div>
      </div>

      <Button
        onClick={() => setIsRecording(true)}
        className={cn(
          "fixed bottom-24 right-6 md:bottom-8 md:right-8",
          "w-16 h-16 rounded-full shadow-lg",
          "bg-accent hover:bg-accent/90",
          "transition-all hover:scale-110",
          "z-50"
        )}
      >
        <Microphone size={28} weight="fill" />
      </Button>

      <Dialog open={isRecording} onOpenChange={setIsRecording}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Microphone size={24} className="text-accent" />
              Quick Record Audio Idea
            </DialogTitle>
          </DialogHeader>
          <AudioRecorder onSave={() => setIsRecording(false)} />
        </DialogContent>
      </Dialog>
    </>
  )
}
