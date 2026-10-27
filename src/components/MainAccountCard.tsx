import { useId } from 'react'
import { t } from '@/i18n'
import { accountIssuerLine, accountNumberLine, accountTitle } from '@/lib/account'
import { formatAmount } from '@/lib/money'
import type { Account } from '@/types'
import { AccountMenu } from './AccountMenu'
import { InertLink } from './InertLink'

interface MainAccountCardProps {
  account: Account
  isMenuOpen: boolean
  onToggleMenu: () => void
  onCopyAccountNumber: () => void
  /** First-visit hint pointing at the action menu; bank_main.html ships its markup. */
  showCoachMark?: boolean
}

/**
 * The large card at the top of the main screen, with its withdrawal / QR / add
 * money bar. Both the card and the bar take their colour from the payload —
 * th-bank.css hardcodes `#24c875` on each, which would stay green after another
 * account is promoted to main.
 */
export function MainAccountCard({
  account,
  isMenuOpen,
  onToggleMenu,
  onCopyAccountNumber,
  showCoachMark = false,
}: MainAccountCardProps) {
  const issuerLine = accountIssuerLine(account)
  const menuId = useId()

  return (
    <div
      className="main-acc main-acc--large main-loading main-loading--order3"
      style={{ backgroundColor: account.color }}
    >
      <div className="main-acc__top">
        <h2 className="main-acc__name">{accountTitle(account)}</h2>
        <span className="main-acc__amount">{formatAmount(account.amount, account.currency)}</span>
        <span className="main-acc__detail main-acc__detail--num">{accountNumberLine(account)}</span>
        {issuerLine && <span className="main-acc__detail">{issuerLine}</span>}
      </div>

      <div className="main-acc__bottom">
        <div className="main-acc__ani_box">
          <div className="main-acc__ani__item">
            <span className="main-acc__ani_img1" />
            <span className="main-acc__ani_img2" />
          </div>
          <div className="main-acc__ani__item2">
            <span className="main-acc__ani_img3" />
          </div>
        </div>
        <div className="main-acc__link__box" style={{ backgroundColor: account.color }}>
          <div className="main-acc__link__item">
            <InertLink className="main-acc__link main-acc__link--withdrawal">
              {t('account.withdrawal')}
            </InertLink>
            <InertLink className="main-acc__link main-acc__link--qr">
              {t('account.qrScan')}
            </InertLink>
            <InertLink className="main-acc__link main-acc__link--addmoney">
              {t('account.addMoney')}
            </InertLink>
          </div>
        </div>
      </div>

      <button
        type="button"
        className="main-acc__more"
        aria-expanded={isMenuOpen}
        aria-controls={menuId}
        onClick={onToggleMenu}
      >
        <span className="blind">{t('account.moreActionFor', { account: accountTitle(account) })}</span>
      </button>
      <AccountMenu id={menuId} isOpen={isMenuOpen} onCopyAccountNumber={onCopyAccountNumber} />

      {showCoachMark && !isMenuOpen && (
        <div
          className="tooltip tooltip--bubble tooltip--right-under"
          style={{ display: 'block' }}
        >
          <span className="tooltip__txt tooltip__txt--lines">{t('main.coachMark')}</span>
        </div>
      )}
    </div>
  )
}
