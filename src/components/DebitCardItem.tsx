import { t } from '@/i18n'
import { formatCardStatus, isCardActive, maskCardNumber } from '@/lib/card'
import type { DebitCard } from '@/types'

interface DebitCardItemProps {
  card: DebitCard
}

/**
 * One card in the horizontal strip. A white card needs a border to separate it
 * from the page, which th-bank.css reads from the `--border-color` custom
 * property; the payload supplies it per card.
 */
export function DebitCardItem({ card }: DebitCardItemProps) {
  const active = isCardActive(card.status)
  const style = {
    backgroundColor: card.color,
    ...(card.borderColor ? { color: '#97999e', '--border-color': card.borderColor } : {}),
  } as React.CSSProperties

  return (
    <a href="#" className="debit-swipe__item" style={style}>
      <strong className="debit-swipe__name">{card.name}</strong>
      {active && card.number ? (
        <span className="debit-swipe__etc debit-swipe__etc--active">
          <span className="debit-swipe__etc__num">{maskCardNumber(card.number)}</span>
        </span>
      ) : (
        <span className="debit-swipe__etc">{formatCardStatus(card.status)}</span>
      )}
      <span
        className="debit-swipe__issue"
        style={card.borderColor ? { color: '#d3d3d2' } : undefined}
      >
        {t('card.issuedBy', { issuer: card.issuer })}
      </span>
    </a>
  )
}
