import { describe, it, expect, vi, afterEach } from 'vitest'
import type { ChordVoicing } from '@/types'

// Minimal voicing fixture (used to verify module exports)
const _voicing: ChordVoicing = {
  id: 'test-voicing',
  frets: [0, 2, 2, 1, 0, 0],
  fingers: [0, 2, 3, 1, 0, 0],
  baseFret: 1,
}

// Stub out the heavy React Three Fiber / drei modules so they are never
// evaluated when running in the Node test environment.
vi.mock('@react-three/fiber', () => ({
  Canvas: () => null,
  useFrame: vi.fn(),
  useThree: vi.fn(() => ({})),
}))

vi.mock('@react-three/drei', () => ({
  OrbitControls: () => null,
}))

afterEach(() => {
  vi.restoreAllMocks()
})

describe('isWebGLAvailable', () => {
  it('returns false when window.WebGLRenderingContext is undefined', async () => {
    // Simulate a non-WebGL environment
    const origWGL = (globalThis as Record<string, unknown>).WebGLRenderingContext
    ;(globalThis as Record<string, unknown>).WebGLRenderingContext = undefined

    const { isWebGLAvailable } = await import('../Fretboard3D')
    expect(isWebGLAvailable()).toBe(false)

    ;(globalThis as Record<string, unknown>).WebGLRenderingContext = origWGL
  })

  it('returns false when canvas.getContext throws', async () => {
    // Provide a stub WebGLRenderingContext but make getContext throw
    ;(globalThis as Record<string, unknown>).WebGLRenderingContext = class {}
    ;(globalThis as Record<string, unknown>).document = {
      createElement: () => ({
        getContext: () => { throw new Error('not supported') },
      }),
    }

    const { isWebGLAvailable } = await import('../Fretboard3D')
    expect(isWebGLAvailable()).toBe(false)

    delete (globalThis as Record<string, unknown>).document
    delete (globalThis as Record<string, unknown>).WebGLRenderingContext
  })

  it('returns true when webgl context is available', async () => {
    // Provide a stub WebGLRenderingContext and a canvas that returns a context
    ;(globalThis as Record<string, unknown>).window = globalThis
    ;(globalThis as Record<string, unknown>).WebGLRenderingContext = class {}
    ;(globalThis as Record<string, unknown>).document = {
      createElement: () => ({
        getContext: (type: string) =>
          type === 'webgl' || type === 'experimental-webgl' ? {} : null,
      }),
    }

    vi.resetModules()
    const { isWebGLAvailable } = await import('../Fretboard3D')
    expect(isWebGLAvailable()).toBe(true)

    delete (globalThis as Record<string, unknown>).window
    delete (globalThis as Record<string, unknown>).document
    delete (globalThis as Record<string, unknown>).WebGLRenderingContext
  })
})

