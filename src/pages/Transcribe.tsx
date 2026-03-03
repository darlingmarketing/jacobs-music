import { useState, useRef } from 'react'
import { useKV } from '@github/spark/hooks'
import type { Song } from '@/types'
import type { ChordSegment, TranscriptionParams, WorkerMessage } from '@/types/transcription'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { ChordTimelineEditor } from '@/components/ChordTimelineEditor'
import { ModelComparisonView } from '@/components/ModelComparisonView'
import { 
  Upload, 
  Microphone, 
  WaveformSlash,
  FloppyDisk,
  ArrowsCounterClockwise,
  Brain,
  SplitVertical
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import { convertSegmentsToSong, transposeSegments, quantizeSegmentBoundaries, simplifySegments, segmentsToBars } from '@/lib/transcriptionUtils'
import { AppState } from '@/App'

interface TranscribeProps {
  onNavigate: (page: AppState['currentPage'], songId?: string) => void
}

export function Transcribe({ onNavigate }: TranscribeProps) {
  const [songs, setSongs] = useKV<Song[]>('songs', [])
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [audioUrl, setAudioUrl] = useState<string>('')
  const [audioDuration, setAudioDuration] = useState<number>(0)
  const [sampleRate, setSampleRate] = useState<number>(44100)
  
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressStep, setProgressStep] = useState('')
  const [segments, setSegments] = useState<ChordSegment[]>([])
  const [processingComplete, setProcessingComplete] = useState(false)
  
  const [bpm, setBpm] = useState(120)
  const [timeSig, setTimeSig] = useState('4/4')
  const [conversionMode, setConversionMode] = useState<'bar' | 'sectioned'>('bar')
  const [songTitle, setSongTitle] = useState('')
  const [songKey, setSongKey] = useState('')
  const [songArtist, setSongArtist] = useState('')
  const [songDescription, setSongDescription] = useState('')
  const [enableEnsemble, setEnableEnsemble] = useState(true)
  const [showModelComparison, setShowModelComparison] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const workerRef = useRef<Worker | null>(null)
  
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    const validTypes = ['audio/wav', 'audio/mpeg', 'audio/mp4', 'audio/ogg', 'audio/webm', 'audio/mp3', 'audio/x-m4a']
    if (!validTypes.some(type => file.type === type || file.name.endsWith(`.${type.split('/')[1]}`) || file.name.endsWith('.m4a') || file.name.endsWith('.mp3'))) {
      toast.error('Invalid file type. Please upload WAV, MP3, M4A, OGG, or WebM')
      return
    }
    
    const MAX_SIZE = 50 * 1024 * 1024
    if (file.size > MAX_SIZE) {
      toast.error('File too large. Maximum size is 50MB')
      return
    }
    
    setAudioFile(file)
    const url = URL.createObjectURL(file)
    setAudioUrl(url)
    
    const audio = new Audio(url)
    audio.addEventListener('loadedmetadata', () => {
      setAudioDuration(audio.duration * 1000)
      setSampleRate(44100)
      
      if (audio.duration > 300) {
        toast.error('Audio duration exceeds 5 minutes. Please trim or use a shorter file.')
      }
    })
    
    toast.success(`Loaded: ${file.name}`)
  }
  
  const decodeAudioData = async (file: File): Promise<{ audioData: Float32Array; sampleRate: number }> => {
    const arrayBuffer = await file.arrayBuffer()
    const audioContext = new AudioContext()
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
    
    let audioData: Float32Array
    if (audioBuffer.numberOfChannels > 1) {
      const left = audioBuffer.getChannelData(0)
      const right = audioBuffer.getChannelData(1)
      audioData = new Float32Array(left.length)
      for (let i = 0; i < left.length; i++) {
        audioData[i] = (left[i] + right[i]) / 2
      }
    } else {
      audioData = audioBuffer.getChannelData(0)
    }
    
    return { audioData, sampleRate: audioBuffer.sampleRate }
  }
  
  const handleAnalyze = async () => {
    if (!audioFile) {
      toast.error('Please select an audio file first')
      return
    }
    
    setIsProcessing(true)
    setProgress(0)
    setProgressStep('Decoding audio...')
    setSegments([])
    setProcessingComplete(false)
    
    try {
      const { audioData, sampleRate: rate } = await decodeAudioData(audioFile)
      setSampleRate(rate)
      
      const params: TranscriptionParams = {
        frameSize: 4096,
        hopSize: 2048,
        sampleRate: rate,
        beatAware: false,
        minSegmentDurationMs: 200,
        confidenceThreshold: 0.1,
        enableEnsemble
      }
      
      if (!workerRef.current) {
        workerRef.current = new Worker(
          new URL('../workers/chordTranscribe.worker.ts', import.meta.url),
          { type: 'module' }
        )
      }
      
      workerRef.current.onmessage = (e: MessageEvent<WorkerMessage>) => {
        const msg = e.data
        
        if (msg.type === 'progress') {
          setProgress(msg.progress || 0)
          setProgressStep(msg.step || '')
        } else if (msg.type === 'success') {
          setSegments(msg.segments || [])
          setProgress(100)
          setProgressStep('Complete!')
          setIsProcessing(false)
          setProcessingComplete(true)
          toast.success(`Transcribed ${msg.segments?.length || 0} chord segments`)
        } else if (msg.type === 'error') {
          setIsProcessing(false)
          toast.error(`Error: ${msg.error}`)
        }
      }
      
      workerRef.current.postMessage({ audioData, sampleRate: rate, params })
      
    } catch (error) {
      setIsProcessing(false)
      toast.error(`Failed to analyze: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
  
  const handleTranspose = (semitones: number) => {
    setSegments(transposeSegments(segments, semitones))
    toast.success(`Transposed ${semitones > 0 ? '+' : ''}${semitones} semitones`)
  }
  
  const handleQuantize = () => {
    setSegments(quantizeSegmentBoundaries(segments, 250))
    toast.success('Quantized segment boundaries')
  }
  
  const handleSimplify = () => {
    setSegments(simplifySegments(segments, 500))
    toast.success('Simplified chord timeline')
  }
  
  const handleCreateSong = async () => {
    if (segments.length === 0) {
      toast.error('No chord segments to convert')
      return
    }
    
    const songData = convertSegmentsToSong(
      segments,
      { bpm, timeSig, mode: conversionMode },
      {
        title: songTitle || audioFile?.name || 'Untitled Transcription',
        artist: songArtist,
        key: songKey,
        description: songDescription
      }
    )
    
    const user = await window.spark.user()
    const newSong: Song = {
      ...songData,
      id: crypto.randomUUID(),
      userId: user.login,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    setSongs((currentSongs) => [...(currentSongs || []), newSong])
    toast.success('Song created successfully!')
    
    setTimeout(() => {
      onNavigate('editor', newSong.id)
    }, 500)
  }
  
  const previewChords = segments.length > 0 ? segmentsToBars(segments, bpm, timeSig) : ''
  
  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 space-y-6">
      <div className="space-y-2">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight font-display">AI Chord Detection</h1>
        <p className="text-lg text-muted-foreground">
          Advanced chord recognition powered by ensemble machine learning models
        </p>
      </div>
      
      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="upload">
            <Upload className="mr-2" size={16} />
            Upload Audio
          </TabsTrigger>
          <TabsTrigger value="record">
            <Microphone className="mr-2" size={16} />
            Record
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="upload" className="space-y-4">
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="audio-file">Audio File</Label>
                <div className="mt-2 flex items-center gap-2">
                  <Input
                    ref={fileInputRef}
                    id="audio-file"
                    type="file"
                    accept="audio/wav,audio/mpeg,audio/mp4,audio/ogg,audio/webm,audio/mp3,.m4a"
                    onChange={handleFileSelect}
                    className="flex-1"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Supported: WAV, MP3, M4A, OGG, WebM (max 5 min, 50MB)
                </p>
              </div>
              
              {audioFile && (
                <div className="p-3 bg-muted/50 rounded-md space-y-1 text-sm">
                  <div><strong>File:</strong> {audioFile.name}</div>
                  <div><strong>Size:</strong> {(audioFile.size / 1024 / 1024).toFixed(2)} MB</div>
                  <div><strong>Duration:</strong> {(audioDuration / 1000).toFixed(1)}s</div>
                  <div><strong>Sample Rate:</strong> {sampleRate} Hz</div>
                </div>
              )}
            </div>
          </Card>
        </TabsContent>
        
        <TabsContent value="record" className="space-y-4">
          <Card className="p-6">
            <p className="text-muted-foreground text-center py-8">
              Recording feature coming soon. Please use the Upload tab.
            </p>
          </Card>
        </TabsContent>
      </Tabs>
      
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold font-display">AI Detection Settings</h3>
            <Brain size={18} className="text-primary" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bpm">BPM (Tempo)</Label>
              <Input
                id="bpm"
                type="number"
                value={bpm}
                onChange={(e) => setBpm(Number(e.target.value))}
                min={40}
                max={240}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="timesig">Time Signature</Label>
              <Select value={timeSig} onValueChange={setTimeSig}>
                <SelectTrigger id="timesig">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="4/4">4/4</SelectItem>
                  <SelectItem value="3/4">3/4</SelectItem>
                  <SelectItem value="6/8">6/8</SelectItem>
                  <SelectItem value="5/4">5/4</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-border">
            <div className="space-y-1">
              <Label htmlFor="ensemble-mode" className="font-medium">Ensemble AI Models</Label>
              <p className="text-sm text-muted-foreground">
                Combine 3 AI models for improved accuracy
              </p>
            </div>
            <Switch
              id="ensemble-mode"
              checked={enableEnsemble}
              onCheckedChange={setEnableEnsemble}
            />
          </div>
          
          <Button
            onClick={handleAnalyze}
            disabled={!audioFile || isProcessing}
            className="w-full gap-2"
            size="lg"
          >
            <WaveformSlash size={20} />
            {isProcessing ? 'Analyzing with AI...' : 'Analyze Chords'}
          </Button>
          
          {isProcessing && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-muted-foreground text-center font-mono">{progressStep}</p>
            </div>
          )}
        </div>
      </Card>
      
      {processingComplete && segments.length > 0 && (
        <>
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold font-display">Chord Timeline</h3>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setShowModelComparison(!showModelComparison)}
                    variant={showModelComparison ? "default" : "outline"}
                    size="sm"
                    className="gap-2"
                  >
                    <SplitVertical size={16} />
                    {showModelComparison ? 'Hide' : 'Show'} Models
                  </Button>
                  <Button onClick={() => handleTranspose(-1)} variant="outline" size="sm">-1</Button>
                  <Button onClick={() => handleTranspose(1)} variant="outline" size="sm">+1</Button>
                  <Button onClick={handleQuantize} variant="outline" size="sm">Quantize</Button>
                  <Button onClick={handleSimplify} variant="outline" size="sm">Simplify</Button>
                </div>
              </div>
              
              {showModelComparison ? (
                <ModelComparisonView segments={segments} />
              ) : (
                <ChordTimelineEditor
                  segments={segments}
                  audioUrl={audioUrl}
                  audioDurationMs={audioDuration}
                  onChange={setSegments}
                />
              )}
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="space-y-4">
              <h3 className="font-semibold font-display">Preview as Song</h3>
              
              <div className="space-y-2">
                <Label>Conversion Mode</Label>
                <Select value={conversionMode} onValueChange={(v) => setConversionMode(v as 'bar' | 'sectioned')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bar">Bar Format (Single Section)</SelectItem>
                    <SelectItem value="sectioned">Auto-Detect Sections</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="p-4 bg-muted/50 rounded-md font-mono text-sm whitespace-pre-wrap max-h-48 overflow-y-auto">
                {previewChords || 'No chords detected'}
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="space-y-4">
              <h3 className="font-semibold">Song Metadata</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={songTitle}
                    onChange={(e) => setSongTitle(e.target.value)}
                    placeholder={audioFile?.name || 'Untitled'}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="artist">Artist</Label>
                  <Input
                    id="artist"
                    value={songArtist}
                    onChange={(e) => setSongArtist(e.target.value)}
                    placeholder="Artist name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="key">Key</Label>
                  <Input
                    id="key"
                    value={songKey}
                    onChange={(e) => setSongKey(e.target.value)}
                    placeholder="e.g., C, Am"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description / Notes</Label>
                <Textarea
                  id="description"
                  value={songDescription}
                  onChange={(e) => setSongDescription(e.target.value)}
                  placeholder="Add notes about this transcription..."
                  rows={3}
                />
              </div>
              
              <div className="flex gap-2">
                <Button onClick={handleCreateSong} className="flex-1 gap-2" size="lg">
                  <FloppyDisk size={20} />
                  Create Song
                </Button>
                <Button 
                  onClick={() => {
                    setSegments([])
                    setProcessingComplete(false)
                    setAudioFile(null)
                    setAudioUrl('')
                  }} 
                  variant="outline"
                  size="lg"
                >
                  <ArrowsCounterClockwise size={20} />
                </Button>
              </div>
            </div>
          </Card>
        </>
      )}
      
      {segments.length === 0 && !isProcessing && (
        <Card className="p-12 text-center">
          <WaveformSlash size={48} className="mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold mb-2">No Analysis Yet</h3>
          <p className="text-muted-foreground text-sm">
            Upload an audio file and click "Analyze Chords" to get started
          </p>
          <div className="mt-6 p-4 bg-muted/50 rounded-md text-left text-sm space-y-2">
            <p><strong>Note:</strong> This feature uses Essentia.js for chord detection.</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Detects major and minor triads only</li>
              <li>Works best with clear, harmonic content</li>
              <li>Results require manual review and editing</li>
              <li>Processing happens entirely in your browser</li>
            </ul>
          </div>
        </Card>
      )}
    </div>
  )
}
