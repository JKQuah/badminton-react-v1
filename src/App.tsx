import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { GameProvider, useGame } from '@/contexts/GameContext'
import LoginPage from '@/pages/LoginPage'
import HomePage from '@/pages/HomePage'
import HostGamePage from '@/pages/HostGamePage'
import GameDetailPage from '@/pages/GameDetailPage'
import PaymentPage from '@/pages/PaymentPage'
import PlayersPage from '@/pages/PlayersPage'
import MaintenancePage from '@/pages/MaintenancePage'
import { Skeleton } from '@/components/ui/skeleton'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  if (isLoading) {
    return (
      <div className="min-h-screen p-6 space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }
  return user ? <>{children}</> : <Navigate to="/login" replace />
}

function AppRoutes() {
  const { user, isLoading } = useAuth()
  const { connectionError } = useGame()

  if (isLoading) {
    return (
      <div className="min-h-screen p-6 space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  if (connectionError) return <MaintenancePage />

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
      <Route path="/host" element={<ProtectedRoute><HostGamePage /></ProtectedRoute>} />
      <Route path="/game/:id" element={<ProtectedRoute><GameDetailPage /></ProtectedRoute>} />
      <Route path="/game/:id/payment" element={<ProtectedRoute><PaymentPage /></ProtectedRoute>} />
      <Route path="/players" element={<ProtectedRoute><PlayersPage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <GameProvider>
          <AppRoutes />
          <Toaster richColors position="top-center" />
        </GameProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
