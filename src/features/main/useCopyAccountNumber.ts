import { useCallback, useEffect, useRef, useState } from 'react'

const FEEDBACK_MS = 1800

/**
 * Copies an account number and reports it, because a copy with no acknowledgement
 * leaves the user unsure whether anything happened. The clipboard API rejects on
 * an insecure origin or a denied permission, so the failure is surfaced rather
 * than swallowed.
 */
export function useCopyAccountNumber() {
  const [message, setMessage] = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), [])

  const announce = useCallback((text: string) => {
    setMessage(text)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setMessage(null), FEEDBACK_MS)
  }, [])

  const copy = useCallback(
    async (accountNumber: string) => {
      try {
        await navigator.clipboard.writeText(accountNumber)
        announce('Account number copied')
      } catch {
        announce('Could not copy the account number')
      }
    },
    [announce],
  )

  return { copy, message }
}
