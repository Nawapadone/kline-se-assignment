import { createAsyncThunk, type UnknownAction } from '@reduxjs/toolkit'
import { t } from '@/i18n'
import { isSessionExpired, toErrorMessage } from '@/lib/load-error'
import { signedOut } from './actions'
import type { RootState } from '.'

/**
 * Shown when a rejection somehow arrives without a classified message. Slices
 * store finished strings, which holds only because the locale is fixed per
 * build — a runtime language switch would need keys in state instead.
 */
export const GENERIC_ERROR = t('error.generic')

/**
 * The server no longer accepts the session, so end it rather than show "load
 * failed" — but only a session that exists. Before the PIN is accepted, or once
 * an earlier 401 has already signed out, another sign-out would reset the
 * profile and a PIN check in flight to `idle`: the splash refetched in a loop,
 * and the keypad unlocked mid-submit. A 401 for a request sent in an earlier
 * session says nothing about the open one, so `startedIn` must still match.
 * Every call site goes through here.
 */
export function endSessionIfExpired(
  error: unknown,
  dispatch: (action: UnknownAction) => unknown,
  getState: () => unknown,
  startedIn: number,
) {
  const { auth } = getState() as RootState
  if (isSessionExpired(error) && auth.isAuthenticated && auth.session === startedIn) {
    dispatch(signedOut())
  }
}

/** The session a request belongs to; read before it is sent. */
export const sessionOf = (getState: () => unknown) => (getState() as RootState).auth.session

/**
 * createAsyncThunk serialises a rejection, so by the time a reducer reads
 * `action.error` the ApiError (or the TypeError `fetch` throws) is gone and only
 * a plain `{ name, message }` is left — every `instanceof` check there fails.
 * Classifying the error here, where it is still the real one, and rejecting with
 * the finished message keeps that trap out of each slice.
 */
export function createApiThunk<Returned, Arg = void>(
  typePrefix: string,
  request: (arg: Arg) => Promise<Returned>,
) {
  return createAsyncThunk<Returned, Arg, { rejectValue: string }>(
    typePrefix,
    async (arg, { dispatch, getState, rejectWithValue }) => {
      const startedIn = sessionOf(getState)
      try {
        return await request(arg)
      } catch (error) {
        endSessionIfExpired(error, dispatch, getState, startedIn)
        return rejectWithValue(toErrorMessage(error))
      }
    },
  )
}
