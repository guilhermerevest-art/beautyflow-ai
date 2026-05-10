import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useEffect } from 'react'
import { useAuthStore } from './stores/authStore'
import { ProtectedRoute, RoleRoute } from './routes/Guards'
import LandingPage from './pages/LandingPage'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Clientes from './pages/Clientes'
import Servicos from './pages/Servicos'
import Agenda from './pages/Agenda'
import AgendamentoPublico from './pages/AgendamentoPublico'
import Financeiro from './pages/Financeiro'

export default function App() {
  const init = useAuthStore(s => s.init)

  useEffect(() => { init() }, [init])

  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{ style: { borderRadius: '12px', fontSize: '14px' } }} />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />

        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/clientes" element={<ProtectedRoute><Clientes /></ProtectedRoute>} />
        <Route path="/servicos" element={<ProtectedRoute><RoleRoute role="dona"><Servicos /></RoleRoute></ProtectedRoute>} />

        <Route path="/agenda" element={<ProtectedRoute><Agenda /></ProtectedRoute>} />
        <Route path="/agendar/:slug" element={<AgendamentoPublico />} />
        <Route path="/financeiro" element={<ProtectedRoute><RoleRoute role="dona"><Financeiro /></RoleRoute></ProtectedRoute>} />
        <Route path="/produtos" element={<ProtectedRoute><RoleRoute role="dona"><Dashboard /></RoleRoute></ProtectedRoute>} />
        <Route path="/pacotes" element={<ProtectedRoute><RoleRoute role="dona"><Dashboard /></RoleRoute></ProtectedRoute>} />
        <Route path="/reativacao" element={<ProtectedRoute><RoleRoute role="dona"><Dashboard /></RoleRoute></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
