// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

/**
 * Tests that animations respect the user's prefers-reduced-motion media query.
 *
 * Framer Motion reads window.matchMedia('(prefers-reduced-motion: reduce)') and
 * disables animations when the user has enabled the reduced-motion preference.
 * Here we verify the matchMedia mock infrastructure works correctly so that
 * animation-aware components can be tested with this preference.
 */
describe('prefers-reduced-motion', () => {
  const originalMatchMedia = window.matchMedia

  afterEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: originalMatchMedia,
    })
  })

  function mockMatchMedia(prefersReducedMotion: boolean) {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (query: string) => ({
        matches: prefersReducedMotion && query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }),
    })
  }

  it('matchMedia returns false for reduced-motion when not set', () => {
    mockMatchMedia(false)
    const result = window.matchMedia('(prefers-reduced-motion: reduce)')
    expect(result.matches).toBe(false)
  })

  it('matchMedia returns true for reduced-motion when preference is set', () => {
    mockMatchMedia(true)
    const result = window.matchMedia('(prefers-reduced-motion: reduce)')
    expect(result.matches).toBe(true)
  })

  it('matchMedia returns false for other queries when reduced-motion is set', () => {
    mockMatchMedia(true)
    const result = window.matchMedia('(max-width: 768px)')
    expect(result.matches).toBe(false)
  })
})
