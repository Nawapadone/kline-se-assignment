import { createSlice } from '@reduxjs/toolkit'
import { apiClient } from '@/api'
import type { User } from '@/types'
import { signedOut } from '../actions'
import { createApiThunk, GENERIC_ERROR } from '../createApiThunk'
import type { RequestStatus } from '../status'

interface UserState {
  profile: User | null
  status: RequestStatus
  error: string | null
  /** See accountsSlice: only the latest request's answer is stored. */
  requestId: string | null
}

const initialState: UserState = { profile: null, status: 'idle', error: null, requestId: null }

/** Loaded on the splash screen, then read by both the PIN and main screens. */
export const fetchUser = createApiThunk('user/fetch', () => apiClient.getUser())

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(signedOut, () => initialState)
      .addCase(fetchUser.pending, (state, action) => {
        state.status = 'loading'
        state.requestId = action.meta.requestId
        state.error = null
      })
      .addCase(fetchUser.fulfilled, (state, action) => {
        if (action.meta.requestId !== state.requestId) return
        state.requestId = null
        state.status = 'succeeded'
        state.profile = action.payload
      })
      .addCase(fetchUser.rejected, (state, action) => {
        if (action.meta.requestId !== state.requestId) return
        state.requestId = null
        state.status = 'failed'
        state.error = action.payload ?? GENERIC_ERROR
      })
  },
})

export default userSlice.reducer
