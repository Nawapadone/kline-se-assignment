/** Currency symbols the design shows; anything else falls back to its ISO code. */
const CURRENCY_SYMBOL: Record<string, string> = { THB: '฿' }

const DECIMAL = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

/**
 * `฿62,000.00` — grouped thousands, always two decimals.
 *
 * Built from a plain number format plus a symbol table rather than
 * `Intl.NumberFormat`'s `style: 'currency'`, because that leaves symbol
 * placement and spacing up to the runtime's locale data ("THB 62,000.00" under
 * en-US), and the design pins the symbol tight against the digits.
 *
 * Note: bank_main.html renders account 2 as `฿300.100`, which is the amount
 * `300.10` with a misplaced separator. This returns `฿300.10`.
 */
export function formatAmount(amount: number, currency: string): string {
  const symbol = CURRENCY_SYMBOL[currency] ?? `${currency} `
  return `${symbol}${DECIMAL.format(amount)}`
}
