/**
 * Vite exposes only `VITE_`-prefixed variables to the browser. Kept as plain
 * reads with defaults rather than a schema library: four variables do not earn
 * a dependency, and every one of them has a working fallback.
 */
export const env = {
  /** Serve data from `api/mock` instead of a backend. Default on: this project ships no backend. */
  useMock: import.meta.env.VITE_USE_MOCK !== 'false',
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '',
  /** PIN the mock client accepts. api-specs.md defines no auth endpoint. */
  demoPin: import.meta.env.VITE_DEMO_PIN ?? '123456',
  /** UI language, baked in at build time. Anything but `th` means English. */
  locale: import.meta.env.VITE_LOCALE === 'th' ? 'th' : 'en',
} as const

export const isMock = env.useMock
