import type { Page } from '@playwright/test'

/**
 * The PIN both app servers are started with, so the specs and
 * `playwright.config.ts` cannot drift apart — a mismatch there fails the suite
 * in a way that looks like a bug in the app.
 */
export const CORRECT_PIN = '123456'
export const WRONG_PIN = '000000'

/** Taps the keypad rather than typing, so the test exercises what a phone does. */
export async function tapPin(page: Page, pin: string) {
  for (const digit of pin) {
    await page.getByRole('button', { name: digit, exact: true }).click()
  }
}

/** Waits out the splash and lands on the keypad. */
export async function gotoPin(page: Page) {
  await page.goto('/')
  await page.locator('.pin__keys').waitFor()
}

/** Signs in and lands on the main screen. */
export async function signIn(page: Page) {
  await gotoPin(page)
  await tapPin(page, CORRECT_PIN)
  await page.locator('.main-acc--large').waitFor()
}
