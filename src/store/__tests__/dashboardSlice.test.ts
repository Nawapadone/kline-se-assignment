import { afterEach, describe, expect, it, mock } from 'bun:test'
import type { UnknownAction } from '@reduxjs/toolkit'
import { apiClient, ApiError } from '@/api'
import { store } from '@/store'
import { signedOut } from '@/store/actions'
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

/** Everything the thunk dispatched on the last `run`, its own lifecycle actions included. */
let dispatched: UnknownAction[] = []

const run = async (
  overrides: Partial<Record<'transactions' | 'cards' | 'banners', unknown>>,
  isAuthenticated = true,
) => {
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

  dispatched = []
  const dispatch = mock((action: unknown) => void dispatched.push(action as UnknownAction))
  const state = store.getState()
  const getState = () => ({ ...state, auth: { ...state.auth, isAuthenticated } })
  await fetchDashboard()(dispatch, getState, undefined)
  // Replayed in order, as the store would: `fulfilled` only counts after its own `pending`.
  return dispatched.reduce(reducer, reducer(undefined, { type: '@@init' }))
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

  it('forgets the lists on sign-out', async () => {
    const state = await run({})
    expect(reducer(state, signedOut())).toEqual(reducer(undefined, { type: '@@init' }))
  })

  it('ends the session when a list answers 401', async () => {
    await run({ banners: new ApiError(401, '/api/banners') })
    expect(dispatched).toContainEqual(signedOut())
  })

  it('has no session to end when nobody is signed in', async () => {
    // A late 401 after sign-out would otherwise reset a PIN check in flight.
    await run({ banners: new ApiError(401, '/api/banners') }, false)
    expect(dispatched).not.toContainEqual(signedOut())
  })

  it('keeps the session when a list fails for another reason', async () => {
    await run({ banners: new ApiError(500, '/api/banners') })
    expect(dispatched).not.toContainEqual(signedOut())
  })
})

describe('dashboardSlice and late responses', () => {
  const initial = reducer(undefined, { type: '@@init' })
  const lists = (n: number) => ({
    recentTransactions: transactions.slice(0, n),
    debitCards: [],
    banners: [],
    error: null,
  })

  it('drops a response that lands after sign-out', () => {
    const state = [
      fetchDashboard.pending('A', undefined),
      signedOut(),
      fetchDashboard.fulfilled(lists(1), 'A', undefined),
    ].reduce(reducer, initial)
    expect(state).toEqual(initial)
  })

  it('lets only the newest request write', () => {
    const racing = [
      fetchDashboard.pending('A', undefined),
      fetchDashboard.pending('B', undefined),
      fetchDashboard.fulfilled(lists(1), 'A', undefined),
    ].reduce(reducer, initial)
    expect(racing.recentTransactions).toEqual([])
    expect(racing.status).toBe('loading')

    const settled = reducer(racing, fetchDashboard.fulfilled(lists(1), 'B', undefined))
    expect(settled.recentTransactions).toHaveLength(1)
    expect(settled.status).toBe('succeeded')
  })
})
