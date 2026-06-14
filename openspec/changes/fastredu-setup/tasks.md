# Tasks: FastRedu Setup — Project Scaffolding & Foundation

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 350–450 |
| 400-line budget risk | Medium |
| Chained PRs recommended | No |
| Suggested split | Single PR (all scaffolding is one cohesive unit) |
| Delivery strategy | ask-always |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Full project scaffold + smoke test | PR 1 | Single cohesive unit; all files are new, no existing code to protect |

## Phase 1: Project Scaffold & Config

- [x] 1.1 Run `npm create vite@latest . -- --template react-ts` to generate base scaffold in project root
- [x] 1.2 Install runtime deps: `npm install pdfjs-dist@4.9.155 mammoth@1.8.0 @tabler/icons-react@3.31.0`
- [x] 1.3 Install dev deps: `npm install -D vitest@3.1.4 @testing-library/react@16.3.2 jsdom@25.0.1 @testing-library/jest-dom@6.6.3`
- [x] 1.4 Write `vite.config.ts` with React plugin + `optimizeDeps.exclude: ['pdfjs-dist']`
- [x] 1.5 Write `vitest.config.ts` with `environment: 'jsdom'`, `globals: true`, `setupFiles: ['./src/test/setup.ts']`
- [x] 1.6 Verify `tsconfig.json` has `strict: true` and references `tsconfig.app.json` + `tsconfig.node.json`
- [x] 1.7 Write `index.html` with `<div id="root">` and proper meta viewport

## Phase 2: Theme System & Styles

- [x] 2.1 Write `src/styles/global.css` with all CSS custom properties on `:root` (bg, accent, text, borders, fonts, radii) + minimal reset
- [x] 2.2 Write `src/App.module.css` with root layout (full-height flex container)
- [x] 2.3 Write `src/components/EditorView/EditorView.module.css` with `@module` doc comment + placeholder `.container` using `var(--bg-editor)`
- [x] 2.4 Write `src/components/RSVPView/RSVPView.module.css` with `@module` doc comment + placeholder `.container` using `var(--bg-rsvp)`
- [x] 2.5 Write `src/components/shared/ErrorBoundary.module.css` with fallback UI styles
- [x] 2.6 Write `src/components/shared/Toast.module.css` with toast positioning + animation styles
- [x] 2.7 Write `src/components/shared/AriaLiveRegion.module.css` with visually-hidden-safe wrapper styles

## Phase 3: Shared Components & Hooks

- [x] 3.1 Write `src/components/shared/ErrorBoundary.tsx` — class component with `componentDidCatch`, fallback UI, `console.error` logging
- [x] 3.2 Write `src/components/shared/Toast.tsx` — `ToastProvider` with context, `useToast()` hook, `createPortal` to `document.body`, auto-dismiss with `setTimeout`
- [x] 3.3 Write `src/components/shared/AriaLiveRegion.tsx` — functional component wrapping children with `aria-live="polite"` and `aria-atomic="true"`
- [x] 3.4 Write `src/hooks/useStorageQuota.ts` — iterates `localStorage` keys, sums `JSON.stringify` lengths, returns `{ used, limit: 5242880, warning: boolean }` with `console.warn` at >4MB

## Phase 4: App Shell & View Switching

- [x] 4.1 Write `src/main.tsx` — `ReactDOM.createRoot`, wraps `<App />` with `<ToastProvider>`, imports `src/styles/global.css`
- [x] 4.2 Write `src/App.tsx` — `useReducer` with `AppState`/`AppAction` types, `SET_VIEW` action wired, conditional render of `EditorView` / `RSVPView`
- [x] 4.3 Write `src/components/EditorView/EditorView.tsx` — placeholder rendering "Editor" text with `var(--bg-editor)` background
- [x] 4.4 Write `src/components/RSVPView/RSVPView.tsx` — placeholder rendering "RSVP" text with `var(--bg-rsvp)` background

## Phase 5: Testing & Verification

- [x] 5.1 Write `src/test/setup.ts` — import `@testing-library/jest-dom/vitest` for DOM matchers
- [x] 5.2 Write `src/test/App.test.tsx` — smoke test: `render(<App />)` asserts app mounts without crashing
- [x] 5.3 Run `npm run test` — confirm 2 smoke tests pass
- [x] 5.4 Run `npm run build` — confirm `dist/` generated with zero errors
- [x] 5.5 Run `npm run dev` — confirm dev server starts, page renders with `#0f0f0d` background

## Testing Instructions

1. **Install & start**: `npm install && npm run dev` — browser opens to `http://localhost:5173`
2. **Verify theme**: Page background should be `#0f0f0d` (dark warm gray). Inspect `:root` in DevTools — all `--bg-*`, `--accent`, `--text-*` variables should be defined
3. **Verify view switching**: Click tab/buttons to toggle between Editor and RSVP views — each should render its placeholder text with correct background color
4. **Verify ErrorBoundary**: Temporarily throw in a child component — fallback UI should appear instead of white screen
5. **Verify Toast**: Open browser console, call `toast.error("test")` — red toast should appear and auto-dismiss after 5s
6. **Verify ARIA**: Inspect the RSVP word display element — it should have `aria-live="polite"` and `aria-atomic="true"` attributes
7. **Verify storage quota**: Open console, call `checkQuota()` — should return `{ used: N, limit: 5242880, warning: false }`
8. **Build check**: `npm run build` — should complete without errors, producing `dist/` folder
9. **Test check**: `npm run test` — should pass 1 smoke test
