import { useEffect, useRef, useState } from 'react'
import { cooldownDeadline } from '@/lib/pin'
import type { PinLock } from '@/types'

const TICK_MS = 1000

const secondsOf = (lock: PinLock | null) => (lock?.kind === 'cooldown' ? lock.secondsRemaining : 0)

/**
 * Counts a cooldown down for display, and reports once when it reaches zero.
 *
 * The authority sets the length; this only renders it. With a backend the
 * server times the cooldown, so winding the device clock gains nothing; the
 * bundled mock times it with the device clock.
 */
export function useCooldownCountdown(lock: PinLock | null, onExpired: () => void) {
  const [remaining, setRemaining] = useState(() => secondsOf(lock))
  const [tracked, setTracked] = useState(lock)
  const deadline = useRef<{ lock: PinLock; at: number } | null>(null)

  /**
   * Reset during render, not in an effect. An effect would leave one commit
   * where a new cooldown is in state but `remaining` is still the old zero, and
   * the timer below reads that as "the wait is over" and releases the keypad the
   * instant it was blocked. Setting state while rendering this same component is
   * React's supported way to derive state from a changed input.
   */
  if (tracked !== lock) {
    setTracked(lock)
    setRemaining(secondsOf(lock))
  }

  useEffect(() => {
    if (lock?.kind !== 'cooldown') {
      deadline.current = null
      return
    }
    if (remaining <= 0) {
      onExpired()
      return
    }
    /**
     * Each tick is measured against the deadline rather than decrementing, so a
     * backgrounded tab — where browsers throttle timers to as little as one tick
     * a minute — does not leave the user waiting long past the real end of the
     * cooldown. The count catches up the moment the tab is visible again. The
     * deadline is fixed on the first tick of each lock, so later ticks keep it.
     */
    if (deadline.current?.lock !== lock) {
      // A remount with the same lock counts the full wait again: errs long, and the authority still decides.
      deadline.current = { lock, at: cooldownDeadline(lock, Date.now()) }
    }
    const { at } = deadline.current
    const timer = setTimeout(() => {
      setRemaining(Math.max(Math.ceil((at - Date.now()) / 1000), 0))
    }, TICK_MS)
    return () => clearTimeout(timer)
  }, [lock, remaining, onExpired])

  return remaining
}
