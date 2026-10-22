import type { PinLock } from '@/types'

/** Six dots in pin.html and in design.jpg. */
export const PIN_LENGTH = 6

/** "You have 3 attempt left." in pin.html sets the budget for one round. */
export const MAX_PIN_ATTEMPTS = 3

/** `0:59`, `5:00`, `15:00` — minutes and seconds, as a countdown reads. */
export function formatCountdown(totalSeconds: number): string {
  const seconds = Math.max(Math.ceil(totalSeconds), 0)
  const minutes = Math.floor(seconds / 60)
  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`
}

interface PinMessageState {
  attemptsLeft: number
  lock: PinLock | null
  /**
   * Seconds left in a cooldown. The screen owns the countdown, so this is the
   * only source for it — the value the authority first sent is already stale by
   * the time the second tick renders.
   */
  secondsRemaining: number
}

/**
 * The two lines of `.pin__dsc`, which the template renders split by a `<br>`.
 * Returned as an array so the component decides the markup.
 */
export function pinErrorLines({
  attemptsLeft,
  lock,
  secondsRemaining,
}: PinMessageState): [string, string] {
  if (lock?.kind === 'locked') {
    return ['Your PIN is locked.', 'Please contact our call centre to unlock it.']
  }
  if (lock?.kind === 'cooldown') {
    return ['Too many incorrect attempts.', `Try again in ${formatCountdown(secondsRemaining)}.`]
  }
  const plural = attemptsLeft === 1 ? 'attempt' : 'attempts'
  return ['Invalid PIN Code.', `You have ${attemptsLeft} ${plural} left.`]
}

/** Ignores extra presses once six digits are in — the keypad submits at that point. */
export function appendPinDigit(pin: string, digit: string): string {
  if (pin.length >= PIN_LENGTH) return pin
  if (!/^[0-9]$/.test(digit)) return pin
  return pin + digit
}

export function deletePinDigit(pin: string): string {
  return pin.slice(0, -1)
}

export function isPinComplete(pin: string): boolean {
  return pin.length === PIN_LENGTH
}
