import { expect, test } from '@playwright/test'
import { CORRECT_PIN, gotoPin, signIn, tapPin } from './helpers'

test.describe('routing', () => {
  test('splash loads the profile, then hands over to the PIN screen', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('status', { name: 'Loading' })).toBeVisible()

    await expect(page).toHaveURL('/pin')
    await expect(page.locator('.pin__keys')).toBeVisible()
  })

  test('the splash is replaced, so Back does not return to it', async ({ page }) => {
    await gotoPin(page)
    await page.goBack()
    await expect(page.locator('.loader')).toHaveCount(0)
  })

  test('/main is unreachable without a PIN', async ({ page }) => {
    await page.goto('/main')
    await expect(page).toHaveURL('/pin')
    await expect(page.locator('.main-acc--large')).toHaveCount(0)
  })

  test('an unknown route re-enters the flow from the start', async ({ page }) => {
    await page.goto('/nope')
    await expect(page).toHaveURL('/pin')
  })

  test('the session is held in memory, so a reload asks for the PIN again', async ({ page }) => {
    await signIn(page)
    await page.reload()
    await expect(page).toHaveURL('/pin')
  })

  test('a new session loads its own data, not the last one\'s', async ({ page }) => {
    await signIn(page)
    await page.locator('.main-acc__more--small').nth(1).click()
    await page.getByRole('button', { name: 'Set main account' }).click()
    await expect(page.locator('.main-acc--large .main-acc__name')).toHaveText('Travel New York')

    await page.locator('.header__cxl').click()
    await expect(page).toHaveURL('/pin')
    await tapPin(page, CORRECT_PIN)

    /**
     * Promoting a main account is a local change no endpoint accepts, so the
     * server still reports the original. Seeing it back proves the screen
     * refetched instead of reusing what the previous session left in the store.
     */
    await expect(page.locator('.main-acc--large .main-acc__name')).toHaveText('Saving Account')
  })

  test('Cancel signs out and clears the entered PIN', async ({ page }) => {
    await signIn(page)
    await page.locator('.header__cxl').click()

    await expect(page).toHaveURL('/pin')
    await expect(page.locator('.pin__dot.is-filled')).toHaveCount(0)

    // The attempt budget is restored too, not left wherever the session ended.
    await tapPin(page, CORRECT_PIN)
    await expect(page.locator('.main-acc--large')).toBeVisible()
  })
})
