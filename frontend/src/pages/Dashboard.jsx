import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, CalendarDays, TrendingUp, Clock, Dumbbell, Activity } from 'lucide-react'
import api from '../api'
import { useAuth } from '../context/AuthContext'
import { format, isToday, isTomorrow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// ── Dashboard Nutricionista ───────────────────────────────────────────
function NutritionistDashboard({ user }) {
  const [patients, setPatients] = useState([])
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([api.get('/patients'), api.get('/appointments')])
      .then(([p, a]) => { setPatients(p.data); setAppointments(a.data) })
      .finally(() => setLoading(false))
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
        <h1 className="text-2xl font-bold text-white">Olá, {user?.name?.split(' ')[0]} 👋</h1>
        <p className="text-gray-400 text-sm mt-1">
          {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Pacientes', value: patients.length, icon: Users },
          { label: 'Consultas hoje', value: today.length, icon: CalendarDays },
          { label: 'Próximas', value: upcoming.length, icon: Clock },
          { label: 'Total consultas', value: appointments.length, icon: TrendingUp },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="card flex items-center gap-4">
            <div className="p-3 rounded-xl text-purple-400 bg-purple-900/30"><Icon className="w-5 h-5" /></div>
            <div>
              <p className="text-2xl font-bold text-white">{loading ? '—' : value}</p>
              <p className="text-xs text-gray-400">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
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
                  <Link to={`/patients/${p.id}`}
                    className="flex items-center gap-3 hover:bg-purple-900/20 rounded-lg p-1.5 -mx-1.5 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-purple-900/30 text-purple-400 flex items-center justify-center text-sm font-bold">
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

// ── Dashboard Personal Trainer ────────────────────────────────────────
function PersonalDashboard({ user }) {
  const [clients, setClients] = useState([])
  const [appointments, setAppointments] = useState([])
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/personal/my-clients'),
      api.get('/appointments'),
    ]).then(async ([c, a]) => {
      setClients(c.data)
      setAppointments(a.data)
      // Conta planos ativos
      let totalPlans = 0
      for (const client of c.data.slice(0, 10)) {
        try {
          const r = await api.get(`/personal/clients/${client.id}/plans`)
          totalPlans += r.data.filter(p => p.is_active).length
        } catch {}
      }
      setPlans(totalPlans)
    }).finally(() => setLoading(false))
  }, [])

  const today = appointments.filter(a => isToday(new Date(a.scheduled_at)))
  const upcoming = appointments
    .filter(a => new Date(a.scheduled_at) >= new Date() && a.status !== 'cancelado')
    .slice(0, 5)

  const statusColor = {
    agendado: 'bg-blue-100 text-blue-700',
    confirmado: 'bg-green-100 text-green-700',
    realizado: 'bg-gray-100 text-gray-600',
    cancelado: 'bg-red-100 text-red-600',
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Olá, {user?.name?.split(' ')[0]} 💪</h1>
        <p className="text-gray-400 text-sm mt-1">
          {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Pacientes', value: clients.length, icon: Users },
          { label: 'Sessões hoje', value: today.length, icon: CalendarDays },
          { label: 'Planos ativos', value: plans, icon: Dumbbell },
          { label: 'Próximas sessões', value: upcoming.length, icon: Clock },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="card flex items-center gap-4">
            <div className="p-3 rounded-xl text-purple-400 bg-purple-900/30"><Icon className="w-5 h-5" /></div>
            <div>
              <p className="text-2xl font-bold text-white">{loading ? '—' : value}</p>
              <p className="text-xs text-gray-400">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Próximas sessões</h2>
            <Link to="/agenda" className="text-xs text-primary-700 hover:underline">Ver agenda</Link>
          </div>
          {upcoming.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">Nenhuma sessão agendada</p>
          ) : (
            <ul className="space-y-3">
              {upcoming.map(a => (
                <li key={a.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{a.patient_name}</p>
                    <p className="text-xs text-gray-400">
                      {isToday(new Date(a.scheduled_at)) ? 'Hoje' : format(new Date(a.scheduled_at), "dd/MM")} — {format(new Date(a.scheduled_at), 'HH:mm')}
                    </p>
                  </div>
                  <span className={`badge ${statusColor[a.status] || 'bg-gray-100 text-gray-600'}`}>{a.status}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Pacientes recentes</h2>
            <Link to="/personal/clients" className="text-xs text-primary-700 hover:underline">Ver todos</Link>
          </div>
          {clients.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">Nenhum paciente cadastrado</p>
          ) : (
            <ul className="space-y-3">
              {clients.slice(0, 5).map(c => (
                <li key={c.id}>
                  <Link to={`/personal/clients/${c.id}`}
                    className="flex items-center gap-3 hover:bg-purple-900/20 rounded-lg p-1.5 -mx-1.5 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-purple-900/30 text-purple-400 flex items-center justify-center text-sm font-bold">
                      {c.name[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{c.name}</p>
                      <p className="text-xs text-gray-400">{c.goal || 'Sem objetivo'}</p>
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

// ── Dashboard Fisioterapeuta ──────────────────────────────────────────
function PhysioDashboard({ user }) {
  const [patients, setPatients] = useState([])
  const [appointments, setAppointments] = useState([])
  const [records, setRecords] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/physio/my-patients'),
      api.get('/appointments'),
    ]).then(async ([p, a]) => {
      setPatients(p.data)
      setAppointments(a.data)
      let totalRecords = 0
      for (const pat of p.data.slice(0, 10)) {
        try {
          const r = await api.get(`/physio/clients/${pat.id}/records`)
          totalRecords += r.data.length
        } catch {}
      }
      setRecords(totalRecords)
    }).finally(() => setLoading(false))
  }, [])

  const today = appointments.filter(a => isToday(new Date(a.scheduled_at)))
  const upcoming = appointments
    .filter(a => new Date(a.scheduled_at) >= new Date() && a.status !== 'cancelado')
    .slice(0, 5)

  const statusColor = {
    agendado: 'bg-blue-100 text-blue-700',
    confirmado: 'bg-green-100 text-green-700',
    realizado: 'bg-gray-100 text-gray-600',
    cancelado: 'bg-red-100 text-red-600',
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Olá, {user?.name?.split(' ')[0]} 🦴</h1>
        <p className="text-gray-400 text-sm mt-1">
          {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Pacientes', value: patients.length, icon: Users },
          { label: 'Sessões hoje', value: today.length, icon: CalendarDays },
          { label: 'Prontuários', value: records, icon: Activity },
          { label: 'Próximas sessões', value: upcoming.length, icon: Clock },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="card flex items-center gap-4">
            <div className="p-3 rounded-xl text-purple-400 bg-purple-900/30"><Icon className="w-5 h-5" /></div>
            <div>
              <p className="text-2xl font-bold text-white">{loading ? '—' : value}</p>
              <p className="text-xs text-gray-400">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Próximas sessões</h2>
            <Link to="/agenda" className="text-xs text-primary-700 hover:underline">Ver agenda</Link>
          </div>
          {upcoming.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">Nenhuma sessão agendada</p>
          ) : (
            <ul className="space-y-3">
              {upcoming.map(a => (
                <li key={a.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{a.patient_name}</p>
                    <p className="text-xs text-gray-400">
                      {isToday(new Date(a.scheduled_at)) ? 'Hoje' : format(new Date(a.scheduled_at), "dd/MM")} — {format(new Date(a.scheduled_at), 'HH:mm')}
                    </p>
                  </div>
                  <span className={`badge ${statusColor[a.status] || 'bg-gray-100 text-gray-600'}`}>{a.status}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Pacientes recentes</h2>
            <Link to="/physio/patients" className="text-xs text-primary-700 hover:underline">Ver todos</Link>
          </div>
          {patients.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">Nenhum paciente cadastrado</p>
          ) : (
            <ul className="space-y-3">
              {patients.slice(0, 5).map(p => (
                <li key={p.id}>
                  <Link to={`/physio/patients/${p.id}`}
                    className="flex items-center gap-3 hover:bg-purple-900/20 rounded-lg p-1.5 -mx-1.5 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-purple-900/30 text-purple-400 flex items-center justify-center text-sm font-bold">
                      {p.name[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{p.name}</p>
                      <p className="text-xs text-gray-400">{p.phone || p.email || '—'}</p>
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

// ── Componente principal — escolhe dashboard pelo role ────────────────
export default function Dashboard() {
  const { user } = useAuth()
  const role = user?.role || 'nutritionist'

  if (role === 'personal_trainer') return <PersonalDashboard user={user} />
  if (role === 'physiotherapist') return <PhysioDashboard user={user} />
  return <NutritionistDashboard user={user} />
}
