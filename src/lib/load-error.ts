import { ApiError } from '@/api/error'
import { t } from '@/i18n'

/**
 * Turns whatever a client rejected with into a line a screen can show. Status is
 * worth distinguishing: a 404 means the endpoint is not there yet, a 5xx means
 * the server is down, a `TypeError` from `fetch` means it was never reached, and
 * a `TimeoutError` means it never answered in time.
 */
export function toErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 404) return t('error.notAvailable')
    if (error.status >= 500) return t('error.server')
    return t('error.loadFailed')
  }
  if (error instanceof TypeError) return t('error.offline')
  if (error instanceof DOMException && error.name === 'TimeoutError') return t('error.timeout')
  return t('error.generic')
}

/** The backend no longer accepts the session, so the app must end it. */
export const isSessionExpired = (error: unknown): boolean =>
  error instanceof ApiError && (error.status === 401 || error.status === 403)
