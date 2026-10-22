import { describe, expect, it } from 'bun:test'
import { COOLDOWN_SECONDS, cooldownForRound, MAX_COOLDOWN_ROUNDS } from '../lockout'

describe('cooldownForRound', () => {
  it('escalates with each spent round', () => {
    expect(cooldownForRound(1)).toBe(60)
    expect(cooldownForRound(2)).toBe(5 * 60)
  })

  it('clamps rather than running off either end of the list', () => {
    expect(cooldownForRound(0)).toBe(COOLDOWN_SECONDS[0])
    expect(cooldownForRound(99)).toBe(COOLDOWN_SECONDS[COOLDOWN_SECONDS.length - 1])
  })

  it('has a wait for every round that ends in one', () => {
    // The round after the last wait is the lock, so these must stay in step.
    expect(MAX_COOLDOWN_ROUNDS).toBe(COOLDOWN_SECONDS.length)
  })
})
