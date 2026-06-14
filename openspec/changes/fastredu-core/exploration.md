## Exploration: FastRedu RSVP Reader — Greenfield Assessment

### Current State

The working directory is empty of source code — no `package.json`, no `src/`, no dependencies. Only project documentation exists: `PHASES.md` (387-line implementation plan in 6 phases), `openspec/config.yaml` (SDD scaffolding with all tooling unconfigured), and `.atl/skill-registry.md`. The `openspec/specs/` directory is empty — no domain specs have been written. This is a true greenfield: React + Vite + TypeScript RSVP (Rapid Serial Visual Presentation) reader with no backend, no router, and localStorage persistence.

### Affected Areas

*None yet — greenfield. The entire project will be created from scratch.*

- `src/components/EditorView/` — UploadZone, TextEditor, Sidebar (WpmControl, ProgressInfo), PlayButton
- `src/components/RSVPView/` — RSVPDisplay, ProgressBar, ControlBar, TopBar
- `src/hooks/useRSVPEngine.ts` — setTimeout-recursive RSVP loop with adaptive timing
- `src/hooks/useTextExtractor.ts` — PDF (pdfjs-dist), DOCX (mammoth), TXT extraction
- `src/utils/textProcessor.ts` — Tokenization, paragraph detection
- `src/utils/orp.ts` — Optimal Recognition Point calculation at 35% word length
- `src/styles/global.css` — Dark theme (#0f0f0d / #0a0a08 backgrounds, #D97757 coral accent)

### Approaches

Since this is greenfield with a detailed PHASES.md already written, there are no competing architectural approaches to evaluate. The plan is well-scoped and follows a logical dependency chain:

1. **Follow PHASES.md as written** — Execute phases 1-6 in order, each building on the previous.
   - Pros: Proven plan, clear dependencies, each phase independently verifiable
   - Cons: Some ambiguities in the plan need resolution before implementation (see Gaps below)
   - Effort: Medium (6 phases, ~2-3 sessions each)

### Recommendation

Proceed with the PHASES.md plan but resolve the identified gaps before starting the spec phase. The first SDD change should be **fastredu-setup** (Phase 1 of PHASES.md), which scopes to: Vite project scaffolding, dependency installation, directory structure, global styles, and verifying the dev server starts cleanly. This is a low-risk, high-confidence starting point.

Before spec work begins on later phases, the design ambiguities (editor implementation, CSS approach, test strategy) must be resolved.

### Risks

- **pdfjs-dist Vite worker bundling**: The worker URL pattern (`import.meta.url` + `.mjs`) is version-sensitive and Vite's worker handling has changed across versions. Mitigation: test PDF extraction early in Phase 3, not at the end.
- **LocalStorage quota without fallback**: No IndexedDB or chunking strategy mentioned. Large documents (~5MB+) will silently fail to persist. Mitigation: add quota detection and warning in Phase 4.
- **contentEditable editor complexity**: Programmatic highlight + scroll-to-position on a contentEditable div is significantly harder than a textarea + preview split. The current plan acknowledges this fork but doesn't decide. Mitigation: resolve this before Phase 5 spec.

### Gaps Identified

1. **Editor implementation fork**: PHASES.md line 325 describes both a contentEditable unified editor AND a textarea+preview split approach without choosing one. This decision affects component architecture and must be made before Phase 5 spec.
2. **CSS strategy undefined**: Only `global.css` is mentioned, but `openspec/config.yaml` rules mention "CSS modules or global styles" as an either/or. No decision documented.
3. **Test placement strategy**: Tests are mentioned ("vitest + @testing-library/react to be added") but no phase adds them. `openspec/config.yaml` confirms no test runner exists. Tests should be added incrementally, not retrofitted.
4. **Dependency versions un-pinned**: `npm create vite@latest` and `npm install pdfjs-dist mammoth` have no version constraints. The pdfjs-dist worker URL pattern is tightly coupled to the installed version.
5. **LocalStorage quota handling**: ~5MB threshold mentioned but no strategy for overflow (IndexedDB? chunking? user warning?).
6. **Error UX unspecified**: "Graceful degradation for corrupted/unsupported files" is stated but no error UI patterns are described (toast, inline error, modal).
7. **Accessibility**: No ARIA, focus management, or screen-reader considerations mentioned. RSVP is inherently a visual-at-speed paradigm — accessibility is a known challenge for this domain.
8. **No mobile keyboard strategy**: The RSVP view has keyboard shortcuts (Space, arrows, brackets) but on mobile these aren't available — no touch controls described.

### Ready for Proposal

**No** — the gaps above should be resolved before writing detailed specs. Specifically:

- The orchestrator should ask the user to decide: (a) editor implementation model, (b) CSS approach, (c) test addition strategy.
- Once those are resolved, `sdd-propose` can write the first change proposal for `fastredu-setup`.
