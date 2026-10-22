/**
 * A non-2xx answer from the backend, carrying its status so a screen can tell
 * "this endpoint does not exist" (404) apart from "the server is down" (5xx).
 * A transport failure (backend unreachable, DNS, TLS) still rejects as the
 * `TypeError` that `fetch` throws.
 */
export class ApiError extends Error {
  readonly status: number
  readonly path: string

  constructor(status: number, path: string) {
    super(`API error ${status}: ${path}`)
    this.name = 'ApiError'
    this.status = status
    this.path = path
  }
}
