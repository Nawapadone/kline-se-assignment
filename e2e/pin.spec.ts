import { expect, test } from '@playwright/test'
import { CORRECT_PIN, gotoPin, tapPin, WRONG_PIN } from './helpers'

test.describe('PIN entry', () => {
  test.beforeEach(async ({ page }) => {
    await gotoPin(page)
  })

  test('shows the name from the API and six empty dots', async ({ page }) => {
    await expect(page.locator('.pin__name')).toHaveText('Clare')
    await expect(page.locator('.pin__dot')).toHaveCount(6)
    await expect(page.locator('.pin__dot.is-filled')).toHaveCount(0)
  })

  test('fills one dot per key and never reveals a digit', async ({ page }) => {
    await tapPin(page, '12')
    await expect(page.locator('.pin__dot.is-filled')).toHaveCount(2)
    // The keypad itself shows digits; what must never appear is the entry.
    await expect(page.locator('.pin__top')).not.toContainText('1')
  })

  test('delete removes the last digit', async ({ page }) => {
    await tapPin(page, '123')
    await page.getByRole('button', { name: 'Delete' }).click()
    await expect(page.locator('.pin__dot.is-filled')).toHaveCount(2)
  })

  test('accepts digits from a physical keyboard', async ({ page }) => {
    await page.keyboard.type('12')
    await expect(page.locator('.pin__dot.is-filled')).toHaveCount(2)

    await page.keyboard.press('Backspace')
    await expect(page.locator('.pin__dot.is-filled')).toHaveCount(1)
  })

  test('submits on the sixth digit with no submit button present', async ({ page }) => {
    await expect(page.getByRole('button', { name: /submit|login|ok/i })).toHaveCount(0)

    await tapPin(page, CORRECT_PIN)
    await expect(page).toHaveURL('/main')
  })

  test('a wrong PIN replaces the name, clears the dots and spends an attempt', async ({ page }) => {
    await tapPin(page, WRONG_PIN)

    const error = page.getByRole('alert')
    await expect(error).toContainText('Invalid PIN Code.')
    await expect(error).toContainText('You have 2 attempts left.')
    // th-bank.css lays .pin__dsc over the name, so the name must not be drawn —
    // but it keeps its space, or the message rides up over the photo.
    await expect(page.locator('.pin__name')).toBeHidden()
    await expect(page.locator('.pin__dot.is-filled')).toHaveCount(0)
  })

  test('the error sits below the photo, not across it', async ({ page }) => {
    await tapPin(page, WRONG_PIN)
    await expect(page.getByRole('alert')).toBeVisible()

    const photo = await page.locator('.pin__photo').boundingBox()
    const message = await page.locator('.pin__dsc').boundingBox()
    expect(photo).not.toBeNull()
    expect(message).not.toBeNull()

    /**
     * The message box starts a few pixels inside the photo by the template's own
     * geometry, but that margin is the first line's leading, not its glyphs.
     * Dropping the name element instead of hiding it moved the text a full line
     * higher, across the circle — that is what this guards against.
     */
    const LEADING_PX = 10
    expect(message!.y).toBeGreaterThan(photo!.y + photo!.height - LEADING_PX)
  })

  test('counts the attempts down, then blocks the keypad with a wait', async ({ page }) => {
    await tapPin(page, WRONG_PIN)
    await expect(page.getByRole('alert')).toContainText('You have 2 attempts left.')

    await tapPin(page, WRONG_PIN)
    await expect(page.getByRole('alert')).toContainText('You have 1 attempt left.')

    await tapPin(page, WRONG_PIN)
    const alert = page.getByRole('alert')
    await expect(alert).toContainText('Too many incorrect attempts.')
    await expect(alert).toContainText('Try again in 1:00.')
    await expect(page.getByRole('button', { name: '1', exact: true })).toBeDisabled()

    // Neither the keypad nor the keyboard can get past the wait.
    await page.keyboard.type(CORRECT_PIN)
    await expect(page.locator('.pin__dot.is-filled')).toHaveCount(0)
    await expect(page).toHaveURL('/pin')
  })

  test('a reload does not clear the block', async ({ page }) => {
    // The keypad stays enabled during a check and ignores digits, so wait out each one.
    await tapPin(page, WRONG_PIN)
    await expect(page.getByRole('alert')).toContainText('2 attempts left')
    await tapPin(page, WRONG_PIN)
    await expect(page.getByRole('alert')).toContainText('1 attempt left')
    await tapPin(page, WRONG_PIN)
    await expect(page.getByRole('alert')).toContainText('Try again in')

    await page.reload()
    await page.locator('.pin__keys').waitFor()

    /**
     * The block belongs to the authority, so refreshing cannot lift it. The
     * store starts empty and no endpoint reports a standing block, so the keypad
     * looks usable until the first attempt — which is refused, costs nothing
     * from the budget, and brings the message back.
     */
    await page.keyboard.type(CORRECT_PIN)
    await expect(page).toHaveURL('/pin')
    await expect(page.getByRole('alert')).toContainText('Too many incorrect attempts.')
    await expect(page.getByRole('button', { name: '1', exact: true })).toBeDisabled()
  })

  test('a correct PIN after a wrong one still signs in', async ({ page }) => {
    await tapPin(page, WRONG_PIN)
    await expect(page.getByRole('alert')).toBeVisible()

    await tapPin(page, CORRECT_PIN)
    await expect(page).toHaveURL('/main')
  })
})
