# Contributing to Jacobs Music

Welcome! This guide covers how to run the project, the code style, how to run tests, and where to find design resources.

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18 (LTS recommended)
- **npm** ≥ 9

### Install dependencies

```bash
npm install
```

### Start the dev server

```bash
npm run dev
```

The app runs at `http://localhost:5173` by default.

### Build for production

```bash
npm run build
```

---

## Code Style

This project uses **TypeScript**, **React 19**, **Tailwind CSS v4**, and **Radix UI** via shadcn/ui.

### Formatting

Run Prettier (if configured) before committing:

```bash
npm run format
```

### Linting

```bash
npm run lint
```

Fix any **errors** before pushing. Warnings for `@typescript-eslint/no-explicit-any` in pre-existing code are tracked but not blocking.

Key ESLint rules enforced:

| Rule | Level | Notes |
|---|---|---|
| `@typescript-eslint/no-unused-vars` | warn | Prefix intentionally unused vars with `_` |
| `no-duplicate-imports` | error | Merge separate type/value imports from the same module |
| `react-hooks/exhaustive-deps` | warn | Fix or suppress with a comment explaining the reason |

### TypeScript

- `strictNullChecks` is enabled. Avoid `!` non-null assertions unless you have proven safety.
- Prefer `type` over `interface` for union types; use `interface` for object shapes that may be extended.
- Do **not** use `any` in new code. Use `unknown` and narrow with type guards.

### Components

- Place shared UI primitives in `src/components/ui/` (shadcn/ui — do not hand-edit).
- Place feature components in `src/components/`.
- Place page-level components (one per route) in `src/pages/`.
- Use the `<Heading>` and `<Text>` wrappers from `src/components/typography/` instead of raw HTML tags.

### Styling

- Use **Tailwind utility classes** for all styling.
- Use semantic tokens (`bg-background`, `text-foreground`, `border-border`, etc.) rather than raw colour values.
- Do not add arbitrary values (e.g. `w-[347px]`) unless absolutely necessary; prefer Tailwind scale steps.
- For dark mode use the `dark:` variant (controlled via `data-appearance="dark"` on a parent).

---

## Running Tests

```bash
npm test
```

Run with coverage:

```bash
npx vitest --coverage
```

Tests live alongside the code they test in `__tests__/` subdirectories or as `*.test.ts` / `*.test.tsx` files next to the source file. Use **Vitest** + **@testing-library/react** for React component tests.

---

## Design Resources

- **`docs/UX_GUIDELINES.md`** – colour palette, spacing scale, typography, motion guidelines, accessibility, and code snippets.
- **`docs/PHASE0_AUDIT.md`** – original baseline audit: known issues, architecture decisions, and dependency choices.
- **`/style-guide`** – in-app style guide page showcasing buttons, inputs, cards, and all design-system components (navigate to it in the running dev server).
- **`theme.json`** – shadcn/ui theme configuration.
- **`tailwind.config.js`** – custom font sizes, line heights, and container-query support.

---

## Workflow

1. Create a feature branch from `main`.
2. Follow the checklist in `docs/FEATURE_TEMPLATE.md` before writing any code.
3. Run `npm run lint` and `npm test` locally before opening a PR.
4. Keep PRs focused — one feature or fix per PR.
5. Request a review and address all comments before merging.
