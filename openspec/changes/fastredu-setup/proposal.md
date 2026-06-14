# Proposal: FastRedu Setup — Project Scaffolding & Foundation

## Intent

Bootstrap the FastRedu RSVP reader as a working React+Vite+TypeScript project with the architecture foundations in place before any feature code. Resolves all exploration gaps (editor model, CSS strategy, test tooling, dependency pinning, error handling patterns, accessibility, mobile controls) so Phase 2+ specs have zero ambiguity.

## Scope

### In Scope
- Vite project scaffold (React + TypeScript template)
- Pinned dependency installation: `pdfjs-dist`, `mammoth`, `vitest`, `@testing-library/react`, `jsdom`
- Directory structure per PHASES.md with component-per-directory convention
- CSS modules per component + `global.css` for theme variables only (CSS custom properties on `:root`)
- `global.css` with full Claude palette: `--bg-editor: #0f0f0d`, `--bg-rsvp: #0a0a08`, `--accent: #D97757`, `--text: rgba(255,255,255,0.9)`
- Tabler Icons (`@tabler/icons-react`) — icon set matching the mockup style
- Mockup fidelity: topbar with logo "FastRedu" + tabs "Editor/Ajustes" + "Limpiar"/"Leer" buttons; play FAB bottom-right; WPM `−`/`+` buttons; ORP guide (dotted vertical line); RSVP controls bar with icon+label+kbd hint per control
- Error boundary component (`src/components/shared/ErrorBoundary.tsx`) + toast pattern (`src/components/shared/Toast.tsx`)
- ARIA live region `<aria-live="polite">` wrapper for RSVP word display
- localStorage quota detection hook (`src/hooks/useStorageQuota.ts`) — warn at >4MB
- Vitest config and a single smoke test confirming the app mounts
- Basic `App.tsx` shell rendering EditorView/RSVPView placeholder based on `view` state
- TypeScript strict mode enabled

### Out of Scope
- Feature implementation (text processing, RSVP engine, file extraction — Phases 2-5)
- Theme switching UI (CSS variables enable it; toggle is Phase 6+)
- Mobile-specific layout breakpoints (structure only; responsive CSS is Phase 5-6)
- contentEditable editor implementation (structure is decided: unified editor; implementation is Phase 5)

## Capabilities

### New Capabilities
- `project-foundation`: Vite+React+TS scaffold, directory structure, pinned deps, vitest config, dev server smoke test
- `theme-system`: CSS custom properties on `:root`, global.css variable definitions, CSS modules per-component convention
- `error-handling`: Error boundary + toast component shells, localStorage quota warning hook
- `accessibility-base`: ARIA live region component for RSVP word announcements

### Modified Capabilities
None — greenfield, no existing specs.

## Approach

1. `npm create vite@latest` with `react-ts` template (pinned Vite version)
2. Install runtime deps with exact versions: `pdfjs-dist@4.x`, `mammoth@1.x`, `@tabler/icons-react`
3. Install dev deps with exact versions: `vitest@3.x`, `@testing-library/react`, `jsdom`
4. Create directory tree matching PHASES.md structure
5. Write `global.css` with theme custom properties (dark palette only; switchable via `.theme-light` class in future)
6. Create CSS modules stub per component directory (e.g., `EditorView.module.css`)
7. Implement ErrorBoundary + Toast shells, ARIA live region wrapper, useStorageQuota hook
8. Write `App.tsx` with reducer shell (`view: 'editor' | 'rsvp'`) and placeholder component imports
9. Configure `vite.config.ts` with `optimizeDeps.exclude: ['pdfjs-dist']`
10. Add smoke test: renders App without crashing
11. Verify: `npm run dev` starts clean, `npm run build` succeeds, `npm run test` passes smoke

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `package.json` | New | Project manifest with pinned deps |
| `vite.config.ts` | New | React plugin + pdfjs-dist exclude |
| `tsconfig.json` | New | Strict mode enabled |
| `src/App.tsx` | New | Shell with useReducer for view state |
| `src/styles/global.css` | New | Theme variables + base resets |
| `src/components/shared/` | New | ErrorBoundary, Toast, AriaLiveRegion |
| `@tabler/icons-react` | New | Icon library (Tabler Icons) |
| `src/hooks/useStorageQuota.ts` | New | localStorage quota detection |
| `vitest.config.ts` | New | Test runner configuration |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| pdfjs-dist worker bundling breaks in Vite | Med | Pin version, test worker resolution in scaffold phase, exclude from optimizeDeps |
| CSS modules + theme variables clash | Low | Variables only in global.css; modules consume via `var(--name)` — no direct value duplication |
| vitest + jsdom setup complexity | Low | Use established config pattern; single smoke test keeps scope minimal |

## Rollback Plan

Delete all generated files — this is greenfield. No data or existing code to protect. Reset to empty repo state if scaffold fails.

## Dependencies

- Node.js >= 18
- npm >= 9

## Success Criteria

- [ ] `npm run dev` starts without errors — blank page renders with `#0f0f0d` background
- [ ] `npm run build` completes without errors
- [ ] `npm run test` passes (1 smoke test)
- [ ] Directory structure matches PHASES.md spec
- [ ] CSS custom properties defined in `global.css` and consumable from any component module
- [ ] ErrorBoundary + Toast render without crashing
- [ ] ARIA live region component renders with `aria-live="polite"`
- [ ] useStorageQuota hook exports `checkQuota()` returning `{ used: number, limit: number, warning: boolean }`