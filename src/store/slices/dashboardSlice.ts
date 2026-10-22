import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { apiClient } from '@/api'
import { toErrorMessage } from '@/lib/load-error'
import { GENERIC_ERROR } from '../createApiThunk'
import type { Banner, DebitCard, RecentTransaction } from '@/types'
import type { RequestStatus } from '../status'

interface DashboardState {
  recentTransactions: RecentTransaction[]
  debitCards: DebitCard[]
  banners: Banner[]
  status: RequestStatus
  /** Set when at least one list failed, even if the others arrived. */
  error: string | null
}

const initialState: DashboardState = {
  recentTransactions: [],
  debitCards: [],
  banners: [],
  status: 'idle',
  error: null,
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

export const fetchDashboard = createAsyncThunk('dashboard/fetch', async () => {
  const [transactions, cards, banners] = await Promise.allSettled([
    apiClient.getRecentTransactions(),
    apiClient.getDebitCards(),
    apiClient.getBanners(),
  ])
  const failure = [transactions, cards, banners].find(result => result.status === 'rejected')

  return {
    recentTransactions: asArray(transactions),
    debitCards: asArray(cards),
    banners: asArray(banners),
    error: failure ? toErrorMessage(failure.reason) : null,
  }
})

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(fetchDashboard.pending, state => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchDashboard.rejected, state => {
        // allSettled swallows every request failure, so only a bug in the thunk
        // body lands here — without this case the screen would wait forever.
        state.status = 'failed'
        state.error = GENERIC_ERROR
      })
      .addCase(fetchDashboard.fulfilled, (state, action) => {
        state.recentTransactions = action.payload.recentTransactions
        state.debitCards = action.payload.debitCards
        state.banners = action.payload.banners
        state.error = action.payload.error
        state.status = action.payload.error ? 'failed' : 'succeeded'
      })
  },
})

export default dashboardSlice.reducer
