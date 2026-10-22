import { expect, test } from '@playwright/test'
import { serveApi, signInOverNetwork } from './network'

/**
 * What the screens show when the data does not arrive. These run against the
 * build with `VITE_USE_MOCK=false`, so every request leaves the page and a test
 * can fulfil or fail each endpoint on its own — see `network.ts`.
 */

test.describe('nothing loads at all', () => {
  test('the splash reports the failure instead of spinning forever', async ({ page }) => {
    await page.goto('/')

    const alert = page.getByRole('alert')
    await expect(alert).toBeVisible()
    await expect(alert).toContainText('No connection. Check your network and try again.')
    await expect(page.locator('.loader')).toHaveCount(0)

    // It does not silently move on to the PIN screen.
    await expect(page).toHaveURL('/')
  })

  test('retry re-runs the request', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('alert')).toBeVisible()

    const attempts: string[] = []
    page.on('requestfailed', request => attempts.push(request.url()))

    await page.getByRole('button', { name: 'Try again' }).click()
    await expect.poll(() => attempts.filter(url => url.includes('/api/user')).length).toBeGreaterThan(0)
    await expect(page.getByRole('alert')).toBeVisible()
  })

  test('retry recovers once the backend answers again', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('alert')).toBeVisible()

    await serveApi(page)
    await page.getByRole('button', { name: 'Try again' }).click()

    await expect(page).toHaveURL('/pin')
    await expect(page.locator('.pin__name')).toHaveText('Clare')
  })

  test('the PIN guard still holds when the backend is down', async ({ page }) => {
    await page.goto('/main')
    await expect(page).toHaveURL('/pin')
  })

  test('the PIN screen says so instead of offering a keypad that cannot work', async ({
    page,
  }) => {
    await page.goto('/pin')

    const alert = page.getByRole('alert')
    await expect(alert).toContainText('No connection. Check your network and try again.')
    // Entering six digits would be wasted: nothing can check them.
    await expect(page.locator('.pin__keys')).toHaveCount(0)
    await expect(page.locator('.pin__dot')).toHaveCount(0)
  })

  test('the PIN screen recovers on retry', async ({ page }) => {
    await page.goto('/pin')
    await expect(page.getByRole('alert')).toBeVisible()

    await serveApi(page)
    await page.getByRole('button', { name: 'Try again' }).click()

    await expect(page.locator('.pin__keys')).toBeVisible()
    await expect(page.locator('.pin__name')).toHaveText('Clare')
  })

  test('every route reports the same failure, none of them shows a usable screen', async ({
    page,
  }) => {
    for (const route of ['/', '/pin', '/main']) {
      await page.goto(route)
      await expect(page.getByRole('alert')).toContainText('No connection.')
      await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible()
    }
  })
})

test.describe('the accounts do not load', () => {
  test('the main screen explains it and offers a retry', async ({ page }) => {
    await serveApi(page, { '/api/accounts': 'abort' })
    await signInOverNetwork(page)

    const alert = page.getByRole('alert')
    await expect(alert).toContainText('No connection. Check your network and try again.')
    await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible()
    // The chrome stays, so the screen does not look broken.
    await expect(page.locator('.header')).toBeVisible()
  })

  test('a 404 reads differently from an unreachable server', async ({ page }) => {
    await serveApi(page, { '/api/accounts': 404 })
    await signInOverNetwork(page)

    await expect(page.getByRole('alert')).toContainText('This service is not available yet.')
  })

  test('a 500 reads as a server problem', async ({ page }) => {
    await serveApi(page, { '/api/accounts': 503 })
    await signInOverNetwork(page)

    await expect(page.getByRole('alert')).toContainText('The server is having trouble.')
  })

  test('retrying brings the accounts back without a reload', async ({ page }) => {
    await serveApi(page, { '/api/accounts': 'abort' })
    await signInOverNetwork(page)
    await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible()

    await serveApi(page)
    await page.getByRole('button', { name: 'Try again' }).click()

    await expect(page.locator('.main-acc--large .main-acc__amount')).toHaveText('฿62,000.00')
    await expect(page.getByRole('button', { name: 'Try again' })).toHaveCount(0)
  })

  test('shows a spinner while they are on their way, not a blank screen', async ({ page }) => {
    await serveApi(page, { '/api/accounts': { delayMs: 1500 } })
    await signInOverNetwork(page)

    await expect(page.getByRole('status', { name: 'Loading your accounts' })).toBeVisible()
    await expect(page.locator('.main-acc--large')).toBeVisible({ timeout: 10_000 })
  })

  test('says so when the account list comes back empty', async ({ page }) => {
    await serveApi(page, { '/api/accounts': { body: [] } })
    await signInOverNetwork(page)

    await expect(page.getByText('You have no accounts yet.')).toBeVisible()
    // An empty list is not a failure, so it offers no retry.
    await expect(page.getByRole('button', { name: 'Try again' })).toHaveCount(0)
  })
})

test.describe('the backend answers with a different shape', () => {
  test('an envelope instead of an array does not blank the screen', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))

    // A plausible real backend: `{ data: [...] }` where api-specs.md says a bare
    // array. Assigning it straight to the store used to reach `.map` in
    // lib/account and leave an empty #root — a white page.
    await serveApi(page, { '/api/accounts': { body: { data: [] } } })
    await signInOverNetwork(page)

    await expect(page.getByText('You have no accounts yet.')).toBeVisible()
    await expect(page.locator('.header')).toBeVisible()
    expect(errors).toEqual([])
  })

  test('a malformed dashboard list leaves the accounts usable', async ({ page }) => {
    await serveApi(page, { '/api/debit-cards': { body: { data: 'nope' } } })
    await signInOverNetwork(page)

    await expect(page.locator('.main-acc--large .main-acc__amount')).toHaveText('฿62,000.00')
    await expect(page.locator('.debit-swipe__item')).toHaveCount(0)
  })

  test('a render failure shows a message, never an empty page', async ({ page }) => {
    await serveApi(page, { '/api/accounts': { body: [{ type: 'saving-account' }] } })
    await signInOverNetwork(page)

    // Whatever an incomplete account does to the renderer, something is shown.
    await expect(page.locator('#root')).not.toBeEmpty()
  })
})

test.describe('only part of the screen loads', () => {
  test('keeps the accounts and flags the sections that failed', async ({ page }) => {
    await serveApi(page, { '/api/debit-cards': 'abort' })
    await signInOverNetwork(page)

    // The accounts arrived and are fully usable.
    await expect(page.locator('.main-acc--large .main-acc__amount')).toHaveText('฿62,000.00')
    await expect(page.getByRole('heading', { name: 'Travel New York' })).toBeVisible()

    // The missing strip is accounted for rather than silently absent.
    const notice = page.locator('.notice--inline')
    await expect(notice).toContainText('No connection.')
    await expect(page.locator('.debit-swipe__item')).toHaveCount(0)

    // The two lists fetched alongside it arrived, and are not thrown away with it.
    await expect(page.locator('.rctly__item')).toHaveCount(6)
    await expect(page.getByText('Want some money?')).toBeVisible()
  })

  test('reloading just that part leaves the accounts alone', async ({ page }) => {
    await serveApi(page, { '/api/debit-cards': 'abort' })
    await signInOverNetwork(page)
    await expect(page.locator('.notice--inline')).toBeVisible()

    await serveApi(page)
    await page.getByRole('button', { name: 'Reload' }).click()

    await expect(page.locator('.notice--inline')).toHaveCount(0)
    await expect(page.getByText('In progress').first()).toBeVisible()
    await expect(page.locator('.rctly__item')).toHaveCount(6)
    await expect(page.locator('.main-acc--large')).toBeVisible()
  })
})
