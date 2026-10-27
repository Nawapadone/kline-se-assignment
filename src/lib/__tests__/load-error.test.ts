import { describe, expect, it } from 'bun:test'
import { ApiError } from '@/api'
import { isSessionExpired, toErrorMessage } from '../load-error'

describe('toErrorMessage', () => {
  it('tells a missing endpoint apart from a broken server', () => {
    expect(toErrorMessage(new ApiError(404, '/api/accounts'))).toBe(
      'This service is not available yet.',
    )
    expect(toErrorMessage(new ApiError(503, '/api/accounts'))).toBe(
      'The server is having trouble. Please try again.',
    )
  })

  it('treats any other non-2xx as a failed load', () => {
    expect(toErrorMessage(new ApiError(400, '/api/accounts'))).toBe(
      'We could not load your data. Please try again.',
    )
  })

  it('reports the unreachable-backend TypeError that fetch throws', () => {
    expect(toErrorMessage(new TypeError('Failed to fetch'))).toBe(
      'No connection. Check your network and try again.',
    )
  })

  it('falls back for anything it cannot classify', () => {
    expect(toErrorMessage('boom')).toBe('Something went wrong. Please try again.')
  })

  it('cannot classify a rejection Redux already serialised — the reason thunks classify early', () => {
    const serialised = { name: 'ApiError', message: 'API error 404: /api/accounts' }
    expect(toErrorMessage(serialised)).toBe('Something went wrong. Please try again.')
  })

  it('reports a request that timed out', () => {
    expect(toErrorMessage(new DOMException('t', 'TimeoutError'))).toBe(
      'The server took too long to answer. Please try again.',
    )
  })
})

describe('isSessionExpired', () => {
  it('is true only for a 401 or 403 from the backend', () => {
    expect(isSessionExpired(new ApiError(401, '/x'))).toBe(true)
    expect(isSessionExpired(new ApiError(403, '/x'))).toBe(true)
    expect(isSessionExpired(new ApiError(404, '/x'))).toBe(false)
    expect(isSessionExpired(new TypeError('Failed to fetch'))).toBe(false)
  })
})
