import type { Page, Route } from '@playwright/test'
import { CORRECT_PIN } from './helpers'
import accounts from '../src/api/mock/data/accounts.json' with { type: 'json' }
import banners from '../src/api/mock/data/banners.json' with { type: 'json' }
import debitCards from '../src/api/mock/data/debit-cards.json' with { type: 'json' }
import transactions from '../src/api/mock/data/transactions.json' with { type: 'json' }
import user from '../src/api/mock/data/user.json' with { type: 'json' }

/**
 * Origin the app under test calls for data. Nothing listens there, so an
 * un-intercepted request rejects rather than being answered by the dev server
 * with HTML. The port is above 1024 and off Chrome's blocked list, because a
 * blocked port is refused before `page.route` could fulfil it.
 */
export const API_ORIGIN = 'http://127.0.0.1:5599'

/**
 * Fault injection for the screens' data.
 *
 * The mock client answers in-process, so nothing crosses the network and
 * `page.route` has nothing to intercept. These specs therefore run against the
 * build configured with `VITE_USE_MOCK=false` and a base URL nothing listens on:
 * every request really leaves the page, which lets a test fulfil some endpoints
 * and fail others — the only way to reproduce a half-loaded screen.
 */
const BODIES: Record<string, unknown> = {
  '/api/user': user,
  '/api/accounts': accounts,
  '/api/transactions/recent': transactions,
  '/api/debit-cards': debitCards,
  '/api/banners': banners,
  '/api/auth/pin': { success: true },
}

type Outcome = 'ok' | 'abort' | number | { body: unknown } | { delayMs: number }

const pathOf = (url: string) => new URL(url).pathname

/**
 * The app under test calls a different origin, and its requests are credentialed,
 * so a fulfilled response still has to carry the headers a real backend would —
 * without them the browser rejects the body and every endpoint looks offline.
 */
const corsHeaders = (origin: string) => ({
  'Access-Control-Allow-Origin': origin,
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Allow-Headers': 'Content-Type,Accept',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
})

async function answer(route: Route, outcome: Outcome, path: string, origin: string) {
  if (outcome === 'abort') return route.abort('failed')

  const headers = corsHeaders(origin)
  if (typeof outcome === 'number') {
    return route.fulfill({ status: outcome, contentType: 'application/json', body: '{}', headers })
  }
  if (typeof outcome === 'object' && 'delayMs' in outcome) {
    await new Promise(resolve => setTimeout(resolve, outcome.delayMs))
  }
  const body = typeof outcome === 'object' && 'body' in outcome ? outcome.body : BODIES[path]
  return route.fulfill({
    status: 200,
    contentType: 'application/json',
    headers,
    body: JSON.stringify(body ?? null),
  })
}

/**
 * Serves every endpoint from the same fixtures the mock client uses, except the
 * paths named in `outcomes`.
 */
export async function serveApi(page: Page, outcomes: Record<string, Outcome> = {}) {
  // Scoped to the API origin: a bare `**/api/**` also matches the app's own
  // module graph (`/src/api/index.ts`), which Vite must be allowed to serve.
  await page.route(`${API_ORIGIN}/api/**`, route => {
    const request = route.request()
    const origin = request.headers().origin ?? '*'
    // The POST to /api/auth/pin is preflighted; answer it or the real call never happens.
    if (request.method() === 'OPTIONS') {
      return route.fulfill({ status: 204, headers: corsHeaders(origin) })
    }
    const path = pathOf(request.url())
    return answer(route, outcomes[path] ?? 'ok', path, origin)
  })
}

/** Walks the splash and the keypad to reach the main screen. */
export async function signInOverNetwork(page: Page) {
  await page.goto('/')
  await page.locator('.pin__keys').waitFor()
  await page.keyboard.type(CORRECT_PIN)
}
