import type { Account, Banner, DebitCard, PinLock, RecentTransaction, User } from '@/types'

export interface VerifyPinPayload {
  pin: string
}

export interface VerifyPinResult {
  success: boolean
  /** Attempts left in this round; absent once the PIN is accepted or blocked. */
  attemptsLeft?: number
  /**
   * Set when the PIN cannot be tried at all. The authority decides this — a
   * disabled keypad is a convenience, not a control — so it is returned even for
   * a PIN that would otherwise be correct.
   */
  lock?: PinLock
}

/**
 * The contract both clients implement. Screens and thunks depend on this
 * interface only, so swapping mock for a real backend is one env variable
 * (`VITE_USE_MOCK`) and touches no feature code.
 */
export interface ApiClient {
  getUser(): Promise<User>
  getAccounts(): Promise<Account[]>
  getRecentTransactions(): Promise<RecentTransaction[]>
  getDebitCards(): Promise<DebitCard[]>
  getBanners(): Promise<Banner[]>
  /**
   * Not in api-specs.md: the PIN screen needs an authority to check against, so
   * both clients expose one. The mock compares against `VITE_DEMO_PIN`; the real
   * client posts to `/api/auth/pin`.
   */
  verifyPin(payload: VerifyPinPayload): Promise<VerifyPinResult>
}
