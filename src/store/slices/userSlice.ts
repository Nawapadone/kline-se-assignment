import { createSlice } from '@reduxjs/toolkit'
import { apiClient } from '@/api'
import type { User } from '@/types'
import { createApiThunk, GENERIC_ERROR } from '../createApiThunk'
import type { RequestStatus } from '../status'

interface UserState {
  profile: User | null
  status: RequestStatus
  error: string | null
}

const initialState: UserState = { profile: null, status: 'idle', error: null }

/** Loaded on the splash screen, then read by both the PIN and main screens. */
export const fetchUser = createApiThunk('user/fetch', () => apiClient.getUser())

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(fetchUser.pending, state => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchUser.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.profile = action.payload
      })
      .addCase(fetchUser.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload ?? GENERIC_ERROR
      })
  },
})

export default userSlice.reducer
