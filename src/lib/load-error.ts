import { ApiError } from '@/api'

/**
 * Turns whatever a client rejected with into a line a screen can show. Status is
 * worth distinguishing: a 404 means the endpoint is not there yet, a 5xx means
 * the server is down, and a `TypeError` from `fetch` means it was never reached.
 */
export function toErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 404) return 'This service is not available yet.'
    if (error.status >= 500) return 'The server is having trouble. Please try again.'
    return 'We could not load your data. Please try again.'
  }
  if (error instanceof TypeError) return 'No connection. Check your network and try again.'
  return 'Something went wrong. Please try again.'
}
