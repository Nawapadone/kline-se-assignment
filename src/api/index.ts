import { isMock } from '@/config/env'
import { RealApiClient } from './client'
import { MockApiClient } from './mock/client'
import type { ApiClient } from './types'

/**
 * The one place the data source is chosen. Features import `apiClient` and never
 * learn which implementation answered.
 */
export const apiClient: ApiClient = isMock ? new MockApiClient() : new RealApiClient()

export { ApiError } from './error'
export type { ApiClient } from './types'
