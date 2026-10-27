import { expect, test } from '@playwright/test'
import { CORRECT_PIN, WRONG_PIN } from './helpers'
import { serveApi } from './network'

/**
 * The two ways a PIN can be blocked, driven through the request layer.
 *
 * The real cooldown is a minute, which no test should sit through, so these run
 * against the build whose requests leave the page (`VITE_USE_MOCK=false`) and
 * answer `/api/auth/pin` themselves — the screen's side of the contract, with
 * the wait shortened. The authority's own escalation is covered by the unit
 * tests in `src/api/mock/__tests__/client.test.ts`.
 */

const TEST_COOLDOWN = 3

test.describe('a cooldown the user can sit out', () => {
  test('counts down and then takes the keypad back', async ({ page }) => {
    await serveApi(page, {
      '/api/auth/pin': {
        body: { success: false, lock: { kind: 'cooldown', secondsRemaining: TEST_COOLDOWN } },
      },
    })
    await page.goto('/pin')
    await page.locator('.pin__keys').waitFor()
    await page.keyboard.type(WRONG_PIN)

    const alert = page.getByRole('alert')
    await expect(alert).toContainText('Too many incorrect attempts.')
    await expect(alert).toContainText(`Try again in 0:0${TEST_COOLDOWN}.`)
    await expect(page.getByRole('button', { name: '1', exact: true })).toBeDisabled()

    // The number really moves, rather than being printed once.
    await expect(alert).toContainText('Try again in 0:01.', { timeout: 5_000 })

    // When it runs out the screen hands the keypad back by itself.
    await expect(page.getByRole('button', { name: '1', exact: true })).toBeEnabled({
      timeout: 5_000,
    })
    await expect(page.getByRole('alert')).toHaveCount(0)
  })

  test('a fresh round of attempts follows the wait', async ({ page }) => {
    await serveApi(page, {
      '/api/auth/pin': {
        body: { success: false, lock: { kind: 'cooldown', secondsRemaining: 1 } },
      },
    })
    await page.goto('/pin')
    await page.locator('.pin__keys').waitFor()
    await page.keyboard.type(WRONG_PIN)
    // The keypad is enabled during the check itself, so wait for the block first.
    await expect(page.getByRole('alert')).toContainText('Try again in')
    await expect(page.getByRole('button', { name: '1', exact: true })).toBeEnabled({
      timeout: 5_000,
    })

    // The PIN is accepted again once the backend stops blocking it.
    await serveApi(page)
    await page.keyboard.type(CORRECT_PIN)
    await expect(page).toHaveURL('/main')
  })
})

test.describe('a lock only the bank can lift', () => {
  test('names the call centre and never counts down', async ({ page }) => {
    await serveApi(page, {
      '/api/auth/pin': { body: { success: false, lock: { kind: 'locked' } } },
    })
    await page.goto('/pin')
    await page.locator('.pin__keys').waitFor()
    await page.keyboard.type(WRONG_PIN)

    const alert = page.getByRole('alert')
    await expect(alert).toContainText('Your PIN is locked.')
    await expect(alert).toContainText('Please contact our call centre to unlock it.')
    await expect(alert).not.toContainText('Try again in')

    // A lock is not a wait: it does not expire on its own.
    await page.waitForTimeout(2_500)
    await expect(page.getByRole('button', { name: '1', exact: true })).toBeDisabled()
    await expect(page.getByRole('alert')).toContainText('Your PIN is locked.')
  })

  test('the correct PIN cannot get past it', async ({ page }) => {
    await serveApi(page, {
      '/api/auth/pin': { body: { success: false, lock: { kind: 'locked' } } },
    })
    await page.goto('/pin')
    await page.locator('.pin__keys').waitFor()
    await page.keyboard.type(WRONG_PIN)
    await expect(page.getByRole('alert')).toContainText('Your PIN is locked.')

    await page.keyboard.type(CORRECT_PIN)
    await expect(page.locator('.pin__dot.is-filled')).toHaveCount(0)
    await expect(page).toHaveURL('/pin')
  })
})

test.describe('a backend that breaks the contract', () => {
  test('a cooldown with no seconds does not brick the keypad', async ({ page }) => {
    await serveApi(page, {
      // `secondsRemaining` is required for a cooldown; without it the screen
      // used to read "Try again in NaN:NaN" with the keypad disabled for good.
      '/api/auth/pin': { body: { success: false, lock: { kind: 'cooldown' } } },
    })
    await page.goto('/pin')
    await page.locator('.pin__keys').waitFor()
    await page.keyboard.type(WRONG_PIN)

    await expect(page.getByRole('alert')).not.toContainText('NaN')
    await expect(page.getByRole('button', { name: '1', exact: true })).toBeEnabled()
  })

  test('an unknown lock kind leaves the keypad usable', async ({ page }) => {
    await serveApi(page, {
      '/api/auth/pin': { body: { success: false, lock: { kind: 'COOLDOWN', secondsRemaining: 2 } } },
    })
    await page.goto('/pin')
    await page.locator('.pin__keys').waitFor()
    await page.keyboard.type(WRONG_PIN)

    await expect(page.getByRole('button', { name: '1', exact: true })).toBeEnabled()

    // The attempt still counted, so the user is told where they stand.
    await expect(page.getByRole('alert')).toContainText('You have 2 attempts left.')
  })

  test('a 429 is reported as a failed check, not silently ignored', async ({ page }) => {
    await serveApi(page, { '/api/auth/pin': 429 })
    await page.goto('/pin')
    await page.locator('.pin__keys').waitFor()
    await page.keyboard.type(WRONG_PIN)

    await expect(page.getByRole('alert')).toContainText('We could not check your PIN.')
  })
})
