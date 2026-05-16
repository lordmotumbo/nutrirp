import { useState } from 'react'
import { X } from 'lucide-react'

export default function EvolutionModal({ onClose, onSave }) {
  const [form, setForm] = useState({ weight: '', body_fat: '', muscle_mass: '', notes: '' })
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  function handleSubmit(e) {
    e.preventDefault()
    const payload = {}
    if (form.weight) payload.weight = parseFloat(form.weight)
    if (form.body_fat) payload.body_fat = parseFloat(form.body_fat)
    if (form.muscle_mass) payload.muscle_mass = parseFloat(form.muscle_mass)
    if (form.notes) payload.notes = form.notes
    onSave(payload)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-[#0f0f1c] rounded-2xl shadow-xl w-full max-w-sm border border-purple-900/30">
        <div className="flex items-center justify-between px-6 py-4 border-b border-purple-900/30">
          <h2 className="font-semibold text-white">Registrar Evolução</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Peso (kg)</label>
              <input type="number" step="0.1" className="input" value={form.weight} onChange={set('weight')} />
            </div>
            <div>
              <label className="label">% Gordura</label>
              <input type="number" step="0.1" className="input" value={form.body_fat} onChange={set('body_fat')} />
            </div>
            <div>
              <label className="label">Massa (kg)</label>
              <input type="number" step="0.1" className="input" value={form.muscle_mass} onChange={set('muscle_mass')} />
            </div>
          </div>
          <div>
            <label className="label">Observações</label>
            <textarea className="input" rows={2} value={form.notes} onChange={set('notes')} />
          </div>
          <div className="flex gap-3">
            <button type="button" className="btn-secondary flex-1 justify-center" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-primary flex-1 justify-center">Salvar</button>
          </div>
        </form>
      </div>
    </div>
  )
}
