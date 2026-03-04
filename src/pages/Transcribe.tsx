import { useState, useRef, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import type { Song, AudioRecording } from '@/types'
import type { ChordSegment, TranscriptionParams, WorkerMessage } from '@/types/transcription'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { ChordTimelineEditor } from '@/components/ChordTimelineEditor'
import { ModelComparisonView } from '@/components/ModelComparisonView'
import { 
  Upload, 
  Microphone, 
  WaveformSlash,
  FloppyDisk,
  ArrowsCounterClockwise,
  Brain,
  SplitVertical,
  Warning,
  MusicNote,
  Timer
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import { convertSegmentsToSong, transposeSegments, quantizeSegmentBoundaries, simplifySegments, segmentsToBars } from '@/lib/transcriptionUtils'
import { AppState } from '@/App'
import { getAvailableEngines, type TranscribeEngine } from '@/lib/transcribe/engine'
import { decodeAudioToBuffer } from '@/lib/audio/decode'
import { saveTranscription, listTranscriptions, type TranscriptionSummary } from '@/lib/transcribe/repo'
import type { TranscriptionResult } from '@/lib/transcribe/types'
import { transcriptionToSongDraft } from '@/lib/transcribe/convertToSongbook'

interface TranscribeProps {
  onNavigate: (page: AppState['currentPage'], songId?: string, transcriptionId?: string) => void
}

export function Transcribe({ onNavigate }: TranscribeProps) {
  const [songs, setSongs] = useKV<Song[]>('songs', [])
  const [recordings] = useKV<AudioRecording[]>('audio-recordings', [])
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [audioUrl, setAudioUrl] = useState<string>('')
  const [audioDuration, setAudioDuration] = useState<number>(0)
  const [sampleRate, setSampleRate] = useState<number>(44100)

  // Source selection: upload file or saved recording
  const [sourceType, setSourceType] = useState<'upload' | 'recording'>('upload')
  const [selectedRecordingId, setSelectedRecordingId] = useState<string>('')

  // Engine selection
  const engines: TranscribeEngine[] = getAvailableEngines()
  const [selectedEngineId, setSelectedEngineId] = useState<string>(engines[0]?.id ?? 'mock')

  // Recent transcriptions
  const [recentTranscriptions, setRecentTranscriptions] = useState<TranscriptionSummary[]>([])
  const [lastTxId, setLastTxId] = useState<string | null>(null)

  useEffect(() => {
    listTranscriptions().then(setRecentTranscriptions).catch(() => {})
  }, [])
  
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

  /** Resolve the audio blob to analyze, from either upload or saved recording. */
  const getSourceBlob = (): { blob: Blob; fileName?: string; recordingId?: string } | null => {
    if (sourceType === 'upload') {
      if (!audioFile) return null
      return { blob: audioFile, fileName: audioFile.name }
    }
    const rec = (recordings ?? []).find(r => r.id === selectedRecordingId)
    if (!rec?.blobData) return null
    return { blob: rec.blobData, fileName: rec.title, recordingId: rec.id }
  }

  const handleAnalyze = async () => {
    const source = getSourceBlob()
    if (!source) {
      toast.error(sourceType === 'upload' ? 'Please select an audio file first' : 'Please select a recording')
      return
    }
    
    setIsProcessing(true)
    setProgress(0)
    setProgressStep('Decoding audio...')
    setSegments([])
    setProcessingComplete(false)
    
    const selectedEngine = engines.find(e => e.id === selectedEngineId)

    try {
      // Engine-pluggable path (MockEngine + future EssentiaEngine)
      if (selectedEngine) {
        setProgressStep('Running engine...')
        setProgress(10)
        const audioBuffer = await decodeAudioToBuffer(source.blob)
        setProgress(40)
        const result: TranscriptionResult = await selectedEngine.transcribe(audioBuffer, {
          sourceFileName: source.fileName,
          sourceRecordingId: source.recordingId,
        })
        setProgress(80)
        if (result.tempoBpm) setBpm(result.tempoBpm)
        if (result.key) setSongKey(result.key)
        // The domain ChordSegment is structurally compatible with the local type
        setSegments(result.segments as ChordSegment[])
        setProgress(90)
        await saveTranscription(result)
        setLastTxId(result.id)
        const updated = await listTranscriptions()
        setRecentTranscriptions(updated)
        setProgress(100)
        setProgressStep('Complete!')
        setIsProcessing(false)
        setProcessingComplete(true)
        toast.success(`Transcribed ${result.segments.length} chord segments`)

        // Update audio player URL for the uploaded/recording blob
        if (!audioUrl) {
          const url = URL.createObjectURL(source.blob)
          setAudioUrl(url)
          if (source.blob instanceof File) {
            setAudioFile(source.blob as File)
          }
        }
        return
      }

      // Fallback: worker-based path (used when no matching engine found)
      const { audioData, sampleRate: rate } = await decodeAudioData(
        source.blob instanceof File ? source.blob : new File([source.blob], source.fileName ?? 'audio')
      )
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

  const handleConvertToSongDraft = async () => {
    if (segments.length === 0) {
      toast.error('No chord segments to convert')
      return
    }
    try {
      const timeSigParts = timeSig.split('/')
      const tsBeats = parseInt(timeSigParts[0] ?? '4', 10) || 4
      const tsBeatValue = parseInt(timeSigParts[1] ?? '4', 10) || 4
      const sbSong = transcriptionToSongDraft(
        {
          id: lastTxId ?? crypto.randomUUID(),
          segments: segments as any,
          tempoBpm: bpm,
          key: songKey || undefined,
          sourceFileName: audioFile?.name,
          createdAt: new Date().toISOString(),
        },
        { title: songTitle || audioFile?.name, timeSig: { beats: tsBeats, beatValue: tsBeatValue } }
      )
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
        key: songKey || undefined,
        tempo: bpm,
        timeSignature: timeSig,
        tuning: 'Standard',
        tags: ['transcribed'],
        sections: [
          {
            id: sbSong.sections[0].id,
            name: 'Transcription',
            type: 'custom',
            order: 0,
            blocks: [{ id: `blk_${Date.now()}`, type: 'chords', content: chordContent }],
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
    }
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
  const isAnalyzeDisabled = isProcessing || (sourceType === 'upload' ? !audioFile : !selectedRecordingId)

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 space-y-6">
      <div className="space-y-2">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight font-display">Transcribe From Audio</h1>
        <p className="text-lg text-muted-foreground">
          Analyse an audio file or saved recording to extract chord segments
        </p>
      </div>

      {/* ── Source Selection ─────────────────────────────────── */}
      <Card className="p-6">
        <div className="space-y-4">
          <h3 className="font-semibold font-display">Audio Source</h3>

          <RadioGroup
            value={sourceType}
            onValueChange={(v) => setSourceType(v as 'upload' | 'recording')}
            className="flex gap-6"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value="upload" id="src-upload" />
              <Label htmlFor="src-upload" className="cursor-pointer">Upload audio file</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="recording" id="src-recording" />
              <Label htmlFor="src-recording" className="cursor-pointer">Use a saved recording</Label>
            </div>
          </RadioGroup>

          {sourceType === 'upload' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Input
                  ref={fileInputRef}
                  id="audio-file"
                  type="file"
                  accept="audio/wav,audio/mpeg,audio/mp4,audio/ogg,audio/webm,audio/mp3,.m4a"
                  onChange={handleFileSelect}
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-muted-foreground">Supported: WAV, MP3, M4A, OGG, WebM (max 5 min, 50 MB)</p>
              {audioFile && (
                <div className="p-3 bg-muted/50 rounded-md space-y-1 text-sm">
                  <div><strong>File:</strong> {audioFile.name}</div>
                  <div><strong>Size:</strong> {(audioFile.size / 1024 / 1024).toFixed(2)} MB</div>
                  {audioDuration > 0 && <div><strong>Duration:</strong> {(audioDuration / 1000).toFixed(1)}s</div>}
                </div>
              )}
            </div>
          )}

          {sourceType === 'recording' && (
            <div className="space-y-2">
              {(recordings ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">No saved recordings found. Record something in the Audio tab first.</p>
              ) : (
                <Select value={selectedRecordingId} onValueChange={setSelectedRecordingId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a recording…" />
                  </SelectTrigger>
                  <SelectContent>
                    {(recordings ?? []).map(r => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.title} ({Math.round(r.durationMs / 1000)}s)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* ── Engine Selection + Settings ──────────────────────── */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold font-display">Detection Settings</h3>
            <Brain size={18} className="text-primary" />
          </div>

          {/* Engine dropdown */}
          <div className="space-y-2">
            <Label htmlFor="engine-select">Engine</Label>
            <div className="flex items-center gap-3">
              <Select value={selectedEngineId} onValueChange={setSelectedEngineId}>
                <SelectTrigger id="engine-select" className="w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {engines.map(e => (
                    <SelectItem key={e.id} value={e.id}>{e.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedEngineId === 'essentia' && (
                <Badge variant="destructive" className="gap-1">
                  <Warning size={12} />
                  AGPL mode
                </Badge>
              )}
            </div>
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
            disabled={isAnalyzeDisabled}
            className="w-full gap-2"
            size="lg"
          >
            <WaveformSlash size={20} />
            {isProcessing ? 'Analyzing…' : 'Analyze'}
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
          {/* ── Analysis Results ─────────────────────────────────── */}
          <Card className="p-6">
            <div className="space-y-4">
              <h3 className="font-semibold font-display">Analysis Results</h3>

              {/* Audio player */}
              {audioUrl && (
                <div>
                  <Label className="mb-2 block">Audio Preview</Label>
                  <audio src={audioUrl} controls className="w-full" />
                </div>
              )}

              {/* Segments table */}
              <div>
                <Label className="mb-2 block">Chord Segments ({segments.length})</Label>
                <div className="overflow-auto max-h-64 rounded-md border border-border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium">Start</th>
                        <th className="px-3 py-2 text-left font-medium">End</th>
                        <th className="px-3 py-2 text-left font-medium">Chord</th>
                        <th className="px-3 py-2 text-left font-medium">Confidence</th>
                      </tr>
                    </thead>
                    <tbody>
                      {segments.map((seg, i) => (
                        <tr key={seg.id} className={i % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                          <td className="px-3 py-1.5 font-mono">{(seg.startMs / 1000).toFixed(2)}s</td>
                          <td className="px-3 py-1.5 font-mono">{(seg.endMs / 1000).toFixed(2)}s</td>
                          <td className="px-3 py-1.5 font-semibold">{seg.chord}</td>
                          <td className="px-3 py-1.5 text-muted-foreground">
                            {seg.confidence != null ? `${Math.round(seg.confidence * 100)}%` : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{segments.length} segments</Badge>
                {songKey && <Badge variant="outline">Key: {songKey}</Badge>}
                {bpm && <Badge variant="outline">{bpm} BPM</Badge>}
                <Badge variant="secondary" className="ml-auto">Saved ✓</Badge>
              </div>
            </div>
          </Card>

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
                  segments={segments as any}
                  audioUrl={audioUrl}
                  audioDurationMs={audioDuration}
                  tempoBpm={bpm}
                  timeSig={{ beats: Number(timeSig.split('/')[0] ?? 4), beatValue: Number(timeSig.split('/')[1] ?? 4) }}
                  onChange={(s) => setSegments(s as ChordSegment[])}
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
              
              <div className="flex gap-2 flex-wrap">
                <Button onClick={handleConvertToSongDraft} className="flex-1 gap-2" size="lg">
                  <MusicNote size={20} />
                  Convert to Song Draft
                </Button>
                <Button onClick={handleCreateSong} variant="outline" className="flex-1 gap-2" size="lg">
                  <FloppyDisk size={20} />
                  Create Song (Legacy)
                </Button>
                {lastTxId && (
                  <Button
                    onClick={() => onNavigate('transcribe-timeline', undefined, lastTxId)}
                    variant="outline"
                    size="lg"
                    className="gap-2"
                  >
                    <Timer size={20} />
                    Open in Timeline
                  </Button>
                )}
                <Button 
                  onClick={() => {
                    setSegments([])
                    setProcessingComplete(false)
                    setAudioFile(null)
                    setAudioUrl('')
                    setLastTxId(null)
                  }} 
                  variant="ghost"
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
            Select an audio source, choose an engine, and click "Analyze" to get started
          </p>
          <div className="mt-6 p-4 bg-muted/50 rounded-md text-left text-sm space-y-2">
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Mock engine returns deterministic chord segments instantly</li>
              <li>Works best with clear, harmonic content</li>
              <li>Results require manual review and editing</li>
              <li>Processing happens entirely in your browser</li>
            </ul>
          </div>
        </Card>
      )}

      {/* ── Recent Transcriptions ────────────────────────────── */}
      {recentTranscriptions.length > 0 && (
        <Card className="p-6">
          <div className="space-y-3">
            <h3 className="font-semibold font-display">Recent Transcriptions</h3>
            <ul className="space-y-2">
              {recentTranscriptions.slice(0, 8).map(t => (
                <li key={t.id} className="flex items-center gap-3 text-sm py-1 border-b border-border last:border-0">
                  <WaveformSlash size={14} className="text-muted-foreground flex-shrink-0" />
                  <span className="flex-1 truncate text-muted-foreground">
                    {t.sourceFileName ?? t.sourceRecordingId ?? t.id}
                  </span>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(t.createdAt).toLocaleDateString()}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2 text-xs"
                    onClick={() => onNavigate('transcribe-timeline', undefined, t.id)}
                  >
                    <Timer size={12} className="mr-1" />
                    Timeline
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      )}
    </div>
  )
}
