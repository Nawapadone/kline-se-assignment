import { useCallback, useEffect, useRef, useState } from 'react'
import { t } from '@/i18n'

const FEEDBACK_MS = 1800
/** Long enough for screen readers to register the cleared region as a change. */
const REANNOUNCE_MS = 100

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
    if (timer.current) clearTimeout(timer.current)
    // A live region speaks only when its text changes, so a repeat is cleared first.
    setMessage(null)
    timer.current = setTimeout(() => {
      setMessage(text)
      timer.current = setTimeout(() => setMessage(null), FEEDBACK_MS)
    }, REANNOUNCE_MS)
  }, [])

  const copy = useCallback(
    async (accountNumber: string) => {
      try {
        await navigator.clipboard.writeText(accountNumber)
        announce(t('main.copied'))
      } catch {
        announce(t('main.copyFailed'))
      }
    },
    [announce],
  )

  return { copy, message }
}
