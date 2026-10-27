import { env } from '@/config/env'
import type { Account, Banner, DebitCard, RecentTransaction, User } from '@/types'
import { ApiError } from './error'
import type { ApiClient, VerifyPinPayload, VerifyPinResult } from './types'

export { ApiError }

const REQUEST_TIMEOUT_MS = 15_000

/**
 * Talks to a real backend over the endpoints in api-specs.md. This project
 * ships no backend, so it is unreachable by default (`VITE_USE_MOCK` defaults to
 * on) — it exists so swapping in a server is a config change, not a rewrite.
 */
export class RealApiClient implements ApiClient {
  private async get<T>(path: string): Promise<T> {
    const res = await fetch(`${env.apiBaseUrl}${path}`, {
      headers: { Accept: 'application/json' },
      credentials: 'include',
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })
    if (!res.ok) throw new ApiError(res.status, path)
    return res.json() as Promise<T>
  }

  private async post<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${env.apiBaseUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
      credentials: 'include',
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })
    if (!res.ok) throw new ApiError(res.status, path)
    return res.json() as Promise<T>
  }

  getUser(): Promise<User> {
    return this.get<User>('/api/user')
  }

  getAccounts(): Promise<Account[]> {
    return this.get<Account[]>('/api/accounts')
  }

  getRecentTransactions(): Promise<RecentTransaction[]> {
    return this.get<RecentTransaction[]>('/api/transactions/recent')
  }

  getDebitCards(): Promise<DebitCard[]> {
    return this.get<DebitCard[]>('/api/debit-cards')
  }

  getBanners(): Promise<Banner[]> {
    return this.get<Banner[]>('/api/banners')
  }

  /** Extension to api-specs.md — the PIN screen needs a server-side check. */
  verifyPin(payload: VerifyPinPayload): Promise<VerifyPinResult> {
    return this.post<VerifyPinResult>('/api/auth/pin', payload)
  }
}
