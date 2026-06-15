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
  _onIndexChange: (index: number) => void
  _onWpmChange: (wpm: number) => void
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

  // ORP split using the utility function
  const { before, orp, after } = splitWordAtOrp(word)

  const progress = words.length > 0 ? ((currentIndex + 1) / words.length) * 100 : 0

  return (
    <div className={styles.container}>
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
        </div>
      </div>

      {/* Progress bar */}
      <div className={styles.rsvpProgressWrap}>
        <div className={styles.rsvpProgressBarWrap}>
          <div className={styles.rsvpProgressFill} style={{ width: `${progress}%` }} />
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

        <button className={styles.ctrlBtn} title="Ajustar WPM ([ ])" onClick={() => onAdjustWpm(25)}>
          <div className={styles.ctrlIcon} style={{ flexDirection: 'column', gap: '1px' }}>
            <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)' }}>WPM</span>
            <IconArrowsVertical size={13} />
          </div>
          <span className={styles.ctrlLabel}>velocidad</span>
          <span className={styles.ctrlKbd}>[ ]</span>
        </button>
      </div>

      {/* ARIA live region for screen readers */}
      <AriaLiveRegion>
        <span>{word}</span>
      </AriaLiveRegion>
    </div>
  )
}