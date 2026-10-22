import { describe, expect, it } from 'bun:test'
import {
  appendPinDigit,
  deletePinDigit,
  formatCountdown,
  isPinComplete,
  PIN_LENGTH,
  pinErrorLines,
} from '../pin'

describe('appendPinDigit', () => {
  it('adds a digit', () => {
    expect(appendPinDigit('12', '3')).toBe('123')
  })

  it('ignores presses past the sixth digit', () => {
    expect(appendPinDigit('123456', '7')).toBe('123456')
  })

  it('ignores anything that is not a single digit', () => {
    expect(appendPinDigit('12', 'a')).toBe('12')
    expect(appendPinDigit('12', '')).toBe('12')
  })
})

describe('deletePinDigit', () => {
  it('drops the last digit', () => {
    expect(deletePinDigit('123')).toBe('12')
  })

  it('is a no-op on an empty PIN', () => {
    expect(deletePinDigit('')).toBe('')
  })
})

describe('isPinComplete', () => {
  it('is true at exactly the template dot count', () => {
    expect(PIN_LENGTH).toBe(6)
    expect(isPinComplete('12345')).toBe(false)
    expect(isPinComplete('123456')).toBe(true)
  })
})

describe('formatCountdown', () => {
  it('reads as a countdown, with seconds always two digits', () => {
    expect(formatCountdown(59)).toBe('0:59')
    expect(formatCountdown(60)).toBe('1:00')
    expect(formatCountdown(5 * 60)).toBe('5:00')
    expect(formatCountdown(15 * 60 + 9)).toBe('15:09')
  })

  it('rounds a part-second up, so it never shows 0:00 while time is left', () => {
    expect(formatCountdown(0.4)).toBe('0:01')
  })

  it('never goes negative', () => {
    expect(formatCountdown(-5)).toBe('0:00')
  })
})

describe('pinErrorLines', () => {
  it('reproduces the message in pin.html', () => {
    expect(pinErrorLines({ attemptsLeft: 3, lock: null, secondsRemaining: 0 })).toEqual([
      'Invalid PIN Code.',
      'You have 3 attempts left.',
    ])
  })

  it('uses the singular on the last attempt', () => {
    expect(pinErrorLines({ attemptsLeft: 1, lock: null, secondsRemaining: 0 })).toEqual([
      'Invalid PIN Code.',
      'You have 1 attempt left.',
    ])
  })

  it('tells the user how long is left, as the screen counts it', () => {
    expect(
      pinErrorLines({
        attemptsLeft: 0,
        lock: { kind: 'cooldown', secondsRemaining: 60 },
        secondsRemaining: 7,
      }),
    ).toEqual(['Too many incorrect attempts.', 'Try again in 0:07.'])
  })

  it('sends the user to the call centre once the PIN is locked', () => {
    expect(pinErrorLines({ attemptsLeft: 0, lock: { kind: 'locked' }, secondsRemaining: 0 })).toEqual([
      'Your PIN is locked.',
      'Please contact our call centre to unlock it.',
    ])
  })

  it('reports the lock even when a stale attempt count is still around', () => {
    // The lock replaces the budget; it must never read "You have 2 attempts left".
    expect(
      pinErrorLines({ attemptsLeft: 2, lock: { kind: 'locked' }, secondsRemaining: 0 })[0],
    ).toBe('Your PIN is locked.')
  })
})
