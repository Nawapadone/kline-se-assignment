import { useId } from 'react'
import { t, type MessageKey } from '@/i18n'
import {
  accountAction,
  accountIssuerLine,
  accountNumberLine,
  accountTitle,
  type AccountAction,
} from '@/lib/account'
import { formatAmount } from '@/lib/money'
import type { Account } from '@/types'
import { AccountGauge } from './AccountGauge'
import { AccountMenu } from './AccountMenu'
import { InertLink } from './InertLink'

/** The corner button th-bank.css draws for each action. */
const ACTION_LABEL: Record<AccountAction, MessageKey> = {
  money: 'account.addMoney',
  disburse: 'account.disburse',
  pay: 'account.pay',
}

/** "Disbursement" renders with a padlock; every other flag is a plain badge. */
const LOCK_FLAG = 'Disbursement'

interface SecondaryAccountCardProps {
  account: Account
  isMenuOpen: boolean
  onToggleMenu: () => void
  onSetMainAccount: () => void
  onCopyAccountNumber: () => void
}

export function SecondaryAccountCard({
  account,
  isMenuOpen,
  onToggleMenu,
  onSetMainAccount,
  onCopyAccountNumber,
}: SecondaryAccountCardProps) {
  const action = accountAction(account)
  const issuerLine = accountIssuerLine(account)
  const menuId = useId()

  return (
    <div className="main-acc is-small" style={{ backgroundColor: account.color }}>
      <div className="main-acc__top">
        <h2 className="main-acc__name">{accountTitle(account)}</h2>
        <span className="main-acc__amount">{formatAmount(account.amount, account.currency)}</span>
        {account.flags?.map(flag => (
          <span
            key={flag}
            className={flag === LOCK_FLAG ? 'main-acc__flag main-acc__flag--lock' : 'main-acc__flag'}
          >
            {flag}
          </span>
        ))}
      </div>

      <div className="main-acc__bottom">
        <span className="main-acc__detail">{accountNumberLine(account)}</span>
        {issuerLine && <span className="main-acc__detail">{issuerLine}</span>}
      </div>

      <button
        type="button"
        className="main-acc__more main-acc__more--small"
        aria-expanded={isMenuOpen}
        aria-controls={menuId}
        onClick={onToggleMenu}
      >
        <span className="blind">{t('account.moreActionFor', { account: accountTitle(account) })}</span>
      </button>
      <AccountMenu
        id={menuId}
        isOpen={isMenuOpen}
        variant="sub"
        onSetMainAccount={onSetMainAccount}
        onCopyAccountNumber={onCopyAccountNumber}
      />

      {account.progress !== undefined && <AccountGauge progress={account.progress} />}

      {action && (
        <InertLink className={`main-acc__act main-acc__act--${action}`}>
          <span className="blind">{t(ACTION_LABEL[action])}</span>
        </InertLink>
      )}
    </div>
  )
}
