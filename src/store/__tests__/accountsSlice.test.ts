import { describe, expect, it } from 'bun:test'
import { signedOut } from '@/store/actions'
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

// A response only counts for the request the slice is waiting on, so start one.
const waiting = reducer(undefined, fetchAccounts.pending('', undefined))
const loaded = reducer(waiting, fetchAccounts.fulfilled([saving, loan, twinLoan], '', undefined))

describe('accountsSlice', () => {
  it('stores the accounts it fetched', () => {
    expect(loaded.status).toBe('succeeded')
    expect(loaded.items).toHaveLength(3)
  })

  it('surfaces a readable message when the fetch fails', () => {
    const failed = reducer(
      waiting,
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

  it('forgets the accounts on sign-out', () => {
    const open = reducer(loaded, menuToggled(1))
    expect(reducer(open, signedOut())).toEqual(reducer(undefined, { type: '@@init' }))
  })
})

describe('accountsSlice and late responses', () => {
  const initial = reducer(undefined, { type: '@@init' })

  it('drops a response that lands after sign-out', () => {
    const state = [
      fetchAccounts.pending('A', undefined),
      signedOut(),
      fetchAccounts.fulfilled([saving], 'A', undefined),
    ].reduce(reducer, initial)
    expect(state).toEqual(initial)
  })

  it('lets only the newest request write', () => {
    const racing = [
      fetchAccounts.pending('A', undefined),
      fetchAccounts.pending('B', undefined),
      fetchAccounts.fulfilled([saving], 'A', undefined),
    ].reduce(reducer, initial)
    expect(racing.items).toEqual([])
    expect(racing.status).toBe('loading')

    const settled = reducer(racing, fetchAccounts.fulfilled([saving, loan], 'B', undefined))
    expect(settled.items).toHaveLength(2)
    expect(settled.status).toBe('succeeded')
  })
})
