import { defineConfig, devices } from '@playwright/test'
import { CORRECT_PIN } from './e2e/helpers'
import { API_ORIGIN } from './e2e/network'

const MOCK_PORT = 5173
/** A second app instance whose requests really leave the page, so tests can fail them. */
const NO_BACKEND_PORT = 5174

const mockURL = `http://localhost:${MOCK_PORT}`
const noBackendURL = `http://localhost:${NO_BACKEND_PORT}`

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  /** A test that only passes sometimes is worse than no test — fail the run instead. */
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: { trace: 'on-first-retry' },
  projects: [
    {
      name: 'mobile-chromium',
      testIgnore: ['**/load-failure.spec.ts', '**/pin-lock.spec.ts'],
      /** The design is a phone; these screens have no desktop layout. */
      use: { ...devices['Pixel 7'], baseURL: mockURL },
    },
    {
      name: 'network',
      testMatch: ['**/load-failure.spec.ts', '**/pin-lock.spec.ts'],
      use: { ...devices['Pixel 7'], baseURL: noBackendURL },
    },
  ],
  /** Playwright starts and stops both servers, so `bun run test:e2e` is one command. */
  webServer: [
    {
      command: `bun run dev --port ${MOCK_PORT}`,
      url: mockURL,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
      /** Pinned, so a developer's local .env cannot decide what the suite tests. */
      env: { VITE_USE_MOCK: 'true', VITE_DEMO_PIN: CORRECT_PIN },
    },
    {
      command: `bun run dev --port ${NO_BACKEND_PORT}`,
      url: noBackendURL,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
      env: { VITE_USE_MOCK: 'false', VITE_API_BASE_URL: API_ORIGIN, VITE_DEMO_PIN: CORRECT_PIN },
    },
  ],
})
