import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import TablesPage from './pages/TablesPage'
import MenuPage from './pages/MenuPage'
import OrdersPage from './pages/OrdersPage'
import KOTPage from './pages/KOTPage'
import StaffPage from './pages/StaffPage'
import QROrderPage from './pages/QROrderPage'

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token')
  if (!token) return <Navigate to="/login" replace />
  return <Layout>{children}</Layout>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login"      element={<LoginPage />} />
        <Route path="/register"   element={<RegisterPage />} />
        <Route path="/order/:token" element={<QROrderPage />} />
        <Route path="/dashboard" element={<ProtectedLayout><DashboardPage /></ProtectedLayout>} />
        <Route path="/tables"    element={<ProtectedLayout><TablesPage /></ProtectedLayout>} />
        <Route path="/menu"      element={<ProtectedLayout><MenuPage /></ProtectedLayout>} />
        <Route path="/orders"    element={<ProtectedLayout><OrdersPage /></ProtectedLayout>} />
        <Route path="/kitchen"   element={<ProtectedLayout><KOTPage /></ProtectedLayout>} />
        <Route path="/staff"     element={<ProtectedLayout><StaffPage /></ProtectedLayout>} />
        <Route path="*"          element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
