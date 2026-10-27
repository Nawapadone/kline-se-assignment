import { t } from '@/i18n'
import { PIN_LENGTH } from '@/lib/pin'

interface PinDotsProps {
  /** How many digits are entered; the rest stay hollow. */
  filled: number
}

/** The six dots above the keypad. Digits are never rendered, only their count. */
export function PinDots({ filled }: PinDotsProps) {
  return (
    <div className="pin__dots" role="status">
      <span className="blind">{t('pin.dotsLabel', { filled, total: PIN_LENGTH })}</span>
      {Array.from({ length: PIN_LENGTH }, (_, index) => (
        <span key={index} className={index < filled ? 'pin__dot is-filled' : 'pin__dot'} />
      ))}
    </div>
  )
}
