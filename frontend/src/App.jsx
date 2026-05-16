import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'

import Layout from './components/Layout'

// ── Páginas comuns ────────────────────────────────────────────────────
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
import SharedPatients from './pages/SharedPatients'

// ── Portal do paciente ────────────────────────────────────────────────
import PatientLogin from './pages/patient/PatientLogin'
import PatientDashboard from './pages/patient/PatientDashboard'
import PatientDiary from './pages/patient/PatientDiary'
import PatientPreConsult from './pages/patient/PatientPreConsult'
import PatientChat from './pages/patient/PatientChat'
import PatientDiet from './pages/patient/PatientDiet'
import PatientAppointments from './pages/patient/PatientAppointments'
import PatientGoals from './pages/patient/PatientGoals'
import PatientAlerts from './pages/patient/PatientAlerts'
import PatientDocuments from './pages/patient/PatientDocuments'
import PatientWorkout from './pages/patient/PatientWorkout'
import PatientWorkoutCheckin from './pages/patient/PatientWorkoutCheckin'
import PatientExerciseDetail from './pages/patient/PatientExerciseDetail'
import PatientWorkoutHistory from './pages/patient/PatientWorkoutHistory'

// ── Personal Trainer ──────────────────────────────────────────────────
import PersonalClients from './pages/personal/PersonalClients'
import PersonalClientDetail from './pages/personal/PersonalClientDetail'
import PersonalWorkouts from './pages/personal/PersonalWorkouts'
import PersonalWorkoutBuilder from './pages/personal/PersonalWorkoutBuilder'

// ── Fisioterapia ──────────────────────────────────────────────────────
import PhysioPatients from './pages/physio/PhysioPatients'
import PhysioPatientDetail from './pages/physio/PhysioPatientDetail'
import PhysioRecords from './pages/physio/PhysioRecords'

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
        {/* ── Auth ── */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* ── Portal do paciente ── */}
        <Route path="/paciente" element={<PatientLogin />} />
        <Route path="/paciente/login" element={<PatientLogin />} />
        <Route path="/paciente/dashboard" element={<PatientDashboard />} />
        <Route path="/paciente/diary" element={<PatientDiary />} />
        <Route path="/paciente/preconsult" element={<PatientPreConsult />} />
        <Route path="/paciente/chat" element={<PatientChat />} />
        <Route path="/paciente/diet" element={<PatientDiet />} />
        <Route path="/paciente/appointments" element={<PatientAppointments />} />
        <Route path="/paciente/goals" element={<PatientGoals />} />
        <Route path="/paciente/alerts" element={<PatientAlerts />} />
        <Route path="/paciente/documents" element={<PatientDocuments />} />
        <Route path="/paciente/workout" element={<PatientWorkout />} />
        <Route path="/paciente/workout/checkin/:sessionId" element={<PatientWorkoutCheckin />} />
        <Route path="/paciente/workout/exercise/:exerciseId" element={<PatientExerciseDetail />} />
        <Route path="/paciente/workout/history" element={<PatientWorkoutHistory />} />

        {/* ── Área do profissional (autenticado) ── */}
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          {/* Dashboard dinâmico por role */}
          <Route index element={<Dashboard />} />

          {/* ── Nutrição ── */}
          <Route path="patients" element={<Patients />} />
          <Route path="patients/:id" element={<PatientDetail />} />
          <Route path="patients/:id/anamnese" element={<Anamnese />} />
          <Route path="patients/:id/diet" element={<DietBuilder />} />
          <Route path="patients/:id/diet/:dietId/edit" element={<DietBuilder />} />
          <Route path="patients/:id/anthropometry" element={<Anthropometry />} />
          <Route path="patients/:id/supplements" element={<Supplements />} />
          <Route path="patients/:id/exams" element={<Exams />} />
          <Route path="patients/:id/chat" element={<Chat />} />

          {/* ── Agenda e Financeiro (compartilhados) ── */}
          <Route path="agenda" element={<Agenda />} />
          <Route path="financial" element={<Financial />} />
          <Route path="shared" element={<SharedPatients />} />

          {/* ── Personal Trainer ── */}
          <Route path="personal/clients" element={<PersonalClients />} />
          <Route path="personal/clients/:id" element={<PersonalClientDetail />} />
          <Route path="personal/workouts" element={<PersonalWorkouts />} />
          <Route path="personal/plans/:planId" element={<PersonalWorkoutBuilder />} />

          {/* ── Fisioterapia ── */}
          <Route path="physio/patients" element={<PhysioPatients />} />
          <Route path="physio/patients/:id" element={<PhysioPatientDetail />} />
          <Route path="physio/records" element={<PhysioRecords />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ThemeProvider>
  )
}
