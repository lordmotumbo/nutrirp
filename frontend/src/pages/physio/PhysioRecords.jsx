import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Activity, X, Trash2 } from 'lucide-react'
import api from '../../api'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function PhysioRecords() {
  const [patients, setPatients] = useState([])
  const [records, setRecords] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({
    client_id: '',
    pain_level: '',
    pain_location: '',
    pain_type: '',
    mobility_notes: '',
    injury_history: '',
    diagnosis: '',
    treatment_plan: '',
    session_notes: '',
    recommendations: '',
  })

  async function load() {
    try {
      const { data } = await api.get('/physio/my-patients')
      setPatients(data)
      const allRecords = []
      for (const p of data.slice(0, 20)) {
        try {
          const r = await api.get(`/physio/clients/${p.id}/records`)
          allRecords.push(...r.data.map(rec => ({ ...rec, patient_name: p.name })))
        } catch {}
      }
      setRecords(allRecords.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)))
    } catch {}
  }

  useEffect(() => { load() }, [])

  async function handleCreate(e) {
    e.preventDefault()
    try {
      const payload = { ...form, client_id: Number(form.client_id) }
      if (payload.pain_level) payload.pain_level = parseInt(payload.pain_level)
      Object.keys(payload).forEach(k => { if (payload[k] === '') delete payload[k] })
      await api.post('/physio/records', payload)
      toast.success('Prontuário criado!')
      setShowModal(false)
      load()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erro ao criar prontuário')
    }
  }

  async function deleteRecord(id) {
    if (!confirm('Excluir este prontuário?')) return
    try {
      await api.delete(`/physio/records/${id}`)
      toast.success('Prontuário removido')
      load()
    } catch { toast.error('Erro') }
  }

  const PAIN_TYPES = ['aguda', 'crônica', 'irradiada', 'difusa', 'muscular', 'articular']

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Prontuários</h1>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4" /> Novo prontuário
        </button>
      </div>

      {records.length === 0 ? (
        <div className="card text-center py-12">
          <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Nenhum prontuário criado</p>
        </div>
      ) : (
        <div className="space-y-3">
          {records.map(r => (
            <div key={r.id} className="card">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-semibold">{r.patient_name}</p>
                  <p className="text-sm text-gray-400">
                    {r.diagnosis || r.pain_location || 'Sem diagnóstico'}
                    {r.pain_level != null && ` · Dor: ${r.pain_level}/10`}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {format(new Date(r.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link to={`/physio/records/${r.id}`} className="btn-secondary text-xs py-1.5">
                    Ver
                  </Link>
                  <button onClick={() => deleteRecord(r.id)} className="text-red-400 hover:text-red-600 p-1.5">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal novo prontuário */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-[#0f0f1c] rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-purple-900/30">
            <div className="flex items-center justify-between px-6 py-4 border-b border-purple-900/30 sticky top-0 bg-[#0f0f1c]">
              <h2 className="font-semibold text-white">Novo Prontuário</h2>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleCreate} className="px-6 py-5 space-y-4">
              <div>
                <label className="label">Paciente *</label>
                <select className="input" value={form.client_id} onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))} required>
                  <option value="">Selecione...</option>
                  {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Nível de dor (0-10)</label>
                  <input type="number" min="0" max="10" className="input" value={form.pain_level}
                    onChange={e => setForm(f => ({ ...f, pain_level: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Localização da dor</label>
                  <input className="input" value={form.pain_location}
                    onChange={e => setForm(f => ({ ...f, pain_location: e.target.value }))}
                    placeholder="ex: joelho direito" />
                </div>
              </div>
              <div>
                <label className="label">Tipo de dor</label>
                <div className="flex flex-wrap gap-2">
                  {PAIN_TYPES.map(t => (
                    <button key={t} type="button"
                      onClick={() => setForm(f => ({ ...f, pain_type: t }))}
                      className={`px-3 py-1.5 rounded-lg text-sm border-2 transition-all ${form.pain_type === t ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)]' : 'border-gray-200'}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label">Histórico de lesões</label>
                <textarea className="input" rows={2} value={form.injury_history}
                  onChange={e => setForm(f => ({ ...f, injury_history: e.target.value }))} />
              </div>
              <div>
                <label className="label">Diagnóstico fisioterapêutico</label>
                <textarea className="input" rows={2} value={form.diagnosis}
                  onChange={e => setForm(f => ({ ...f, diagnosis: e.target.value }))} />
              </div>
              <div>
                <label className="label">Plano de tratamento</label>
                <textarea className="input" rows={2} value={form.treatment_plan}
                  onChange={e => setForm(f => ({ ...f, treatment_plan: e.target.value }))} />
              </div>
              <div>
                <label className="label">Notas da sessão</label>
                <textarea className="input" rows={2} value={form.session_notes}
                  onChange={e => setForm(f => ({ ...f, session_notes: e.target.value }))} />
              </div>
              <div>
                <label className="label">Recomendações para casa</label>
                <textarea className="input" rows={2} value={form.recommendations}
                  onChange={e => setForm(f => ({ ...f, recommendations: e.target.value }))} />
              </div>
              <div className="flex gap-3">
                <button type="button" className="btn-secondary flex-1 justify-center" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn-primary flex-1 justify-center">Criar prontuário</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
