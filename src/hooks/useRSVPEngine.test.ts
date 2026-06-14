/**
 * useRSVPEngine.test.ts — Tests for RSVP playback engine hook
 * =============================================================
 *
 * Tests: play/pause, skip bounds, jump-to-paragraph, WPM bounds,
 * and localStorage persistence.
 *
 * Uses fake timers to control recursive setTimeout.
 * Uses localStorage stub for consistent jsdom behavior.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useRSVPEngine } from './useRSVPEngine'
import type { AppAction } from '../App'

// Helper: create mock dispatch
function createMockDispatch() {
  return vi.fn() as React.Dispatch<AppAction>
}

const defaultWords = [
  'The', 'quick', 'brown', 'fox', 'jumps',
  'over', 'the', 'lazy', 'dog', 'today',
]
const defaultBoundaries = [0, 5]  // paragraph 1: 0-4, paragraph 2: 5-9
const defaultWpm = 300

// localStorage stub
function createLocalStorageStub() {
  const store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = String(value) }),
    removeItem: vi.fn((key: string) => { delete store[key] }),
    clear: vi.fn(() => { Object.keys(store).forEach(k => delete store[k]) }),
    get length() { return Object.keys(store).length },
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
    _store: store,
  }
}

describe('useRSVPEngine', () => {
  let localStorageMock: ReturnType<typeof createLocalStorageStub>

  beforeEach(() => {
    localStorageMock = createLocalStorageStub()
    vi.stubGlobal('localStorage', localStorageMock)
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  describe('play/pause', () => {
    it('starts as not playing', () => {
      const dispatch = createMockDispatch()
      const { result } = renderHook(() =>
        useRSVPEngine(defaultWords, defaultBoundaries, defaultWpm, dispatch),
      )

      expect(result.current.isPlaying).toBe(false)
    })

    it('play() starts playback', () => {
      const dispatch = createMockDispatch()
      const { result } = renderHook(() =>
        useRSVPEngine(defaultWords, defaultBoundaries, defaultWpm, dispatch),
      )

      act(() => {
        result.current.play()
      })

      expect(result.current.isPlaying).toBe(true)
    })

    it('pause() stops playback and clears timer', () => {
      const dispatch = createMockDispatch()
      const { result } = renderHook(() =>
        useRSVPEngine(defaultWords, defaultBoundaries, defaultWpm, dispatch),
      )

      act(() => {
        result.current.play()
      })
      expect(result.current.isPlaying).toBe(true)

      act(() => {
        result.current.pause()
      })
      expect(result.current.isPlaying).toBe(false)
    })

    it('toggle() alternates between play and pause', () => {
      const dispatch = createMockDispatch()
      const { result } = renderHook(() =>
        useRSVPEngine(defaultWords, defaultBoundaries, defaultWpm, dispatch),
      )

      act(() => {
        result.current.toggle()
      })
      expect(result.current.isPlaying).toBe(true)

      act(() => {
        result.current.toggle()
      })
      expect(result.current.isPlaying).toBe(false)
    })

    it('play does nothing when at the last word', () => {
      const dispatch = createMockDispatch()
      // Set currentIndex to last position via localStorage
      localStorageMock.setItem('rsvp_index', '9')

      const { result } = renderHook(() =>
        useRSVPEngine(defaultWords, defaultBoundaries, defaultWpm, dispatch),
      )

      expect(result.current.currentIndex).toBe(9)

      act(() => {
        result.current.play()
      })

      // Should not start playing
      expect(result.current.isPlaying).toBe(false)
    })
  })

  describe('recursive setTimeout advancement', () => {
    it('advances word on each timer tick', () => {
      const dispatch = createMockDispatch()
      const { result } = renderHook(() =>
        useRSVPEngine(defaultWords, defaultBoundaries, defaultWpm, dispatch),
      )

      expect(result.current.currentIndex).toBe(0)

      act(() => {
        result.current.play()
      })

      // Fast-forward one tick
      act(() => {
        vi.advanceTimersByTime(200) // base interval at 300 WPM = 200ms
      })

      expect(result.current.currentIndex).toBe(1)
    })

    it('stops at the end of text', () => {
      const dispatch = createMockDispatch()
      localStorageMock.setItem('rsvp_index', '8') // Start at second-to-last word

      const { result } = renderHook(() =>
        useRSVPEngine(defaultWords, defaultBoundaries, defaultWpm, dispatch),
      )

      expect(result.current.currentIndex).toBe(8)

      act(() => {
        result.current.play()
      })

      // First tick advances to last word (9)
      act(() => {
        vi.advanceTimersByTime(200)
      })
      expect(result.current.currentIndex).toBe(9)

      // Next tick should detect end and pause — need to advance past the scheduled timer
      act(() => {
        vi.advanceTimersByTime(1000)
      })
      expect(result.current.isPlaying).toBe(false)
    })
  })

  describe('skip', () => {
    it('skips forward by n words', () => {
      const dispatch = createMockDispatch()
      const { result } = renderHook(() =>
        useRSVPEngine(defaultWords, defaultBoundaries, defaultWpm, dispatch),
      )

      act(() => {
        result.current.skip(10)
      })
      expect(result.current.currentIndex).toBe(9) // clamped to max
    })

    it('skips backward by n words', () => {
      const dispatch = createMockDispatch()
      localStorageMock.setItem('rsvp_index', '5')

      const { result } = renderHook(() =>
        useRSVPEngine(defaultWords, defaultBoundaries, defaultWpm, dispatch),
      )

      act(() => {
        result.current.skip(-10)
      })
      expect(result.current.currentIndex).toBe(0)
    })

    it('clamps to upper bound (words.length - 1)', () => {
      const dispatch = createMockDispatch()
      const { result } = renderHook(() =>
        useRSVPEngine(defaultWords, defaultBoundaries, defaultWpm, dispatch),
      )

      act(() => {
        result.current.skip(100)
      })
      expect(result.current.currentIndex).toBe(9) // 10 words - 1
    })

    it('clamps to lower bound (0)', () => {
      const dispatch = createMockDispatch()
      const { result } = renderHook(() =>
        useRSVPEngine(defaultWords, defaultBoundaries, defaultWpm, dispatch),
      )

      act(() => {
        result.current.skip(-100)
      })
      expect(result.current.currentIndex).toBe(0)
    })
  })

  describe('jumpToParagraphStart', () => {
    it('jumps to start of current paragraph', () => {
      const dispatch = createMockDispatch()
      localStorageMock.setItem('rsvp_index', '7') // In paragraph 2 (boundaries [0, 5])

      const { result } = renderHook(() =>
        useRSVPEngine(defaultWords, defaultBoundaries, defaultWpm, dispatch),
      )

      expect(result.current.currentIndex).toBe(7)

      act(() => {
        result.current.jumpToParagraphStart()
      })

      // Should jump to start of paragraph 2 → boundary 5
      expect(result.current.currentIndex).toBe(5)
    })

    it('jumps to start of previous paragraph when at paragraph start', () => {
      const dispatch = createMockDispatch()
      localStorageMock.setItem('rsvp_index', '5') // At start of paragraph 2

      const { result } = renderHook(() =>
        useRSVPEngine(defaultWords, defaultBoundaries, defaultWpm, dispatch),
      )

      act(() => {
        result.current.jumpToParagraphStart()
      })

      // currentIndex = 5 is a boundary; should jump to previous paragraph start
      expect(result.current.currentIndex).toBe(0)
    })

    it('stays at 0 if already at first paragraph start', () => {
      const dispatch = createMockDispatch()
      const { result } = renderHook(() =>
        useRSVPEngine(defaultWords, defaultBoundaries, defaultWpm, dispatch),
      )

      act(() => {
        result.current.jumpToParagraphStart()
      })

      expect(result.current.currentIndex).toBe(0)
    })
  })

  describe('adjustWpm', () => {
    it('increases WPM by delta', () => {
      const dispatch = createMockDispatch()
      const { result } = renderHook(() =>
        useRSVPEngine(defaultWords, defaultBoundaries, defaultWpm, dispatch),
      )

      act(() => {
        result.current.adjustWpm(25)
      })

      // WPM should have been adjusted (default 300 → 325), check dispatch
      expect(dispatch).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'SET_WPM', wpm: 325 }),
      )
    })

    it('clamps WPM to maximum 1000', () => {
      const dispatch = createMockDispatch()
      localStorageMock.setItem('rsvp_wpm', '990')

      const { result } = renderHook(() =>
        useRSVPEngine(defaultWords, defaultBoundaries, defaultWpm, dispatch),
      )

      act(() => {
        result.current.adjustWpm(25)
      })

      expect(dispatch).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'SET_WPM', wpm: 1000 }),
      )
    })

    it('clamps WPM to minimum 100', () => {
      const dispatch = createMockDispatch()
      localStorageMock.setItem('rsvp_wpm', '110')

      const { result } = renderHook(() =>
        useRSVPEngine(defaultWords, defaultBoundaries, defaultWpm, dispatch),
      )

      act(() => {
        result.current.adjustWpm(-25)
      })

      expect(dispatch).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'SET_WPM', wpm: 100 }),
      )
    })
  })

  describe('localStorage persistence', () => {
    it('persists currentIndex to localStorage on skip', () => {
      const dispatch = createMockDispatch()
      const { result } = renderHook(() =>
        useRSVPEngine(defaultWords, defaultBoundaries, defaultWpm, dispatch),
      )

      act(() => {
        result.current.skip(5)
      })

      expect(localStorageMock.setItem).toHaveBeenCalledWith('rsvp_index', '5')
    })

    it('persists wpm to localStorage on adjustment', () => {
      const dispatch = createMockDispatch()
      const { result } = renderHook(() =>
        useRSVPEngine(defaultWords, defaultBoundaries, defaultWpm, dispatch),
      )

      act(() => {
        result.current.adjustWpm(50)
      })

      // Should have saved the new WPM value
      expect(localStorageMock.setItem).toHaveBeenCalledWith('rsvp_wpm', '350')
    })

    it('hydrates currentIndex from localStorage', () => {
      localStorageMock.setItem('rsvp_index', '7')

      const dispatch = createMockDispatch()
      const { result } = renderHook(() =>
        useRSVPEngine(defaultWords, defaultBoundaries, defaultWpm, dispatch),
      )

      expect(result.current.currentIndex).toBe(7)
    })

    it('hydrates WPM from localStorage', () => {
      localStorageMock.setItem('rsvp_wpm', '450')

      const dispatch = createMockDispatch()
      const { result } = renderHook(() =>
        useRSVPEngine(defaultWords, defaultBoundaries, defaultWpm, dispatch),
      )

      // The hook uses localWpm which was hydrated to 450
      // Verify by checking that a subsequent adjustWpm starts from 450
      act(() => {
        result.current.adjustWpm(25)
      })
      expect(dispatch).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'SET_WPM', wpm: 475 }),
      )
    })
  })

  describe('dispatch sync', () => {
    it('dispatches SET_CURRENT_INDEX on skip', () => {
      const dispatch = createMockDispatch()
      const { result } = renderHook(() =>
        useRSVPEngine(defaultWords, defaultBoundaries, defaultWpm, dispatch),
      )

      act(() => {
        result.current.skip(3)
      })

      expect(dispatch).toHaveBeenCalledWith({
        type: 'SET_CURRENT_INDEX',
        index: 3,
      })
    })

    it('dispatches SET_WPM on adjustWpm', () => {
      const dispatch = createMockDispatch()
      const { result } = renderHook(() =>
        useRSVPEngine(defaultWords, defaultBoundaries, defaultWpm, dispatch),
      )

      act(() => {
        result.current.adjustWpm(25)
      })

      expect(dispatch).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'SET_WPM' }),
      )
    })
  })
})