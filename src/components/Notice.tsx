interface NoticeProps {
  message: string
  /** Omitted when there is nothing to retry — an empty list is not a failure. */
  actionLabel?: string
  onAction?: () => void
  /**
   * `screen` fills the viewport when nothing could be loaded at all; `inline`
   * sits in the gap left by one section that failed while the rest arrived.
   */
  variant?: 'screen' | 'inline'
}

/**
 * The provided HTML has markup for no failure, empty list or retry, so this is
 * the one invented piece of UI. Its rules live in `styles/app.css`, which keeps
 * every addition out of the team's th-bank.css.
 */
export function Notice({ message, actionLabel, onAction, variant = 'screen' }: NoticeProps) {
  return (
    <div
      className={variant === 'inline' ? 'notice notice--inline' : 'notice'}
      role={actionLabel ? 'alert' : 'status'}
    >
      <p className="notice__msg">{message}</p>
      {actionLabel && onAction && (
        <button type="button" className="notice__action" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  )
}
