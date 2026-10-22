import type { Account, AccountType } from '@/types'

/** Fallback titles for accounts the API serves without a `name`. */
const TYPE_LABEL: Record<AccountType, string> = {
  'saving-account': 'Saving Account',
  'credit-loan': 'Credit Loan',
  'goal-saving-account': 'Goal Saving Account',
}

/** The product line printed above the account number on every card. */
const TYPE_PRODUCT: Record<AccountType, string> = {
  'saving-account': 'Smart account',
  'credit-loan': 'Credit Loan',
  'goal-saving-account': 'Goal driven savings',
}

/** The flag that turns a loan from "draw it down" into "pay it back". */
const OVERDUE_FLAG = 'Overdue'

/** Which call-to-action sits in the corner of a secondary card, if any. */
export type AccountAction = 'money' | 'disburse' | 'pay'

/**
 * api-specs.md has no `name`, but the design titles two cards "Travel New York"
 * and "Need to repay" — values no rule can derive from `type`. So a name is used
 * when the payload carries one, and a type label covers a backend that sends none.
 */
export function accountTitle(account: Account): string {
  return account.name ?? TYPE_LABEL[account.type]
}

/** `Smart account 568-2-81740-9` — the product name followed by the account number. */
export function accountNumberLine(account: Account): string {
  return `${TYPE_PRODUCT[account.type]} ${account.accountNumber}`
}

/**
 * Loans in the design show no issuer line, savings and goals do — matching
 * bank_main.html, where only the Credit Loan cards omit "Powered by".
 */
export function accountIssuerLine(account: Account): string | null {
  return account.type === 'credit-loan' ? null : `Powered by ${account.issuer}`
}

/**
 * A savings account can take a deposit; a loan is drawn down until it falls
 * overdue, at which point the action becomes repayment. Goal accounts show their
 * gauge instead of a button.
 */
export function accountAction(account: Account): AccountAction | null {
  switch (account.type) {
    case 'saving-account':
      return 'money'
    case 'credit-loan':
      return account.flags?.includes(OVERDUE_FLAG) ? 'pay' : 'disburse'
    case 'goal-saving-account':
      return null
  }
}

/**
 * An account together with its position in the fetched list.
 *
 * api-specs.md gives accounts no id, and the mock data proves a composite key
 * will not do either: two credit loans share one account number, so matching on
 * number and type selects both. Position in the payload is the only identity
 * available, so it is what the UI keys and targets by.
 */
export interface AccountEntry {
  account: Account
  index: number
}

const toEntries = (accounts: Account[]): AccountEntry[] =>
  accounts.map((account, index) => ({ account, index }))

/** The card rendered large at the top of the main screen. */
export function findMainAccountEntry(accounts: Account[]): AccountEntry | undefined {
  return toEntries(accounts).find(entry => entry.account.isMainAccount)
}

/** Everything below it, in payload order. */
export function secondaryAccountEntries(accounts: Account[]): AccountEntry[] {
  return toEntries(accounts).filter(entry => !entry.account.isMainAccount)
}

/** Promotes exactly the account at `index` and demotes every other one. */
export function withMainAccount(accounts: Account[], index: number): Account[] {
  return accounts.map((account, position) => ({
    ...account,
    isMainAccount: position === index,
  }))
}
