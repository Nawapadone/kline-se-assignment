import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { MAX_PIN_ATTEMPTS } from '@/lib/pin'
import { cooldownForRound, MAX_COOLDOWN_ROUNDS } from '../lockout'
import { MockApiClient } from '../client'

/** Fixed here, so an ambient VITE_DEMO_PIN cannot decide whether these pass. */
const PIN = '123456'
const WRONG_PIN = '000000'

describe('MockApiClient', () => {
  let client: MockApiClient
  let clock: number

  /** Jumps past a wait, so a test never actually sits through one. */
  const advance = (seconds: number) => {
    clock += seconds * 1000
  }

  beforeEach(() => {
    clock = 1_700_000_000_000
    // No latency and a PIN of its own: these assert behaviour, not timing.
    client = new MockApiClient({ latencyMs: 0, acceptedPin: PIN, now: () => clock, persist: false })
  })

  it('serves the payloads api-specs.md describes', async () => {
    await expect(client.getUser()).resolves.toEqual({
      name: 'Clare',
      greetingMessage: 'Have a nice day Clare',
    })

    const accounts = await client.getAccounts()
    expect(accounts).toHaveLength(4)
    expect(accounts.filter(a => a.isMainAccount)).toHaveLength(1)
    expect(await client.getRecentTransactions()).toHaveLength(6)
    expect(await client.getDebitCards()).toHaveLength(4)
    expect(await client.getBanners()).toHaveLength(1)
  })

  it('hands out copies, so a caller cannot mutate the fixtures', async () => {
    const first = await client.getAccounts()
    first[0].amount = 1
    const second = await client.getAccounts()
    expect(second[0].amount).toBe(62000)
  })

  it('accepts the configured PIN', async () => {
    await expect(client.verifyPin({ pin: PIN })).resolves.toEqual({ success: true })
  })

  /** Spends one full round of attempts and returns the last answer. */
  const spendRound = async () => {
    let last: Awaited<ReturnType<typeof client.verifyPin>> = { success: false }
    for (let attempt = 0; attempt < MAX_PIN_ATTEMPTS; attempt += 1) {
      last = await client.verifyPin({ pin: WRONG_PIN })
    }
    return last
  }

  it('counts the attempts of a round down', async () => {
    for (let attempt = 1; attempt < MAX_PIN_ATTEMPTS; attempt += 1) {
      const result = await client.verifyPin({ pin: WRONG_PIN })
      expect(result.success).toBe(false)
      expect(result.attemptsLeft).toBe(MAX_PIN_ATTEMPTS - attempt)
      expect(result.lock).toBeUndefined()
    }
  })

  it('starts a cooldown when a round is spent', async () => {
    const result = await spendRound()
    expect(result).toEqual({
      success: false,
      lock: { kind: 'cooldown', secondsRemaining: cooldownForRound(1) },
    })
  })

  it('refuses even the correct PIN during the cooldown', async () => {
    await spendRound()
    const result = await client.verifyPin({ pin: PIN })
    expect(result.success).toBe(false)
    expect(result.lock?.kind).toBe('cooldown')
  })

  it('escalates the wait with every spent round', async () => {
    const waits: number[] = []
    for (let round = 1; round <= MAX_COOLDOWN_ROUNDS; round += 1) {
      const result = await spendRound()
      expect(result.lock?.kind).toBe('cooldown')
      if (result.lock?.kind === 'cooldown') waits.push(result.lock.secondsRemaining)
      // Sitting the wait out is what lets the next round begin.
      advance(cooldownForRound(round))
    }
    expect(waits).toEqual([cooldownForRound(1), cooldownForRound(2)])
    expect(waits).toHaveLength(MAX_COOLDOWN_ROUNDS)
  })

  it('locks the PIN for good once every wait has been served', async () => {
    for (let round = 1; round <= MAX_COOLDOWN_ROUNDS; round += 1) {
      await spendRound()
      advance(cooldownForRound(round))
    }
    const result = await spendRound()
    expect(result).toEqual({ success: false, lock: { kind: 'locked' } })

    // A lock is not a wait: it does not expire, and the right PIN cannot pass it.
    advance(60 * 60)
    await expect(client.verifyPin({ pin: PIN })).resolves.toEqual({
      success: false,
      lock: { kind: 'locked' },
    })
  })

  it('clears the failure count once the right PIN arrives', async () => {
    await client.verifyPin({ pin: WRONG_PIN })
    await client.verifyPin({ pin: PIN })
    const result = await client.verifyPin({ pin: WRONG_PIN })
    expect(result.attemptsLeft).toBe(MAX_PIN_ATTEMPTS - 1)
  })
})

describe('MockApiClient across tabs', () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')

  afterEach(() => {
    if (original) Object.defineProperty(globalThis, 'localStorage', original)
    else Reflect.deleteProperty(globalThis, 'localStorage')
  })

  it('counts failures from two instances sharing storage toward one cooldown', async () => {
    const store = new Map<string, string>()
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => void store.set(k, v),
        removeItem: (k: string) => void store.delete(k),
      },
    })
    const options = { latencyMs: 0, acceptedPin: PIN, now: () => 1_700_000_000_000, persist: true }
    const tabA = new MockApiClient(options)
    const tabB = new MockApiClient(options)

    await tabA.verifyPin({ pin: WRONG_PIN })
    await tabB.verifyPin({ pin: WRONG_PIN })
    const third = await tabA.verifyPin({ pin: WRONG_PIN })
    expect(third.lock?.kind).toBe('cooldown')

    const other = await tabB.verifyPin({ pin: PIN })
    expect(other).toEqual({ success: false, lock: { kind: 'cooldown', secondsRemaining: cooldownForRound(1) } })
  })

  it('still starts a cooldown when storage is blocked', async () => {
    const blocked = () => {
      throw new Error('blocked')
    }
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: { getItem: blocked, setItem: blocked, removeItem: blocked },
    })
    const client = new MockApiClient({ latencyMs: 0, acceptedPin: PIN, now: () => 1_700_000_000_000, persist: true })

    await client.verifyPin({ pin: WRONG_PIN })
    await client.verifyPin({ pin: WRONG_PIN })
    const third = await client.verifyPin({ pin: WRONG_PIN })
    expect(third.lock?.kind).toBe('cooldown')
  })
})
