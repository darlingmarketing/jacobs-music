class AudioEngine {
  private audioContext: AudioContext | null = null

  private getContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new AudioContext()
    }
    return this.audioContext
  }

  playChord(frets: (number | -1)[], baseFret: number = 0): void {
    const ctx = this.getContext()
    const now = ctx.currentTime
    const tuning = [329.63, 246.94, 196.00, 146.83, 110.00, 82.41]

    frets.forEach((fret, stringIndex) => {
      if (fret === -1) return

      const openFreq = tuning[stringIndex]
      const actualFret = fret + (fret > 0 ? baseFret : 0)
      const frequency = openFreq * Math.pow(2, actualFret / 12)

      this.playNote(frequency, now + stringIndex * 0.03, 1.5)
    })
  }

  private playNote(frequency: number, startTime: number, duration: number): void {
    const ctx = this.getContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'triangle'
    osc.frequency.value = frequency

    gain.gain.setValueAtTime(0.3, startTime)
    gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(startTime)
    osc.stop(startTime + duration)
  }

  playFrequency(frequency: number, duration = 1.5): void {
    const ctx = this.getContext()
    this.playNote(frequency, ctx.currentTime, duration)
  }

  playMetronomeClick(isAccent: boolean = false, volume: number = 0.5): void {
    const ctx = this.getContext()
    const now = ctx.currentTime

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.frequency.value = isAccent ? 1200 : 800
    gain.gain.setValueAtTime(volume * (isAccent ? 0.8 : 0.4), now)
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(now)
    osc.stop(now + 0.05)
  }
}

export const audioEngine = new AudioEngine()
