import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Utensils, CalendarDays, BookOpen, Target, MessageSquare, LogOut, TrendingUp } from 'lucide-react'
import axios from 'axios'
import NutrirpLogo from '../../components/NutrirpLogo'
import toast from 'react-hot-toast'

const BASE = import.meta.env.VITE_API_URL || 'https://nutrirp-api.onrender.com/api'

function patientApi() {
  const token = localStorage.getItem('nutrirp_patient_token')
  return axios.create({ baseURL: BASE, headers: { Authorization: `Bearer ${token}` } })
}

export default function PatientDashboard() {
  const navigate = useNavigate()
  const [patient, setPatient] = useState(() => {
    try { return JSON.parse(localStorage.getItem('nutrirp_patient')) } catch { return null }
  })
  const [goals, setGoals] = useState([])
  const [appointments, setAppointments] = useState([])

  useEffect(() => {
    const api = patientApi()
    api.get('/patient-portal/me').then(r => setPatient(r.data)).catch(() => {})
    api.get('/patient-portal/goals').then(r => setGoals(r.data)).catch(() => {})
    api.get('/patient-portal/appointments').then(r => setAppointments(r.data)).catch(() => {})
  }, [])

  function logout() {
    localStorage.removeItem('nutrirp_patient_token')
    localStorage.removeItem('nutrirp_patient')
    navigate('/patient/login')
  }

  const upcoming = appointments.filter(a => new Date(a.scheduled_at) >= new Date() && a.status !== 'cancelado').slice(0, 3)

  const menu = [
    { to: '/patient/diet', icon: Utensils, label: 'Minha Dieta', color: 'bg-green-50 text-green-700' },
    { to: '/patient/diary', icon: BookOpen, label: 'Diário', color: 'bg-blue-50 text-blue-700' },
    { to: '/patient/goals', icon: Target, label: 'Metas', color: 'bg-purple-50 text-purple-700' },
    { to: '/patient/appointments', icon: CalendarDays, label: 'Consultas', color: 'bg-orange-50 text-orange-700' },
    { to: '/patient/chat', icon: MessageSquare, label: 'Chat', color: 'bg-pink-50 text-pink-700' },
    { to: '/patient/preconsult', icon: TrendingUp, label: 'Pré-consulta', color: 'bg-teal-50 text-teal-700' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="text-white px-5 py-4 flex items-center justify-between" style={{ backgroundColor: 'var(--color-primary)' }}>
        <NutrirpLogo size={32} textSize="text-lg" />
        <button onClick={logout} className="flex items-center gap-1 text-white/70 hover:text-white text-sm">
          <LogOut className="w-4 h-4" /> Sair
        </button>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Boas-vindas */}
        <div>
          <h1 className="text-xl font-bold dark:text-white">Olá, {patient?.name?.split(' ')[0]} 👋</h1>
          {patient?.goal && <p className="text-sm text-gray-500">Objetivo: {patient.goal}</p>}
        </div>

        {/* Menu rápido */}
        <div className="grid grid-cols-3 gap-3">
          {menu.map(({ to, icon: Icon, label, color }) => (
            <Link key={to} to={to} className="card flex flex-col items-center gap-2 py-4 hover:shadow-md transition-shadow text-center">
              <div className={`p-2.5 rounded-xl ${color}`}><Icon className="w-5 h-5" /></div>
              <span className="text-xs font-medium dark:text-white">{label}</span>
            </Link>
          ))}
        </div>

        {/* Próximas consultas */}
        {upcoming.length > 0 && (
          <div className="card">
            <h2 className="font-semibold mb-3 dark:text-white">Próximas consultas</h2>
            {upcoming.map(a => (
              <div key={a.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="text-sm font-medium dark:text-white">
                    {new Date(a.scheduled_at).toLocaleDateString('pt-BR')}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(a.scheduled_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} · {a.type}
                  </p>
                </div>
                <span className="badge bg-blue-100 text-blue-700">{a.status}</span>
              </div>
            ))}
          </div>
        )}

        {/* Metas */}
        {goals.length > 0 && (
          <div className="card">
            <h2 className="font-semibold mb-3 dark:text-white">Minhas Metas</h2>
            {goals.filter(g => g.status === 'ativo').slice(0, 3).map(g => {
              const pct = g.target_value && g.current_value ? Math.min(100, (g.current_value / g.target_value) * 100) : 0
              return (
                <div key={g.id} className="mb-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium dark:text-white">{g.title}</span>
                    <span className="text-gray-400">{g.current_value || 0}/{g.target_value} {g.unit}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: 'var(--color-primary)' }} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
