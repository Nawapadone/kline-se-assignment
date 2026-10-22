import { createSelector } from '@reduxjs/toolkit'
import { findMainAccountEntry, secondaryAccountEntries } from '@/lib/account'
import { MAX_PIN_ATTEMPTS } from '@/lib/pin'
import type { RootState } from '.'

const selectAccountItems = (state: RootState) => state.accounts.items

/** The large card at the top of the main screen, with its position in the list. */
export const selectMainAccountEntry = createSelector([selectAccountItems], findMainAccountEntry)

/** Every other card, kept memoised so the list does not re-render on unrelated state. */
export const selectSecondaryEntries = createSelector([selectAccountItems], secondaryAccountEntries)

/** The keypad accepts nothing while the authority says the PIN is blocked. */
export const selectIsPinBlocked = (state: RootState) => state.auth.lock !== null

/** The error line only appears after a failed try, never on a fresh screen. */
export const selectShowPinError = (state: RootState) =>
  (state.auth.lock !== null || state.auth.attemptsLeft < MAX_PIN_ATTEMPTS) &&
  state.auth.status !== 'loading'
