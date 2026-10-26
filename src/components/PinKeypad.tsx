import { useCallback, useEffect, useRef, useState } from 'react'
import { t } from '@/i18n'

const DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'] as const
const DELETE_KEY = 'delete'

/** Long enough to register as a tap, short enough not to lag behind fast entry. */
const FLASH_MS = 140

interface PinKeypadProps {
  onDigit: (digit: string) => void
  onDelete: () => void
  disabled?: boolean
}

/**
 * The number pad. th-bank.css ships the press highlight as `.pin__key:before`
 * with `opacity: 0` and no `:active` rule, so the original implementation
 * toggled it from script — this flashes an `is-pressed` class instead, which
 * also covers physical-keyboard entry (see `usePinKeyboard`), something a CSS
 * `:active` rule could never reach.
 */
export function PinKeypad({ onDigit, onDelete, disabled = false }: PinKeypadProps) {
  const [pressed, setPressed] = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const flash = useCallback((key: string) => {
    setPressed(key)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setPressed(null), FLASH_MS)
  }, [])

  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), [])

  /**
   * The screens are a phone design, but a reviewer opens them on a desktop where
   * typing six digits beats clicking them. Keyboard entry flashes the same key,
   * so the feedback is identical whichever input is used.
   */
  useEffect(() => {
    if (disabled) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return
      if (/^[0-9]$/.test(event.key)) {
        flash(event.key)
        onDigit(event.key)
        return
      }
      if (event.key === 'Backspace') {
        event.preventDefault()
        flash(DELETE_KEY)
        onDelete()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [disabled, flash, onDigit, onDelete])

  const keyClass = (key: string, extra = '') =>
    `pin__key${extra}${pressed === key ? ' is-pressed' : ''}`

  return (
    <div className="pin__keys">
      {DIGITS.map(digit => (
        <button
          key={digit}
          type="button"
          className={keyClass(digit)}
          disabled={disabled}
          onPointerDown={() => flash(digit)}
          onClick={() => onDigit(digit)}
        >
          {digit}
        </button>
      ))}
      <span className="pin__key pin__key--space" />
      <button
        type="button"
        className={keyClass('0')}
        disabled={disabled}
        onPointerDown={() => flash('0')}
        onClick={() => onDigit('0')}
      >
        0
      </button>
      <button
        type="button"
        className={keyClass(DELETE_KEY, ' pin__key--del')}
        disabled={disabled}
        onPointerDown={() => flash(DELETE_KEY)}
        onClick={onDelete}
      >
        <span className="blind">{t('pin.delete')}</span>
      </button>
    </div>
  )
}

export { DELETE_KEY }
