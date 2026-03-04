import { useRef, useEffect, useCallback, RefObject } from 'react'

export interface AutoscrollOptions {
  /** If true, scrolling pauses when the scroll position reaches a section boundary
   *  element (elements with `data-section` attribute). */
  pauseAtSections?: boolean
  /** How many pixels before a section boundary to pause. Default 10. */
  sectionPausePx?: number
  /** Duration in milliseconds to pause at each section boundary. Default 1500. */
  sectionPauseDurationMs?: number
  /** Autoscroll mode: 'manual' uses speed (px/sec), 'bpm' derives speed from tempo. */
  mode?: 'manual' | 'bpm'
  /** Song tempo in BPM – used in 'bpm' mode. */
  tempoBpm?: number
  /** Pixels to scroll per beat in 'bpm' mode. Default 40. */
  pxPerBeat?: number
}

/** Resolve effective px/sec given the current options. */
function resolveSpeed(
  manualSpeed: number,
  mode: 'manual' | 'bpm',
  tempoBpm: number,
  pxPerBeat: number
): number {
  if (mode === 'bpm' && tempoBpm > 0) {
    // beats/sec × px/beat = px/sec
    return (tempoBpm / 60) * pxPerBeat
  }
  return manualSpeed
}

/**
 * useAutoscroll – drives smooth autoscroll of a container div.
 *
 * Supports:
 *  - Pause / resume at section boundaries (elements with `data-section` attribute)
 *  - Dynamic speed changes without restarting the animation loop
 *  - BPM-based speed mode
 *  - Screen Wake Lock (keeps screen on while scrolling on mobile)
 */
export function useAutoscroll(
  active: boolean,
  speed: number,
  options?: AutoscrollOptions
): RefObject<HTMLDivElement> {
  const containerRef = useRef<HTMLDivElement>(null)
  const speedRef = useRef(speed)
  const modeRef = useRef(options?.mode ?? 'manual')
  const tempoBpmRef = useRef(options?.tempoBpm ?? 120)
  const pxPerBeatRef = useRef(options?.pxPerBeat ?? 40)

  // Keep refs current so changes take effect without restarting the loop
  useEffect(() => {
    speedRef.current = speed
  }, [speed])
  useEffect(() => {
    modeRef.current = options?.mode ?? 'manual'
    tempoBpmRef.current = options?.tempoBpm ?? 120
    pxPerBeatRef.current = options?.pxPerBeat ?? 40
  }, [options?.mode, options?.tempoBpm, options?.pxPerBeat])

  const pauseAtSections = options?.pauseAtSections ?? false
  const pausePx = options?.sectionPausePx ?? 10
  const pauseDurationMs = options?.sectionPauseDurationMs ?? 1500

  const pauseAtSectionsRef = useRef(pauseAtSections)
  const pausePxRef = useRef(pausePx)
  const pauseDurationMsRef = useRef(pauseDurationMs)
  useEffect(() => {
    pauseAtSectionsRef.current = pauseAtSections
    pausePxRef.current = pausePx
    pauseDurationMsRef.current = pauseDurationMs
  }, [pauseAtSections, pausePx, pauseDurationMs])

  const getSectionBoundaries = useCallback((el: HTMLDivElement): number[] => {
    const sections = el.querySelectorAll<HTMLElement>('[data-section]')
    return Array.from(sections).map(s => s.offsetTop)
  }, [])

  // Screen Wake Lock: prevent screen from sleeping while scrolling
  useEffect(() => {
    if (!active) return
    if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) return

    let wakeLock: WakeLockSentinel | null = null
    const wakeLockNav = navigator as Navigator & { wakeLock: WakeLockType }
    wakeLockNav.wakeLock
      .request('screen')
      .then(wl => { wakeLock = wl })
      .catch(() => { /* wake lock unavailable – ignore */ })

    return () => {
      wakeLock?.release().catch(() => {})
    }
  }, [active])

  useEffect(() => {
    if (!active) return
    const el = containerRef.current
    if (!el) return

    let animationId: number
    let lastTimestamp: number | null = null
    let pauseUntil: number | null = null
    const crossedBoundaries = new Set<number>()

    function step(timestamp: number) {
      if (!el) return

      if (pauseUntil !== null) {
        if (timestamp < pauseUntil) {
          lastTimestamp = null
          animationId = requestAnimationFrame(step)
          return
        }
        pauseUntil = null
      }

      if (lastTimestamp !== null) {
        const deltaMs = timestamp - lastTimestamp
        const effectiveSpeed = resolveSpeed(
          speedRef.current,
          modeRef.current,
          tempoBpmRef.current,
          pxPerBeatRef.current
        )
        el.scrollTop += (effectiveSpeed * deltaMs) / 1000

        if (pauseAtSectionsRef.current) {
          const boundaries = getSectionBoundaries(el)
          for (const boundary of boundaries) {
            if (!crossedBoundaries.has(boundary) &&
                el.scrollTop + pausePxRef.current >= boundary) {
              crossedBoundaries.add(boundary)
              pauseUntil = timestamp + pauseDurationMsRef.current
              break
            }
          }
        }
      }

      lastTimestamp = timestamp
      animationId = requestAnimationFrame(step)
    }

    animationId = requestAnimationFrame(step)
    return () => cancelAnimationFrame(animationId)
  }, [active, getSectionBoundaries])

  return containerRef as RefObject<HTMLDivElement>
}

// Minimal type shim for WakeLock API
interface WakeLockSentinel {
  release(): Promise<void>
}
interface WakeLockType {
  request(type: 'screen'): Promise<WakeLockSentinel>
}
