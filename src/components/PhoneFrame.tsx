import type { ReactNode } from 'react'

/**
 * th-bank.css stops at 474px and assumes a phone, so on a desktop the screens
 * would stretch edge to edge. design.jpg presents all three inside phone
 * outlines; this reproduces that framing in `styles/app.css` without touching a
 * line of the provided stylesheet.
 */
export function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="phone-frame">
      <div className="phone-frame__screen">{children}</div>
    </div>
  )
}
