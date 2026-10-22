import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAppSelector } from '@/store/hooks'

/**
 * Keeps /main behind the PIN. The session lives in memory only, so a reload
 * sends the user back to the keypad — the behaviour a banking app is expected to
 * have, and the reason nothing here reads from storage.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const isAuthenticated = useAppSelector(state => state.auth.isAuthenticated)
  if (!isAuthenticated) return <Navigate to="/pin" replace />
  return <>{children}</>
}
