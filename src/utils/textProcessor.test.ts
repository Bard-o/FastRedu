import { describe, it, expect } from 'vitest'
import { processText } from './textProcessor'

describe('processText', () => {
  it('tokenizes a single paragraph', () => {
    const result = processText('Hola mundo cruel')
    expect(result.words).toEqual(['Hola', 'mundo', 'cruel'])
    expect(result.paragraphBoundaries).toEqual([0])
  })

  it('detects multiple paragraph boundaries', () => {
    const result = processText('Primer párrafo aquí\n\nSegundo párrafo')
    expect(result.words).toEqual(['Primer', 'párrafo', 'aquí', 'Segundo', 'párrafo'])
    expect(result.paragraphBoundaries).toEqual([0, 3])
  })

  it('handles more than two paragraphs', () => {
    // "Uno\n\nDos" = one paragraph, "Tres\n\nCuatro" = second paragraph
    const result = processText('Uno Dos\n\nTres Cuatro')
    expect(result.paragraphBoundaries).toEqual([0, 2])
    expect(result.words).toEqual(['Uno', 'Dos', 'Tres', 'Cuatro'])
  })

  it('filters out empty paragraphs', () => {
    const result = processText('Uno\n\n\n\n  \n\nDos')
    expect(result.words).toEqual(['Uno', 'Dos'])
    expect(result.paragraphBoundaries).toEqual([0, 1])
  })

  it('handles mixed line endings', () => {
    const result = processText('Línea uno\r\n\r\nLínea dos')
    expect(result.words).toEqual(['Línea', 'uno', 'Línea', 'dos'])
    expect(result.paragraphBoundaries).toEqual([0, 2])
  })

  it('handles empty input', () => {
    const result = processText('')
    expect(result.words).toEqual([])
    expect(result.paragraphBoundaries).toEqual([])
  })

  it('handles whitespace-only input', () => {
    const result = processText('   \n\n  \n\n  ')
    expect(result.words).toEqual([])
    expect(result.paragraphBoundaries).toEqual([])
  })

  it('keeps punctuation attached to words', () => {
    const result = processText('¡Hola, mundo! ¿Cómo estás?')
    expect(result.words).toEqual(['¡Hola,', 'mundo!', '¿Cómo', 'estás?'])
  })

  it('maps paragraph boundaries correctly across tokens', () => {
    const result = processText('a b c\n\nd e f g')
    expect(result.paragraphBoundaries).toEqual([0, 3])
    expect(result.words.slice(0, 3)).toEqual(['a', 'b', 'c'])
    expect(result.words.slice(3)).toEqual(['d', 'e', 'f', 'g'])
  })
})