# Proposal: FastRedu Text Processing (Phase 2 + 3)

## Intent

The app has styled EditorView and RSVPView shells but no real text pipeline. Users cannot upload documents, extract content, or see RSVP words positioned correctly. This change builds the full text pipeline — from file upload through tokenization, ORP calculation, and adaptive timing — and wires it into the existing UI.

## Scope

### In Scope
- `textProcessor()` — split raw text into words + paragraph boundaries
- `getOrpIndex()` / `splitWordAtOrp()` — ORP calculation extracted as utility
- `getWordDuration()` — adaptive timing multipliers for punctuation and word length
- `useTextExtractor` — extract text from PDF, DOCX, and TXT files
- `useRSVPEngine` — playback hook with play/pause, skip, jump-to-paragraph, WPM adjust
- `AppState` update — add `paragraphBoundaries`, extend `SET_TEXT` action
- `EditorView` — wire UploadZone: drag/drop handlers, file input → extractText → processText → dispatch
- `RSVPView` — replace inline ORP logic with `splitWordAtOrp()`, fix leading-non-alpha bug

### Out of Scope
- Phase 4 features (bookmarks, progress persistence beyond localStorage)
- Keyboard shortcuts in RSVP mode (future enhancement)
- Any backend or API integration
-Accessibility audit (separate change)

## Capabilities

### New Capabilities
- `text-processing`: Tokenization, ORP calculation, and adaptive timing — the core text pipeline utilities
- `file-extraction`: Document text extraction supporting PDF, DOCX, and plain text
- `rsvp-engine`: Playback control hook managing setTimeout-recursive display loop with pause, skip, jump, and WPM adjustment

### Modified Capabilities
- None (no existing specs in `openspec/specs/`)

## Approach

Single change covering Phase 2 + Phase 3. Build pure utilities first (textProcessor, orp, timing), then extraction hook, then engine hook, then wire everything into existing views. The AppState reducer extends `SET_TEXT` with `paragraphBoundaries`; `useRSVPEngine` manages its own playback state and dispatches sync-back actions.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/utils/textProcessor.ts` | New | `processText(raw): { words, paragraphBoundaries }` |
| `src/utils/orp.ts` | New | `getOrpIndex()`, `splitWordAtOrp()` |
| `src/utils/timing.ts` | New | `getWordDuration()` with adaptive multipliers |
| `src/hooks/useTextExtractor.ts` | New | File → raw text extraction |
| `src/hooks/useRSVPEngine.ts` | New | Playback control hook |
| `src/App.tsx` | Modified | Add `paragraphBoundaries` to AppState, extend actions |
| `src/components/EditorView/EditorView.tsx` | Modified | Wire UploadZone + drag/drop |
| `src/components/RSVPView/RSVPView.tsx` | Modified | Replace inline ORP, fix bug |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| pdfjs-dist worker path version sensitivity | Med | Test PDF extraction first task in apply; pin worker URL pattern |
| AppState action creep from engine sync | Low | Hook manages playback internally; only sync-back dispatches to global state |
| ORP replacement introduces regression | Low | Unit tests on splitWordAtOrp cover edge cases including leading non-alpha |

## Rollback Plan

All changes are additive (3 new files, 3 new hooks/utils) or small modifications to existing files. Revert by: (1) remove new util/hook files, (2) revert App.tsx AppState to current interface, (3) revert EditorView/RSVPView component changes. No data migration, no external state.

## Dependencies

- `pdfjs-dist@4.9.155` — already installed, worker path must be configured at runtime
- `mammoth@1.8.0` — already installed
- Vitest — already configured in project

## Success Criteria

- [ ] Upload a TXT file in EditorView; extracted text renders as paragraphs
- [ ] Upload a PDF file; content displays correctly
- [ ] ORP highlight positions correctly on words with leading non-alpha chars
- [ ] RSVP playback speed adapts for punctuation (slower on . ! ?)
- [ ] `paragraphBoundaries` flows through AppState and supports jump-to-paragraph
- [ ] `npm run build` passes with zero type errors