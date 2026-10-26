import { t } from '@/i18n'

/**
 * The only loading affordance th-bank.css ships is `.loader`, the splash
 * spinner. Reusing it keeps a waiting screen recognisable instead of inventing a
 * skeleton the design never specified.
 */
export function Loading({ label = t('common.loading') }: { label?: string }) {
  return (
    <div className="loading-block">
      <div className="loader" role="status" aria-label={label} />
    </div>
  )
}
