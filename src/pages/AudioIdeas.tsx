import { useState } from 'react'
import type { AudioRecording } from '@/type
import { Button } from '@/components/ui/butto
import { Badge } from '@/components/ui/badg
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { AudioRecorder } from '@/components/AudioRecorder'
import { 
import {
  Pause, 
  if ('sh
  MagnifyingGlass, 
        type
  Plus,
    
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
      audio.addEventListen
      if (error.name === 'AbortError') {
        toast.info('Save cancelled')
        return false
      }
      throw error
    }
  } else {
      toast.error('Cannot download this r
    const a = document.createElement('a')
    await saveTo
    a.download = filename
    document.body.appendChild(a)
    a.click()
  }
    URL.revokeObjectURL(url)
    toast.success('Audio downloaded')
    return true
   
}

interface AudioPlayerProps {
  }
  onDelete: () => void
 

function AudioPlayer({ recording, onDelete }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null)

  const audioUrl = recording.blobData 
    ? URL.createObjectURL(recording.blobData)
        <div className="fl

              <div className="fl
    if (!audioElement) {
      const audio = new Audio(audioUrl!)
      audio.addEventListener('ended', () => setIsPlaying(false))
      audio.addEventListener('pause', () => setIsPlaying(false))
      audio.addEventListener('play', () => setIsPlaying(true))
                  onClick={h
      audio.play()
                >
    } else {
      if (isPlaying) {
        audioElement.pause()
      } else {
        audioElement.play()
       
    }
   

  const handleDownload = async () => {
    if (!recording.blobData) {
      toast.error('Cannot download this recording')
      return
     
    const filename = `${recording.title}-${Date.now()}.${recording.mimeType.split('/')[1]}`
    await saveToDevice(recording.blobData, filename)
   

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const formatDate = (isoString: string) => {
    const date = new Date(isoString)
      recording.notes?.toL
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
   

          
    <Card className="p-4 bg-card hover:bg-card/80 transition-colors border-border">
      <div className="flex items-start gap-4">
        <Button
          onClick={togglePlayback}
          size="lg"
            </>
        </Button>

        <div
        <

        <div className="relative flex-1">
            siz
          />
            
            onCha

        {searchQuery && (
            onClick={() => setSearchQuery('')}
            size="sm"
            Clear
        )}

        <Card className="p-12 text-center bg-card/50">
            <div classNa
            </div>
              <h3 className="font-semibold text-lg 
              </h3>
                {sea
                  
              </p>
                <Button onClick={() =>
                  Recor
              )}
          </div>
      )}
      {filteredRecordings.length > 0 && (
          <div cl
              {filteredRecordings.length
          </div>
          <Scrol
              {filter
                  key={recording.i
                  onDelet
              ))}
          </ScrollArea>
      )}
  )
















































































            </>




            </>

        </Button>









        <div className="relative flex-1">



          />







        {searchQuery && (

            onClick={() => setSearchQuery('')}

            size="sm"

            Clear

        )}



        <Card className="p-12 text-center bg-card/50">



            </div>



              </h3>





              </p>





              )}

          </div>

      )}

      {filteredRecordings.length > 0 && (





          </div>









              ))}

          </ScrollArea>

      )}

  )

