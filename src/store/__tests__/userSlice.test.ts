import { describe, expect, it } from 'bun:test'
import { signedOut } from '@/store/actions'
import reducer, { fetchUser } from '../slices/userSlice'

describe('userSlice', () => {
  it('forgets the profile on sign-out', () => {
    const waiting = reducer(undefined, fetchUser.pending('', undefined))
    const loaded = reducer(
      waiting,
      fetchUser.fulfilled({ name: 'Clare', greetingMessage: 'Hi' }, '', undefined),
    )
    expect(loaded.profile).not.toBeNull()
    expect(reducer(loaded, signedOut())).toEqual(reducer(undefined, { type: '@@init' }))
  })
})

describe('userSlice and late responses', () => {
  const initial = reducer(undefined, { type: '@@init' })
  const clare = { name: 'Clare', greetingMessage: 'Hi' }

  it('drops a response that lands after sign-out', () => {
    const state = [
      fetchUser.pending('A', undefined),
      signedOut(),
      fetchUser.fulfilled(clare, 'A', undefined),
    ].reduce(reducer, initial)
    expect(state).toEqual(initial)
  })

  it('lets only the newest request write', () => {
    const racing = [
      fetchUser.pending('A', undefined),
      fetchUser.pending('B', undefined),
      fetchUser.fulfilled({ ...clare, name: 'Old' }, 'A', undefined),
    ].reduce(reducer, initial)
    expect(racing.profile).toBeNull()
    expect(racing.status).toBe('loading')

    const settled = reducer(racing, fetchUser.fulfilled(clare, 'B', undefined))
    expect(settled.profile).toEqual(clare)
    expect(settled.status).toBe('succeeded')
  })
})
