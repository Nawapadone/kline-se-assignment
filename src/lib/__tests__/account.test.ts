import { describe, expect, it } from 'bun:test'
import type { Account } from '@/types'
import {
  accountAction,
  accountIssuerLine,
  accountNumberLine,
  accountTitle,
  findMainAccountEntry,
  secondaryAccountEntries,
  withMainAccount,
} from '../account'

const saving: Account = {
  type: 'saving-account',
  amount: 62000,
  currency: 'THB',
  accountNumber: '568-2-81740-9',
  issuer: 'TestLab',
  color: '#24c875',
  isMainAccount: true,
}

const loan: Account = { ...saving, type: 'credit-loan', amount: 300.1, isMainAccount: false }
const overdueLoan: Account = { ...loan, name: 'Need to repay', flags: ['Disbursement', 'Overdue'] }
const goal: Account = {
  ...saving,
  type: 'goal-saving-account',
  name: 'Travel New York',
  progress: 24,
  isMainAccount: false,
}

describe('accountTitle', () => {
  it('prefers the name the payload carries', () => {
    expect(accountTitle(goal)).toBe('Travel New York')
  })

  it('falls back to a label derived from the type', () => {
    expect(accountTitle(saving)).toBe('Saving Account')
    expect(accountTitle(loan)).toBe('Credit Loan')
  })
})

describe('accountNumberLine', () => {
  it('names the product in front of the account number', () => {
    expect(accountNumberLine(saving)).toBe('Smart account 568-2-81740-9')
    expect(accountNumberLine(goal)).toBe('Goal driven savings 568-2-81740-9')
  })
})

describe('accountIssuerLine', () => {
  it('omits the issuer on loans, as the design does', () => {
    expect(accountIssuerLine(loan)).toBeNull()
    expect(accountIssuerLine(saving)).toBe('Powered by TestLab')
  })
})

describe('accountAction', () => {
  it('offers a deposit on savings', () => {
    expect(accountAction(saving)).toBe('money')
  })

  it('switches a loan from disbursement to repayment once overdue', () => {
    expect(accountAction(loan)).toBe('disburse')
    expect(accountAction(overdueLoan)).toBe('pay')
  })

  it('gives a goal account no action — it shows a gauge instead', () => {
    expect(accountAction(goal)).toBeNull()
  })
})

describe('main account selection', () => {
  const accounts = [saving, loan, goal, overdueLoan]

  it('splits the large card from the rest, keeping each position', () => {
    expect(findMainAccountEntry(accounts)).toEqual({ account: saving, index: 0 })
    expect(secondaryAccountEntries(accounts).map(entry => entry.index)).toEqual([1, 2, 3])
  })

  it('promotes exactly the account at that position', () => {
    const promoted = withMainAccount(accounts, 2)
    expect(promoted.filter(a => a.isMainAccount)).toHaveLength(1)
    expect(findMainAccountEntry(promoted)?.account.name).toBe('Travel New York')
  })

  it('demotes the previous main account', () => {
    expect(withMainAccount(accounts, 2)[0].isMainAccount).toBe(false)
  })

  it('promotes one of two accounts that share a number and a type', () => {
    // The mock data has exactly this shape, and a number+type key promoted both.
    const twins = [loan, { ...loan, name: 'Need to repay' }]
    const promoted = withMainAccount(twins, 1)
    expect(promoted.map(a => a.isMainAccount)).toEqual([false, true])
  })

  it('reports no main account when the payload flags none', () => {
    expect(findMainAccountEntry([loan, goal])).toBeUndefined()
  })
})
