import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Plus,
  Trash,
  MusicNotes,
  Queue,
  PencilSimple,
  Check,
  X,
} from '@phosphor-icons/react'
import { useSetlists } from '@/hooks/useSetlists'
import type { Song, Setlist } from '@/types'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface SetlistManagerProps {
  songs: Song[]
  onLaunchSetlist?: (setlist: Setlist) => void
  className?: string
}

export function SetlistManager({ songs, onLaunchSetlist, className }: SetlistManagerProps) {
  const { setlists, createSetlist, deleteSetlist, addSongToSetlist, removeSongFromSetlist, updateSetlist } = useSetlists()
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [selectedSetlistId, setSelectedSetlistId] = useState<string | null>(null)

  const handleCreate = () => {
    const name = newName.trim()
    if (!name) return
    createSetlist(name)
    setNewName('')
    toast.success(`Created setlist "${name}"`)
  }

  const handleStartEdit = (setlist: Setlist) => {
    setEditingId(setlist.id)
    setEditingName(setlist.name)
  }

  const handleConfirmEdit = () => {
    if (!editingId || !editingName.trim()) return
    updateSetlist(editingId, { name: editingName.trim() })
    setEditingId(null)
    toast.success('Setlist renamed')
  }

  const handleDelete = (id: string, name: string) => {
    deleteSetlist(id)
    if (selectedSetlistId === id) setSelectedSetlistId(null)
    toast.success(`Deleted "${name}"`)
  }

  const selectedSetlist = setlists.find(s => s.id === selectedSetlistId) ?? null
  const songsInSetlist = selectedSetlist
    ? selectedSetlist.songIds.map(id => songs.find(s => s.id === id)).filter(Boolean) as Song[]
    : []
  const songsNotInSetlist = selectedSetlist
    ? songs.filter(s => !selectedSetlist.songIds.includes(s.id))
    : []

  return (
    <div className={cn('space-y-4', className)}>
      {/* Create new setlist */}
      <div className="flex gap-2">
        <Input
          placeholder="New setlist name..."
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleCreate()}
          className="flex-1"
        />
        <Button onClick={handleCreate} disabled={!newName.trim()} className="gap-1">
          <Plus size={16} />
          Create
        </Button>
      </div>

      {setlists.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">
          No setlists yet. Create one above to get started.
        </p>
      ) : (
        <div className="space-y-2">
          {setlists.map(setlist => (
            <div
              key={setlist.id}
              className={cn(
                'flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors',
                selectedSetlistId === setlist.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/40'
              )}
              onClick={() => setSelectedSetlistId(prev => prev === setlist.id ? null : setlist.id)}
            >
              <Queue size={18} className="text-primary shrink-0" />

              {editingId === setlist.id ? (
                <Input
                  value={editingName}
                  onChange={e => setEditingName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleConfirmEdit()
                    if (e.key === 'Escape') setEditingId(null)
                  }}
                  onClick={e => e.stopPropagation()}
                  className="h-7 text-sm flex-1"
                  autoFocus
                />
              ) : (
                <span className="font-medium flex-1">{setlist.name}</span>
              )}

              <Badge variant="secondary" className="shrink-0">
                {setlist.songIds.length} songs
              </Badge>

              {editingId === setlist.id ? (
                <>
                  <Button size="icon" variant="ghost" onClick={e => { e.stopPropagation(); handleConfirmEdit() }} className="h-7 w-7">
                    <Check size={14} />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={e => { e.stopPropagation(); setEditingId(null) }} className="h-7 w-7">
                    <X size={14} />
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={e => { e.stopPropagation(); handleStartEdit(setlist) }}
                    className="h-7 w-7 text-muted-foreground"
                    aria-label="Rename setlist"
                  >
                    <PencilSimple size={14} />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={e => { e.stopPropagation(); handleDelete(setlist.id, setlist.name) }}
                    className="h-7 w-7 text-destructive"
                    aria-label="Delete setlist"
                  >
                    <Trash size={14} />
                  </Button>
                </>
              )}

              {onLaunchSetlist && setlist.songIds.length > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={e => { e.stopPropagation(); onLaunchSetlist(setlist) }}
                  className="shrink-0 text-xs"
                >
                  Launch
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Song management for selected setlist */}
      {selectedSetlist && (
        <div className="mt-4 space-y-3 border-t pt-4">
          <h4 className="font-semibold text-sm">Songs in "{selectedSetlist.name}"</h4>

          {songsInSetlist.length === 0 ? (
            <p className="text-xs text-muted-foreground">No songs added yet.</p>
          ) : (
            <ScrollArea className="max-h-48">
              <div className="space-y-1">
                {songsInSetlist.map(song => (
                  <div key={song.id} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted/50">
                    <MusicNotes size={14} className="text-muted-foreground shrink-0" />
                    <span className="text-sm flex-1">{song.title}</span>
                    {song.artist && <span className="text-xs text-muted-foreground">{song.artist}</span>}
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => removeSongFromSetlist(selectedSetlist.id, song.id)}
                      className="h-6 w-6 text-destructive shrink-0"
                      aria-label="Remove from setlist"
                    >
                      <X size={12} />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}

          {songsNotInSetlist.length > 0 && (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1">
                  <Plus size={14} />
                  Add songs
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add songs to "{selectedSetlist.name}"</DialogTitle>
                </DialogHeader>
                <ScrollArea className="max-h-96">
                  <div className="space-y-1 pr-4">
                    {songsNotInSetlist.map(song => (
                      <div
                        key={song.id}
                        className="flex items-center gap-2 px-2 py-2 rounded hover:bg-muted/50 cursor-pointer"
                        onClick={() => {
                          addSongToSetlist(selectedSetlist.id, song.id)
                          toast.success(`Added "${song.title}" to setlist`)
                        }}
                      >
                        <MusicNotes size={14} className="text-muted-foreground shrink-0" />
                        <span className="text-sm flex-1">{song.title}</span>
                        {song.artist && <span className="text-xs text-muted-foreground">{song.artist}</span>}
                        <Plus size={14} className="text-primary shrink-0" />
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </DialogContent>
            </Dialog>
          )}
        </div>
      )}
    </div>
  )
}

interface AddToSetlistButtonProps {
  songId: string
  songs: Song[]
}

export function AddToSetlistButton({ songId, songs }: AddToSetlistButtonProps) {
  const { setlists, addSongToSetlist, removeSongFromSetlist, createSetlist } = useSetlists()
  const [newName, setNewName] = useState('')

  const setlistsWithSong = setlists.filter(s => s.songIds.includes(songId))

  const handleCreate = () => {
    const name = newName.trim()
    if (!name) return
    const sl = createSetlist(name)
    addSongToSetlist(sl.id, songId)
    setNewName('')
    toast.success(`Added to new setlist "${name}"`)
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Manage setlists">
          <Queue size={18} className={setlistsWithSong.length > 0 ? 'text-primary' : 'text-muted-foreground'} />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add to Setlist</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1">
            {setlists.map(sl => {
              const inList = sl.songIds.includes(songId)
              return (
                <div
                  key={sl.id}
                  className="flex items-center gap-2 px-2 py-2 rounded hover:bg-muted/50 cursor-pointer"
                  onClick={() => inList ? removeSongFromSetlist(sl.id, songId) : addSongToSetlist(sl.id, songId)}
                >
                  <Queue size={14} className="text-muted-foreground shrink-0" />
                  <span className="text-sm flex-1">{sl.name}</span>
                  <Badge variant="secondary" className="text-xs">{sl.songIds.length}</Badge>
                  {inList ? (
                    <Check size={14} className="text-primary shrink-0" />
                  ) : (
                    <Plus size={14} className="text-muted-foreground shrink-0" />
                  )}
                </div>
              )
            })}
          </div>

          <Label className="text-xs text-muted-foreground">Create new setlist</Label>
          <div className="flex gap-2">
            <Input
              placeholder="Setlist name..."
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              className="flex-1 h-8 text-sm"
            />
            <Button size="sm" onClick={handleCreate} disabled={!newName.trim()}>
              <Plus size={14} />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
