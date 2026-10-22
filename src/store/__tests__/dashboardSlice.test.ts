import { afterEach, describe, expect, it, mock } from 'bun:test'
import { apiClient, ApiError } from '@/api'
import reducer, { fetchDashboard } from '../slices/dashboardSlice'

/**
 * `apiClient` is a module-level singleton, so replacing its methods leaks into
 * every file that imports it. Keep the originals and put them back.
 */
const original = {
  getRecentTransactions: apiClient.getRecentTransactions,
  getDebitCards: apiClient.getDebitCards,
  getBanners: apiClient.getBanners,
}

afterEach(() => {
  Object.assign(apiClient, original)
})

const transactions = [{ name: 'Emily', image: 'x', isBank: false }]
const cards = [{ name: 'My Salary', status: 'in-progress', issuer: 'TestLab', color: '#00a1e2' }]
const banners = [{ title: 'Want some money?', description: '…', image: 'x' }]

const run = async (overrides: Partial<Record<'transactions' | 'cards' | 'banners', unknown>>) => {
  apiClient.getRecentTransactions = mock(() =>
    overrides.transactions instanceof Error
      ? Promise.reject(overrides.transactions)
      : Promise.resolve(transactions),
  )
  apiClient.getDebitCards = mock(() =>
    overrides.cards instanceof Error ? Promise.reject(overrides.cards) : Promise.resolve(cards),
  )
  apiClient.getBanners = mock(() =>
    overrides.banners instanceof Error
      ? Promise.reject(overrides.banners)
      : Promise.resolve(banners),
  )

  const dispatch = mock(() => {})
  const action = await fetchDashboard()(dispatch, () => ({}), undefined)
  return reducer(undefined, action)
}

describe('dashboardSlice', () => {
  it('keeps every list when all three answer', async () => {
    const state = await run({})
    expect(state.status).toBe('succeeded')
    expect(state.error).toBeNull()
    expect(state.debitCards).toHaveLength(1)
    expect(state.recentTransactions).toHaveLength(1)
    expect(state.banners).toHaveLength(1)
  })

  it('keeps the lists that answered when one endpoint fails', async () => {
    const state = await run({ cards: new TypeError('Failed to fetch') })

    // The point of allSettled: a failed strip must not take the rest down.
    expect(state.recentTransactions).toHaveLength(1)
    expect(state.banners).toHaveLength(1)
    expect(state.debitCards).toEqual([])
    expect(state.status).toBe('failed')
    expect(state.error).toBe('No connection. Check your network and try again.')
  })

  it('classifies the failure it reports', async () => {
    const state = await run({ banners: new ApiError(503, '/api/banners') })
    expect(state.error).toBe('The server is having trouble. Please try again.')
  })

  it('reports an error when every list fails', async () => {
    const state = await run({
      transactions: new TypeError('Failed to fetch'),
      cards: new TypeError('Failed to fetch'),
      banners: new TypeError('Failed to fetch'),
    })
    expect(state.status).toBe('failed')
    expect(state.recentTransactions).toEqual([])
  })
})
