import { describe, expect, it } from 'bun:test'
import type { Account } from '@/types'
import reducer, {
  fetchAccounts,
  mainAccountSet,
  menuClosed,
  menuToggled,
} from '../slices/accountsSlice'

const saving: Account = {
  type: 'saving-account',
  amount: 62000,
  currency: 'THB',
  accountNumber: '568-2-81740-9',
  issuer: 'TestLab',
  color: '#24c875',
  isMainAccount: true,
}
const loan: Account = { ...saving, type: 'credit-loan', isMainAccount: false }
/** Same type, same account number as `loan` — the mock data really is like this. */
const twinLoan: Account = { ...loan, name: 'Need to repay', flags: ['Overdue'] }

const loaded = reducer(
  undefined,
  fetchAccounts.fulfilled([saving, loan, twinLoan], '', undefined),
)

describe('accountsSlice', () => {
  it('stores the accounts it fetched', () => {
    expect(loaded.status).toBe('succeeded')
    expect(loaded.items).toHaveLength(3)
  })

  it('surfaces a readable message when the fetch fails', () => {
    const failed = reducer(
      undefined,
      fetchAccounts.rejected(
        new TypeError('fetch failed'),
        '',
        undefined,
        'No connection. Check your network and try again.',
      ),
    )
    expect(failed.status).toBe('failed')
    expect(failed.error).toBe('No connection. Check your network and try again.')
  })

  it('moves the main flag to the chosen account only', () => {
    const state = reducer(loaded, mainAccountSet(2))
    expect(state.items.map(a => a.isMainAccount)).toEqual([false, false, true])
  })

  it('opens one action menu at a time', () => {
    const open = reducer(loaded, menuToggled(0))
    expect(open.openMenuIndex).toBe(0)

    const switched = reducer(open, menuToggled(1))
    expect(switched.openMenuIndex).toBe(1)

    expect(reducer(switched, menuToggled(1)).openMenuIndex).toBeNull()
    expect(reducer(switched, menuClosed()).openMenuIndex).toBeNull()
  })

  it('opens the menu of one twin loan without opening the other', () => {
    const open = reducer(loaded, menuToggled(1))
    expect(open.openMenuIndex).toBe(1)
    expect(open.openMenuIndex).not.toBe(2)
  })

  it('closes the menu after setting a main account', () => {
    const open = reducer(loaded, menuToggled(1))
    expect(reducer(open, mainAccountSet(1)).openMenuIndex).toBeNull()
  })
})
