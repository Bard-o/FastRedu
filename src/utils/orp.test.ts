import { describe, it, expect } from 'vitest'
import { getOrpIndex, splitWordAtOrp } from './orp'

describe('getOrpIndex', () => {
  it('returns index 2 for "reading" (7 clean chars → floor(7*0.35)=2)', () => {
    expect(getOrpIndex('reading')).toBe(2)
  })

  it('returns index 1 for "hello" (5 clean chars → floor(5*0.35)=1)', () => {
    expect(getOrpIndex('hello')).toBe(1)
  })

  it('returns 0 for empty string', () => {
    expect(getOrpIndex('')).toBe(0)
  })

  it('ignores leading punctuation for calculation', () => {
    // '"hello"' — clean is 'hello' (5 chars → 1), but leading " counts as offset
    expect(getOrpIndex('"hello"')).toBe(1)
  })

  it('returns 0 for punctuation-only strings', () => {
    expect(getOrpIndex('---')).toBe(0)
    expect(getOrpIndex('...')).toBe(0)
    expect(getOrpIndex('!!!')).toBe(0)
  })

  it('handles accented characters (5 chars → floor(5*0.35)=1)', () => {
    expect(getOrpIndex('ábóéío')).toBe(1)
  })
})

describe('splitWordAtOrp', () => {
  it('splits "reading" correctly', () => {
    const result = splitWordAtOrp('reading')
    expect(result.before).toBe('re')
    expect(result.orp).toBe('a')
    expect(result.after).toBe('ding')
  })

  it('splits "sorprendentes" correctly (13 chars → floor(13*0.35)=4)', () => {
    const result = splitWordAtOrp('sorprendentes')
    expect(result.before).toBe('sorp')
    expect(result.orp).toBe('r')
    expect(result.after).toBe('endentes')
  })

  it('handles empty word', () => {
    const result = splitWordAtOrp('')
    expect(result).toEqual({ before: '', orp: '', after: '' })
  })

  it('handles word with leading punctuation', () => {
    // '"reading"' → ORP at index 2 in 'reading' → 'e'
    const result = splitWordAtOrp('"reading"')
    expect(result.before).toBe('"re')
    expect(result.orp).toBe('a')
    expect(result.after).toBe('ding"')
  })

  it('handles word with trailing punctuation', () => {
    // 'world.' → 5 clean chars → floor(5*0.35)=1 → ORP at 'o'
    const result = splitWordAtOrp('world.')
    expect(result.before).toBe('w')
    expect(result.orp).toBe('o')
    expect(result.after).toBe('rld.')
  })

  it('handles single character word', () => {
    const result = splitWordAtOrp('a')
    expect(result.before).toBe('')
    expect(result.orp).toBe('a')
    expect(result.after).toBe('')
  })

  it('handles two character word', () => {
    const result = splitWordAtOrp('yo')
    expect(result.before).toBe('')
    expect(result.orp).toBe('y')
    expect(result.after).toBe('o')
  })
})