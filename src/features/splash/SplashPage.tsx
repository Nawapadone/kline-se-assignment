import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Notice } from '@/components/Notice'
import { t } from '@/i18n'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { fetchUser } from '@/store/slices/userSlice'

/**
 * A splash that disappears the instant the request resolves reads as a flicker,
 * so the screen is held briefly even on a fast answer.
 */
const MIN_VISIBLE_MS = 800

/**
 * Loads the profile the next two screens need, then hands over to the PIN
 * screen. Fetching here is what gives the splash a purpose: by the time the
 * keypad appears the user's name is already in the store.
 */
export function SplashPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const status = useAppSelector(state => state.user.status)
  const error = useAppSelector(state => state.user.error)
  const [minTimePassed, setMinTimePassed] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setMinTimePassed(true), MIN_VISIBLE_MS)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (status === 'idle') dispatch(fetchUser())
  }, [dispatch, status])

  useEffect(() => {
    if (status === 'succeeded' && minTimePassed) navigate('/pin', { replace: true })
  }, [status, minTimePassed, navigate])

  const retry = useCallback(() => void dispatch(fetchUser()), [dispatch])

  return (
    <div className="wrap">
      <div className="splash">
        {status === 'failed' && error ? (
          <Notice message={error} actionLabel={t('common.tryAgain')} onAction={retry} />
        ) : (
          <div className="loader" role="status" aria-label={t('common.loading')} />
        )}
      </div>
    </div>
  )
}
