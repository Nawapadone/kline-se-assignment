import { describe, expect, it } from 'bun:test'
import { createT, type MessageKey } from '..'
import { en } from '../en'
import { th } from '../th'

const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map(match => match[1]).sort()

describe('createT', () => {
  it('returns the message for the locale', () => {
    expect(createT('en')('common.tryAgain')).toBe('Try again')
    expect(createT('th')('common.tryAgain')).toBe('ลองอีกครั้ง')
  })

  it('fills named placeholders', () => {
    expect(createT('en')('card.issuedBy', { issuer: 'TestLab' })).toBe('Issued by TestLab')
    expect(createT('th')('pin.dotsLabel', { filled: 2, total: 6 })).toBe('ใส่แล้ว 2 จาก 6 หลัก')
  })

  it('leaves a placeholder visible when its param is missing', () => {
    expect(createT('en')('card.issuedBy')).toBe('Issued by {issuer}')
  })

  it('renders an unknown key as the key itself', () => {
    expect(createT('en')('nope' as MessageKey)).toBe('nope')
  })
})

describe('th dictionary', () => {
  const keys = Object.keys(en) as MessageKey[]

  it.each(keys)('translates %s', key => {
    expect(th[key].trim()).not.toBe('')
  })

  // tsc catches a missing key but not a translation that drops `{count}`.
  it.each(keys)('keeps the placeholders of %s', key => {
    expect(placeholders(th[key])).toEqual(placeholders(en[key]))
  })
})
