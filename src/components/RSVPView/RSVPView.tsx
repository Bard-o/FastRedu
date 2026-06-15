import { useEffect, useRef, useState } from 'react'
import { IconX, IconPlayerSkipBack, IconPlayerSkipForward, IconPlayerPause, IconPlayerPlay, IconArrowsVertical, IconRewindBackward10 } from '@tabler/icons-react'
import { splitWordAtOrp } from '../../utils/orp'
import { AriaLiveRegion } from '../shared/AriaLiveRegion'
import styles from './RSVPView.module.css'

interface Props {
  words: string[]
  currentIndex: number
  wpm: number
  paragraphBoundaries: number[]
  isPlaying: boolean
  onPlay: () => void
  onPause: () => void
  onToggle: () => void
  onSkip: (n: number) => void
  onJumpToParagraphStart: () => void
  onAdjustWpm: (delta: number) => void
  onExit: () => void
}

export function RSVPView({
  words,
  currentIndex,
  wpm,
  isPlaying,
  onToggle,
  onSkip,
  onJumpToParagraphStart,
  onAdjustWpm,
  onExit,
}: Props) {
  const word = words[currentIndex] ?? ''

  // ORP split
  const { before, orp, after } = splitWordAtOrp(word)
  const progress_pct = words.length > 0 ? ((currentIndex + 1) / words.length) * 100 : 0

  // ── End of text detection ────────────────────────────────────────
  const [showEndOverlay, setShowEndOverlay] = useState(false)
  const wasAtEnd = useRef(false)

  useEffect(() => {
    const isAtEnd = currentIndex >= words.length - 1 && words.length > 0
    if (isAtEnd && !wasAtEnd.current && isPlaying) {
      setShowEndOverlay(true)
    }
    wasAtEnd.current = isAtEnd
  }, [currentIndex, words.length, isPlaying])

  // ── WPM feedback flash ───────────────────────────────────────────
  const [wpmFlash, setWpmFlash] = useState<number | null>(null)
  const wpmTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Always fresh wpm value for use in closures (keyboard handler)
  const wpmRef = useRef(wpm)
  wpmRef.current = wpm

  const flashWpm = (value: number) => {
    setWpmFlash(value)
    if (wpmTimer.current) clearTimeout(wpmTimer.current)
    wpmTimer.current = setTimeout(() => setWpmFlash(null), 800)
  }

  // ── Keyboard shortcuts ───────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      switch (e.key) {
        case ' ':
          e.preventDefault()
          onToggle()
          break
        case 'ArrowLeft':
          e.preventDefault()
          onSkip(-10)
          break
        case 'ArrowRight':
          e.preventDefault()
          onSkip(10)
          break
        case 'ArrowUp':
          e.preventDefault()
          onJumpToParagraphStart()
          break
        case '[':
          e.preventDefault()
          onAdjustWpm(-25)
          flashWpm(wpmRef.current - 25)
          break
        case ']':
          e.preventDefault()
          onAdjustWpm(25)
          flashWpm(wpmRef.current + 25)
          break
        case 'Escape':
          e.preventDefault()
          onExit()
          break
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onToggle, onSkip, onJumpToParagraphStart, onAdjustWpm, onExit, wpm])

  const handleAdjustWpm = (delta: number) => {
    onAdjustWpm(delta)
    flashWpm(wpm + delta)
  }

  return (
    <div className={`${styles.container} ${styles.fadeIn}`}>
      {/* Topbar */}
      <div className={styles.rsvpTopbar}>
        <span className={styles.rsvpLogo}>FastRedu</span>
        <span className={styles.rsvpWpmBadge}>{wpm} WPM</span>
        <button className={styles.rsvpExit} onClick={onExit}>
          <IconX size={10} />
          Esc
        </button>
      </div>

      {/* RSVP Stage */}
      <div className={styles.rsvpStage}>
        <div className={styles.rsvpContent}>
          <div className={styles.orpGuide}>
            <div className={styles.orpDot} />
            <div className={styles.orpLine} />
          </div>
          <div className={styles.rsvpWordWrap}>
            <span className={styles.rsvpBefore}>{before}</span>
            <span className={styles.rsvpOrp}>{orp}</span>
            <span className={styles.rsvpAfter}>{after}</span>
          </div>
          <div className={styles.orpGuideBottom}>
            <div className={styles.orpLine} />
            <div className={styles.orpDot} />
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className={styles.rsvpProgressWrap}>
        <div className={styles.rsvpProgressBarWrap}>
          <div className={styles.rsvpProgressFill} style={{ width: `${progress_pct}%` }} />
        </div>
      </div>

      {/* Controls */}
      <div className={styles.rsvpControls}>
        <button className={styles.ctrlBtn} title="Inicio del párrafo (↑)" onClick={onJumpToParagraphStart}>
          <div className={styles.ctrlIcon}>
            <IconRewindBackward10 size={16} />
          </div>
          <span className={styles.ctrlLabel}>inicio párr.</span>
          <span className={styles.ctrlKbd}>↑</span>
        </button>

        <button className={styles.ctrlBtn} title="-10 palabras (←)" onClick={() => onSkip(-10)}>
          <div className={styles.ctrlIcon}>
            <IconPlayerSkipBack size={16} />
          </div>
          <span className={styles.ctrlLabel}>−10 palabras</span>
          <span className={styles.ctrlKbd}>←</span>
        </button>

        <button className={styles.ctrlBtn} title={isPlaying ? 'Pausa (Space)' : 'Reproducir (Space)'} onClick={onToggle}>
          <div className={`${styles.ctrlIcon} ${styles.ctrlIconPrimary}`}>
            {isPlaying ? <IconPlayerPause size={20} /> : <IconPlayerPlay size={20} />}
          </div>
          <span className={styles.ctrlLabel}>{isPlaying ? 'pausa' : 'reproducir'}</span>
          <span className={styles.ctrlKbd}>Space</span>
        </button>

        <button className={styles.ctrlBtn} title="+10 palabras (→)" onClick={() => onSkip(10)}>
          <div className={styles.ctrlIcon}>
            <IconPlayerSkipForward size={16} />
          </div>
          <span className={styles.ctrlLabel}>+10 palabras</span>
          <span className={styles.ctrlKbd}>→</span>
        </button>

        <button className={styles.ctrlBtn} title="Ajustar WPM ([ ])" onClick={() => handleAdjustWpm(25)}>
          <div className={styles.ctrlIcon} style={{ flexDirection: 'column', gap: '1px' }}>
            <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)' }}>WPM</span>
            <IconArrowsVertical size={13} />
          </div>
          <span className={styles.ctrlLabel}>velocidad</span>
          <span className={styles.ctrlKbd}>[ ]</span>
        </button>
      </div>

      {/* WPM flash overlay */}
      {wpmFlash !== null && (
        <div className={styles.wpmFlash}>{wpmFlash}</div>
      )}

      {/* End of text overlay */}
      {showEndOverlay && (
        <div className={styles.endOverlay} role="dialog" aria-modal="true">
          <div className={styles.endOverlayContent}>
            <div className={styles.endOverlayTitle}>Fin del texto</div>
            <button className={styles.endOverlayBtn} onClick={onExit}>
              Volver al editor
            </button>
          </div>
        </div>
      )}

      {/* ARIA live region for screen readers */}
      <AriaLiveRegion>
        <span>{word}</span>
      </AriaLiveRegion>
    </div>
  )
}
