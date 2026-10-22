/** Domain types, mirroring the payloads the team specified — see the API section of README.md. */

export type AccountType = 'saving-account' | 'credit-loan' | 'goal-saving-account'

export interface Account {
  type: AccountType
  amount: number
  currency: string
  accountNumber: string
  issuer: string
  color: string
  isMainAccount: boolean
  /** Goal accounts only: percentage saved so far, drawn as the card's gauge. */
  progress?: number
  /** Badges on the card ("Disbursement", "Overdue"). */
  flags?: string[]
  /**
   * Not in the team's API spec. The design shows per-account titles ("Travel New
   * York", "Need to repay") that cannot be derived from `type`, so the mock
   * serves this extra field and the UI falls back to a type label when it is
   * absent — see `lib/account.ts`.
   */
  name?: string
}

export interface User {
  name: string
  greetingMessage: string
}

export interface RecentTransaction {
  name: string
  image: string
  isBank: boolean
}

export interface DebitCard {
  name: string
  status: string
  issuer: string
  color: string
  borderColor?: string
  number?: string
}

export interface Banner {
  title: string
  description: string
  image: string
}

/**
 * Why a PIN cannot be entered right now.
 *
 * `cooldown` is a wait the user can sit out; `locked` needs someone at the bank.
 * Throttling first and locking only after repeated rounds follows NIST SP
 * 800-63B's guidance to rate-limit rather than lock out, since a lockout anyone
 * can trigger by guessing is itself a denial of service.
 */
export type PinLock =
  | { kind: 'cooldown'; secondsRemaining: number }
  | { kind: 'locked' }
