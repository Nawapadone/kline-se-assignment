import { useState } from 'react'
import { BsBank2 } from 'react-icons/bs'
import { HiUser } from 'react-icons/hi2'

interface AvatarProps {
  src?: string
  alt?: string
  /** The template class that sizes and shapes the avatar (`rctly__thumb`, `pin__photo`). */
  className: string
  variant?: 'person' | 'bank'
}

/**
 * The avatar circle, with an icon standing in when the photo cannot be shown.
 * Two things make that likely here: th-bank.css points its placeholder at
 * `img/common/bg_profile.png` and `bg_logo.png`, neither of which ships in the
 * provided resources, and the payloads point at an external image host that may
 * be unreachable. One fallback covers both.
 */
export function Avatar({ src, alt = '', className, variant = 'person' }: AvatarProps) {
  /**
   * Lists here are keyed by position, so one slot can be reused for a different
   * person after a reload. Remembering which URL failed, rather than a flag,
   * keeps the slot from showing the icon for a new URL that loads fine.
   */
  const [failedSrc, setFailedSrc] = useState<string>()
  const failed = failedSrc === src
  const Icon = variant === 'bank' ? BsBank2 : HiUser

  return (
    <span className={className}>
      {src && !failed ? (
        <img src={src} alt={alt} onError={() => setFailedSrc(src)} />
      ) : (
        <Icon className="avatar__fallback" aria-hidden="true" />
      )}
    </span>
  )
}
