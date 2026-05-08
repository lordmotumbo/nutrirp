import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, ClipboardList, Utensils, CalendarDays,
  Pencil, Trash2, TrendingUp, Plus, FlaskConical, Pill, MessageSquare, Activity, FileText, UserPlus, X, BookOpen, Share2
} from 'lucide-react'
import api from '../api'
import toast from 'react-hot-toast'
import PatientModal from '../components/PatientModal'
import EvolutionModal from '../components/EvolutionModal'
import SharePatientModal from '../components/SharePatientModal'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts'

const GOAL_LABEL = {
  emagrecimento: 'Emagrecimento',
  ganho_massa: 'Ganho de Massa',
  manutencao: 'Manutenção',
  saude: 'Saúde Geral',
}

export default function PatientDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [patient, setPatient] = useState(null)
  const [diets, setDiets] = useState([])
  const [evolutions, setEvolutions] = useState([])
  const [showEdit, setShowEdit] = useState(false)
  const [showEvo, setShowEvo] = useState(false)
  const [showPortalModal, setShowPortalModal] = useState(false)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [showDailyReport, setShowDailyReport] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [dailyReportDate, setDailyReportDate] = useState(new Date().toISOString().slice(0, 10))
  const [dailyReport, setDailyReport] = useState(null)
  const [dailyReportLoading, setDailyReportLoading] = useState(false)
  const [portalForm, setPortalForm] = useState({ email: '', password: '' })
  const [portalLoading, setPortalLoading] = useState(false)
  const [scheduleForm, setScheduleForm] = useState({ date: '', time: '09:00', duration_minutes: 60, type: 'consulta', notes: '' })
  const [scheduleLoading, setScheduleLoading] = useState(false)
  const patientPortalUrl = `${window.location.origin}/paciente/`

  async function load() {
    const [p, d, e] = await Promise.all([
      api.get(`/patients/${id}`),
      api.get(`/diets/patient/${id}`),
      api.get(`/appointments/evolution/${id}`),
    ])
    setPatient(p.data)
    setDiets(d.data)
    setEvolutions(e.data)
  }

  useEffect(() => { load() }, [id])

  async function handleUpdate(payload) {
    try {
      await api.put(`/patients/${id}`, payload)
      toast.success('Paciente atualizado!')
      setShowEdit(false)
      load()
    } catch { toast.error('Erro ao atualizar') }
  }

  async function handleDelete() {
    if (!confirm('Excluir este paciente? Todos os dados serão removidos.')) return
    try {
      await api.delete(`/patients/${id}`)
      toast.success('Paciente removido')
      navigate('/patients')
    } catch { toast.error('Erro ao excluir') }
  }

  async function handleCreatePortalAccess(e) {
    e.preventDefault()
    setPortalLoading(true)
    try {
      await api.post('/patient-portal/register', {
        patient_id: Number(id),
        email: portalForm.email,
        password: portalForm.password,
      })
      toast.success('Acesso criado! Paciente pode entrar em /paciente')
      setShowPortalModal(false)
      setPortalForm({ email: '', password: '' })
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erro ao criar acesso')
    } finally { setPortalLoading(false) }
  }

  async function handleSchedule(e) {
    e.preventDefault()
    setScheduleLoading(true)
    try {
      await api.post('/appointments', {
        patient_id: Number(id),
        scheduled_at: `${scheduleForm.date}T${scheduleForm.time}:00`,
        duration_minutes: Number(scheduleForm.duration_minutes),
        type: scheduleForm.type,
        notes: scheduleForm.notes || null,
      })
      toast.success('Consulta agendada!')
      setShowScheduleModal(false)
      setScheduleForm({ date: '', time: '09:00', duration_minutes: 60, type: 'consulta', notes: '' })
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erro ao agendar')
    } finally { setScheduleLoading(false) }
  }

  async function loadDailyReport() {
    setDailyReportLoading(true)
    try {
      const { data } = await api.get(`/reports/patient/${id}/daily/${dailyReportDate}`)
      setDailyReport(data)
    } catch { toast.error('Erro ao carregar relatório') }
    finally { setDailyReportLoading(false) }
  }

  async function handleAddEvolution(payload) {
    try {
      await api.post('/appointments/evolution', { ...payload, patient_id: Number(id) })
      toast.success('Evolução registrada!')
      setShowEvo(false)
      load()
    } catch { toast.error('Erro ao registrar') }
  }

  if (!patient) return <p className="text-center py-10 text-gray-400">Carregando...</p>

  const bmi = patient.weight && patient.height
    ? (patient.weight / ((patient.height / 100) ** 2)).toFixed(1)
    : null

  const evoData = evolutions.map(e => ({
    data: format(new Date(e.recorded_at), 'dd/MM'),
    peso: e.weight,
  })).filter(e => e.peso)

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <Link to="/patients" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold">{patient.name}</h1>
          {patient.goal && (
            <span className="badge bg-primary-50 text-primary-700 mt-0.5">
              {GOAL_LABEL[patient.goal] || patient.goal}
            </span>
          )}
        </div>
        <button className="btn-secondary" onClick={() => setShowScheduleModal(true)} title="Agendar consulta">
          <CalendarDays className="w-4 h-4" /> Agendar
        </button>
        <button className="btn-secondary" onClick={() => setShowShare(true)} title="Compartilhar paciente">
          <Share2 className="w-4 h-4" /> Compartilhar
        </button>
        <button className="btn-secondary" onClick={() => setShowEdit(true)}>
          <Pencil className="w-4 h-4" /> Editar
        </button>
        <button className="btn-secondary" onClick={() => setShowPortalModal(true)} title="Criar acesso para o paciente">
          <UserPlus className="w-4 h-4" /> Portal
        </button>
        <button className="btn-danger" onClick={handleDelete}>
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Dados clínicos */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Peso', value: patient.weight ? `${patient.weight} kg` : '—' },
          { label: 'Altura', value: patient.height ? `${patient.height} cm` : '—' },
          { label: 'IMC', value: bmi || '—' },
          { label: 'Telefone', value: patient.phone || '—' },
        ].map(({ label, value }) => (
          <div key={label} className="card text-center">
            <p className="text-lg font-bold text-primary-700">{value}</p>
            <p className="text-xs text-gray-400">{label}</p>
          </div>
        ))}
      </div>

      {/* Ações rápidas */}
      <div className="grid grid-cols-3 md:grid-cols-7 gap-3">
        {[
          { to: `/patients/${id}/anamnese`, icon: ClipboardList, label: 'Anamnese' },
          { to: `/patients/${id}/diet`, icon: Utensils, label: 'Dieta' },
          { to: `/patients/${id}/anthropometry`, icon: Activity, label: 'Antropometria' },
          { to: `/patients/${id}/exams`, icon: FlaskConical, label: 'Exames' },
          { to: `/patients/${id}/supplements`, icon: Pill, label: 'Suplementos' },
          { to: `/patients/${id}/chat`, icon: MessageSquare, label: 'Chat' },
        ].map(({ to, icon: Icon, label }) => (
          <Link key={to} to={to} className="card flex flex-col items-center gap-2 hover:shadow-md transition-shadow text-center py-4">
            <Icon className="w-6 h-6 text-primary-600" />
            <span className="text-xs font-medium">{label}</span>
          </Link>
        ))}
        <a
          href={`${import.meta.env.VITE_API_URL || 'https://nutrirp-api.onrender.com/api'}/reports/patient/${id}/full?token=${localStorage.getItem('nutrirp_token')}`}
          target="_blank" rel="noreferrer"
          className="card flex flex-col items-center gap-2 hover:shadow-md transition-shadow text-center py-4"
        >
          <FileText className="w-6 h-6 text-primary-600" />
          <span className="text-xs font-medium">Relatório</span>
        </a>
      </div>

      {/* Evolução de peso */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary-600" /> Evolução de Peso
          </h2>
          <button className="btn-secondary text-xs py-1.5" onClick={() => setShowEvo(true)}>
            <Plus className="w-3 h-3" /> Registrar
          </button>
        </div>
        {evoData.length < 2 ? (
          <p className="text-sm text-gray-400 text-center py-6">
            Registre pelo menos 2 medições para ver o gráfico
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={evoData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="data" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} domain={['auto', 'auto']} />
              <Tooltip />
              <Line type="monotone" dataKey="peso" stroke="#2E7D32" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Diário do paciente */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary-600" /> Diário do Paciente
          </h2>
          <button className="btn-secondary text-xs py-1.5" onClick={() => { setShowDailyReport(true); loadDailyReport() }}>
            Ver relatório diário
          </button>
        </div>
        <p className="text-sm text-gray-400">Acompanhe o diário do paciente: humor, sono, água, atividade física e mais.</p>
      </div>

      {/* Dietas */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Planos Alimentares</h2>
          <Link to={`/patients/${id}/diet`} className="btn-primary text-xs py-1.5">
            <Plus className="w-3 h-3" /> Nova dieta
          </Link>
        </div>
        {diets.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">Nenhuma dieta criada</p>
        ) : (
          <ul className="space-y-2">
            {diets.map(d => (
              <li key={d.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="text-sm font-medium">{d.title}</p>
                  <p className="text-xs text-gray-400">
                    {d.total_calories ? `${d.total_calories} kcal · ` : ''}
                    {d.meals?.length || 0} refeições
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link
                    to={`/patients/${id}/diet/${d.id}/edit`}
                    className="btn-secondary text-xs py-1.5"
                  >
                    <Pencil className="w-3 h-3" /> Editar
                  </Link>
                  <a
                    href={`${import.meta.env.VITE_API_URL || 'https://nutrirp-api.onrender.com/api'}/diets/${d.id}/pdf?token=${localStorage.getItem('nutrirp_token')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-secondary text-xs py-1.5"
                  >
                    PDF
                  </a>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {showEdit && (
        <PatientModal initial={patient} onClose={() => setShowEdit(false)} onSave={handleUpdate} />
      )}
      {showEvo && (
        <EvolutionModal onClose={() => setShowEvo(false)} onSave={handleAddEvolution} />
      )}
      {showShare && (
        <SharePatientModal
          patient={patient}
          onClose={() => setShowShare(false)}
          onShared={load}
        />
      )}

      {/* Modal agendar consulta */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b dark:border-gray-700">
              <h2 className="font-semibold dark:text-white">📅 Agendar Consulta — {patient.name}</h2>
              <button onClick={() => setShowScheduleModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleSchedule} className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Data *</label>
                  <input type="date" className="input" value={scheduleForm.date}
                    onChange={e => setScheduleForm(f => ({ ...f, date: e.target.value }))} required />
                </div>
                <div>
                  <label className="label">Horário *</label>
                  <input type="time" className="input" value={scheduleForm.time}
                    onChange={e => setScheduleForm(f => ({ ...f, time: e.target.value }))} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Duração (min)</label>
                  <input type="number" className="input" value={scheduleForm.duration_minutes}
                    onChange={e => setScheduleForm(f => ({ ...f, duration_minutes: e.target.value }))} min={15} step={15} />
                </div>
                <div>
                  <label className="label">Tipo</label>
                  <select className="input" value={scheduleForm.type}
                    onChange={e => setScheduleForm(f => ({ ...f, type: e.target.value }))}>
                    <option value="consulta">Consulta</option>
                    <option value="retorno">Retorno</option>
                    <option value="avaliacao">Avaliação</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Observações</label>
                <textarea className="input" rows={2} value={scheduleForm.notes}
                  onChange={e => setScheduleForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
              <div className="flex gap-3">
                <button type="button" className="btn-secondary flex-1 justify-center" onClick={() => setShowScheduleModal(false)}>Cancelar</button>
                <button type="submit" className="btn-primary flex-1 justify-center" disabled={scheduleLoading}>
                  <CalendarDays className="w-4 h-4" /> {scheduleLoading ? 'Agendando...' : 'Agendar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal relatório diário */}
      {showDailyReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-lg max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-900 z-10">
              <h2 className="font-semibold dark:text-white">📋 Diário — {patient.name}</h2>
              <button onClick={() => setShowDailyReport(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div className="flex gap-3">
                <input
                  type="date"
                  className="input flex-1"
                  value={dailyReportDate}
                  onChange={e => setDailyReportDate(e.target.value)}
                />
                <button className="btn-primary" onClick={loadDailyReport} disabled={dailyReportLoading}>
                  {dailyReportLoading ? 'Carregando...' : 'Buscar'}
                </button>
              </div>

              {dailyReport && (
                dailyReport.has_data ? (
                  <div className="space-y-4">
                    {/* Resumo */}
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: '💧 Água total', value: `${dailyReport.summary.total_water_ml}ml` },
                        { label: '😴 Sono total', value: `${dailyReport.summary.total_sleep_hours}h` },
                        { label: '🥗 Adesão dieta', value: `${dailyReport.summary.avg_diet_adherence}%` },
                        { label: '⚡ Energia média', value: `${dailyReport.summary.avg_energy?.toFixed(1) || '—'}/5` },
                        { label: '😤 Estresse médio', value: `${dailyReport.summary.avg_stress?.toFixed(1) || '—'}/5` },
                        { label: '🏃 Atividades', value: dailyReport.summary.activities.join(', ') || '—' },
                      ].map(({ label, value }) => (
                        <div key={label} className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                          <p className="text-xs text-gray-400">{label}</p>
                          <p className="font-semibold text-sm dark:text-white truncate">{value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Registros detalhados */}
                    {dailyReport.entries.map((entry, i) => (
                      <div key={i} className="border rounded-xl p-4 space-y-2 dark:border-gray-700">
                        <p className="text-xs text-gray-400 font-medium">
                          Registro {i + 1} {entry.date ? `— ${format(new Date(entry.date), 'HH:mm')}` : ''}
                        </p>
                        <div className="grid grid-cols-2 gap-2 text-sm dark:text-gray-300">
                          {entry.mood && <span>Humor: {entry.mood}</span>}
                          {entry.sleep_hours && <span>Sono: {entry.sleep_hours}h {entry.sleep_quality ? `(${entry.sleep_quality})` : ''}</span>}
                          {entry.water_ml && <span>Água: {entry.water_ml}ml</span>}
                          {entry.hunger_level && <span>Fome: {entry.hunger_level}/5</span>}
                          {entry.energy_level && <span>Energia: {entry.energy_level}/5</span>}
                          {entry.stress_level && <span>Estresse: {entry.stress_level}/5</span>}
                          {entry.bowel_function && <span>Intestino: {entry.bowel_function}</span>}
                          {entry.diet_adherence && <span>Adesão: {entry.diet_adherence}%</span>}
                        </div>
                        {entry.physical_activity && (
                          <p className="text-sm dark:text-gray-300">
                            🏃 {entry.physical_activity}
                            {entry.activity_duration_min && ` · ${entry.activity_duration_min}min`}
                            {entry.activity_intensity && ` · ${entry.activity_intensity}`}
                          </p>
                        )}
                        {entry.symptoms && <p className="text-sm text-orange-500">⚠️ Sintomas: {entry.symptoms}</p>}
                        {entry.medications_taken && <p className="text-sm text-blue-500">💊 {entry.medications_taken}</p>}
                        {entry.notes && <p className="text-sm text-gray-500 italic">{entry.notes}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-4xl mb-2">📭</p>
                    <p className="text-gray-500">Nenhum registro para este dia</p>
                    <p className="text-xs text-gray-400 mt-1">O paciente não preencheu o diário nesta data</p>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal criar acesso portal do paciente */}
      {showPortalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b dark:border-gray-700">
              <div>
                <h2 className="font-semibold dark:text-white">Criar Acesso — Portal do Paciente</h2>
                <p className="text-xs text-gray-400 mt-0.5">O paciente poderá acessar em <b>/paciente</b></p>
              </div>
              <button onClick={() => setShowPortalModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleCreatePortalAccess} className="px-6 py-5 space-y-4">
              <div>
                <label className="label">E-mail do paciente *</label>
                <input
                  type="email" className="input"
                  value={portalForm.email}
                  onChange={e => setPortalForm(f => ({ ...f, email: e.target.value }))}
                  placeholder={patient?.email || 'email@exemplo.com'}
                  required
                />
              </div>
              <div>
                <label className="label">Senha inicial *</label>
                <input
                  type="password" className="input"
                  value={portalForm.password}
                  onChange={e => setPortalForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="Mínimo 6 caracteres"
                  required minLength={6}
                />
              </div>
              <p className="text-xs text-gray-400">
                Envie o e-mail e senha para o paciente. Ele acessa em:<br />
                <a
                  href={patientPortalUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block mt-1 font-mono text-primary-600 hover:underline break-all"
                  title="Abrir login do paciente"
                >
                  {patientPortalUrl}
                </a>
              </p>
              <div className="flex gap-3">
                <button type="button" className="btn-secondary flex-1 justify-center" onClick={() => setShowPortalModal(false)}>Cancelar</button>
                <button type="submit" className="btn-primary flex-1 justify-center" disabled={portalLoading}>
                  <UserPlus className="w-4 h-4" /> {portalLoading ? 'Criando...' : 'Criar acesso'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
