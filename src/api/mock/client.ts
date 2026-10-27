import { MAX_PIN_ATTEMPTS } from '@/lib/pin'
import type { Account, Banner, DebitCard, RecentTransaction, User } from '@/types'
import type { ApiClient, VerifyPinPayload, VerifyPinResult } from '../types'
import { mockAccounts, mockBanners, mockDebitCards, mockTransactions, mockUser } from './data'
import {
  clearLockout,
  cooldownForRound,
  EMPTY_LOCKOUT,
  MAX_COOLDOWN_ROUNDS,
  readLockout,
  writeLockout,
  type LockoutState,
} from './lockout'

/** Enough delay for the splash and the loading states to be visible without feeling slow. */
export const DEFAULT_LATENCY_MS = 300

export interface MockApiOptions {
  latencyMs?: number
  acceptedPin?: string
  /** The clock the cooldown is measured against. */
  now?: () => number
  /** Off in tests, so each one starts from a clean attempt budget. */
  persist?: boolean
}

/**
 * Serves the fixtures in `./data`, with latency so loading states are real. It
 * is read-only for account data: api-specs.md defines no endpoint that changes
 * an account, so promoting a main account stays in the Redux store and a reload
 * shows the server's own ordering again.
 *
 * The PIN attempt budget is the exception, because here the mock is the
 * authority — see `./lockout`.
 */
export class MockApiClient implements ApiClient {
  /** Attempt budget, spent rounds and the running cooldown, as a backend would hold them. */
  private lockout: LockoutState

  private readonly latencyMs: number
  private readonly acceptedPin: string
  private readonly now: () => number
  private readonly persist: boolean

  /**
   * Everything the client depends on from outside is injected, so the unit suite
   * can be deterministic: `latencyMs: 0` keeps it from sleeping, `acceptedPin`
   * stops an ambient `VITE_DEMO_PIN` — which bun loads from `.env` on its own —
   * from deciding whether the tests pass, `now` lets a test sit out a five-minute
   * cooldown without waiting for it, and `persist: false` gives each test a clean
   * attempt budget with no browser storage involved.
   */
  constructor({ latencyMs, acceptedPin, now, persist = true }: MockApiOptions = {}) {
    this.latencyMs = latencyMs ?? DEFAULT_LATENCY_MS
    this.acceptedPin = acceptedPin ?? import.meta.env.VITE_DEMO_PIN ?? '123456'
    this.now = now ?? Date.now
    this.persist = persist
    this.lockout = persist ? readLockout() : { ...EMPTY_LOCKOUT }
  }

  private delay(): Promise<unknown> {
    if (this.latencyMs === 0) return Promise.resolve()
    return new Promise(resolve => setTimeout(resolve, this.latencyMs))
  }

  private saveLockout(): void {
    if (this.persist) writeLockout(this.lockout)
  }

  async getUser(): Promise<User> {
    await this.delay()
    return { ...mockUser }
  }

  async getAccounts(): Promise<Account[]> {
    await this.delay()
    return mockAccounts.map(account => ({ ...account }))
  }

  async getRecentTransactions(): Promise<RecentTransaction[]> {
    await this.delay()
    return mockTransactions.map(transaction => ({ ...transaction }))
  }

  async getDebitCards(): Promise<DebitCard[]> {
    await this.delay()
    return mockDebitCards.map(card => ({ ...card }))
  }

  async getBanners(): Promise<Banner[]> {
    await this.delay()
    return mockBanners.map(banner => ({ ...banner }))
  }

  /**
   * Blocking is the authority's rule, not the keypad's: a disabled keypad is a
   * convenience, so this refuses even a correct PIN while a block is in force,
   * and the screen takes the remaining wait from here rather than its own clock.
   *
   * A spent round starts an escalating cooldown; the round after the last wait
   * needs the bank to lift it. Throttling before locking follows NIST SP
   * 800-63B: a lockout anyone can trigger by guessing is a denial of service.
   */
  async verifyPin({ pin }: VerifyPinPayload): Promise<VerifyPinResult> {
    await this.delay()
    // Another tab may have failed or cooled down since this client was built.
    if (this.persist) this.lockout = readLockout(this.lockout)

    if (this.lockout.spentRounds > MAX_COOLDOWN_ROUNDS) {
      return { success: false, lock: { kind: 'locked' } }
    }

    const secondsRemaining = this.cooldownSecondsRemaining()
    if (secondsRemaining > 0) {
      return { success: false, lock: { kind: 'cooldown', secondsRemaining } }
    }

    if (pin === this.acceptedPin) {
      this.lockout = { ...EMPTY_LOCKOUT }
      if (this.persist) clearLockout()
      return { success: true }
    }

    this.lockout.failedAttempts += 1
    const attemptsLeft = MAX_PIN_ATTEMPTS - this.lockout.failedAttempts
    if (attemptsLeft > 0) {
      this.saveLockout()
      return { success: false, attemptsLeft }
    }

    // The round is spent. COOLDOWN_SECONDS holds one wait per round; the round
    // after the last of them is locked until the bank lifts it.
    this.lockout.failedAttempts = 0
    this.lockout.spentRounds += 1
    if (this.lockout.spentRounds > MAX_COOLDOWN_ROUNDS) {
      this.lockout.cooldownUntil = 0
      this.saveLockout()
      return { success: false, lock: { kind: 'locked' } }
    }

    const wait = cooldownForRound(this.lockout.spentRounds)
    this.lockout.cooldownUntil = this.now() + wait * 1000
    this.saveLockout()
    return { success: false, lock: { kind: 'cooldown', secondsRemaining: wait } }
  }

  private cooldownSecondsRemaining(): number {
    if (this.lockout.cooldownUntil === 0) return 0
    const remaining = Math.ceil((this.lockout.cooldownUntil - this.now()) / 1000)
    if (remaining > 0) return remaining
    this.lockout.cooldownUntil = 0
    this.saveLockout()
    return 0
  }
}
