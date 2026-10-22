const GROUP_SIZE = 4
const VISIBLE_LEADING = 6
const VISIBLE_TRAILING = 4
const MASK = '•'

/**
 * `9440 7841 2222 3115` -> `9440 78•• •••• 3115`, the masking bank_main.html
 * shows. Only the issuer prefix and the last four digits stay readable; a full
 * card number must never reach the screen.
 */
export function maskCardNumber(cardNumber: string): string {
  const digits = cardNumber.replace(/\D/g, '')
  if (digits.length === 0) return cardNumber

  // A number too short to keep a readable prefix is masked down to the last
  // four rather than returned untouched: failing open here would print the very
  // thing this function exists to hide.
  if (digits.length <= VISIBLE_LEADING + VISIBLE_TRAILING) {
    // Only reveal the trailing four when there is something in front of them to
    // hide; four digits on their own are the whole number.
    const visible = digits.length > VISIBLE_TRAILING ? VISIBLE_TRAILING : 0
    return MASK.repeat(digits.length - visible) + digits.slice(digits.length - visible)
  }

  const masked =
    digits.slice(0, VISIBLE_LEADING) +
    MASK.repeat(digits.length - VISIBLE_LEADING - VISIBLE_TRAILING) +
    digits.slice(-VISIBLE_TRAILING)

  return masked.match(new RegExp(`.{1,${GROUP_SIZE}}`, 'g'))?.join(' ') ?? masked
}

/**
 * `in-progress` -> `In progress`. The payload mixes slug and display casing
 * ("in-progress" alongside "Active"), so both are normalised the same way.
 */
export function formatCardStatus(status: string): string {
  const words = status.replace(/[-_]/g, ' ').trim().toLowerCase()
  return words.charAt(0).toUpperCase() + words.slice(1)
}

/** A card only shows its number once it has been issued. */
export function isCardActive(status: string): boolean {
  return formatCardStatus(status) === 'Active'
}
