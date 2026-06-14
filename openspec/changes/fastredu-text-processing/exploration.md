## Exploration: FastRedu Text Processing — Phases 2 & 3

### Current State

The `fastredu-setup` change is fully completed. The project has a working Vite+React+TS scaffold with all dependencies installed (pdfjs-dist@4.9.155, mammoth@1.8.0, @tabler/icons-react@3.31.0), vitest configured, and 2 passing smoke tests. EditorView and RSVPView are fully styled components rendering real UI — not placeholders.

**EditorView** renders a sidebar with upload zone (hidden file input, no drag/drop handlers wired, empty `onChange`), WPM control (±25 buttons), and progress bar. The editor area renders paragraphs by splitting `text` on `/\n\n+/`. The play button exists but only calls `onRead`.

**RSVPView** renders the RSVP stage with ORP split calculated INLINE (not using a utility), progress bar, controls bar, and keyboard hint display. The ORP logic is duplicated and has a subtle bug: the `leadingNonAlpha` check overlaps incorrectly with the slice logic — the `before` slice includes leading non-alpha chars, then the adjustment attempts to move them to `orp`, but the slice was already done on the raw word, not the clean one.

**App.tsx** manages state via `useReducer` with `AppState = { view, text, words, currentIndex, wpm }`. No `paragraphBoundaries` field exists. The `SET_TEXT` action takes `{ text, words }` — no boundaries. View switching is wired: `_onTextChange` dispatches `SET_TEXT`, `_onWpmChange` dispatches `SET_WPM`, etc.

### Affected Areas

- `src/utils/textProcessor.ts` — **NEW**: processText() returning `{ words, paragraphBoundaries }`
- `src/utils/orp.ts` — **NEW**: getOrpIndex() and splitWordAtOrp()
- `src/utils/timing.ts` — **NEW**: getWordDuration() with adaptive multipliers
- `src/hooks/useTextExtractor.ts` — **NEW**: extractText() for PDF/DOCX/TXT with proper worker config
- `src/hooks/useRSVPEngine.ts` — **NEW**: setTimeout-recursive RSVP loop with play/pause/skip/jumpToParagraphStart/adjustWpm, localStorage persistence
- `src/components/EditorView/EditorView.tsx` — Wire upload zone: add drag/drop handlers, file input onChange → extractText → processText → dispatch SET_TEXT (with paragraphBoundaries)
- `src/components/RSVPView/RSVPView.tsx` — Replace inline ORP calculation with splitWordAtOrp() from orp.ts; fix the leading-non-alpha bug
- `src/App.tsx` — Add `paragraphBoundaries` to AppState, update SET_TEXT action to include boundaries, add new actions for RSVP engine (SET_INDEX, TOGGLE_PLAY), wire useRSVPEngine into RSVPViewShell

### Approaches

1. **Phase 2 + 3 together as one change** — Build all text processing utilities (Phase 2) AND the file extraction hook + UploadZone wiring (Phase 3) in one SDD cycle.
   - Pros: Natural dependency chain — extraction produces raw text, processing consumes it. Both are needed before Phase 4 (RSVP engine). Single coherent unit with clear boundaries.
   - Cons: ~8 files to create/modify. Multi-format extraction testing (PDF/DOCX/TXT) adds surface area.
   - Effort: Medium

2. **Split Phase 2 and Phase 3 into separate changes** — Phase 2 as `fastredu-text-processing` (pure functions only) and Phase 3 as a separate change.
   - Pros: Smaller PRs, pure functions are independently testable. Clear separation.
   - Cons: Phase 3 can't be verified end-to-end without Phase 2's processText(). Requires a temporary integration shim or mock. Adds orchestration overhead for minimal risk reduction.
   - Effort: Medium (same total, more ceremony)

### Recommendation

**Approach 1** — single change `fastredu-text-processing` covering Phase 2 + Phase 3. The two phases form a complete "text pipeline": raw input → extraction → processing → structured output ready for the engine. Splitting them adds ceremony without reducing risk — the pure functions in Phase 2 are trivially testable regardless of whether Phase 3 is in the same change. The UploadZone wiring is the integration point that proves both phases work together.

### Risks

- **pdfjs-dist worker resolution**: The `import.meta.url` + `.mjs` pattern in PHASES.md is version-sensitive. pdfjs-dist@4.9.155 may use a different worker path. Mitigation: test PDF extraction with a real file as the first task in apply.
- **paragraphBoundaries state gap**: AppState currently lacks `paragraphBoundaries`, but EditorView and RSVPEngine both need it. The `SET_TEXT` action must be extended. This is a one-line change to the AppState interface + action payload — low risk.
- **AppState action explosion**: Adding RSVP engine actions (SET_INDEX, TOGGLE_PLAY, etc.) to the global reducer vs. local state in useRSVPEngine. PHASES.md defines the hook with its own useState — so the hook manages playback internally and only the sync-back to AppState needs dispatch. This is the correct pattern already laid out in PHASES.md.
- **ORP duplication**: RSVPView has inline ORP logic that must be replaced. The current impl has a bug (leading-non-alpha overlap). Replacing it with splitWordAtOrp() from the utility fixes this.

### Gaps

1. **paragraphBoundaries in AppState**: PHASES.md defines `paragraphBoundaries: number[]` in global state (line 34), but the current AppState doesn't have it and `SET_TEXT` doesn't accept it. Must be added.
2. **SET_TEXT signature change**: Currently `{ text, words }` — needs to become `{ text, words, paragraphBoundaries }`. Also affects the `_onTextChange` prop type in EditorView.
3. **Upload zone drag/drop not implemented**: EditorView has an upload zone div with click handler but no `onDragOver`/`onDrop`. These need to be added.
4. **useRSVPEngine vs. AppState**: PHASES.md defines the engine as a self-contained hook with its own useState. But App.tsx manages `currentIndex` and `wpm` in global state. The reconciliation: the hook manages playback internally, but the Shell reads `currentIndex`/`wpm` from state and the hook dispatches updates. The exact boundary needs clarification in spec.
5. **timing.ts function dependencies**: getWordDuration() needs to know about punctuation-end rules (. , ; : vs . ! ?). This is a subset of text analysis that could live in either timing.ts or textProcessor.ts. PHASES.md leans toward timing.ts having its own mini-analysis — spec should clarify.

### Ready for Proposal

**Yes** — all structural blockers are resolved. The gaps above are spec-level details, not architectural forks. The orchestrator should proceed to `sdd-propose` for `fastredu-text-processing`.

### Skill Resolution

**Status**: `paths-injected` — received 2 exact skill paths from orchestrator:
- `/home/bardo/.config/opencode/skills/sdd-explore/SKILL.md`
- `/home/bardo/.config/opencode/skills/_shared/SKILL.md`

No project-scoped skills matched (React/TypeScript are built-in knowledge, no project-specific skills in registry for this task).
