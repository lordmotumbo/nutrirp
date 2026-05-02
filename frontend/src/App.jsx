import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Patients from './pages/Patients'
import PatientDetail from './pages/PatientDetail'
import Anamnese from './pages/Anamnese'
import DietBuilder from './pages/DietBuilder'
import Agenda from './pages/Agenda'
import Anthropometry from './pages/Anthropometry'
import Supplements from './pages/Supplements'
import Exams from './pages/Exams'
import Financial from './pages/Financial'
import Chat from './pages/Chat'

function PrivateRoute({ children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return children
}

function AppRoutes() {
  return (
    <>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="patients" element={<Patients />} />
          <Route path="patients/:id" element={<PatientDetail />} />
          <Route path="patients/:id/anamnese" element={<Anamnese />} />
          <Route path="patients/:id/diet" element={<DietBuilder />} />
          <Route path="patients/:id/anthropometry" element={<Anthropometry />} />
          <Route path="patients/:id/supplements" element={<Supplements />} />
          <Route path="patients/:id/exams" element={<Exams />} />
          <Route path="patients/:id/chat" element={<Chat />} />
          <Route path="agenda" element={<Agenda />} />
          <Route path="financial" element={<Financial />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
