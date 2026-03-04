# Feature Template

Use this template when proposing or implementing a new feature. Fill in every section **before** writing any code. This keeps scope clear, prevents regressions, and makes reviews faster.

---

## Feature name

_A short, human-readable name for the feature (e.g. "Chord Difficulty Badge")._

## Background / motivation

_Why is this feature needed? Link to any relevant issue, user request, or design document._

## Scope

_What is **in scope** and what is **explicitly out of scope** for this iteration?_

**In scope:**
- 

**Out of scope:**
- 

## Acceptance criteria

_A numbered list of testable conditions that must be true for the feature to be considered complete._

1. 
2. 
3. 

## Design references

_Link to Figma files, screenshots, or sections of `docs/UX_GUIDELINES.md` that apply._

- Colour tokens: see [UX_GUIDELINES.md – Colour System](./UX_GUIDELINES.md#colour-system)
- Spacing: see [UX_GUIDELINES.md – Component Spacing](./UX_GUIDELINES.md#component-spacing)
- Motion: see [UX_GUIDELINES.md – Motion & Animations](./UX_GUIDELINES.md#motion--animations)

## Technical approach

_Describe the implementation plan: which files will be created or modified, which existing hooks/utilities will be reused, and any architectural decisions._

### Files to create

- 

### Files to modify

- 

### Data model changes

_Describe any additions or changes to `src/types/`, `src/lib/songbook/types.ts`, or KV storage keys in `src/lib/storage/keys.ts`._

## Feature flag

_If this feature should be hidden behind a feature flag while in development, name the flag here and reference `src/lib/config/flags.ts`._

Flag name: `enable_<feature_name>` (or `none` if not required)

## Accessibility checklist

- [ ] All interactive elements are keyboard-accessible (focusable, correct role, label).
- [ ] Colour contrast meets WCAG AA (≥ 4.5:1 for normal text, ≥ 3:1 for large text).
- [ ] Animations respect `prefers-reduced-motion` (Framer Motion handles this automatically).
- [ ] Touch targets are at least 44 × 44 px on mobile.

## Test plan

_List the unit, integration, or manual tests that will verify the acceptance criteria._

### Automated tests

- [ ] Unit test: 
- [ ] Component test: 

### Manual tests

- [ ] Desktop (≥ 768 px): 
- [ ] Mobile emulation (< 768 px): 

## Rollout notes

_Any migration steps, data-backfill requirements, or gradual-rollout considerations._
