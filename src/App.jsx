import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider } from './context/AuthContext'
import PWABanner from './components/PWABanner'
import ProtectedRoute from './components/ProtectedRoute'
import PublicLayout from './layouts/PublicLayout'
import AdminLayout from './layouts/AdminLayout'
import SuperAdminRoute from './components/SuperAdminRoute'

const HomePage = lazy(() => import('./pages/HomePage'))
const PricingPage = lazy(() => import('./pages/PricingPage'))
const DemoPage = lazy(() => import('./pages/DemoPage'))
const HistoryPage = lazy(() => import('./pages/HistoryPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const RegisterPage = lazy(() => import('./pages/RegisterPage'))
const RifaPage = lazy(() => import('./pages/RifaPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))
const SuperAdminPage = lazy(() => import('./pages/SuperAdminPage'))
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'))
const LegalPage = lazy(() => import('./pages/LegalPage'))
const TicketVerificationPage = lazy(() => import('./pages/TicketVerificationPage'))

function PageLoader() {
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
      <i className="fas fa-spinner fa-spin" aria-label="Cargando" style={{ fontSize: 28, color: 'var(--primary)' }} />
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Suspense fallback={<PageLoader />}>
          <Routes>
          {/* Rutas Públicas (Cliente) */}
          <Route element={<PublicLayout />}>
            <Route path="/"          element={<HomePage />} />
            <Route path="/pricing"   element={<PricingPage />} />
            <Route path="/demo"      element={<DemoPage />} />
            <Route path="/history"   element={<HistoryPage />} />
            <Route path="/login"     element={<LoginPage />} />
            <Route path="/register"  element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/terms" element={<LegalPage type="terms" />} />
            <Route path="/privacy" element={<LegalPage type="privacy" />} />
            <Route path="/rifa/:slug" element={<RifaPage />} />
            <Route path="/ticket/:code" element={<TicketVerificationPage />} />
            <Route path="*"          element={<NotFoundPage />} />
          </Route>

          {/* Rutas de Administración (Organizador) */}
          <Route element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<DashboardPage />} />
          </Route>

          {/* Rutas de Súper Administrador (Maestro) */}
          <Route element={<SuperAdminRoute />}>
            <Route path="/master" element={<SuperAdminPage />} />
          </Route>
          </Routes>
        </Suspense>
        <PWABanner />
      </AuthProvider>
    </ThemeProvider>
  )
}
