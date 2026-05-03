import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Plus, X } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const BASE = import.meta.env.VITE_API_URL || 'https://nutrirp-api.onrender.com/api'
const api = () => axios.create({ baseURL: BASE, headers: { Authorization: `Bearer ${localStorage.getItem('nutrirp_patient_token')}` } })

const MOODS = [
  { value: 'otimo', label: '😄 Ótimo' },
  { value: 'bom', label: '🙂 Bom' },
  { value: 'regular', label: '😐 Regular' },
  { value: 'ruim', label: '😔 Ruim' },
]

export default function PatientDiary() {
  const [entries, setEntries] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0, 16), mood: 'bom', sleep_hours: '', water_ml: '', physical_activity: '', diet_adherence: 80, notes: '' })
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  async function load() {
    const { data } = await api().get('/patient-portal/diary')
    setEntries(data)
  }

  useEffect(() => { load() }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      const payload = { ...form }
      if (payload.sleep_hours) payload.sleep_hours = parseFloat(payload.sleep_hours)
      if (payload.water_ml) payload.water_ml = parseInt(payload.water_ml)
      payload.diet_adherence = parseInt(payload.diet_adherence)
      await api().post('/patient-portal/diary', payload)
      toast.success('Registrado!')
      setShowModal(false)
      load()
    } catch { toast.error('Erro ao salvar') }
  }

  const moodEmoji = { otimo: '😄', bom: '🙂', regular: '😐', ruim: '😔' }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="text-white px-5 py-4 flex items-center gap-3" style={{ backgroundColor: 'var(--color-primary)' }}>
        <Link to="/patient/dashboard"><ArrowLeft className="w-5 h-5" /></Link>
        <h1 className="font-bold text-lg">Meu Diário</h1>
      </header>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">
        <button className="btn-primary w-full justify-center" onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4" /> Novo registro
        </button>

        {entries.length === 0 ? (
          <p className="text-center text-gray-400 py-10">Nenhum registro ainda</p>
        ) : entries.map(e => (
          <div key={e.id} className="card">
            <div className="flex items-center justify-between mb-2">
              <p className="font-semibold dark:text-white">
                {moodEmoji[e.mood] || '📝'} {format(new Date(e.date), "dd 'de' MMMM", { locale: ptBR })}
              </p>
              <span className="text-xs text-gray-400">{format(new Date(e.date), 'HH:mm')}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs text-gray-500 mb-2">
              {e.sleep_hours && <span>😴 {e.sleep_hours}h sono</span>}
              {e.water_ml && <span>💧 {e.water_ml}ml água</span>}
              {e.diet_adherence && <span>🥗 {e.diet_adherence}% dieta</span>}
            </div>
            {e.physical_activity && <p className="text-xs text-gray-500">🏃 {e.physical_activity}</p>}
            {e.notes && <p className="text-xs text-gray-400 mt-1 italic">{e.notes}</p>}
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
          <div className="bg-white dark:bg-gray-900 rounded-t-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b dark:border-gray-700">
              <h2 className="font-semibold dark:text-white">Novo Registro</h2>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
              <div><label className="label">Data e hora</label>
                <input type="datetime-local" className="input" value={form.date} onChange={set('date')} /></div>
              <div>
                <label className="label">Como você está?</label>
                <div className="grid grid-cols-4 gap-2">
                  {MOODS.map(m => (
                    <button key={m.value} type="button"
                      onClick={() => setForm(f => ({ ...f, mood: m.value }))}
                      className={`py-2 rounded-lg text-sm border-2 transition-all ${form.mood === m.value ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)]' : 'border-gray-200'}`}>
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Sono (horas)</label>
                  <input type="number" step="0.5" className="input" value={form.sleep_hours} onChange={set('sleep_hours')} /></div>
                <div><label className="label">Água (ml)</label>
                  <input type="number" className="input" value={form.water_ml} onChange={set('water_ml')} placeholder="ex: 2000" /></div>
              </div>
              <div><label className="label">Atividade física</label>
                <input className="input" value={form.physical_activity} onChange={set('physical_activity')} placeholder="ex: Caminhada 30min" /></div>
              <div>
                <label className="label">Adesão à dieta: {form.diet_adherence}%</label>
                <input type="range" min="0" max="100" step="5" className="w-full" value={form.diet_adherence} onChange={set('diet_adherence')} />
              </div>
              <div><label className="label">Observações</label>
                <textarea className="input" rows={2} value={form.notes} onChange={set('notes')} /></div>
              <button type="submit" className="btn-primary w-full justify-center">Salvar</button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
