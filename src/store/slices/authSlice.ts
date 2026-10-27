import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { apiClient } from '@/api'
import { appendPinDigit, deletePinDigit, MAX_PIN_ATTEMPTS } from '@/lib/pin'
import type { VerifyPinResult } from '@/api/types'
import type { PinLock } from '@/types'
import { signedOut } from '../actions'
import { createApiThunk } from '../createApiThunk'
import type { RequestStatus } from '../status'

/**
 * Accepts a lock only in the two shapes the contract defines. A backend that
 * sends anything else — a misspelled `kind`, a cooldown with no seconds — would
 * otherwise reach the screen as a keypad disabled forever with "Try again in
 * NaN:NaN", which is the dead end this whole feature exists to remove. An
 * unusable lock is treated as no lock, so the attempt is simply spent.
 */
function readLock(lock: unknown): PinLock | null {
  if (!lock || typeof lock !== 'object') return null
  const candidate = lock as { kind?: unknown; secondsRemaining?: unknown }
  if (candidate.kind === 'locked') return { kind: 'locked' }
  if (
    candidate.kind === 'cooldown' &&
    typeof candidate.secondsRemaining === 'number' &&
    Number.isFinite(candidate.secondsRemaining) &&
    candidate.secondsRemaining > 0
  ) {
    return { kind: 'cooldown', secondsRemaining: candidate.secondsRemaining }
  }
  return null
}

interface AuthState {
  /** Digits entered so far — never persisted, never logged. */
  pin: string
  attemptsLeft: number
  status: RequestStatus
  isAuthenticated: boolean
  /** Why the keypad is blocked, as the authority reported it. */
  lock: PinLock | null
  /** Counts sign-ins, so a request can tell whether its session is still the open one. */
  session: number
}

const initialState: AuthState = {
  pin: '',
  attemptsLeft: MAX_PIN_ATTEMPTS,
  status: 'idle',
  isAuthenticated: false,
  lock: null,
  session: 0,
}

export const submitPin = createApiThunk('auth/submitPin', (pin: string) =>
  apiClient.verifyPin({ pin }),
)

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    digitPressed(state, action: PayloadAction<string>) {
      if (state.status === 'loading' || state.lock) return
      state.pin = appendPinDigit(state.pin, action.payload)
    },
    digitDeleted(state) {
      if (state.status === 'loading' || state.lock) return
      state.pin = deletePinDigit(state.pin)
    },
    /**
     * The screen counts the cooldown down and says so when it reaches zero. The
     * wait is not re-granted here — the authority is asked again on the next
     * attempt and will report the block if it is somehow still in force.
     */
    cooldownExpired(state) {
      if (state.lock?.kind !== 'cooldown') return
      state.lock = null
      state.attemptsLeft = MAX_PIN_ATTEMPTS
    },
  },
  extraReducers: builder => {
    builder
      /**
       * Leaving the main screen drops the session, as a banking app would. It also
       * drops the lock, which is safe because only a signed-in user can reach it
       * and a blocked user never signs in — and because the authority holds the
       * block regardless of what this store forgets.
       */
      // The counter survives, or the next sign-in would reuse the number just closed.
      .addCase(signedOut, state => ({ ...initialState, session: state.session }))
      .addCase(submitPin.pending, state => {
        state.status = 'loading'
      })
      .addCase(submitPin.fulfilled, (state, action: PayloadAction<VerifyPinResult>) => {
        state.status = 'succeeded'
        state.pin = ''
        if (action.payload.success) {
          state.isAuthenticated = true
          state.session += 1
          state.attemptsLeft = MAX_PIN_ATTEMPTS
          state.lock = null
          return
        }
        const lock = readLock(action.payload.lock)
        if (lock) {
          // A blocked PIN has no budget left to report; the lock replaces it.
          state.lock = lock
          state.attemptsLeft = 0
          return
        }
        // A backend that does not report a budget still costs the user one try.
        state.lock = null
        state.attemptsLeft = action.payload.attemptsLeft ?? Math.max(state.attemptsLeft - 1, 0)
      })
      .addCase(submitPin.rejected, state => {
        // The PIN could not be checked at all, so it does not count as a failure.
        state.status = 'failed'
        state.pin = ''
      })
  },
})

export { signedOut }
export const { digitPressed, digitDeleted, cooldownExpired } = authSlice.actions
export default authSlice.reducer
