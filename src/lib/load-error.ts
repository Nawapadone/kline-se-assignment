import { ApiError } from '@/api'
import { t } from '@/i18n'

/**
 * Turns whatever a client rejected with into a line a screen can show. Status is
 * worth distinguishing: a 404 means the endpoint is not there yet, a 5xx means
 * the server is down, and a `TypeError` from `fetch` means it was never reached.
 */
export function toErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 404) return t('error.notAvailable')
    if (error.status >= 500) return t('error.server')
    return t('error.loadFailed')
  }
  if (error instanceof TypeError) return t('error.offline')
  return t('error.generic')
}
