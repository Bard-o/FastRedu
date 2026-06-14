# Tasks: FastRedu Text Processing (Phase 2 + 3)

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~550–600 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (utils + tests) → PR 2 (hooks + AppState + tests) → PR 3 (view wiring) |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Pure utilities: textProcessor, orp, timing + unit tests | PR 1 | No dependencies; base = main |
| 2 | Hooks: useTextExtractor, useRSVPEngine + AppState changes + tests | PR 2 | Depends on PR 1 utils; base = PR 1 |
| 3 | View wiring: EditorView drag/drop, RSVPView ORP replacement | PR 3 | Depends on PR 2 hooks; base = PR 2 |

## Phase 1: Utilities (Foundation)

- [ ] 1.1 Create `src/utils/textProcessor.ts` — `processText(raw)` splits on `/\n\n+/` then `/\s+/`, tracks cumulative word indices as `paragraphBoundaries`; returns `{ words, paragraphBoundaries }`
- [ ] 1.2 Create `src/utils/orp.ts` — `getOrpIndex(word)` strips leading/trailing non-alpha, computes `floor(clean * 0.35)`, maps back; `splitWordAtOrp(word)` returns `{ before, orp, after }`
- [ ] 1.3 Create `src/utils/timing.ts` — `getWordDuration(word, wpm)` computes base `60000/wpm`, applies highest-wins multiplier (long>8: ×1.3, ends ,;: ×1.5, ends .!? ×1.8), returns `Math.round(base × mult)`
- [ ] 1.4 Create `src/utils/textProcessor.test.ts` — test single paragraph, multi-paragraph, empty/whitespace input per spec scenarios
- [ ] 1.5 Create `src/utils/orp.test.ts` — test "reading"→2, ""hello""→1, "---"→0, split output, empty word edge case
- [ ] 1.6 Create `src/utils/timing.test.ts` — test base at 300 WPM ("the"→200ms), long word ("extraordinarily"→260ms), terminal punct ("done!"→360ms), highest-wins ("extraordinarily!"→360ms)

## Phase 2: Hooks + AppState

- [ ] 2.1 Create `src/hooks/useTextExtractor.ts` — `extractText(file)` routes by extension: `.txt` via `file.text()`, `.pdf` via pdfjs-dist with worker `new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url)`, `.docx` via `mammoth.extractRawText`; rejects unknown/corrupted
- [ ] 2.2 Create `src/hooks/useRSVPEngine.ts` — recursive `setTimeout` in `useRef` tick function; exposes play/pause/toggle/skip/jumpToParagraphStart/adjustWpm; clamps skip to `[0, len-1]`; jump finds largest boundary ≤ currentIndex; localStorage persist `rsvp_index`/`rsvp_wpm`; dispatches `SET_CURRENT_INDEX`/`SET_WPM`
- [ ] 2.3 Modify `src/App.tsx` — add `paragraphBoundaries: number[]` to AppState; extend `SET_TEXT` action with `paragraphBoundaries` field; init `paragraphBoundaries: []` in initialState; pass `paragraphBoundaries` through both Shell components
- [ ] 2.4 Create `src/hooks/useTextExtractor.test.ts` — mock File for TXT extraction; verify rejection on unknown extension
- [ ] 2.5 Create `src/hooks/useRSVPEngine.test.ts` — renderHook with fake timers; test play/pause, skip bounds, jump-to-paragraph, WPM bounds (100–1000), localStorage persistence

## Phase 3: View Wiring

- [ ] 3.1 Modify `src/components/EditorView/EditorView.tsx` — add `onFileDrop: (file: File) => void` prop; wire `onDragOver`/`onDragLeave`/`onDrop` on UploadZone; connect file input `onChange` to call `onFileDrop`; reset input value after select
- [ ] 3.2 Modify `src/App.tsx` EditorViewShell — instantiate `useTextExtractor`; wire `onFileDrop` to `extractText(file)` → `processText(raw)` → `dispatch SET_TEXT` with words + boundaries
- [ ] 3.3 Modify `src/components/RSVPView/RSVPView.tsx` — import `splitWordAtOrp` from `../../utils/orp`; replace lines 22-42 (inline ORP) with `const { before, orp, after } = splitWordAtOrp(word)`
- [ ] 3.4 Modify `src/App.tsx` RSVPViewShell — instantiate `useRSVPEngine(words, paragraphBoundaries, wpm, dispatch)`; pass engine methods as props to RSVPView; wire control buttons to engine methods

## Phase 4: Verification

- [ ] 4.1 Run `npm run build` — verify zero type errors across all new/modified files
- [ ] 4.2 Run `npx vitest run` — all unit and integration tests pass
- [ ] 4.3 Manual: upload TXT file in EditorView; verify text renders as paragraphs
- [ ] 4.4 Manual: click "Leer"; verify RSVP displays words with correct ORP highlight
- [ ] 4.5 Manual: verify play/pause, skip ±10, jump to paragraph, WPM adjust all work in RSVP view
