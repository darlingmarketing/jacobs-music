# UX Guidelines – Jacobs Music

## Colour System

All colours are defined as OKLCH values in `src/index.css` and mapped to Radix colour palettes in `src/styles/theme.css`.

### Semantic tokens (defined in `src/index.css`)

| Token | Value | Usage |
|---|---|---|
| `--background` | `oklch(0.97 0.01 250)` | Page background |
| `--foreground` | `oklch(0.18 0.05 250)` | Body text |
| `--card` | `oklch(0.995 0.005 250)` | Card surfaces |
| `--primary` | `oklch(0.45 0.15 250)` | Primary actions |
| `--secondary` | `oklch(0.55 0.12 200)` | Secondary actions |
| `--muted` | `oklch(0.92 0.02 250)` | Subtle backgrounds |
| `--accent` | `oklch(0.65 0.15 145)` | Highlights / accents |
| `--destructive` | `oklch(0.55 0.20 25)` | Error / delete actions |
| `--warning` | `oklch(0.70 0.15 70)` | Warning states |
| `--border` | `oklch(0.88 0.02 250)` | Borders and dividers |

### Radix colour palettes (defined in `src/styles/theme.css`)

- **Neutral** → Slate scale (`--color-neutral-1` … `--color-neutral-12`)
- **Accent** → Blue scale (`--color-accent-1` … `--color-accent-12`)
- **Accent secondary** → Violet scale (`--color-accent-secondary-1` … `--color-accent-secondary-12`)

Use the semantic tokens in components rather than the raw Radix palette steps.

---

## Typography Scale

Font sizes and line heights are defined in `tailwind.config.js` under `theme.extend.fontSize` / `theme.extend.lineHeight`.

| Class | Size | Notes |
|---|---|---|
| `text-body` | `0.95rem` | General body copy |
| `text-base` | `1rem` | Default base |
| `text-lg` | `1.125rem` | Slightly larger body |
| `text-xl` | `1.25rem` | Card headings |
| `text-2xl` | `1.5rem` | Section headings |

| Class | Line height | Notes |
|---|---|---|
| `leading-body` | `1.6` | Body copy |
| `leading-heading` | `1.3` | Headings and labels |

### Fonts

- **Body** – Inter (sans-serif fallback chain)
- **Headings** – Outfit (`h1`–`h6`)
- **Monospace** – JetBrains Mono (`.font-mono`)

---

## Component Spacing

Spacing is driven by the `--size-scale` CSS variable (default `1`). All spacing utilities (`p-`, `m-`, `gap-`, etc.) use the computed `--size-*` tokens from `src/styles/theme.css`.

- Use `p-4` / `p-6` for card inner padding.
- Use `gap-4` between related form fields.
- Use `gap-6` or `gap-8` between distinct page sections.
- Prefer `max-w-screen-sm`, `max-w-screen-md`, and `max-w-screen-lg` for responsive containers.

---

## Navigation

- **Mobile (< `md`)** – Fixed bottom navigation bar (`BottomNav` component in `src/components/nav/BottomNav.tsx`).
- **Desktop (≥ `md`)** – Fixed top navigation bar with icon + label buttons.
- The app uses an internal state-based router (`App.tsx`). Navigation items are defined in the `navItems` array.

---

## Dark Mode

Dark mode is toggled via the `data-appearance="dark"` attribute on a parent element (see `tailwind.config.js` `darkMode` setting). Use Tailwind's `dark:` variant for dark-mode overrides.
