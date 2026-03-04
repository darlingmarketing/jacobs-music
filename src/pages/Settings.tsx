import { GearSix } from '@phosphor-icons/react'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Separator } from '@/components/ui/separator'
import { useSettings } from '@/hooks/useSettings'
import type { AccentColour, Theme } from '@/hooks/useSettings'

const ACCENT_SWATCHES: { value: AccentColour; label: string; color: string }[] = [
  { value: 'blue', label: 'Blue', color: 'oklch(0.45 0.15 250)' },
  { value: 'green', label: 'Green', color: 'oklch(0.45 0.15 145)' },
  { value: 'purple', label: 'Purple', color: 'oklch(0.50 0.14 290)' },
  { value: 'orange', label: 'Orange', color: 'oklch(0.55 0.15 70)' },
  { value: 'rose', label: 'Rose', color: 'oklch(0.50 0.20 10)' },
]

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-lg font-semibold font-display mb-4">{children}</h2>
  )
}

function SettingRow({
  label,
  description,
  htmlFor,
  children,
}: {
  label: string
  description?: string
  htmlFor?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="flex-1 min-w-0">
        <Label htmlFor={htmlFor} className="text-sm font-medium leading-none">
          {label}
        </Label>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      {children}
    </div>
  )
}

export function Settings() {
  const { settings, update } = useSettings()

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 md:py-10">
      <div className="flex items-center gap-3 mb-8">
        <GearSix size={28} weight="duotone" className="text-primary" aria-hidden="true" />
        <h1 className="text-2xl font-bold font-display">Settings</h1>
      </div>

      {/* ── Appearance ─────────────────────────────────────────────── */}
      <section aria-labelledby="settings-appearance">
        <SectionHeading>
          <span id="settings-appearance">Appearance</span>
        </SectionHeading>

        {/* Theme */}
        <SettingRow label="Theme" description="Choose light, dark, or follow your system preference.">
          <RadioGroup
            value={settings.theme}
            onValueChange={v => update('theme', v as Theme)}
            className="flex gap-3"
            aria-label="Theme"
          >
            {(['light', 'dark', 'system'] as Theme[]).map(t => (
              <div key={t} className="flex items-center gap-1.5">
                <RadioGroupItem value={t} id={`theme-${t}`} />
                <Label htmlFor={`theme-${t}`} className="capitalize cursor-pointer">
                  {t}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </SettingRow>

        <Separator />

        {/* Accent colour */}
        <SettingRow label="Accent colour" description="Pick the primary colour used throughout the app.">
          <div className="flex gap-2" role="radiogroup" aria-label="Accent colour">
            {ACCENT_SWATCHES.map(swatch => (
              <button
                key={swatch.value}
                role="radio"
                aria-checked={settings.accentColour === swatch.value}
                aria-label={swatch.label}
                onClick={() => update('accentColour', swatch.value)}
                className="w-7 h-7 rounded-full transition-transform focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
                style={{
                  background: swatch.color,
                  transform: settings.accentColour === swatch.value ? 'scale(1.25)' : undefined,
                  boxShadow: settings.accentColour === swatch.value ? `0 0 0 2px var(--background), 0 0 0 4px ${swatch.color}` : undefined,
                }}
              />
            ))}
          </div>
        </SettingRow>

        <Separator />

        {/* Font size */}
        <SettingRow
          label={`Font size (${settings.fontSize}px)`}
          description="Adjust the base text size across the app."
          htmlFor="font-size-slider"
        >
          <div className="w-40">
            <Slider
              id="font-size-slider"
              min={12}
              max={22}
              step={1}
              value={[settings.fontSize]}
              onValueChange={([v]) => update('fontSize', v)}
              aria-label="Font size"
            />
          </div>
        </SettingRow>
      </section>

      <div className="mt-8 mb-2" />

      {/* ── Accessibility ──────────────────────────────────────────── */}
      <section aria-labelledby="settings-accessibility">
        <SectionHeading>
          <span id="settings-accessibility">Accessibility</span>
        </SectionHeading>

        <SettingRow
          label="Reduced motion"
          description="Minimise animations and transitions throughout the app."
          htmlFor="reduced-motion"
        >
          <Switch
            id="reduced-motion"
            checked={settings.reducedMotion}
            onCheckedChange={v => update('reducedMotion', v)}
            aria-describedby="reduced-motion-desc"
          />
        </SettingRow>

        <Separator />

        <SettingRow
          label="High contrast"
          description="Increase colour contrast for better readability."
          htmlFor="high-contrast"
        >
          <Switch
            id="high-contrast"
            checked={settings.highContrast}
            onCheckedChange={v => update('highContrast', v)}
          />
        </SettingRow>

        <Separator />

        <SettingRow
          label="Dyslexia-friendly font"
          description="Use OpenDyslexic, a typeface designed to aid readers with dyslexia."
          htmlFor="dyslexia-font"
        >
          <Switch
            id="dyslexia-font"
            checked={settings.dyslexiaFont}
            onCheckedChange={v => update('dyslexiaFont', v)}
          />
        </SettingRow>
      </section>

      <div className="mt-8 mb-2" />

      {/* ── 3D & Animations ────────────────────────────────────────── */}
      <section aria-labelledby="settings-3d">
        <SectionHeading>
          <span id="settings-3d">3D &amp; Animations</span>
        </SectionHeading>

        <SettingRow
          label="3D diagrams"
          description="Show interactive 3D fretboard and chord visualisations."
          htmlFor="enable-3d"
        >
          <Switch
            id="enable-3d"
            checked={settings.enable3D}
            onCheckedChange={v => update('enable3D', v)}
          />
        </SettingRow>

        <Separator />

        <SettingRow
          label="Ambient animations"
          description="Display decorative background animations on the dashboard."
          htmlFor="ambient-animations"
        >
          <Switch
            id="ambient-animations"
            checked={settings.ambientAnimations}
            onCheckedChange={v => update('ambientAnimations', v)}
          />
        </SettingRow>
      </section>
    </div>
  )
}
