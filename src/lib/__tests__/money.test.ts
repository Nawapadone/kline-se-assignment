import { describe, expect, it } from 'bun:test'
import { formatAmount } from '../money'

describe('formatAmount', () => {
  it('groups thousands and pins the baht symbol to the digits', () => {
    expect(formatAmount(62000, 'THB')).toBe('฿62,000.00')
  })

  it('always shows two decimals', () => {
    // bank_main.html prints this amount as `฿300.100`, which is wrong.
    expect(formatAmount(300.1, 'THB')).toBe('฿300.10')
    expect(formatAmount(30000, 'THB')).toBe('฿30,000.00')
  })

  it('falls back to the ISO code for currencies the design does not cover', () => {
    expect(formatAmount(1234.5, 'USD')).toBe('USD 1,234.50')
  })

  it('handles zero and negative balances', () => {
    expect(formatAmount(0, 'THB')).toBe('฿0.00')
    expect(formatAmount(-500, 'THB')).toBe('฿-500.00')
  })
})
