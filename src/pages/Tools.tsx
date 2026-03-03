import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Metronome } from '@/components/Metronome'
import { Tuner } from '@/components/Tuner'
import { Info } from '@phosphor-icons/react'

export function Tools() {
  return (
    <div className="max-w-2xl mx-auto px-4 md:px-6 py-6 space-y-6">
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Tools</h1>

      <Tabs defaultValue="metronome">
        <TabsList className="w-full">
          <TabsTrigger value="metronome" className="flex-1">
            Metronome
          </TabsTrigger>
          <TabsTrigger value="tuner" className="flex-1">
            Tuner
          </TabsTrigger>
        </TabsList>

        <TabsContent value="metronome" className="mt-4 space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Tooltip>
              <TooltipTrigger asChild>
                <Info size={16} className="cursor-help shrink-0" />
              </TooltipTrigger>
              <TooltipContent>
                Set your tempo with the slider or tap the "Tap Tempo" button
                repeatedly to match a beat. Toggle accent to emphasise the
                downbeat.
              </TooltipContent>
            </Tooltip>
            <span>Adjust BPM and use Tap Tempo to set the beat.</span>
          </div>
          <Metronome />
        </TabsContent>

        <TabsContent value="tuner" className="mt-4 space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Tooltip>
              <TooltipTrigger asChild>
                <Info size={16} className="cursor-help shrink-0" />
              </TooltipTrigger>
              <TooltipContent>
                Click "Start Tuner", allow microphone access, then play a note on
                your instrument. The meter shows whether you are flat or sharp.
              </TooltipContent>
            </Tooltip>
            <span>Allow microphone access, then play a note to detect pitch.</span>
          </div>
          <Tuner />
        </TabsContent>
      </Tabs>
    </div>
  )
}
