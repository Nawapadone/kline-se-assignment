import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { apiClient } from '@/api'
import { toErrorMessage } from '@/lib/load-error'
import type { Banner, DebitCard, RecentTransaction } from '@/types'
import { signedOut } from '../actions'
import { endSessionIfExpired, GENERIC_ERROR, sessionOf } from '../createApiThunk'
import type { RequestStatus } from '../status'

interface DashboardState {
  recentTransactions: RecentTransaction[]
  debitCards: DebitCard[]
  banners: Banner[]
  status: RequestStatus
  /** Set when at least one list failed, even if the others arrived. */
  error: string | null
  /** See accountsSlice: only the latest request's answer is stored. */
  requestId: string | null
}

const initialState: DashboardState = {
  recentTransactions: [],
  debitCards: [],
  banners: [],
  status: 'idle',
  error: null,
  requestId: null,
}

/**
 * The three read-only lists below the main account are fetched in one round
 * rather than three waterfalls, and with `allSettled` rather than `all`: they do
 * not depend on each other, so one failing endpoint must not discard the two
 * that answered. Whatever arrived is kept and the screen says something is
 * missing — which is why this thunk resolves on a partial failure instead of
 * rejecting, and classifies the error itself.
 */
/** Guards the lists against a backend that answers with something other than an array. */
const asArray = <T,>(result: PromiseSettledResult<T[]>): T[] =>
  result.status === 'fulfilled' && Array.isArray(result.value) ? result.value : []

export const fetchDashboard = createAsyncThunk('dashboard/fetch', async (_, { dispatch, getState }) => {
  const startedIn = sessionOf(getState)
  const [transactions, cards, banners] = await Promise.allSettled([
    apiClient.getRecentTransactions(),
    apiClient.getDebitCards(),
    apiClient.getBanners(),
  ])
  const failures = [transactions, cards, banners].filter(result => result.status === 'rejected')
  for (const { reason } of failures) endSessionIfExpired(reason, dispatch, getState, startedIn)

  return {
    recentTransactions: asArray(transactions),
    debitCards: asArray(cards),
    banners: asArray(banners),
    error: failures.length ? toErrorMessage(failures[0].reason) : null,
  }
})

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(signedOut, () => initialState)
      .addCase(fetchDashboard.pending, (state, action) => {
        state.status = 'loading'
        state.requestId = action.meta.requestId
        state.error = null
      })
      .addCase(fetchDashboard.rejected, (state, action) => {
        if (action.meta.requestId !== state.requestId) return
        state.requestId = null
        // allSettled swallows every request failure, so only a bug in the thunk
        // body lands here — without this case the screen would wait forever.
        state.status = 'failed'
        state.error = GENERIC_ERROR
      })
      .addCase(fetchDashboard.fulfilled, (state, action) => {
        if (action.meta.requestId !== state.requestId) return
        state.requestId = null
        state.recentTransactions = action.payload.recentTransactions
        state.debitCards = action.payload.debitCards
        state.banners = action.payload.banners
        state.error = action.payload.error
        state.status = action.payload.error ? 'failed' : 'succeeded'
      })
  },
})

export default dashboardSlice.reducer
