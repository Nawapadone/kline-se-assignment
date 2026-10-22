import { configureStore } from '@reduxjs/toolkit'
import accounts from './slices/accountsSlice'
import auth from './slices/authSlice'
import dashboard from './slices/dashboardSlice'
import user from './slices/userSlice'

export const store = configureStore({
  reducer: { user, auth, accounts, dashboard },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
