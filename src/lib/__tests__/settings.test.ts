// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { applySettings, DEFAULT_SETTINGS, type Settings } from '../../hooks/useSettings'

/**
 * Tests that applySettings() correctly updates CSS custom properties and
 * HTML class names on the document root element.
 */
describe('applySettings – CSS custom properties', () => {
  const originalMatchMedia = window.matchMedia

  beforeEach(() => {
    // Reset document root state
    document.documentElement.removeAttribute('class')
    document.documentElement.removeAttribute('style')
    document.documentElement.removeAttribute('data-enable-3d')
    document.documentElement.removeAttribute('data-ambient-animations')
    document.documentElement.style.cssText = ''

    // Stub matchMedia (light mode by default)
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }),
    })
  })

  afterEach(() => {
    Object.defineProperty(window, 'matchMedia', { writable: true, value: originalMatchMedia })
  })

  it('applies dark class when theme is dark', () => {
    applySettings({ ...DEFAULT_SETTINGS, theme: 'dark' })
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('removes dark class when theme is light', () => {
    document.documentElement.classList.add('dark')
    applySettings({ ...DEFAULT_SETTINGS, theme: 'light' })
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('follows system preference (dark) when theme is system', () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (query: string) => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }),
    })
    applySettings({ ...DEFAULT_SETTINGS, theme: 'system' })
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('sets --primary CSS variable based on accent colour', () => {
    applySettings({ ...DEFAULT_SETTINGS, accentColour: 'green' })
    expect(document.documentElement.style.getPropertyValue('--primary')).toContain('oklch')
    expect(document.documentElement.style.getPropertyValue('--primary')).toContain('145')
  })

  it('sets --font-size-base CSS variable', () => {
    applySettings({ ...DEFAULT_SETTINGS, fontSize: 18 })
    expect(document.documentElement.style.getPropertyValue('--font-size-base')).toBe('18px')
  })

  it('adds reduced-motion class when enabled', () => {
    applySettings({ ...DEFAULT_SETTINGS, reducedMotion: true })
    expect(document.documentElement.classList.contains('reduced-motion')).toBe(true)
  })

  it('removes reduced-motion class when disabled', () => {
    document.documentElement.classList.add('reduced-motion')
    applySettings({ ...DEFAULT_SETTINGS, reducedMotion: false })
    expect(document.documentElement.classList.contains('reduced-motion')).toBe(false)
  })

  it('adds high-contrast class when enabled', () => {
    applySettings({ ...DEFAULT_SETTINGS, highContrast: true })
    expect(document.documentElement.classList.contains('high-contrast')).toBe(true)
  })

  it('adds font-dyslexia class when dyslexiaFont is enabled', () => {
    applySettings({ ...DEFAULT_SETTINGS, dyslexiaFont: true })
    expect(document.documentElement.classList.contains('font-dyslexia')).toBe(true)
  })

  it('sets data-enable-3d attribute to "false" when 3D is disabled', () => {
    applySettings({ ...DEFAULT_SETTINGS, enable3D: false })
    expect(document.documentElement.dataset.enable3d).toBe('false')
  })

  it('sets data-ambient-animations attribute to "true" by default', () => {
    applySettings({ ...DEFAULT_SETTINGS })
    expect(document.documentElement.dataset.ambientAnimations).toBe('true')
  })

  it('DEFAULT_SETTINGS has expected shape', () => {
    const s: Settings = DEFAULT_SETTINGS
    expect(s.theme).toBe('system')
    expect(s.accentColour).toBe('blue')
    expect(s.fontSize).toBe(16)
    expect(s.reducedMotion).toBe(false)
    expect(s.highContrast).toBe(false)
    expect(s.dyslexiaFont).toBe(false)
    expect(s.enable3D).toBe(true)
    expect(s.ambientAnimations).toBe(true)
  })
})
