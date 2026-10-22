import { useCallback, useState } from 'react'

const STORAGE_KEY = 'kline.coachmark.main-account'

const readDismissed = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    // Private mode or blocked storage — show the hint rather than crash.
    return false
  }
}

/**
 * The `tooltip--bubble` hint in bank_main.html explains the main-account menu.
 * It is worth showing once; after that it is noise, so the dismissal is
 * remembered per browser.
 */
export function useCoachMark() {
  const [dismissed, setDismissed] = useState(readDismissed)

  const dismiss = useCallback(() => {
    setDismissed(true)
    try {
      localStorage.setItem(STORAGE_KEY, '1')
    } catch {
      // Nothing to persist to; the hint simply returns next visit.
    }
  }, [])

  return { showCoachMark: !dismissed, dismissCoachMark: dismiss }
}
