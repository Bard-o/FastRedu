import { type ReactNode } from 'react'
import styles from './AriaLiveRegion.module.css'

interface Props {
  children: ReactNode
  /**
   * aria-live politeness setting.
   * 'polite' — announcements wait for current speech to finish (default)
   * 'assertive' — interrupts current speech immediately
   */
  politeness?: 'polite' | 'assertive'
}

/**
 * AriaLiveRegion — visually hidden wrapper for screen reader announcements.
 *
 * Used in RSVP mode to announce the current word without disturbing
 * the visual display.
 *
 * @example
 * <AriaLiveRegion>
 *   <RSVPWordDisplay word="sorprendentes" />
 * </AriaLiveRegion>
 */
export function AriaLiveRegion({
  children,
  politeness = 'polite',
}: Props): React.JSX.Element {
  return (
    <div
      className={styles.srOnly}
      aria-live={politeness}
      aria-atomic="true"
      role="status"
    >
      {children}
    </div>
  )
}