import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { apiClient } from '@/api'
import { withMainAccount } from '@/lib/account'
import type { Account } from '@/types'
import { createApiThunk, GENERIC_ERROR } from '../createApiThunk'
import type { RequestStatus } from '../status'

interface AccountsState {
  items: Account[]
  status: RequestStatus
  error: string | null
  /** Position of the card whose action menu is open; only one at a time. */
  openMenuIndex: number | null
}

const initialState: AccountsState = {
  items: [],
  status: 'idle',
  error: null,
  openMenuIndex: null,
}

export const fetchAccounts = createApiThunk('accounts/fetch', () => apiClient.getAccounts())

const accountsSlice = createSlice({
  name: 'accounts',
  initialState,
  reducers: {
    /**
     * Optimistic: the design gives the menu no pending state, and a real backend
     * call would be a PATCH this spec does not define.
     */
    mainAccountSet(state, action: PayloadAction<number>) {
      state.items = withMainAccount(state.items, action.payload)
      state.openMenuIndex = null
    },
    menuToggled(state, action: PayloadAction<number>) {
      state.openMenuIndex = state.openMenuIndex === action.payload ? null : action.payload
    },
    menuClosed(state) {
      state.openMenuIndex = null
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchAccounts.pending, state => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchAccounts.fulfilled, (state, action) => {
        state.status = 'succeeded'
        // A backend is not bound by api-specs.md. Anything but the documented
        // array would reach `.map` in lib/account and blank the whole screen.
        state.items = Array.isArray(action.payload) ? action.payload : []
      })
      .addCase(fetchAccounts.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload ?? GENERIC_ERROR
      })
  },
})

export const { mainAccountSet, menuToggled, menuClosed } = accountsSlice.actions
export default accountsSlice.reducer
