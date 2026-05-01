import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, CalendarDays, TrendingUp, Clock } from 'lucide-react'
import api from '../api'
import { useAuth } from '../context/AuthContext'
import { format, isToday, isTomorrow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function Dashboard() {
  const { user } = useAuth()
  const [patients, setPatients] = useState([])
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/patients'),
      api.get('/appointments'),
    ]).then(([p, a]) => {
      setPatients(p.data)
      setAppointments(a.data)
    }).finally(() => setLoading(false))
  }, [])

  const today = appointments.filter(a => isToday(new Date(a.scheduled_at)))
  const upcoming = appointments
    .filter(a => new Date(a.scheduled_at) >= new Date() && a.status !== 'cancelado')
    .slice(0, 5)

  function dayLabel(dt) {
    const d = new Date(dt)
    if (isToday(d)) return 'Hoje'
    if (isTomorrow(d)) return 'Amanhã'
    return format(d, "dd/MM", { locale: ptBR })
  }

  const statusColor = {
    agendado: 'bg-blue-100 text-blue-700',
    confirmado: 'bg-green-100 text-green-700',
    realizado: 'bg-gray-100 text-gray-600',
    cancelado: 'bg-red-100 text-red-600',
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Olá, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
        </p>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Pacientes', value: patients.length, icon: Users, color: 'text-primary-700 bg-primary-50' },
          { label: 'Consultas hoje', value: today.length, icon: CalendarDays, color: 'text-blue-700 bg-blue-50' },
          { label: 'Próximas', value: upcoming.length, icon: Clock, color: 'text-orange-700 bg-orange-50' },
          { label: 'Total consultas', value: appointments.length, icon: TrendingUp, color: 'text-purple-700 bg-purple-50' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card flex items-center gap-4">
            <div className={`p-3 rounded-xl ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{loading ? '—' : value}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Próximas consultas */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Próximas consultas</h2>
            <Link to="/agenda" className="text-xs text-primary-700 hover:underline">Ver agenda</Link>
          </div>
          {upcoming.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">Nenhuma consulta agendada</p>
          ) : (
            <ul className="space-y-3">
              {upcoming.map(a => (
                <li key={a.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{a.patient_name}</p>
                    <p className="text-xs text-gray-400">
                      {dayLabel(a.scheduled_at)} — {format(new Date(a.scheduled_at), 'HH:mm')}
                    </p>
                  </div>
                  <span className={`badge ${statusColor[a.status] || 'bg-gray-100 text-gray-600'}`}>
                    {a.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Pacientes recentes */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Pacientes recentes</h2>
            <Link to="/patients" className="text-xs text-primary-700 hover:underline">Ver todos</Link>
          </div>
          {patients.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">Nenhum paciente cadastrado</p>
          ) : (
            <ul className="space-y-3">
              {patients.slice(0, 5).map(p => (
                <li key={p.id}>
                  <Link
                    to={`/patients/${p.id}`}
                    className="flex items-center gap-3 hover:bg-gray-50 rounded-lg p-1.5 -mx-1.5 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-bold">
                      {p.name[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{p.name}</p>
                      <p className="text-xs text-gray-400">{p.goal || 'Sem objetivo definido'}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
