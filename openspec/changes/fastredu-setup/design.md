# Design: FastRedu Setup — Project Scaffolding & Foundation

## Technical Approach

Greenfield Vite 6 + React 19 + TypeScript scaffold. Two-view shell (`editor` | `rsvp`) driven by a single `useReducer` in `App.tsx`. Theme via CSS custom properties on `:root`, consumed by CSS Modules through `var(--name)`. Shared infrastructure components (ErrorBoundary, Toast, AriaLiveRegion) and a storage quota hook establish patterns that Phases 2-6 build on. No feature code — only the skeleton that makes feature code trivial to add.

## Architecture Decisions

| Decision | Option A | Option B | Choice | Rationale |
|----------|----------|----------|--------|-----------|
| State management | Single `useReducer` in App | Zustand/Jotai | **useReducer** | Two views, ~7 fields. Library adds bundle + learning cost for zero gain at this scale. |
| CSS strategy | CSS Modules + `global.css` vars | Tailwind / CSS-in-JS | **CSS Modules** | Spec requires theme-switchable variables. Modules give scoping without runtime cost. Tailwind's utility model fights the mockup's bespoke design tokens. |
| View switching | Conditional render in App | React Router | **Conditional render** | No URL routing needed. Two views toggled by state. Router adds 8KB+ for a problem that doesn't exist. |
| Test runner | Vitest + jsdom | Jest | **Vitest** | Native Vite integration, no transform config. Jest requires `babel-jest` or `ts-jest` bridge. |
| pdfjs-dist handling | `optimizeDeps.exclude` | Dynamic import only | **exclude + dynamic** | Vite pre-bundles CJS deps by default, breaking pdfjs worker resolution. Exclude prevents the crash; dynamic import in Phase 3 handles the worker. |
| Toast architecture | Context + portal | Library (react-hot-toast) | **Context + portal** | 30 lines of code vs 15KB dep. Toast API surface is tiny (error/info/warning + dismiss). |

## Directory Structure

```
src/
├── components/
│   ├── EditorView/
│   │   ├── EditorView.tsx          # Placeholder — renders "Editor" text
│   │   └── EditorView.module.css   # Stub module
│   ├── RSVPView/
│   │   ├── RSVPView.tsx            # Placeholder — renders "RSVP" text
│   │   └── RSVPView.module.css     # Stub module
│   └── shared/
│       ├── ErrorBoundary.tsx        # Class component, catches render errors
│       ├── ErrorBoundary.module.css
│       ├── Toast.tsx                # ToastProvider + useToast hook + portal
│       ├── Toast.module.css
│       ├── AriaLiveRegion.tsx       # Wraps children with aria-live="polite"
│       └── AriaLiveRegion.module.css
├── hooks/
│   └── useStorageQuota.ts          # Returns { used, limit, warning }
├── utils/                          # Empty — populated in Phase 2
├── styles/
│   └── global.css                  # Theme variables + minimal reset
├── App.tsx                         # Reducer shell + view switching
├── App.module.css                  # App-level layout
├── main.tsx                        # Entry point, imports global.css
└── vite-env.d.ts                   # Vite type reference
```

Root config files:
```
vite.config.ts
vitest.config.ts
tsconfig.json
tsconfig.app.json
tsconfig.node.json
package.json
index.html
```

## Interfaces / Contracts

### App Reducer

```ts
type View = 'editor' | 'rsvp'

interface AppState {
  view: View
  text: string
  words: string[]
  paragraphBoundaries: number[]
  currentIndex: number
  wpm: number
  isPlaying: boolean
}

type AppAction =
  | { type: 'SET_VIEW'; view: View }
  | { type: 'SET_TEXT'; text: string }
  | { type: 'SET_WORDS'; words: string[]; boundaries: number[] }
  | { type: 'SET_INDEX'; index: number }
  | { type: 'SET_WPM'; wpm: number }
  | { type: 'TOGGLE_PLAY' }
```

Only `SET_VIEW` is wired in this phase. Other actions are declared but unused until Phases 2-5.

### ErrorBoundary

```ts
interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode  // defaults to built-in error UI
}
// Class component with componentDidCatch → logs to console.error
```

### Toast

```ts
type ToastLevel = 'error' | 'info' | 'warning'

interface ToastContextValue {
  toast: {
    error: (msg: string, duration?: number) => void   // default 5000ms
    info: (msg: string, duration?: number) => void     // default 3000ms
    warning: (msg: string, duration?: number) => void  // default 4000ms
  }
}
// ToastProvider wraps app, renders via createPortal to document.body
// useToast() hook returns ToastContextValue
```

### AriaLiveRegion

```ts
interface AriaLiveRegionProps {
  children: React.ReactNode
  politeness?: 'polite' | 'assertive'  // default 'polite'
}
// Renders: <div aria-live={politeness} aria-atomic="true">{children}</div>
```

### useStorageQuota

```ts
interface StorageQuotaInfo {
  used: number      // bytes used in localStorage
  limit: number     // 5_242_880 (5MB)
  warning: boolean  // true when used > 4_194_304 (4MB)
}

function useStorageQuota(): {
  checkQuota: () => StorageQuotaInfo
}
// Iterates localStorage keys, sums JSON.stringify lengths.
// console.warn when warning === true.
```

## CSS Module Documentation Standard

Every `.module.css` file MUST begin with this comment block:

```css
/**
 * @module {ComponentName}
 * @theme-vars
 *   --bg-editor, --bg-rsvp, --accent, --text-primary,
 *   --text-secondary, --border-subtle
 * @description
 *   {One-line: what this module styles}
 * @theme-safety
 *   All colors use var() references from global.css.
 *   No hardcoded hex values. Safe for theme switching.
 *
 * To add a light theme: define overrides in .theme-light { }
 * in global.css — this module requires zero changes.
 */
```

This convention ensures theme developers can grep `@theme-vars` to find which variables a component depends on, and `@theme-safety` confirms no raw values leak.

## Package Dependencies (exact versions)

| Package | Version | Type |
|---------|---------|------|
| `vite` | `6.3.5` | dev |
| `@vitejs/plugin-react` | `4.4.1` | dev |
| `react` | `19.1.0` | prod |
| `react-dom` | `19.1.0` | prod |
| `typescript` | `5.8.3` | dev |
| `pdfjs-dist` | `4.10.38` | prod |
| `mammoth` | `1.9.0` | prod |
| `@tabler/icons-react` | `3.31.0` | prod |
| `vitest` | `3.2.1` | dev |
| `@testing-library/react` | `16.3.0` | dev |
| `jsdom` | `26.1.0` | dev |
| `@types/react` | `19.1.6` | dev |
| `@types/react-dom` | `19.1.6` | dev |

## Key Config Files

### vite.config.ts

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['pdfjs-dist'],
  },
})
```

### vitest.config.ts

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
})
```

`src/test/setup.ts` imports `@testing-library/jest-dom/vitest` for DOM matchers.

### global.css — Theme Variables

```css
:root {
  /* Backgrounds */
  --bg-editor: #0f0f0d;
  --bg-rsvp: #0a0a08;

  /* Accent */
  --accent: #D97757;
  --accent-muted: rgba(217, 119, 87, 0.15);

  /* Text */
  --text-primary: rgba(255, 255, 255, 0.9);
  --text-secondary: rgba(255, 255, 255, 0.55);
  --text-tertiary: rgba(255, 255, 255, 0.3);

  /* Borders */
  --border-subtle: rgba(255, 255, 255, 0.07);
  --border-input: rgba(255, 255, 255, 0.12);

  /* Typography */
  --font-sans: system-ui, -apple-system, sans-serif;
  --font-serif: Georgia, 'Times New Roman', serif;
  --font-mono: 'SF Mono', 'Fira Code', monospace;

  /* Radii */
  --border-radius-sm: 6px;
  --border-radius-md: 8px;
  --border-radius-lg: 12px;
}

/* Future light theme — uncomment and override:
.theme-light {
  --bg-editor: #fafaf8;
  --bg-rsvp: #f5f5f3;
  --text-primary: rgba(0, 0, 0, 0.87);
  --text-secondary: rgba(0, 0, 0, 0.55);
  --text-tertiary: rgba(0, 0, 0, 0.3);
  --border-subtle: rgba(0, 0, 0, 0.07);
  --border-input: rgba(0, 0, 0, 0.12);
}
*/

/* Minimal reset */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html, body, #root { height: 100%; }
body {
  font-family: var(--font-sans);
  background: var(--bg-editor);
  color: var(--text-primary);
  -webkit-font-smoothing: antialiased;
}
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `package.json` | Create | Manifest with pinned deps, scripts: dev/build/test |
| `vite.config.ts` | Create | React plugin + pdfjs-dist exclude |
| `vitest.config.ts` | Create | jsdom env + setup file |
| `tsconfig.json` | Create | Strict mode, references app + node configs |
| `tsconfig.app.json` | Create | App-specific TS config |
| `tsconfig.node.json` | Create | Node-specific TS config for vite |
| `index.html` | Create | Entry HTML with `<div id="root">` |
| `src/main.tsx` | Create | ReactDOM.createRoot, imports global.css |
| `src/App.tsx` | Create | useReducer shell, conditional EditorView/RSVPView |
| `src/App.module.css` | Create | Root layout styles |
| `src/vite-env.d.ts` | Create | Vite client types reference |
| `src/styles/global.css` | Create | Theme variables + reset |
| `src/test/setup.ts` | Create | jest-dom matchers import |
| `src/test/App.test.tsx` | Create | Smoke test: App mounts |
| `src/components/EditorView/EditorView.tsx` | Create | Placeholder component |
| `src/components/EditorView/EditorView.module.css` | Create | Stub with doc comment |
| `src/components/RSVPView/RSVPView.tsx` | Create | Placeholder component |
| `src/components/RSVPView/RSVPView.module.css` | Create | Stub with doc comment |
| `src/components/shared/ErrorBoundary.tsx` | Create | Error boundary class component |
| `src/components/shared/ErrorBoundary.module.css` | Create | Fallback UI styles |
| `src/components/shared/Toast.tsx` | Create | Provider + portal + useToast hook |
| `src/components/shared/Toast.module.css` | Create | Toast animation + layout |
| `src/components/shared/AriaLiveRegion.tsx` | Create | aria-live wrapper |
| `src/components/shared/AriaLiveRegion.module.css` | Create | Visually-hidden-safe styles |
| `src/hooks/useStorageQuota.ts` | Create | localStorage quota checker |

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `useStorageQuota` returns correct shape | Mock `localStorage`, assert `{ used, limit, warning }` |
| Unit | ErrorBoundary catches thrown errors | Render child that throws, assert fallback appears |
| Unit | Toast renders and auto-dismisses | `render` + `waitFor` with fake timers |
| Unit | AriaLiveRegion has correct `aria-live` attr | `screen.getByRole` assertion |
| Smoke | App mounts without crashing | `render(<App />)` — single test for Phase 1 |
| Integration | — | Not applicable in setup phase |
| E2E | — | Not applicable in setup phase |

## Migration / Rollout

No migration required. Greenfield project — all files are new.

## Open Questions

- [ ] Should `ToastProvider` use `createPortal` or render inline? Portal is cleaner but adds complexity for a setup phase. **Recommendation**: portal — it's 3 extra lines and avoids z-index stacking issues later.
- [ ] `pdfjs-dist@4.10.38` worker path in Vite 6 — needs validation during apply. The `optimizeDeps.exclude` prevents pre-bundling but the worker URL resolution (`new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url)`) must be tested at runtime in Phase 3.
