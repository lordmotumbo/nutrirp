import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, ClipboardList, Utensils, CalendarDays,
  Pencil, Trash2, TrendingUp, Plus, FlaskConical, Pill, MessageSquare, Activity
} from 'lucide-react'
import api from '../api'
import toast from 'react-hot-toast'
import PatientModal from '../components/PatientModal'
import EvolutionModal from '../components/EvolutionModal'
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
      <div className="flex items-center gap-3">
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
        <button className="btn-secondary" onClick={() => setShowEdit(true)}>
          <Pencil className="w-4 h-4" /> Editar
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
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
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
                <a
                  href={`/api/diets/${d.id}/pdf`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-secondary text-xs py-1.5"
                >
                  PDF
                </a>
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
    </div>
  )
}
