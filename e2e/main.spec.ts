import { expect, test } from '@playwright/test'
import { signIn } from './helpers'

test.describe('main screen', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page)
  })

  test('renders the greeting and the main account from the payload', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Have a nice day Clare' })).toBeVisible()

    const main = page.locator('.main-acc--large')
    await expect(main.locator('.main-acc__name')).toHaveText('Saving Account')
    await expect(main.locator('.main-acc__amount')).toHaveText('฿62,000.00')
    await expect(main).toHaveCSS('background-color', 'rgb(36, 200, 117)')
  })

  test('formats the amount the template printed wrong', async ({ page }) => {
    // bank_main.html shows ฿300.100 for an amount of 300.10.
    await expect(page.getByText('฿300.10', { exact: true })).toBeVisible()
  })

  test('titles a card from its name, or from its type when it has none', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Travel New York' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Need to repay' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Credit Loan' })).toBeVisible()
  })

  test('draws the goal gauge from progress and badges the loan flags', async ({ page }) => {
    await expect(page.locator('.main-acc__num .percent')).toHaveText('24')
    await expect(page.locator('.gauge')).toHaveAttribute('style', /stroke-dasharray:\s*24,?\s*76/)

    await expect(page.getByText('Disbursement')).toBeVisible()
    await expect(page.getByText('Overdue')).toBeVisible()
  })

  test('masks an issued card number and labels one still in progress', async ({ page }) => {
    await expect(page.getByText('9440 78•• •••• 3115').first()).toBeVisible()
    await expect(page.getByText('In progress').first()).toBeVisible()
  })

  test('lists the recent payees and the banner', async ({ page }) => {
    await expect(page.locator('.rctly__item')).toHaveCount(6)
    await expect(page.getByText('Want some money?')).toBeVisible()
  })
})

test.describe('account action menu', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page)
  })

  test('opens one menu at a time, even for two loans sharing an account number', async ({
    page,
  }) => {
    const triggers = page.locator('.main-acc__more--small')
    await triggers.nth(0).click()
    await expect(page.getByRole('button', { name: 'Set main account' })).toHaveCount(1)

    await triggers.nth(2).click()
    await expect(page.getByRole('button', { name: 'Set main account' })).toHaveCount(1)
  })

  test('closes when its trigger is tapped again', async ({ page }) => {
    const trigger = page.locator('.main-acc__more--small').first()
    await trigger.click()
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')

    await trigger.click()
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
  })

  test('closes when anything else is tapped', async ({ page }) => {
    await page.locator('.main-acc__more--small').first().click()
    await expect(page.getByRole('button', { name: 'Copy account number' })).toBeVisible()

    await page.locator('.main-top__tit').click()
    await expect(page.getByRole('button', { name: 'Copy account number' })).toHaveCount(0)
  })

  test('works from the keyboard: opens onto its first item, Escape returns', async ({ page }) => {
    const trigger = page.getByRole('button', { name: 'More Action for Travel New York' })
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')

    await trigger.focus()
    await page.keyboard.press('Enter')
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')
    await expect(page.getByRole('button', { name: 'Set main account' })).toBeFocused()

    await page.keyboard.press('Escape')
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await expect(page.getByRole('button', { name: 'Set main account' })).toHaveCount(0)
    await expect(trigger).toBeFocused()
  })

  test('promotes an account to main, keeping its own colour', async ({ page }) => {
    await expect(page.locator('.main-acc--large .main-acc__name')).toHaveText('Saving Account')

    await page.locator('.main-acc__more--small').nth(1).click()
    await page.getByRole('button', { name: 'Set main account' }).press('Enter')

    const main = page.locator('.main-acc--large')
    await expect(main.locator('.main-acc__name')).toHaveText('Travel New York')
    // The promoted card re-renders in a new place; focus follows it there.
    await expect(main.locator('.main-acc__more')).toBeFocused()
    // th-bank.css hardcodes #24c875 on the card and its action bar.
    await expect(main).toHaveCSS('background-color', 'rgb(0, 161, 226)')
    await expect(main.locator('.main-acc__link__box')).toHaveCSS(
      'background-color',
      'rgb(0, 161, 226)',
    )

    // The demoted account is now one of the small cards, and only one is main.
    await expect(page.locator('.main-acc--large')).toHaveCount(1)
    await expect(page.locator('.main-acc.is-small .main-acc__name').first()).toHaveText(
      'Saving Account',
    )
  })

  test('copies the account number and says so', async ({ page, context, browserName }) => {
    test.skip(browserName !== 'chromium', 'clipboard permissions are Chromium-only here')
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])

    const trigger = page.locator('.main-acc__more').first()
    await trigger.click()
    await page.getByRole('button', { name: 'Copy account number' }).click()

    // Copying is the menu's last step, so it closes and hands focus back.
    await expect(page.getByRole('button', { name: 'Copy account number' })).toHaveCount(0)
    await expect(trigger).toBeFocused()
    await expect(page.getByRole('status')).toContainText('Account number copied')
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(
      '568-2-81740-9',
    )
  })
})

test.describe('first-visit hint', () => {
  test('shows once, then stays dismissed for this browser', async ({ page }) => {
    await signIn(page)
    await expect(page.getByText('Change your main account for')).toBeVisible()

    await page.locator('.main-acc__more').first().click()
    await expect(page.getByText('Change your main account for')).toHaveCount(0)

    await signIn(page)
    await expect(page.getByText('Change your main account for')).toHaveCount(0)
  })
})
