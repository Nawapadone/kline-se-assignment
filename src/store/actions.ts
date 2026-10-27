import { createAction } from '@reduxjs/toolkit'

/** Handled by every slice; lives outside authSlice so `createApiThunk` can dispatch it without an import cycle. */
export const signedOut = createAction('auth/signedOut')
