import { describe, expect, it } from 'bun:test'
import { MAX_PIN_ATTEMPTS } from '@/lib/pin'
import reducer, {
  cooldownExpired,
  digitDeleted,
  digitPressed,
  signedOut,
  submitPin,
} from '../slices/authSlice'

const initial = reducer(undefined, { type: '@@init' })

const enter = (pin: string) =>
  [...pin].reduce((state, digit) => reducer(state, digitPressed(digit)), initial)

describe('authSlice', () => {
  it('collects digits up to the PIN length', () => {
    expect(enter('123456').pin).toBe('123456')
    expect(reducer(enter('123456'), digitPressed('7')).pin).toBe('123456')
  })

  it('deletes the last digit', () => {
    expect(reducer(enter('123'), digitDeleted()).pin).toBe('12')
  })

  it('ignores presses while a PIN is being verified', () => {
    const verifying = reducer(enter('123456'), submitPin.pending('', '123456'))
    expect(reducer(verifying, digitPressed('1')).pin).toBe('123456')
  })

  it('signs in on a correct PIN and clears the digits', () => {
    const state = reducer(
      enter('123456'),
      submitPin.fulfilled({ success: true }, '', '123456'),
    )
    expect(state.isAuthenticated).toBe(true)
    expect(state.pin).toBe('')
  })

  it('spends an attempt on a wrong PIN', () => {
    const state = reducer(
      enter('000000'),
      submitPin.fulfilled({ success: false, attemptsLeft: 2 }, '', '000000'),
    )
    expect(state.isAuthenticated).toBe(false)
    expect(state.attemptsLeft).toBe(2)
    expect(state.pin).toBe('')
  })

  it('still spends an attempt when the backend reports no budget', () => {
    const state = reducer(
      enter('000000'),
      submitPin.fulfilled({ success: false }, '', '000000'),
    )
    expect(state.attemptsLeft).toBe(MAX_PIN_ATTEMPTS - 1)
  })

  it('refuses further input while the PIN is blocked', () => {
    const cooling = reducer(
      initial,
      submitPin.fulfilled(
        { success: false, lock: { kind: 'cooldown', secondsRemaining: 60 } },
        '',
        '000000',
      ),
    )
    expect(cooling.lock).toEqual({ kind: 'cooldown', secondsRemaining: 60 })
    expect(cooling.attemptsLeft).toBe(0)
    expect(reducer(cooling, digitPressed('1')).pin).toBe('')
  })

  it('grants a fresh round of attempts when the cooldown runs out', () => {
    const cooling = reducer(
      initial,
      submitPin.fulfilled(
        { success: false, lock: { kind: 'cooldown', secondsRemaining: 60 } },
        '',
        '000000',
      ),
    )
    const released = reducer(cooling, cooldownExpired())
    expect(released.lock).toBeNull()
    expect(released.attemptsLeft).toBe(MAX_PIN_ATTEMPTS)
    expect(reducer(released, digitPressed('1')).pin).toBe('1')
  })

  it('does not release a PIN that is locked, only one that is cooling down', () => {
    const locked = reducer(
      initial,
      submitPin.fulfilled({ success: false, lock: { kind: 'locked' } }, '', '000000'),
    )
    expect(reducer(locked, cooldownExpired()).lock).toEqual({ kind: 'locked' })
    expect(reducer(locked, digitPressed('1')).pin).toBe('')
  })

  it('clears a block when the right PIN is finally accepted', () => {
    const cooling = reducer(
      initial,
      submitPin.fulfilled(
        { success: false, lock: { kind: 'cooldown', secondsRemaining: 60 } },
        '',
        '000000',
      ),
    )
    const signedIn = reducer(cooling, submitPin.fulfilled({ success: true }, '', '123456'))
    expect(signedIn.lock).toBeNull()
    expect(signedIn.attemptsLeft).toBe(MAX_PIN_ATTEMPTS)
  })

  it('does not charge an attempt when the check itself failed', () => {
    const state = reducer(enter('123456'), submitPin.rejected(new Error('offline'), '', '123456'))
    expect(state.attemptsLeft).toBe(MAX_PIN_ATTEMPTS)
    expect(state.status).toBe('failed')
    expect(state.pin).toBe('')
  })

  it('lets a lock replace a running cooldown, and will not release it', () => {
    const cooling = reducer(
      initial,
      submitPin.fulfilled(
        { success: false, lock: { kind: 'cooldown', secondsRemaining: 60 } },
        '',
        '000000',
      ),
    )
    const locked = reducer(
      cooling,
      submitPin.fulfilled({ success: false, lock: { kind: 'locked' } }, '', '000000'),
    )
    expect(locked.lock).toEqual({ kind: 'locked' })
    expect(reducer(locked, cooldownExpired()).lock).toEqual({ kind: 'locked' })
  })

  it('ignores a lock the contract does not define, and spends the attempt', () => {
    // A keypad disabled forever with "Try again in NaN:NaN" is the dead end this
    // feature removed; a malformed payload must not put it back.
    const malformed = [
      { kind: 'cooldown' },
      { kind: 'cooldown', secondsRemaining: 'soon' },
      { kind: 'cooldown', secondsRemaining: Number.NaN },
      { kind: 'cooldown', secondsRemaining: 0 },
      { kind: 'COOLDOWN', secondsRemaining: 60 },
      { kind: 'banned' },
      'locked',
      {},
    ]
    for (const lock of malformed) {
      const state = reducer(
        initial,
        submitPin.fulfilled({ success: false, lock } as never, '', '000000'),
      )
      expect(state.lock).toBeNull()
      expect(state.attemptsLeft).toBe(MAX_PIN_ATTEMPTS - 1)
    }
  })

  it('refuses a digit, and a delete, while blocked', () => {
    const cooling = reducer(
      initial,
      submitPin.fulfilled(
        { success: false, lock: { kind: 'cooldown', secondsRemaining: 60 } },
        '',
        '000000',
      ),
    )
    expect(reducer(cooling, digitPressed('1')).pin).toBe('')
    expect(reducer(cooling, digitDeleted()).pin).toBe('')
  })

  it('drops the lock on sign-out, which only a signed-in user can reach', () => {
    const cooling = reducer(
      initial,
      submitPin.fulfilled(
        { success: false, lock: { kind: 'cooldown', secondsRemaining: 60 } },
        '',
        '000000',
      ),
    )
    // Safe because a blocked user never signs in, and the authority keeps the
    // block regardless of what this store forgets.
    expect(reducer(cooling, signedOut()).lock).toBeNull()
  })

  it('drops the whole session on sign-out', () => {
    const signedIn = reducer(initial, submitPin.fulfilled({ success: true }, '', '123456'))
    expect(reducer(signedIn, signedOut()).isAuthenticated).toBe(false)
  })
})
