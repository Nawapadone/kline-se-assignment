import { describe, expect, it } from 'bun:test'
import { formatCardStatus, isCardActive, maskCardNumber } from '../card'

describe('maskCardNumber', () => {
  it('masks the middle digits exactly as bank_main.html shows', () => {
    expect(maskCardNumber('9440 7841 2222 3115')).toBe('9440 78•• •••• 3115')
  })

  it('accepts an unspaced number', () => {
    expect(maskCardNumber('9440784122223115')).toBe('9440 78•• •••• 3115')
  })

  it('still hides a number too short to keep a readable prefix', () => {
    // Returning it untouched would print exactly what this function hides.
    expect(maskCardNumber('9440 7841')).toBe('••••7841')
  })

  it('masks a short number completely, since there is no prefix to hide', () => {
    expect(maskCardNumber('1234')).toBe('••••')
    expect(maskCardNumber('7')).toBe('•')
  })

  it('passes a value with no digits through', () => {
    expect(maskCardNumber('')).toBe('')
  })
})

describe('formatCardStatus', () => {
  it('turns a slug into a sentence', () => {
    expect(formatCardStatus('in-progress')).toBe('In progress')
  })

  it('normalises an already-displayable status', () => {
    expect(formatCardStatus('Active')).toBe('Active')
  })
})

describe('isCardActive', () => {
  it('is true only once the card is issued', () => {
    expect(isCardActive('Active')).toBe(true)
    expect(isCardActive('in-progress')).toBe(false)
  })
})
