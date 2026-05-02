import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2, X, Pill } from 'lucide-react'
import api from '../api'
import toast from 'react-hot-toast'

const TYPES = ['suplemento', 'fitoterápico', 'vitamina', 'mineral', 'aminoácido', 'outro']

export default function Supplements() {
  const { id } = useParams()
  const [patient, setPatient] = useState(null)
  const [supplements, setSupplements] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name: '', type: 'suplemento', dosage: '', frequency: '', timing: '', duration: '', brand: '', justification: '', contraindications: '' })
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  async function load() {
    const [p, s] = await Promise.all([api.get(`/patients/${id}`), api.get(`/exams/supplement/patient/${id}`)])
    setPatient(p.data); setSupplements(s.data)
  }

  useEffect(() => { load() }, [id])

  async function handleCreate(e) {
    e.preventDefault()
    try {
      await api.post('/exams/supplement', { ...form, patient_id: Number(id) })
      toast.success('Prescrição salva!')
      setShowModal(false)
      setForm({ name: '', type: 'suplemento', dosage: '', frequency: '', timing: '', duration: '', brand: '', justification: '', contraindications: '' })
      load()
    } catch { toast.error('Erro ao salvar') }
  }

  async function handleDelete(sid) {
    if (!confirm('Remover prescrição?')) return
    await api.delete(`/exams/supplement/${sid}`)
    toast.success('Removido')
    load()
  }

  const typeColor = { suplemento: 'bg-blue-100 text-blue-700', fitoterápico: 'bg-green-100 text-green-700', vitamina: 'bg-yellow-100 text-yellow-700', mineral: 'bg-purple-100 text-purple-700', aminoácido: 'bg-orange-100 text-orange-700', outro: 'bg-gray-100 text-gray-600' }

  return (
    <div className="max-w-3xl space-y-5">
      <div className="flex items-center gap-3">
        <Link to={`/patients/${id}`} className="text-gray-400 hover:text-gray-600"><ArrowLeft className="w-5 h-5" /></Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold">Suplementos & Fitoterápicos</h1>
          {patient && <p className="text-sm text-gray-500">{patient.name}</p>}
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}><Plus className="w-4 h-4" /> Prescrever</button>
      </div>

      {supplements.length === 0 ? (
        <div className="card text-center py-12">
          <Pill className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400">Nenhuma prescrição ativa</p>
        </div>
      ) : (
        <div className="space-y-3">
          {supplements.map(s => (
            <div key={s.id} className="card">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold">{s.name}</p>
                    <span className={`badge ${typeColor[s.type] || 'bg-gray-100 text-gray-600'}`}>{s.type}</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-500">
                    {s.dosage && <span>💊 {s.dosage}</span>}
                    {s.frequency && <span>🔄 {s.frequency}</span>}
                    {s.timing && <span>⏰ {s.timing}</span>}
                    {s.duration && <span>📅 {s.duration}</span>}
                    {s.brand && <span>🏷 {s.brand}</span>}
                  </div>
                  {s.justification && <p className="text-xs text-gray-400 mt-1 italic">{s.justification}</p>}
                  {s.contraindications && <p className="text-xs text-red-400 mt-1">⚠️ {s.contraindications}</p>}
                </div>
                <button onClick={() => handleDelete(s.id)} className="text-gray-300 hover:text-red-400 ml-3"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="font-semibold">Nova Prescrição</h2>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleCreate} className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Nome *</label><input className="input" value={form.name} onChange={set('name')} required /></div>
                <div><label className="label">Tipo</label>
                  <select className="input" value={form.type} onChange={set('type')}>
                    {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Dosagem</label><input className="input" value={form.dosage} onChange={set('dosage')} placeholder="ex: 500mg" /></div>
                <div><label className="label">Frequência</label><input className="input" value={form.frequency} onChange={set('frequency')} placeholder="ex: 2x ao dia" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Horário</label><input className="input" value={form.timing} onChange={set('timing')} placeholder="ex: antes do treino" /></div>
                <div><label className="label">Duração</label><input className="input" value={form.duration} onChange={set('duration')} placeholder="ex: 3 meses" /></div>
              </div>
              <div><label className="label">Marca</label><input className="input" value={form.brand} onChange={set('brand')} /></div>
              <div><label className="label">Justificativa</label><textarea className="input" rows={2} value={form.justification} onChange={set('justification')} /></div>
              <div><label className="label">Contraindicações</label><textarea className="input" rows={2} value={form.contraindications} onChange={set('contraindications')} /></div>
              <div className="flex gap-3">
                <button type="button" className="btn-secondary flex-1 justify-center" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn-primary flex-1 justify-center">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
