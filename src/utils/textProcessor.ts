/**
 * textProcessor.ts — Text normalization, paragraph detection, and tokenization
 * =============================================================================
 *
 * Transforms raw text (from file upload or manual edit) into the structured
 * format consumed by the RSVP engine.
 *
 * Algorithm:
 * 1. Normalize line endings (replace \r\n with \n)
 * 2. Split into paragraphs on /\n\n+/
 * 3. Within each paragraph, split into words on /\s+/, filtering empty strings
 * 4. Track the cumulative word index where each paragraph starts
 */

export interface ProcessedText {
  /** Flat array of all words in document order */
  words: string[]
  /**
   * Cumulative word indices where each paragraph begins.
   * paragraphBoundaries[i] = index of first word of paragraph i
   * Length = number of paragraphs.
   */
  paragraphBoundaries: number[]
}

/**
 * Process raw text into tokenized words with paragraph boundary tracking.
 *
 * @param raw - Raw text input (from file or manual entry)
 * @returns ProcessedText with words array and paragraph boundaries
 */
export function processText(raw: string): ProcessedText {
  // Normalize line endings
  const normalized = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

  // Split into non-empty paragraphs
  const paragraphTexts = normalized.split(/\n\n+/).filter(p => p.trim().length > 0)

  const words: string[] = []
  const paragraphBoundaries: number[] = []

  for (const paragraph of paragraphTexts) {
    // Record where this paragraph starts
    paragraphBoundaries.push(words.length)

    // Tokenize by whitespace, keeping punctuation attached to words
    const tokens = paragraph.split(/\s+/).filter(token => token.length > 0)
    words.push(...tokens)
  }

  return { words, paragraphBoundaries }
}