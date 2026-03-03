import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Play, Pause, Microphone } from '@phosphor-icons/react'

export function Tools() {
  const [metronomeBpm, setMetronomeBpm] = useState(120)
  const [metronomeActive, setMetronomeActive] = useState(false)
  const [tunerActive, setTunerActive] = useState(false)

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 space-y-6">
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Tools</h1>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Metronome</h2>
          <div className="space-y-6">
            <div>
              <div className="text-4xl font-bold text-center text-primary mb-2">
                {metronomeBpm} BPM
              </div>
              <Slider
                value={[metronomeBpm]}
                onValueChange={(val) => setMetronomeBpm(val[0])}
                min={40}
                max={240}
                step={1}
                className="my-4"
              />
            </div>
            <Button
              onClick={() => setMetronomeActive(!metronomeActive)}
              className="w-full gap-2"
              variant={metronomeActive ? "destructive" : "default"}
            >
              {metronomeActive ? (
                <>
                  <Pause size={20} weight="fill" />
                  Stop
                </>
              ) : (
                <>
                  <Play size={20} weight="fill" />
                  Start
                </>
              )}
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Tuner</h2>
          <div className="space-y-6">
            <div className="text-center py-8">
              <Microphone size={64} className="mx-auto text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">
                {tunerActive ? 'Listening...' : 'Click start to tune your guitar'}
              </p>
            </div>
            <Button
              onClick={() => setTunerActive(!tunerActive)}
              className="w-full gap-2"
              variant={tunerActive ? "destructive" : "default"}
            >
              {tunerActive ? (
                <>
                  <Pause size={20} weight="fill" />
                  Stop Tuner
                </>
              ) : (
                <>
                  <Microphone size={20} />
                  Start Tuner
                </>
              )}
            </Button>
          </div>
        </Card>
      </div>

      <Card className="p-8 text-center">
        <p className="text-muted-foreground">
          Full tuner and metronome functionality with audio synthesis coming soon.
        </p>
      </Card>
    </div>
  )
}
