import type { Account, Banner, DebitCard, RecentTransaction, User } from '@/types'
import accounts from './accounts.json'
import banners from './banners.json'
import debitCards from './debit-cards.json'
import transactions from './transactions.json'
import user from './user.json'

/**
 * The fixtures are plain `.json` so they read exactly like the payloads in
 * api-specs.md — the one place a backend response is described. TypeScript
 * widens `type` to `string` when importing JSON, so this module is the single
 * boundary where the raw data is asserted into the domain types; everything
 * downstream is fully typed.
 */
export const mockUser = user as User
export const mockAccounts = accounts as Account[]
export const mockTransactions = transactions as RecentTransaction[]
export const mockDebitCards = debitCards as DebitCard[]
export const mockBanners = banners as Banner[]
