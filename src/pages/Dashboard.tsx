import { useKV } from '@github/spark/hooks'
import { Song } from '@/types'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, MagnifyingGlass, Clock } from '@phosphor-icons/react'
import { AppState } from '@/App'

interface DashboardProps {
  onNavigate: (page: AppState['currentPage'], songId?: string) => void
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const [songs] = useKV<Song[]>('songs', [])
  const allSongs = songs || []
  const recentSongs = [...allSongs].sort((a, b) => 
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  ).slice(0, 5)

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-8">
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
          <div className="text-sm font-medium text-muted-foreground">Quick Access</div>
          <Button 
            variant="ghost" 
            className="mt-2 text-accent hover:text-accent p-0 h-auto font-semibold"
            onClick={() => onNavigate('chords')}
          >
            Chord Library →
          </Button>
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
  )
}
