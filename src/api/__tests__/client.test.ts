import { afterEach, describe, expect, it, mock } from 'bun:test'
import { RealApiClient } from '../client'

const originalFetch = globalThis.fetch

afterEach(() => {
  globalThis.fetch = originalFetch
})

describe('RealApiClient', () => {
  it('gives every request a signal, so a stalled server cannot hang the screen', async () => {
    const fetchMock = mock((_url: string, _init?: RequestInit) =>
      Promise.resolve(new Response('[]', { status: 200 })),
    )
    globalThis.fetch = fetchMock as unknown as typeof fetch

    const client = new RealApiClient()
    await client.getAccounts()
    await client.verifyPin({ pin: '123456' })

    for (const [, init] of fetchMock.mock.calls) {
      expect(init?.signal).toBeInstanceOf(AbortSignal)
    }
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})
