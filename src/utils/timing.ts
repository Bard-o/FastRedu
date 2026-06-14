/**
 * timing.ts — Adaptive word duration for RSVP playback
 * =====================================================
 *
 * Base interval = 60000ms / WPM (words per minute)
 * Multipliers make longer/complex words more readable:
 *
 * - Long words (>8 chars):         ×1.3
 * - Ends with , ; :                ×1.5
 * - Ends with . ! ?                ×1.8
 * - Pure number:                   ×1.0 (no multiplier)
 *
 * When multiple multipliers apply, the highest wins (not multiplicative).
 */

const BASE_INTERVAL_MS = 60_000

const LENGTH_THRESHOLD = 8
const LENGTH_MULTIPLIER = 1.3
const COMMA_MULTIPLIER = 1.5
const SENTENCE_END_MULTIPLIER = 1.8

/**
 * Calculate display duration for a word at a given WPM.
 *
 * @param word   - The word to time
 * @param wpm    - Current words-per-minute setting (100–1000)
 * @returns Duration in milliseconds
 */
export function getWordDuration(word: string, wpm: number): number {
  const clampedWpm = Math.max(100, Math.min(1000, wpm))
  const base = BASE_INTERVAL_MS / clampedWpm

  const mult = getMultiplier(word)

  return Math.round(base * mult)
}

/**
 * Get the highest applicable timing multiplier for a word.
 */
function getMultiplier(word: string): number {
  // Pure numbers get no multiplier
  if (/^\d+(\.\d+)?$/.test(word)) {
    return 1.0
  }

  let mult = 1.0

  // Long word
  if (word.replace(/^[^a-zA-ZáéíóúÁÉÍÓÚñÑ]+|[^a-zA-ZáéíóúÁÉÍÓÚñÑ]+$/g, '').length > LENGTH_THRESHOLD) {
    mult = Math.max(mult, LENGTH_MULTIPLIER)
  }

  const lastChar = word.slice(-1)

  // Sentence-ending punctuation
  if ('.!?'.includes(lastChar)) {
    mult = Math.max(mult, SENTENCE_END_MULTIPLIER)
  } else if (',;:'.includes(lastChar)) {
    mult = Math.max(mult, COMMA_MULTIPLIER)
  }

  return mult
}