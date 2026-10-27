import { describe, expect, it, mock } from 'bun:test'
import { ApiError } from '@/api/error'
import { createApiThunk } from '../createApiThunk'

/** `signInDuringRequest` starts a new session while the request is in flight. */
const run = async (error: unknown, isAuthenticated = true, signInDuringRequest = false) => {
  const auth = { isAuthenticated, session: 1 }
  const thunk = createApiThunk('test/fetch', () => {
    if (signInDuringRequest) auth.session = 2
    return Promise.reject(error)
  })
  const dispatch = mock((action: unknown) => action)
  await thunk()(dispatch, () => ({ auth }), undefined)
  return dispatch.mock.calls.map(([action]) => (action as { type: string }).type)
}

describe('createApiThunk', () => {
  it('signs out on a 401 before reporting the rejection', async () => {
    expect(await run(new ApiError(401, '/x'))).toEqual([
      'test/fetch/pending',
      'auth/signedOut',
      'test/fetch/rejected',
    ])
  })

  it('signs out on a 403 too', async () => {
    expect(await run(new ApiError(403, '/x'))).toContain('auth/signedOut')
  })

  it('has no session to end before the PIN is accepted', async () => {
    // Signing out there would reset the profile to `idle`, and the splash
    // refetches an idle profile: one 401 became an endless request loop.
    expect(await run(new ApiError(401, '/api/user'), false)).not.toContain('auth/signedOut')
  })

  it('ignores a 401 that belongs to an earlier session', async () => {
    // Sent before sign-out, answered after the next sign-in: it says nothing
    // about the session that is now open.
    expect(await run(new ApiError(401, '/x'), true, true)).not.toContain('auth/signedOut')
  })

  it('leaves the session alone on any other failure', async () => {
    expect(await run(new ApiError(500, '/x'))).not.toContain('auth/signedOut')
    expect(await run(new TypeError('Failed to fetch'))).not.toContain('auth/signedOut')
  })
})
