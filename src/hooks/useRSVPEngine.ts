/**
 * useRSVPEngine — RSVP playback engine hook
 * ==========================================
 *
 * Manages word-by-word display using recursive setTimeout.
 * Exposes play/pause/toggle/skip/jumpToParagraphStart/adjustWpm.
 *
 * State split: AppState holds data (words, boundaries, wpm),
 * hook holds playback (isPlaying, timer ref). Hook syncs back
 * currentIndex and wpm via dispatch.
 *
 * localStorage: persists rsvp_index and rsvp_wpm on change,
 * hydrates on mount.
 */

import { useState, useRef, useCallback, useEffect } from 'react'
import type { AppAction } from '../App'
import { getWordDuration } from '../utils/timing'

const WPM_MIN = 100
const WPM_MAX = 1000

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
} {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(() => {
    const saved = localStorage.getItem('rsvp_index')
    return saved !== null ? Number(saved) : 0
  })
  const [localWpm, setLocalWpm] = useState(() => {
    const saved = localStorage.getItem('rsvp_wpm')
    return saved !== null ? Number(saved) : wpm
  })

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isPlayingRef = useRef(isPlaying)
  const currentIndexRef = useRef(currentIndex)
  const localWpmRef = useRef(localWpm)
  const wordsRef = useRef(words)
  const paragraphBoundariesRef = useRef(paragraphBoundaries)
  const dispatchRef = useRef(dispatch)

  // Keep refs in sync with latest values
  useEffect(() => {
    isPlayingRef.current = isPlaying
  }, [isPlaying])

  useEffect(() => {
    currentIndexRef.current = currentIndex
  }, [currentIndex])

  useEffect(() => {
    localWpmRef.current = localWpm
  }, [localWpm])

  useEffect(() => {
    wordsRef.current = words
  }, [words])

  useEffect(() => {
    paragraphBoundariesRef.current = paragraphBoundaries
  }, [paragraphBoundaries])

  useEffect(() => {
    dispatchRef.current = dispatch
  }, [dispatch])

  // Persist to localStorage on changes
  useEffect(() => {
    localStorage.setItem('rsvp_index', String(currentIndex))
    dispatchRef.current({ type: 'SET_CURRENT_INDEX', index: currentIndex })
  }, [currentIndex])

  useEffect(() => {
    localStorage.setItem('rsvp_wpm', String(localWpm))
    dispatchRef.current({ type: 'SET_WPM', wpm: localWpm })
  }, [localWpm])

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])

  const tick = useCallback(() => {
    const nextIndex = currentIndexRef.current + 1

    if (nextIndex >= wordsRef.current.length) {
      // End of text — stop playback
      setIsPlaying(false)
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
      return
    }

    setCurrentIndex(nextIndex)

    // Schedule next tick with adaptive timing
    const duration = getWordDuration(wordsRef.current[nextIndex], localWpmRef.current)
    timerRef.current = setTimeout(tick, duration)
  }, [])

  const play = useCallback(() => {
    if (words.length === 0) return
    // Don't play if already at the end
    if (currentIndexRef.current >= words.length - 1 && !isPlayingRef.current) return

    setIsPlaying(true)

    // If at the end, restart from beginning? No — spec says end condition pauses.
    // Start the first tick immediately, schedule next
    const duration = getWordDuration(wordsRef.current[currentIndexRef.current], localWpmRef.current)
    timerRef.current = setTimeout(tick, duration)
  }, [words.length, tick])

  const pause = useCallback(() => {
    setIsPlaying(false)
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const toggle = useCallback(() => {
    if (isPlayingRef.current) {
      pause()
    } else {
      play()
    }
  }, [isPlaying, pause, play])

  const skip = useCallback((n: number) => {
    const newIndex = Math.max(0, Math.min(wordsRef.current.length - 1, currentIndexRef.current + n))
    setCurrentIndex(newIndex)
  }, [])

  const jumpToParagraphStart = useCallback(() => {
    const idx = currentIndexRef.current
    const boundaries = paragraphBoundariesRef.current

    // Find the largest boundary ≤ currentIndex — but not the current one if we're already at start
    let target = 0
    for (let i = boundaries.length - 1; i >= 0; i--) {
      if (boundaries[i] < idx) {
        target = boundaries[i]
        break
      }
      target = boundaries[i]
    }

    setCurrentIndex(target)
  }, [])

  const adjustWpm = useCallback((delta: number) => {
    setLocalWpm((prev) => Math.max(WPM_MIN, Math.min(WPM_MAX, prev + delta)))
  }, [])

  return {
    isPlaying,
    currentIndex,
    play,
    pause,
    toggle,
    skip,
    jumpToParagraphStart,
    adjustWpm,
  }
}