# Design: FastRedu Text Processing

## Technical Approach

Build the text pipeline bottom-up: pure utilities first (textProcessor, orp, timing), then hooks that compose them (useTextExtractor, useRSVPEngine), then wire into existing views. All utilities are pure functions — trivially testable with Vitest. Hooks use `useRef`/`useCallback` patterns consistent with the existing `useStorageQuota` convention (plain function exports from `src/hooks/`).

The AppState gains `paragraphBoundaries: number[]` and the `SET_TEXT` action carries it. `useRSVPEngine` owns playback state internally (isPlaying, timer ref) and syncs currentIndex/wpm back to AppState via dispatch.

## Architecture Decisions

| Decision | Options | Choice | Rationale |
|----------|---------|--------|-----------|
| Utils location | `src/utils/` vs co-located | `src/utils/` | New directory; these are shared across components and hooks — not owned by any single component |
| ORP algorithm | Strip-then-calculate vs regex-match | Strip leading/trailing non-alpha, compute index on clean length, map back to original | Matches spec exactly; handles `"hello"` → clean=`hello` → idx=1 → maps to original position 2 |
| Timing multiplier stacking | Stack vs highest-wins | Highest wins | Spec is explicit: "highest wins, not stacked" |
| RSVP loop mechanism | `setInterval` vs recursive `setTimeout` | Recursive `setTimeout` | Self-correcting — each tick computes duration from current word; no drift accumulation |
| Engine state ownership | All in AppState vs split | Split: AppState holds data (words, boundaries, wpm), hook holds playback (isPlaying, timer) | Prevents action creep; hook syncs back only currentIndex and wpm |
| pdfjs worker | CDN URL vs bundled | `new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url)` | Vite resolves at build time; no version-mismatch risk with CDN |

## Data Flow

```
File upload (EditorView)
    │
    ▼
useTextExtractor.extractText(file) ──→ raw text string
    │
    ▼
processText(raw) ──→ { words[], paragraphBoundaries[] }
    │
    ▼
dispatch SET_TEXT ──→ AppState { text, words, paragraphBoundaries, currentIndex: 0 }
    │
    ▼ (user clicks "Leer")
useRSVPEngine(words, paragraphBoundaries, wpm)
    │
    ├── getWordDuration(word, wpm) ──→ ms per word
    ├── recursive setTimeout ──→ advances currentIndex
    └── syncs back ──→ dispatch SET_CURRENT_INDEX / SET_WPM
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/utils/textProcessor.ts` | Create | `processText()` — tokenization + paragraph boundary detection |
| `src/utils/orp.ts` | Create | `getOrpIndex()`, `splitWordAtOrp()` — ORP calculation |
| `src/utils/timing.ts` | Create | `getWordDuration()` — adaptive timing with multipliers |
| `src/hooks/useTextExtractor.ts` | Create | File → raw text for PDF/DOCX/TXT |
| `src/hooks/useRSVPEngine.ts` | Create | Playback engine with recursive setTimeout |
| `src/App.tsx` | Modify | Add `paragraphBoundaries` to AppState, extend `SET_TEXT` action |
| `src/components/EditorView/EditorView.tsx` | Modify | Wire UploadZone drag/drop + file input onChange |
| `src/components/RSVPView/RSVPView.tsx` | Modify | Replace inline ORP with `splitWordAtOrp()` |

## Interfaces / Contracts

### `src/utils/textProcessor.ts`

```ts
export interface ProcessedText {
  words: string[]
  paragraphBoundaries: number[]  // word-index where each paragraph starts
}

export function processText(raw: string): ProcessedText
```

Algorithm: Split on `/\n\n+/` to get paragraphs. For each paragraph, split on `/\s+/` to get words. Track cumulative word count as boundary index. Filter empty strings from both splits.

### `src/utils/orp.ts`

```ts
export interface OrpSplit {
  before: string
  orp: string
  after: string
}

export function getOrpIndex(word: string): number
export function splitWordAtOrp(word: string): OrpSplit
```

`getOrpIndex`: strip leading/trailing non-alpha (regex `/^[^a-zA-ZáéíóúÁÉÍÓÚñÑ]+|[^a-zA-ZáéíóúÁÉÍÓÚñÑ]+$/g`), compute `Math.floor(cleanLength * 0.35)`, add leading-stripped length to map back to original index. Clamp to `[0, word.length - 1]`.

`splitWordAtOrp`: calls `getOrpIndex`, returns `{ before: word.slice(0, idx), orp: word[idx], after: word.slice(idx + 1) }`. Edge case: empty word → `{ before: '', orp: '', after: '' }`.

### `src/utils/timing.ts`

```ts
export function getWordDuration(word: string, wpm: number): number
```

Base = `60_000 / wpm`. Multipliers (highest wins):
- Word length > 8 chars → 1.3
- Ends with `,`, `;`, `:` → 1.5
- Ends with `.`, `!`, `?` → 1.8

Return `Math.round(base * multiplier)`.

### `src/hooks/useTextExtractor.ts`

```ts
export function useTextExtractor(): {
  extractText: (file: File) => Promise<string>
  isExtracting: boolean
  error: string | null
}
```

- `.txt`: `file.text()`
- `.pdf`: `pdfjs-dist` with worker set via `GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url).href`. Iterate pages, join `page.getTextContent()` items with spaces, join pages with `\n\n`.
- `.docx`: `mammoth.extractRawText({ arrayBuffer })` from `file.arrayBuffer()`.
- Unknown extension → reject with descriptive error.

### `src/hooks/useRSVPEngine.ts`

```ts
export function useRSVPEngine(
  words: string[],
  paragraphBoundaries: number[],
  wpm: number,
  dispatch: React.Dispatch<AppAction>,
): {
  isPlaying: boolean
  currentIndex: number
  play: () => void
  pause: () => void
  toggle: () => void
  skip: (n: number) => void
  jumpToParagraphStart: () => void
  adjustWpm: (delta: number) => void
}
```

- Recursive `setTimeout` in a `tick` function stored in `useRef`. Each tick: compute duration via `getWordDuration(words[idx], wpm)`, schedule next tick, increment index.
- End condition: `idx >= words.length - 1` → pause.
- `skip(n)`: clamp `currentIndex + n` to `[0, words.length - 1]`.
- `jumpToParagraphStart()`: find largest boundary ≤ currentIndex, set index to it.
- localStorage: persist `rsvp_index` and `rsvp_wpm` on change; hydrate on mount.
- Sync back: dispatch `SET_CURRENT_INDEX` and `SET_WPM` when internal state changes.

### `src/App.tsx` changes

```ts
// Add to AppState:
paragraphBoundaries: number[]

// Extend SET_TEXT action:
| { type: 'SET_TEXT'; text: string; words: string[]; paragraphBoundaries: number[] }

// Reducer SET_TEXT case:
return { ...state, text: action.text, words: action.words, paragraphBoundaries: action.paragraphBoundaries, currentIndex: 0 }

// initialState:
paragraphBoundaries: []

// Pass paragraphBoundaries through EditorViewShell and RSVPViewShell
```

### `src/components/EditorView/EditorView.tsx` changes

- Add `onFileDrop: (file: File) => void` prop (replaces inline file handling).
- UploadZone: add `onDragOver` (preventDefault + visual state), `onDragLeave`, `onDrop` (extract `e.dataTransfer.files[0]`, call `onFileDrop`).
- File input `onChange`: extract `e.target.files[0]`, call `onFileDrop`, reset input value.
- `App.tsx` wires `onFileDrop` to: `extractText(file)` → `processText(raw)` → `dispatch SET_TEXT`.

### `src/components/RSVPView/RSVPView.tsx` changes

- Import `splitWordAtOrp` from `../../utils/orp`.
- Replace lines 22-42 (inline ORP logic) with: `const { before, orp, after } = splitWordAtOrp(word)`.
- Wire control buttons to `useRSVPEngine` methods (passed as props from `RSVPViewShell`).

## Testing Strategy

| Layer | What | Approach |
|-------|------|----------|
| Unit | `processText()` — single/multi paragraph, empty input | Vitest, direct assertion on spec scenarios |
| Unit | `getOrpIndex()` / `splitWordAtOrp()` — simple words, punctuation, edge cases | Vitest, spec scenarios + leading non-alpha |
| Unit | `getWordDuration()` — base, long words, punctuation multipliers | Vitest, verify highest-wins rule |
| Integration | `useTextExtractor` — TXT extraction | Vitest + mock File object |
| Integration | `useRSVPEngine` — play/pause/skip/jump/WPM bounds | Vitest + `@testing-library/react` renderHook, fake timers |
| E2E | Upload → display → RSVP flow | Manual verification (acceptance criteria) |

## Migration / Rollout

No migration required. All changes are additive or small extensions to existing interfaces. The `SET_TEXT` action gains one field — only dispatched from `EditorViewShell`, so the change is localized.

## Open Questions

- [ ] pdfjs-dist worker path: `pdfjs-dist/build/pdf.worker.mjs` vs `pdfjs-dist/build/pdf.worker.min.mjs` — verify which exists in v4.9.155 at apply time
- [ ] Whether `paragraphBoundaries` should be passed to RSVPView as a prop or read from a context — prop drilling is fine for now given the flat component tree
