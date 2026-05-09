import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Activity, AlertTriangle, Plus, X, FileText, Share2 } from 'lucide-react'
import api from '../../api'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import SharePatientModal from '../../components/SharePatientModal'

export default function PhysioPatientDetail() {
  const { id } = useParams()
  const [patient, setPatient] = useState(null)
  const [records, setRecords] = useState([])
  const [restrictions, setRestrictions] = useState([])
  const [showRestriction, setShowRestriction] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [error, setError] = useState(null)
  const [restrictionForm, setRestrictionForm] = useState({
    restriction_type: 'lesao',
    severity: 'moderada',
    description: '',
    affected_area: '',
  })

  async function load() {
    try {
      const [p, r, res] = await Promise.all([
        api.get(`/patients/${id}`),
        api.get(`/physio/clients/${id}/records`).catch(() => ({ data: [] })),
        api.get(`/physio/clients/${id}/restrictions`).catch(() => ({ data: [] })),
      ])
      setPatient(p.data)
      setRecords(r.data)
      setRestrictions(res.data)
      setError(null)
    } catch (err) {
      setError(err.response?.data?.detail || 'Erro ao carregar paciente')
    }
  }

  useEffect(() => { load() }, [id])

  async function handleAddRestriction(e) {
    e.preventDefault()
    try {
      await api.post(`/physio/clients/${id}/restrictions`, restrictionForm)
      toast.success('Restrição adicionada!')
      setShowRestriction(false)
      load()
    } catch { toast.error('Erro ao adicionar restrição') }
  }

  if (error) return (
    <div className="card text-center py-12 max-w-md mx-auto mt-10">
      <p className="text-4xl mb-3">⚠️</p>
      <p className="text-gray-700 font-medium">{error}</p>
      <Link to="/physio/patients" className="btn-secondary mt-4 inline-flex">
        <ArrowLeft className="w-4 h-4" /> Voltar
      </Link>
    </div>
  )

  if (!patient) return (
    <div className="flex items-center justify-center py-20">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-gray-400 text-sm">Carregando paciente...</p>
      </div>
    </div>
  )

  const RESTRICTION_TYPES = ['lesao', 'doenca', 'cirurgia', 'alergia', 'medicamento', 'outro']
  const SEVERITIES = ['leve', 'moderada', 'grave']

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/physio/patients" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold">{patient.name}</h1>
          <p className="text-sm text-gray-400">
            {patient.weight && `${patient.weight}kg`}
            {patient.height && ` · ${patient.height}cm`}
            {patient.gender && ` · ${patient.gender}`}
          </p>
        </div>
        <Link to={`/physio/records/new?client=${id}`} className="btn-primary">
          <Plus className="w-4 h-4" /> Novo prontuário
        </Link>
        <button
          className="btn-secondary"
          onClick={() => setShowShare(true)}
          title="Compartilhar com outro profissional"
        >
          <Share2 className="w-4 h-4" /> Compartilhar
        </button>
      </div>

      {/* Restrições */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-500" /> Restrições Físicas
          </h2>
          <button className="btn-secondary text-xs py-1.5" onClick={() => setShowRestriction(true)}>
            <Plus className="w-3 h-3" /> Adicionar
          </button>
        </div>
        {restrictions.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">Nenhuma restrição registrada</p>
        ) : (
          <div className="space-y-2">
            {restrictions.map(r => (
              <div key={r.id} className="flex items-start gap-3 py-2 border-b last:border-0">
                <span className={`badge text-xs flex-shrink-0 ${
                  r.severity === 'grave' ? 'bg-red-100 text-red-700' :
                  r.severity === 'moderada' ? 'bg-orange-100 text-orange-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {r.restriction_type} · {r.severity}
                </span>
                <div>
                  <p className="text-sm">{r.description}</p>
                  {r.affected_area && <p className="text-xs text-gray-400">{r.affected_area}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Prontuários */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary-600" /> Prontuários
          </h2>
        </div>
        {records.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">Nenhum prontuário criado</p>
        ) : (
          <div className="space-y-3">
            {records.map(r => (
              <div key={r.id} className="border rounded-xl p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm font-medium">
                      {r.diagnosis || 'Sem diagnóstico'}
                    </p>
                    <p className="text-xs text-gray-400">
                      {format(new Date(r.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      {r.pain_level != null && ` · Dor: ${r.pain_level}/10`}
                      {r.pain_location && ` · ${r.pain_location}`}
                    </p>
                  </div>
                  <Link to={`/physio/records/${r.id}`} className="btn-secondary text-xs py-1.5">
                    Ver
                  </Link>
                </div>
                {r.session_notes && (
                  <p className="text-xs text-gray-500 italic">{r.session_notes.slice(0, 100)}{r.session_notes.length > 100 ? '...' : ''}</p>
                )}
                {r.recommendations && (
                  <p className="text-xs text-blue-600 mt-1">💡 {r.recommendations.slice(0, 80)}{r.recommendations.length > 80 ? '...' : ''}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal restrição */}
      {showRestriction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b dark:border-gray-700">
              <h2 className="font-semibold dark:text-white">Adicionar Restrição</h2>
              <button onClick={() => setShowRestriction(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleAddRestriction} className="px-6 py-5 space-y-4">
              <div>
                <label className="label">Tipo de restrição</label>
                <div className="flex flex-wrap gap-2">
                  {RESTRICTION_TYPES.map(t => (
                    <button key={t} type="button"
                      onClick={() => setRestrictionForm(f => ({ ...f, restriction_type: t }))}
                      className={`px-3 py-1.5 rounded-lg text-sm border-2 transition-all ${restrictionForm.restriction_type === t ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)]' : 'border-gray-200'}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label">Gravidade</label>
                <div className="flex gap-2">
                  {SEVERITIES.map(s => (
                    <button key={s} type="button"
                      onClick={() => setRestrictionForm(f => ({ ...f, severity: s }))}
                      className={`flex-1 py-2 rounded-lg text-sm border-2 font-medium transition-all ${restrictionForm.severity === s ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)]' : 'border-gray-200'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label">Descrição *</label>
                <textarea className="input" rows={2} required
                  value={restrictionForm.description}
                  onChange={e => setRestrictionForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Descreva a restrição..." />
              </div>
              <div>
                <label className="label">Área afetada</label>
                <input className="input" value={restrictionForm.affected_area}
                  onChange={e => setRestrictionForm(f => ({ ...f, affected_area: e.target.value }))}
                  placeholder="ex: joelho direito, coluna lombar..." />
              </div>
              <div className="flex gap-3">
                <button type="button" className="btn-secondary flex-1 justify-center" onClick={() => setShowRestriction(false)}>Cancelar</button>
                <button type="submit" className="btn-primary flex-1 justify-center">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal compartilhar */}
      {showShare && patient && (
        <SharePatientModal
          patient={patient}
          onClose={() => setShowShare(false)}
          onShared={load}
        />
      )}
    </div>
  )
}
