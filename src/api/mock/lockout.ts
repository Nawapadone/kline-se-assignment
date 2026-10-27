/**
 * How long each spent round of attempts blocks the keypad, in seconds.
 *
 * Escalating rather than fixed, the way a phone passcode does it: a mistyped PIN
 * costs a minute, while someone guessing pays progressively more for the same
 * number of tries. Once the last wait has been served the PIN is locked, so this
 * list also decides how many rounds come before the lock.
 *
 * It is the authority's policy, which is why it lives with the mock client and
 * not with the screen — a real backend owns this list, not the UI.
 */
export const COOLDOWN_SECONDS = [60, 5 * 60] as const

/** Rounds that end in a wait. The round after the last one is locked for good. */
export const MAX_COOLDOWN_ROUNDS = COOLDOWN_SECONDS.length

/** The wait after `round` spent rounds, 1-based. */
export function cooldownForRound(round: number): number {
  const index = Math.min(Math.max(round, 1), COOLDOWN_SECONDS.length) - 1
  return COOLDOWN_SECONDS[index]
}

/** What the mock remembers between reloads; a backend would hold this itself. */
export interface LockoutState {
  failedAttempts: number
  spentRounds: number
  /** Epoch ms the current cooldown ends at, or 0 when none is running. */
  cooldownUntil: number
}

export const EMPTY_LOCKOUT: LockoutState = {
  failedAttempts: 0,
  spentRounds: 0,
  cooldownUntil: 0,
}

const STORAGE_KEY = 'kline.mock.lockout'

/**
 * The mock is the authority in this build, so its counters have to outlive a
 * page reload — otherwise every block is three attempts and a refresh away from
 * gone, which is exactly the hole the design exists to close. A real backend
 * keeps this server-side and this module disappears with it.
 */
export function readLockout(fallback: LockoutState = EMPTY_LOCKOUT): LockoutState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return { ...EMPTY_LOCKOUT }
    const parsed = JSON.parse(stored) as Partial<LockoutState>
    return {
      failedAttempts: Number(parsed.failedAttempts) || 0,
      spentRounds: Number(parsed.spentRounds) || 0,
      cooldownUntil: Number(parsed.cooldownUntil) || 0,
    }
  } catch {
    // Private mode, blocked storage or a corrupt value — keep what this page already
    // counted rather than throw, or every check would reset the count.
    return { ...fallback }
  }
}

export function writeLockout(state: LockoutState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Nothing to persist to; the block then lasts only for this page.
  }
}

export function clearLockout(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // As above.
  }
}
