import { useState } from 'react'
import { X } from 'lucide-react'

const GOALS = [
  { value: 'emagrecimento', label: 'Emagrecimento' },
  { value: 'ganho_massa', label: 'Ganho de Massa' },
  { value: 'manutencao', label: 'Manutenção' },
  { value: 'saude', label: 'Saúde Geral' },
]

export default function PatientModal({ onClose, onSave, initial = {} }) {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', birth_date: '',
    gender: '', weight: '', height: '', goal: '', notes: '',
    ...initial,
  })

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  function handleSubmit(e) {
    e.preventDefault()
    const payload = { ...form }
    if (!payload.weight) delete payload.weight
    if (!payload.height) delete payload.height
    if (!payload.birth_date) delete payload.birth_date
    onSave(payload)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-[#0f0f1c] rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-purple-900/30">
        <div className="flex items-center justify-between px-6 py-4 border-b border-purple-900/30">
          <h2 className="font-semibold text-lg text-white">
            {initial.id ? 'Editar paciente' : 'Novo paciente'}
          </h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="label">Nome *</label>
            <input className="input" value={form.name} onChange={set('name')} required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">E-mail</label>
              <input type="email" className="input" value={form.email} onChange={set('email')} />
            </div>
            <div>
              <label className="label">Telefone</label>
              <input className="input" value={form.phone} onChange={set('phone')} placeholder="(00) 00000-0000" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Data de nascimento</label>
              <input type="date" className="input" value={form.birth_date} onChange={set('birth_date')} />
            </div>
            <div>
              <label className="label">Sexo</label>
              <select className="input" value={form.gender} onChange={set('gender')}>
                <option value="">Selecione</option>
                <option value="F">Feminino</option>
                <option value="M">Masculino</option>
                <option value="outro">Outro</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Peso (kg)</label>
              <input type="number" step="0.1" className="input" value={form.weight} onChange={set('weight')} />
            </div>
            <div>
              <label className="label">Altura (cm)</label>
              <input type="number" className="input" value={form.height} onChange={set('height')} />
            </div>
            <div>
              <label className="label">Objetivo</label>
              <select className="input" value={form.goal} onChange={set('goal')}>
                <option value="">Selecione</option>
                {GOALS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="label">Observações</label>
            <textarea className="input" rows={3} value={form.notes} onChange={set('notes')} />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" className="btn-secondary flex-1 justify-center" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary flex-1 justify-center">
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
