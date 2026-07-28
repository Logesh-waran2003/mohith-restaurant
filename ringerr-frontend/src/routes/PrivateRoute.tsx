import { Navigate } from 'react-router-dom'
import { authService } from '../services/authService'
import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
}

export default function PrivateRoute({ children }: Props) {
  if (!authService.isAuthenticated()) {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}
