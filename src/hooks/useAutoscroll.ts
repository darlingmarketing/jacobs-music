import { useRef, useEffect, useCallback, RefObject } from 'react'

export interface AutoscrollOptions {
  /** If true, scrolling pauses when the scroll position reaches a section boundary
   *  element (elements with `data-section` attribute). */
  pauseAtSections?: boolean
  /** How many pixels before a section boundary to pause. Default 10. */
  sectionPausePx?: number
  /** Duration in milliseconds to pause at each section boundary. Default 1500. */
  sectionPauseDurationMs?: number
}

/**
 * useAutoscroll – drives smooth autoscroll of a container div.
 *
 * Supports:
 *  - Pause / resume at section boundaries (elements with `data-section` attribute)
 *  - Dynamic speed changes without restarting the animation loop
 */
export function useAutoscroll(
  active: boolean,
  speed: number,
  options?: AutoscrollOptions
): RefObject<HTMLDivElement> {
  const containerRef = useRef<HTMLDivElement>(null)
  const speedRef = useRef(speed)

  // Keep speedRef current so speed changes take effect without restarting the loop
  useEffect(() => {
    speedRef.current = speed
  }, [speed])

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
        el.scrollTop += (speedRef.current * deltaMs) / 1000

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
