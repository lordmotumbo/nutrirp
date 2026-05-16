import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Dumbbell, Search, X, ChevronDown, ChevronUp, Trash2 } from 'lucide-react'
import api from '../../api'
import toast from 'react-hot-toast'

export default function PersonalWorkouts() {
  const [clients, setClients] = useState([])
  const [plans, setPlans] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({
    client_id: '', title: '', objective: '', observations: '',
    start_date: '', end_date: '', frequency_per_week: 3,
  })

  async function load() {
    try {
      const { data } = await api.get('/personal/my-clients')
      setClients(data)
      // Carrega planos de todos os clientes
      const allPlans = []
      for (const c of data.slice(0, 20)) {
        try {
          const r = await api.get(`/personal/clients/${c.id}/plans`)
          allPlans.push(...r.data.map(p => ({ ...p, client_name: c.name })))
        } catch {}
      }
      setPlans(allPlans)
    } catch {}
  }

  useEffect(() => { load() }, [])

  async function handleCreate(e) {
    e.preventDefault()
    try {
      await api.post('/personal/plans', {
        ...form,
        client_id: Number(form.client_id),
        frequency_per_week: Number(form.frequency_per_week),
        start_date: form.start_date || null,
        end_date: form.end_date || null,
      })
      toast.success('Plano criado!')
      setShowModal(false)
      setForm({ client_id: '', title: '', objective: '', observations: '', start_date: '', end_date: '', frequency_per_week: 3 })
      load()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erro ao criar plano')
    }
  }

  async function deletePlan(id) {
    if (!confirm('Excluir este plano de treino?')) return
    try {
      await api.delete(`/personal/plans/${id}`)
      toast.success('Plano removido')
      load()
    } catch { toast.error('Erro') }
  }

  const OBJECTIVES = [
    { value: 'hipertrofia', label: '💪 Hipertrofia' },
    { value: 'emagrecimento', label: '🔥 Emagrecimento' },
    { value: 'condicionamento', label: '🏃 Condicionamento' },
    { value: 'forca', label: '🏋️ Força' },
    { value: 'reabilitacao', label: '🦴 Reabilitação' },
    { value: 'manutencao', label: '⚖️ Manutenção' },
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Planos de Treino</h1>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4" /> Novo plano
        </button>
      </div>

      {plans.length === 0 ? (
        <div className="card text-center py-12">
          <Dumbbell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Nenhum plano de treino criado</p>
        </div>
      ) : (
        <div className="space-y-3">
          {plans.map(p => (
            <div key={p.id} className="card">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-semibold">{p.title}</p>
                  <p className="text-sm text-gray-400">
                    {p.client_name} · {p.objective || 'Sem objetivo'} · {p.frequency_per_week}x/semana
                  </p>
                  {p.start_date && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(p.start_date).toLocaleDateString('pt-BR')}
                      {p.end_date && ` → ${new Date(p.end_date).toLocaleDateString('pt-BR')}`}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Link
                    to={`/personal/plans/${p.id}`}
                    className="btn-secondary text-xs py-1.5"
                  >
                    Abrir treino
                  </Link>
                  <button
                    onClick={() => deletePlan(p.id)}
                    className="text-red-400 hover:text-red-600 p-1.5"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal novo plano */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-[#0f0f1c] rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto border border-purple-900/30">
            <div className="flex items-center justify-between px-6 py-4 border-b border-purple-900/30 sticky top-0 bg-[#0f0f1c]">
              <h2 className="font-semibold text-white">Novo Plano de Treino</h2>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleCreate} className="px-6 py-5 space-y-4">
              <div>
                <label className="label">Paciente *</label>
                <select className="input" value={form.client_id} onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))} required>
                  <option value="">Selecione...</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Título do plano *</label>
                <input className="input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required placeholder="ex: Treino ABC — Hipertrofia" />
              </div>
              <div>
                <label className="label">Objetivo</label>
                <div className="grid grid-cols-2 gap-2">
                  {OBJECTIVES.map(o => (
                    <button key={o.value} type="button"
                      onClick={() => setForm(f => ({ ...f, objective: o.value }))}
                      className={`py-2 rounded-lg text-sm border-2 transition-all ${form.objective === o.value ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)]' : 'border-gray-200'}`}>
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label">Frequência semanal</label>
                <div className="flex gap-2">
                  {[2, 3, 4, 5, 6].map(n => (
                    <button key={n} type="button"
                      onClick={() => setForm(f => ({ ...f, frequency_per_week: n }))}
                      className={`flex-1 py-2 rounded-lg text-sm border-2 font-medium transition-all ${form.frequency_per_week === n ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)]' : 'border-gray-200'}`}>
                      {n}x
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Início</label>
                  <input type="date" className="input" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Fim</label>
                  <input type="date" className="input" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="label">Observações</label>
                <textarea className="input" rows={2} value={form.observations} onChange={e => setForm(f => ({ ...f, observations: e.target.value }))} />
              </div>
              <div className="flex gap-3">
                <button type="button" className="btn-secondary flex-1 justify-center" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn-primary flex-1 justify-center">Criar plano</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
