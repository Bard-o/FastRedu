import { describe, it, expect } from 'vitest'
import { getWordDuration } from './timing'

describe('getWordDuration', () => {
  const wpm = 300

  it('base interval at 300 WPM is 200ms', () => {
    // 60000 / 300 = 200ms
    expect(getWordDuration('the', wpm)).toBe(200)
  })

  it('long word (>8 chars) gets ×1.3', () => {
    // base=200ms, ×1.3 = 260ms
    expect(getWordDuration('extraordinarily', wpm)).toBe(260)
  })

  it('word ending with comma gets ×1.5', () => {
    // base=200ms, ×1.5 = 300ms
    expect(getWordDuration('however,', wpm)).toBe(300)
  })

  it('word ending with period gets ×1.8', () => {
    // base=200ms, ×1.8 = 360ms
    expect(getWordDuration('done!', wpm)).toBe(360)
  })

  it('highest multiplier wins (long word + sentence end)', () => {
    // extraordinarily! → long (×1.3) + sentence end (×1.8) → ×1.8
    expect(getWordDuration('extraordinarily!', wpm)).toBe(360)
  })

  it('highest multiplier wins (long word + comma)', () => {
    // however, → long? no, but comma ×1.5
    expect(getWordDuration('furthermore,', wpm)).toBe(300)
  })

  it('pure numbers get no multiplier (×1.0)', () => {
    expect(getWordDuration('42', wpm)).toBe(200)
    expect(getWordDuration('3.14', wpm)).toBe(200)
  })

  it('handles WPM below minimum (clamps to 100)', () => {
    // 60000 / 100 = 600ms base
    expect(getWordDuration('word', 100)).toBe(600)
  })

  it('scales linearly with WPM', () => {
    // at 600 WPM: 60000/600 = 100ms base
    expect(getWordDuration('word', 600)).toBe(100)
  })

  it('handles mixed punctuation correctly', () => {
    // "word..." → sentence end ×1.8
    expect(getWordDuration('word...', wpm)).toBe(360)
  })
})