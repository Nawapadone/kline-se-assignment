import { useCallback, useEffect, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Avatar } from '@/components/Avatar'
import { Loading } from '@/components/Loading'
import { Notice } from '@/components/Notice'
import { PinDots } from '@/components/PinDots'
import { PinKeypad } from '@/components/PinKeypad'
import { isPinComplete, pinErrorLines } from '@/lib/pin'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { selectIsPinBlocked, selectShowPinError } from '@/store/selectors'
import { cooldownExpired, digitDeleted, digitPressed, submitPin } from '@/store/slices/authSlice'
import { fetchUser } from '@/store/slices/userSlice'
import { useCooldownCountdown } from './useCooldownCountdown'

/** The avatar the template points at; no endpoint in api-specs.md serves a photo. */
const AVATAR_URL = 'https://dummyimage.com/200x200/999/fff'

/**
 * The ancestry th-bank.css styles this screen through: `.pin` paints the green
 * background and `.container--pin-type` removes the page padding. Every state of
 * the screen needs all of it, so none of them rebuilds it by hand.
 */
function PinScreen({ children }: { children: ReactNode }) {
  return (
    <div className="wrap">
      <main className="container container--pin-type">
        <div className="pin">{children}</div>
      </main>
    </div>
  )
}

export function PinPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const profile = useAppSelector(state => state.user.profile)
  const userStatus = useAppSelector(state => state.user.status)
  const userError = useAppSelector(state => state.user.error)
  const { pin, attemptsLeft, status, isAuthenticated, lock } = useAppSelector(state => state.auth)
  const isBlocked = useAppSelector(selectIsPinBlocked)
  const showError = useAppSelector(selectShowPinError)

  // Opening /pin directly skips the splash, so the profile may not be loaded yet.
  useEffect(() => {
    if (userStatus === 'idle') dispatch(fetchUser())
  }, [dispatch, userStatus])

  /** No submit button exists in pin.html — the sixth digit submits. */
  useEffect(() => {
    if (isPinComplete(pin) && status !== 'loading') void dispatch(submitPin(pin))
  }, [dispatch, pin, status])

  useEffect(() => {
    if (isAuthenticated) navigate('/main', { replace: true })
  }, [isAuthenticated, navigate])

  const onDigit = useCallback((digit: string) => void dispatch(digitPressed(digit)), [dispatch])
  const onDelete = useCallback(() => void dispatch(digitDeleted()), [dispatch])
  const retryUser = useCallback(() => void dispatch(fetchUser()), [dispatch])
  const onCooldownExpired = useCallback(() => void dispatch(cooldownExpired()), [dispatch])
  const secondsRemaining = useCooldownCountdown(lock, onCooldownExpired)

  const [errorTitle, errorDetail] = pinErrorLines({ attemptsLeft, lock, secondsRemaining })
  const verifyFailed = status === 'failed'
  /**
   * th-bank.css gives `.pin__dsc` `margin-top: -37px`, so the message is laid out
   * on top of the name rather than below it: the template means the error to
   * replace the name. The name therefore stays in the DOM to hold that slot and
   * is only hidden — removing it let the message slide up over the photo.
   */
  const errorVisible = verifyFailed || showError

  /**
   * A keypad that cannot reach the backend is a trap: it accepts six digits and
   * only then admits nothing works. When the profile could not be loaded, say so
   * here the way the splash and the main screen do, and offer the same retry.
   */
  if (userStatus === 'failed' && userError) {
    return (
      <PinScreen>
        <Notice message={userError} actionLabel="Try again" onAction={retryUser} />
      </PinScreen>
    )
  }

  if (userStatus === 'idle' || userStatus === 'loading') {
    return (
      <PinScreen>
        <Loading label="Loading" />
      </PinScreen>
    )
  }

  return (
    <PinScreen>
      <div className="pin__top">
        <Avatar src={AVATAR_URL} className="pin__photo" />
        {/* The name holds its slot even when empty: th-bank.css lays the error
            message over it, and an absent slot sends that text across the photo. */}
        <h1 className={errorVisible ? 'pin__name is-hidden' : 'pin__name'}>
          {profile?.name ?? ''}
        </h1>
        {verifyFailed ? (
          <p className="pin__dsc" role="alert">
            We could not check your PIN.
            <br />
            Please try again.
          </p>
        ) : (
          showError && (
            <p className="pin__dsc" role="alert">
              {errorTitle}
              <br />
              {errorDetail}
            </p>
          )
        )}
        <PinDots filled={pin.length} />
      </div>

      <div className="pin__btm">
        <a href="#" className="pin__login">
          Login with ID / Password{' '}
        </a>
        <span className="pin__kb">Powered by TestLab</span>
        <PinKeypad
          onDigit={onDigit}
          onDelete={onDelete}
          disabled={isBlocked || status === 'loading'}
        />
      </div>
    </PinScreen>
  )
}
