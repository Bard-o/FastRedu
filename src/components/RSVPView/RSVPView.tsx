import { IconX, IconPlayerSkipBack, IconPlayerSkipForward, IconPlayerPause, IconArrowsVertical, IconRewindBackward10 } from '@tabler/icons-react'
import { AriaLiveRegion } from '../shared/AriaLiveRegion'
import styles from './RSVPView.module.css'

interface Props {
  words: string[]
  currentIndex: number
  wpm: number
  _onIndexChange: (index: number) => void
  _onWpmChange: (wpm: number) => void
  onExit: () => void
}

export function RSVPView({
  words,
  currentIndex,
  wpm,
  onExit,
}: Props) {
  const word = words[currentIndex] ?? ''

  // Simple ORP split — implement properly in Phase 2
  const cleanLen = word.replace(/^[^a-zA-ZáéíóúÁÉÍÓÚñÑ]+|[^a-zA-ZáéíóúÁÉÍÓÚñÑ]+$/g, '').length
  const orpIdx = cleanLen > 0 ? Math.floor(cleanLen * 0.35) : 0

  let before = word.slice(0, orpIdx)
  let orp = ''
  let after = word.slice(orpIdx)

  // Adjust for any leading non-alpha chars (they go to "before")
  const leadingNonAlpha = word.match(/^[^a-zA-ZáéíóúÁÉÍÓÚñÑ]*/)?.[0] ?? ''
  if (leadingNonAlpha && before.startsWith(leadingNonAlpha)) {
    before = before.slice(leadingNonAlpha.length)
    orp = leadingNonAlpha + orp
  }

  // If ORP is empty but we have a word, take first letter
  if (!orp && word.length > 0) {
    orp = word[0]
    after = word.slice(1)
    before = ''
  }

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

      {/* Progress bar */}
      <div className={styles.rsvpProgressWrap}>
        <div className={styles.rsvpProgressBarWrap}>
          <div className={styles.rsvpProgressFill} style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Controls */}
      <div className={styles.rsvpControls}>
        <button className={styles.ctrlBtn} title="Inicio del párrafo (↑)">
          <div className={styles.ctrlIcon}>
            <IconRewindBackward10 size={16} />
          </div>
          <span className={styles.ctrlLabel}>inicio párr.</span>
          <span className={styles.ctrlKbd}>↑</span>
        </button>

        <button className={styles.ctrlBtn} title="-10 palabras (←)">
          <div className={styles.ctrlIcon}>
            <IconPlayerSkipBack size={16} />
          </div>
          <span className={styles.ctrlLabel}>−10 palabras</span>
          <span className={styles.ctrlKbd}>←</span>
        </button>

        <button className={styles.ctrlBtn} title="Pausa (Space)">
          <div className={`${styles.ctrlIcon} ${styles.ctrlIconPrimary}`}>
            <IconPlayerPause size={20} />
          </div>
          <span className={styles.ctrlLabel}>pausa</span>
          <span className={styles.ctrlKbd}>Space</span>
        </button>

        <button className={styles.ctrlBtn} title="+10 palabras (→)">
          <div className={styles.ctrlIcon}>
            <IconPlayerSkipForward size={16} />
          </div>
          <span className={styles.ctrlLabel}>+10 palabras</span>
          <span className={styles.ctrlKbd}>→</span>
        </button>

        <button className={styles.ctrlBtn} title="Ajustar WPM ([ ])">
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