import { createAsyncThunk } from '@reduxjs/toolkit'
import { t } from '@/i18n'
import { toErrorMessage } from '@/lib/load-error'

/**
 * Shown when a rejection somehow arrives without a classified message. Slices
 * store finished strings, which holds only because the locale is fixed per
 * build — a runtime language switch would need keys in state instead.
 */
export const GENERIC_ERROR = t('error.generic')

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
    async (arg, { rejectWithValue }) => {
      try {
        return await request(arg)
      } catch (error) {
        return rejectWithValue(toErrorMessage(error))
      }
    },
  )
}
