/**
 * Global keyboard shortcuts for Jacobs Music.
 *
 * Call `registerKeyboardShortcuts` once at app startup (e.g. inside App.tsx)
 * and call the returned cleanup function on unmount.
 */

export interface KeyboardShortcut {
  /** Human-readable description shown in the help overlay */
  description: string
  /** The key combination, e.g. 'ctrl+s' or '?' */
  combo: string
  handler: (e: KeyboardEvent) => void
}

/** Map of shortcut ID → shortcut definition */
const shortcuts = new Map<string, KeyboardShortcut>()

/** Register a named shortcut. Returns an unregister function. */
export function registerShortcut(id: string, shortcut: KeyboardShortcut): () => void {
  shortcuts.set(id, shortcut)
  return () => shortcuts.delete(id)
}

/** Return all currently registered shortcuts (for the help overlay). */
export function getShortcuts(): KeyboardShortcut[] {
  return Array.from(shortcuts.values())
}

function matchesCombo(e: KeyboardEvent, combo: string): boolean {
  const parts = combo.toLowerCase().split('+')
  const key = parts[parts.length - 1]
  const ctrl = parts.includes('ctrl')
  const shift = parts.includes('shift')
  const alt = parts.includes('alt')
  const meta = parts.includes('meta')

  return (
    e.key.toLowerCase() === key &&
    e.ctrlKey === ctrl &&
    e.shiftKey === shift &&
    e.altKey === alt &&
    e.metaKey === meta
  )
}

function globalKeyHandler(e: KeyboardEvent) {
  // Don't fire shortcuts when typing in an input / textarea
  const tag = (e.target as HTMLElement)?.tagName?.toLowerCase()
  if (tag === 'input' || tag === 'textarea' || (e.target as HTMLElement)?.isContentEditable) {
    return
  }

  for (const shortcut of shortcuts.values()) {
    if (matchesCombo(e, shortcut.combo)) {
      shortcut.handler(e)
      break
    }
  }
}

/**
 * Attach the global keyboard listener.
 * Returns a cleanup function to remove the listener.
 */
export function registerKeyboardShortcuts(): () => void {
  document.addEventListener('keydown', globalKeyHandler)
  return () => document.removeEventListener('keydown', globalKeyHandler)
}
