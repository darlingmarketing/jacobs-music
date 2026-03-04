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

### Typography Components

Use the shared wrappers in `src/components/typography/` instead of raw HTML tags:

- **`<Heading level={1..4}>`** – renders `<h1>`–`<h4>` with the correct size, weight, and line-height class.
- **`<Text size="body|base|lg|sm" muted>`** – renders a `<p>` tag with the correct size and optional muted colour.

### Prose (lyric / markdown areas)

Apply the `.prose` class (from `@tailwindcss/typography`) to any container that renders free-form text or markdown. Use `.prose-sm` for compact contexts and `.dark:prose-invert` for dark-mode support.

```tsx
<div className="prose prose-sm dark:prose-invert max-w-none">
  {markdownContent}
</div>
```

---

## Component Spacing

Spacing is driven by the `--size-scale` CSS variable (default `1`). All spacing utilities (`p-`, `m-`, `gap-`, etc.) use the computed `--size-*` tokens from `src/styles/theme.css`.

- Use `p-4` / `p-6` for card inner padding.
- Use `gap-4` between related form fields.
- Use `gap-6` or `gap-8` between distinct page sections.
- Prefer `max-w-screen-sm`, `max-w-screen-md`, and `max-w-screen-lg` for responsive containers.

### Spacing Scale

The spacing scale is defined in `src/styles/theme.css` using CSS custom properties and a `--size-scale` multiplier. Prefer Tailwind utility classes over arbitrary values.

| Tailwind class | CSS variable | Value (at scale 1) | Common usage |
|---|---|---|---|
| `p-1` / `m-1` | `var(--size-1)` | `0.25rem` | Tight icon padding |
| `p-2` / `m-2` | `var(--size-2)` | `0.5rem` | Small inset padding |
| `p-3` / `m-3` | `var(--size-3)` | `0.75rem` | Badge/tag padding |
| `p-4` / `m-4` | `var(--size-4)` | `1rem` | Card inner padding (compact) |
| `p-6` / `m-6` | `var(--size-6)` | `1.5rem` | Card inner padding (default) |
| `gap-4` | `var(--size-4)` | `1rem` | Form field gap |
| `gap-6` | `var(--size-6)` | `1.5rem` | Section gap |
| `gap-8` | `var(--size-8)` | `2rem` | Major section gap |
| `p-8` / `m-8` | `var(--size-8)` | `2rem` | Page-level padding |

To scale all spacing proportionally, set `--size-scale` on a container element (e.g. `style="--size-scale: 1.25"`).

---

## Navigation

- **Mobile (< `md`)** – Fixed bottom navigation bar (`BottomNav` component in `src/components/nav/BottomNav.tsx`).
- **Desktop (≥ `md`)** – Fixed top navigation bar with icon + label buttons.
- The app uses an internal state-based router (`App.tsx`). Navigation items are defined in the `navItems` array.

---

## Dark Mode

Dark mode is toggled via the `data-appearance="dark"` attribute on a parent element (see `tailwind.config.js` `darkMode` setting). Use Tailwind's `dark:` variant for dark-mode overrides.

---

## Motion & Animations

Framer Motion (`framer-motion`) is used for all page transitions and micro-interactions.

### Page Transitions

Route changes are wrapped with `AnimatePresence` and `motion.div` in `App.tsx`:

```tsx
<AnimatePresence mode="wait">
  <motion.div
    key={currentPage}
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    transition={{ duration: 0.2 }}
  >
    {pageContent}
  </motion.div>
</AnimatePresence>
```

### Component Animations

Use Framer Motion for interactive feedback:

- **Beat indicators** – `motion.div` with `scaleY` and `opacity` variants on each beat pulse.
- **Count-in numbers** – `AnimatePresence` with scale/opacity transitions to sequence the animated countdown.
- **Cards** – `motion(Card)` with `whileHover={{ scale: 1.02 }}` and `whileTap={{ scale: 0.97 }}`.

### Accessibility

Framer Motion automatically respects `prefers-reduced-motion`. When a user has enabled the reduced-motion system preference, all animations are disabled without any additional code. Do not override this behaviour.
