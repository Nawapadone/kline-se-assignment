import { RealApiClient } from './client'
import { MockApiClient } from './mock/client'
import type { ApiClient } from './types'

/**
 * The one place the data source is chosen. Features import `apiClient` and never
 * learn which implementation answered. Read straight from `import.meta.env` so a
 * real-backend build folds this and drops the mock and its fixtures. Default on:
 * this project ships no backend.
 */
export const apiClient: ApiClient =
  import.meta.env.VITE_USE_MOCK === 'false' ? new RealApiClient() : new MockApiClient()

export { ApiError } from './error'
export type { ApiClient } from './types'
