import { Navigate, Route, Routes } from 'react-router-dom'
import { PhoneFrame } from '@/components/PhoneFrame'
import { MainPage } from '@/features/main/MainPage'
import { PinPage } from '@/features/pin/PinPage'
import { SplashPage } from '@/features/splash/SplashPage'
import { ErrorBoundary } from './ErrorBoundary'
import { RequireAuth } from './RequireAuth'

export function App() {
  return (
    <PhoneFrame>
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<SplashPage />} />
          <Route path="/pin" element={<PinPage />} />
          <Route
            path="/main"
            element={
              <RequireAuth>
                <MainPage />
              </RequireAuth>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ErrorBoundary>
    </PhoneFrame>
  )
}
