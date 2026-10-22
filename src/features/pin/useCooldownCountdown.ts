import { useEffect, useRef, useState } from 'react'
import type { PinLock } from '@/types'

const TICK_MS = 1000

const secondsOf = (lock: PinLock | null) => (lock?.kind === 'cooldown' ? lock.secondsRemaining : 0)

/**
 * Counts a cooldown down for display, and reports once when it reaches zero.
 *
 * The authority sets the length; this only renders it. A user who winds their
 * device clock forward gains nothing, because the next attempt is checked
 * server-side either way.
 */
export function useCooldownCountdown(lock: PinLock | null, onExpired: () => void) {
  const deadline = useRef(0)
  const [remaining, setRemaining] = useState(() => secondsOf(lock))
  const tracked = useRef(lock)

  /**
   * Reset during render, not in an effect. An effect would leave one commit
   * where a new cooldown is in state but `remaining` is still the old zero, and
   * the timer below reads that as "the wait is over" and releases the keypad the
   * instant it was blocked. Setting state while rendering this same component is
   * React's supported way to derive state from a changed input.
   */
  if (tracked.current !== lock) {
    tracked.current = lock
    const seconds = secondsOf(lock)
    deadline.current = seconds > 0 ? Date.now() + seconds * 1000 : 0
    setRemaining(seconds)
  }

  useEffect(() => {
    if (lock?.kind !== 'cooldown') return
    if (remaining <= 0) {
      onExpired()
      return
    }
    /**
     * Each tick is measured against the deadline rather than decrementing, so a
     * backgrounded tab — where browsers throttle timers to as little as one tick
     * a minute — does not leave the user waiting long past the real end of the
     * cooldown. The count catches up the moment the tab is visible again.
     */
    const timer = setTimeout(() => {
      setRemaining(Math.max(Math.ceil((deadline.current - Date.now()) / 1000), 0))
    }, TICK_MS)
    return () => clearTimeout(timer)
  }, [lock, remaining, onExpired])

  return remaining
}
