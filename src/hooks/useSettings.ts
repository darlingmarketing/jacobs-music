import { useEffect } from 'react'
import { useKV } from '@github/spark/hooks'

export type Theme = 'light' | 'dark' | 'system'
export type AccentColour = 'blue' | 'green' | 'purple' | 'orange' | 'rose'

export interface Settings {
  theme: Theme
  accentColour: AccentColour
  fontSize: number // 12–20, default 16
  reducedMotion: boolean
  highContrast: boolean
  dyslexiaFont: boolean
  enable3D: boolean
  ambientAnimations: boolean
}

export const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  accentColour: 'blue',
  fontSize: 16,
  reducedMotion: false,
  highContrast: false,
  dyslexiaFont: false,
  enable3D: true,
  ambientAnimations: true,
}

/** Accent colour CSS overrides (OKLch values matching existing palette style) */
const ACCENT_MAP: Record<AccentColour, { accent: string; accentFg: string; primary: string; primaryFg: string }> = {
  blue: {
    accent: 'oklch(0.65 0.15 250)',
    accentFg: 'oklch(0.20 0.05 250)',
    primary: 'oklch(0.45 0.15 250)',
    primaryFg: 'oklch(0.98 0.01 250)',
  },
  green: {
    accent: 'oklch(0.65 0.15 145)',
    accentFg: 'oklch(0.20 0.02 145)',
    primary: 'oklch(0.45 0.15 145)',
    primaryFg: 'oklch(0.98 0.01 145)',
  },
  purple: {
    accent: 'oklch(0.65 0.15 290)',
    accentFg: 'oklch(0.20 0.02 290)',
    primary: 'oklch(0.50 0.14 290)',
    primaryFg: 'oklch(0.98 0.01 290)',
  },
  orange: {
    accent: 'oklch(0.70 0.15 70)',
    accentFg: 'oklch(0.20 0.02 70)',
    primary: 'oklch(0.55 0.15 70)',
    primaryFg: 'oklch(0.98 0.01 70)',
  },
  rose: {
    accent: 'oklch(0.65 0.20 10)',
    accentFg: 'oklch(0.20 0.02 10)',
    primary: 'oklch(0.50 0.20 10)',
    primaryFg: 'oklch(0.98 0.01 10)',
  },
}

function applyTheme(theme: Theme) {
  const root = document.documentElement
  if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    root.classList.toggle('dark', prefersDark)
  } else {
    root.classList.toggle('dark', theme === 'dark')
  }
}

function applySettings(settings: Settings) {
  const root = document.documentElement

  // Theme
  applyTheme(settings.theme)

  // Accent colour
  const colours = ACCENT_MAP[settings.accentColour]
  root.style.setProperty('--accent', colours.accent)
  root.style.setProperty('--accent-foreground', colours.accentFg)
  root.style.setProperty('--primary', colours.primary)
  root.style.setProperty('--primary-foreground', colours.primaryFg)
  root.style.setProperty('--ring', colours.primary)

  // Font size scale (base 16px)
  root.style.setProperty('--font-size-base', `${settings.fontSize}px`)

  // Accessibility classes
  root.classList.toggle('reduced-motion', settings.reducedMotion)
  root.classList.toggle('high-contrast', settings.highContrast)
  root.classList.toggle('font-dyslexia', settings.dyslexiaFont)

  // 3D / animations data attributes (consumed by relevant components)
  root.dataset.enable3d = settings.enable3D ? 'true' : 'false'
  root.dataset.ambientAnimations = settings.ambientAnimations ? 'true' : 'false'
}

export function useSettings() {
  const [settings, setSettings] = useKV<Settings>('settings', DEFAULT_SETTINGS)

  const resolved = settings ?? DEFAULT_SETTINGS

  // Apply settings to document whenever they change
  useEffect(() => {
    applySettings(resolved)
  }, [resolved])

  // Listen for system colour-scheme changes when theme is 'system'
  useEffect(() => {
    if (resolved.theme !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => applyTheme('system')
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [resolved.theme])

  const update = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings(prev => ({ ...(prev ?? DEFAULT_SETTINGS), [key]: value }))
  }

  return { settings: resolved, update }
}

export { applySettings }
