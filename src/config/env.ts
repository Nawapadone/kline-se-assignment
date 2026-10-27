/**
 * Vite exposes only `VITE_`-prefixed variables to the browser. Kept as plain
 * reads with defaults rather than a schema library: two variables do not earn
 * a dependency, and each has a working fallback. `VITE_USE_MOCK` and
 * `VITE_DEMO_PIN` are read where they are used (`api/index.ts`, `api/mock`), so
 * a real-backend build can fold them away together with the mock.
 */
export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '',
  /** UI language, baked in at build time. Anything but `th` means English. */
  locale: import.meta.env.VITE_LOCALE === 'th' ? 'th' : 'en',
} as const
