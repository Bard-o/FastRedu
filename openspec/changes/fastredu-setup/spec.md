# Delta for FastRedu Setup

## ADDED Requirements — Project Foundation

### Requirement: Project Scaffold

The project MUST initialize as Vite + React + TypeScript with strict mode, PHASES-compliant directory tree, and passing vitest smoke test.

#### Scenario: Dev server starts

- GIVEN `react-ts` scaffolded
- WHEN `npm run dev` runs
- THEN page renders with `#0f0f0d` bg

#### Scenario: Build succeeds

- WHEN `npm run build` runs
- THEN dist/ generated, zero errors

#### Scenario: Smoke test passes

- GIVEN vitest + jsdom configured
- WHEN `npm run test` runs
- THEN 1 test passes, App mounts

### Requirement: Dependency Pinning

All dependencies MUST be pinned to exact major versions.

| Dep | Version | Purpose |
|-----|---------|---------|
| `pdfjs-dist` | `4.x` | PDF |
| `mammoth` | `1.x` | DOCX |
| `@tabler/icons-react` | latest | Icons |
| `vitest` | `3.x` | Tests |

#### Scenario: pdfjs excluded from optimizeDeps

- WHEN `vite.config.ts` is read
- THEN `optimizeDeps.exclude` includes `pdfjs-dist`

---

## ADDED Requirements — Theme System

### Requirement: CSS Custom Properties

Theme variables MUST be on `:root` in `global.css`. CSS modules MUST use `var(--name)` — never duplicate raw values.

| Variable | Value | Use |
|----------|-------|-----|
| `--bg-editor` | `#0f0f0d` | Editor bg |
| `--bg-rsvp` | `#0a0a08` | RSVP bg |
| `--accent` | `#D97757` | Accent |
| `--text-primary` | `rgba(255,255,255,0.9)` | Primary |
| `--text-secondary` | `rgba(255,255,255,0.55)` | Secondary |
| `--text-tertiary` | `rgba(255,255,255,0.3)` | Hints |
| `--border-subtle` | `rgba(255,255,255,0.07)` | Borders |
| `--border-input` | `rgba(255,255,255,0.12)` | Inputs |
| `--font-sans` | `system-ui, sans-serif` | UI |
| `--font-serif` | `Georgia, serif` | RSVP words |
| `--font-mono` | `monospace` | Code/kbd |
| `--border-radius-{sm,md,lg}` | `6px/8px/12px` | Radii |

#### Scenario: Variables consumable from any module

- GIVEN `global.css` imported in `main.tsx`
- WHEN module uses `var(--accent)`
- THEN computed value is `#D97757`

#### Scenario: Theme switchable via class

- WHEN `.theme-light` added to `<html>`
- THEN overridden variables apply without module changes

---

## ADDED Requirements — Error Handling

### Requirement: Error Boundary

ErrorBoundary MUST catch render errors, show fallback UI, log stack.

#### Scenario: Render error caught

- GIVEN child throws during render
- WHEN error reaches boundary
- THEN fallback UI renders (no white screen)

### Requirement: Toast API

Toast MUST provide `toast.error|info|warning(msg, duration?)` with auto-dismiss.

#### Scenario: Error toast

- WHEN `toast.error("msg")` called
- THEN red toast appears, auto-dismisses 5s

#### Scenario: Manual dismiss

- WHEN user clicks close
- THEN toast removed immediately

---

## ADDED Requirements — Accessibility

### Requirement: ARIA Live Region

RSVP word display MUST be wrapped in `aria-live="polite"` for screen reader announcements.

#### Scenario: Word announced

- GIVEN playback active
- WHEN new word rendered
- THEN live region announces word to AT

#### Scenario: Polite mode

- GIVEN screen reader busy
- WHEN new word appears
- THEN announcement waits for current speech

---

## ADDED Requirements — Storage Quota

### Requirement: localStorage Quota Detection

`useStorageQuota` hook MUST return `{ used: number, limit: number, warning: boolean }` with warning at >4MB.

#### Scenario: Quota check

- WHEN `checkQuota()` called with usage < 4MB
- THEN returns `{ used: N, limit: 5242880, warning: false }`

#### Scenario: Warning at threshold

- WHEN usage > 4MB
- THEN `warning` is `true`

#### Scenario: Quota exceeded

- GIVEN localStorage full
- WHEN app writes data
- THEN toast error shown, app continues

---

## Acceptance Criteria

- [ ] `npm run dev` starts — `#0f0f0d` bg renders
- [ ] `npm run build` completes, zero errors
- [ ] `npm run test` passes (1 smoke test)
- [ ] Directory structure matches PHASES.md
- [ ] CSS vars in `global.css`, consumable from modules
- [ ] ErrorBoundary + Toast render without crash
- [ ] ARIA live region has `aria-live="polite"`
- [ ] `useStorageQuota` → `checkQuota()` returns `{ used, limit, warning }`
