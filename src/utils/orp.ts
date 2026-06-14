/**
 * orp.ts — Optimal Recognition Point calculation
 * ===============================================
 *
 * The ORP is the character in a word where recognition is fastest.
 * Calculated as 35% into the alpha-only portion of the word.
 *
 * The word is split into three spans:
 * - before: characters before the ORP
 * - orp:    the ORP character itself
 * - after:  characters after the ORP
 */

const ORP_RATIO = 0.35

/**
 * Strip non-alpha characters from both ends of a string.
 */
function stripPunctuation(word: string): string {
  return word.replace(/^[^a-zA-Z]+|[^a-zA-Z]+$/g, '')
}

/**
 * Check if a character is alphabetic.
 */
function isAlpha(char: string): boolean {
  return /[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(char)
}

/**
 * Find the ORP index within a word's clean (alpha-only) representation.
 */
export function getOrpIndex(word: string): number {
  const clean = stripPunctuation(word)
  if (clean.length === 0) return 0
  return Math.floor(clean.length * ORP_RATIO)
}

/**
 * Split a word into three spans around the ORP character.
 */
export function splitWordAtOrp(word: string): { before: string; orp: string; after: string } {
  if (word.length === 0) {
    return { before: '', orp: '', after: '' }
  }

  const clean = stripPunctuation(word)
  if (clean.length === 0) {
    return { before: '', orp: word[0], after: word.slice(1) }
  }

  const orpCleanIndex = getOrpIndex(word)

  // Count how many alpha chars to skip in the original word to reach orpCleanIndex
  let alphaCount = 0
  let orpOriginalIndex = 0

  for (let i = 0; i < word.length; i++) {
    if (isAlpha(word[i])) {
      if (alphaCount === orpCleanIndex) {
        orpOriginalIndex = i
        break
      }
      alphaCount++
    }
  }

  const before = word.slice(0, orpOriginalIndex)
  const orp = word[orpOriginalIndex] ?? ''
  const after = word.slice(orpOriginalIndex + 1)

  return { before, orp, after }
}