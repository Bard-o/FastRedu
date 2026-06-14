# Spec: FastRedu Text Processing

## text-processing

### Requirement: Text Tokenization

The system MUST split raw text into words and track paragraph boundaries. Words retain punctuation. Paragraphs separated by blank lines.

#### Scenario: Single paragraph

- GIVEN "Hola mundo. Segundo frase."
- WHEN processText() called
- THEN words = ["Hola", "mundo.", "Segundo", "frase."], boundaries = [0]

#### Scenario: Multi-paragraph

- GIVEN "Hola mundo.\n\nSegundo párrafo."
- WHEN processText() called
- THEN words = ["Hola", "mundo.", "Segundo", "párrafo."], boundaries = [0, 2]

#### Scenario: Empty input

- GIVEN empty or whitespace-only string
- WHEN processText() called
- THEN words = [], boundaries = []

### Requirement: ORP Calculation

The system MUST compute ORP index at floor(cleanLength * 0.35), excluding leading/trailing non-alpha. splitWordAtOrp() returns {before, orp, after}.

#### Scenario: Simple word

- GIVEN "reading"
- WHEN getOrpIndex() called
- THEN returns 2 (floor(7 * 0.35))

#### Scenario: Punctuation handling

- GIVEN ""hello"" → returns 1; "world." → returns 1; "---" → returns 0

#### Scenario: Split output

- GIVEN "reading", orpIndex = 2
- WHEN splitWordAtOrp() called
- THEN { before: "re", orp: "a", after: "ding" }

### Requirement: Adaptive Timing

The system MUST calculate per-word duration as (60/WPM * 1000ms) × multiplier. Multipliers: >8 chars × 1.3, terminal punctuation (.,;:) × 1.5, sentence-ending (.!?) × 1.8. Highest wins.

#### Scenario: Base and multipliers at 300 WPM

- GIVEN "the" → 200ms (× 1.0)
- GIVEN "extraordinarily" → 260ms (× 1.3)
- GIVEN "done!" → 360ms (× 1.8)
- GIVEN "extraordinarily!" → 360ms (× 1.8, not stacked)

## file-extraction

### Requirement: Text Extraction Hook

The system MUST provide useTextExtractor with extractText(file) → Promise<string> for PDF, DOCX, TXT. Corrupted files MUST reject with error.

#### Scenario: TXT extraction

- GIVEN .txt File with "Hello world"
- WHEN extractText(file) called
- THEN resolves to "Hello world"

#### Scenario: PDF extraction

- GIVEN valid .pdf File
- WHEN extractText(file) called
- THEN resolves to text from all pages, worker via import.meta.url

#### Scenario: DOCX extraction

- GIVEN valid .docx File
- WHEN extractText(file) called
- THEN resolves via mammoth.extractRawText

#### Scenario: Corrupted PDF

- GIVEN .pdf file with invalid content
- WHEN extractText(file) called
- THEN rejects with error

## rsvp-engine

### Requirement: Playback Control

The system MUST provide useRSVPEngine managing word-by-word display via recursive setTimeout. Exposes: play, pause, toggle, skip(n), jumpToParagraphStart, adjustWpm(delta). State MUST persist to localStorage.

#### Scenario: Play/pause/toggle

- GIVEN isPlaying = false → play() → true, timer active
- GIVEN isPlaying = true → pause() → false, timer cleared
- toggle() alternates between play and pause

#### Scenario: Skip with bounds

- GIVEN currentIndex = 50, len = 100 → skip(10) → 60
- GIVEN currentIndex = 5 → skip(-10) → 0
- GIVEN currentIndex = 95 → skip(10) → 99

#### Scenario: Jump to paragraph

- GIVEN currentIndex = 5, boundaries = [0, 3, 8] → jump → 3
- GIVEN currentIndex = 1, boundaries = [0, 5] → jump → 0

#### Scenario: End of text

- GIVEN currentIndex = last word, isPlaying = true
- WHEN next tick fires
- THEN isPlaying = false, currentIndex unchanged

#### Scenario: WPM bounds

- GIVEN wpm = 300 → adjustWpm(25) → 325
- GIVEN wpm = 100 → adjustWpm(-25) → 100
- GIVEN wpm = 1000 → adjustWpm(25) → 1000

#### Scenario: localStorage persistence

- GIVEN currentIndex → 42 → localStorage 'rsvp_index' = '42'
- GIVEN wpm → 350 → localStorage 'rsvp_wpm' = '350'

## Acceptance Criteria

- [ ] processText() returns correct words and boundaries
- [ ] getOrpIndex() handles leading/trailing punctuation
- [ ] splitWordAtOrp() returns {before, orp, after}
- [ ] getWordDuration() applies correct multipliers; highest wins
- [ ] useTextExtractor extracts PDF, DOCX, TXT; rejects corrupted files
- [ ] useRSVPEngine play/pause/toggle/skip/jump/WPM work correctly
- [ ] RSVP uses recursive setTimeout; state persists to localStorage
- [ ] npm run build passes with zero type errors
