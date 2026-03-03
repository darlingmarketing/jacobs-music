import { useRef, useEffect } from 'react'

export function useAutoscroll(active: boolean, speed: number) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!active) return
    const el = containerRef.current
    let animationId: number
    let lastTimestamp: number | null = null

    function step(timestamp: number) {
      if (el) {
        if (lastTimestamp !== null) {
          const deltaMs = timestamp - lastTimestamp
          el.scrollTop += (speed * deltaMs) / 1000
        }
        lastTimestamp = timestamp
      }
      animationId = requestAnimationFrame(step)
    }

    animationId = requestAnimationFrame(step)
    return () => cancelAnimationFrame(animationId)
  }, [active, speed])

  return containerRef
}
