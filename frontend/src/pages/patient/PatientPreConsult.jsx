import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Send } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'

const BASE = import.meta.env.VITE_API_URL || 'https://nutrirp-api.onrender.com/api'
const api = () => axios.create({ baseURL: BASE, headers: { Authorization: `Bearer ${localStorage.getItem('nutrirp_patient_token')}` } })

export default function PatientPreConsult() {
  const [form, setForm] = useState({
    main_complaint: '', current_symptoms: '', recent_changes: '',
    sleep_quality: 'boa', stress_level: 'baixo', physical_activity_last_week: '',
    water_intake_today: '', breakfast: '', morning_snack: '', lunch: '',
    afternoon_snack: '', dinner: '', night_snack: '',
    medications_changes: '', additional_notes: '',
  })
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      await api().post('/patient-portal/preconsult', form)
      toast.success('Questionário enviado!')
      setSent(true)
    } catch { toast.error('Erro ao enviar') }
    finally { setLoading(false) }
  }

  if (sent) return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="text-6xl mb-4">✅</div>
      <h2 className="text-xl font-bold mb-2">Enviado com sucesso!</h2>
      <p className="text-gray-500 text-center mb-6">Seu nutricionista receberá suas informações antes da consulta.</p>
      <Link to="/paciente/dashboard" className="btn-primary">Voltar ao início</Link>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="text-white px-5 py-4 flex items-center gap-3" style={{ backgroundColor: 'var(--color-primary)' }}>
        <Link to="/paciente/dashboard"><ArrowLeft className="w-5 h-5" /></Link>
        <h1 className="font-bold text-lg">Questionário Pré-Consulta</h1>
      </header>

      <form onSubmit={handleSubmit} className="max-w-lg mx-auto px-4 py-5 space-y-5">
        <div className="card space-y-4">
          <h2 className="font-semibold" style={{ color: 'var(--color-primary)' }}>Como você está?</h2>
          <div><label className="label">Principal queixa / motivo da consulta</label>
            <textarea className="input" rows={2} value={form.main_complaint} onChange={set('main_complaint')} /></div>
          <div><label className="label">Sintomas atuais</label>
            <textarea className="input" rows={2} value={form.current_symptoms} onChange={set('current_symptoms')} /></div>
          <div><label className="label">Mudanças recentes (peso, hábitos, saúde)</label>
            <textarea className="input" rows={2} value={form.recent_changes} onChange={set('recent_changes')} /></div>
        </div>

        <div className="card space-y-4">
          <h2 className="font-semibold" style={{ color: 'var(--color-primary)' }}>Hábitos recentes</h2>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Qualidade do sono</label>
              <select className="input" value={form.sleep_quality} onChange={set('sleep_quality')}>
                <option value="boa">Boa</option><option value="regular">Regular</option><option value="ruim">Ruim</option>
              </select></div>
            <div><label className="label">Nível de estresse</label>
              <select className="input" value={form.stress_level} onChange={set('stress_level')}>
                <option value="baixo">Baixo</option><option value="médio">Médio</option><option value="alto">Alto</option>
              </select></div>
          </div>
          <div><label className="label">Atividade física na última semana</label>
            <input className="input" value={form.physical_activity_last_week} onChange={set('physical_activity_last_week')} placeholder="ex: Caminhada 3x, musculação 2x" /></div>
          <div><label className="label">Água consumida hoje</label>
            <input className="input" value={form.water_intake_today} onChange={set('water_intake_today')} placeholder="ex: 1,5L" /></div>
        </div>

        <div className="card space-y-4">
          <h2 className="font-semibold" style={{ color: 'var(--color-primary)' }}>O que você comeu hoje?</h2>
          {[
            ['breakfast', 'Café da manhã'],
            ['morning_snack', 'Lanche da manhã'],
            ['lunch', 'Almoço'],
            ['afternoon_snack', 'Lanche da tarde'],
            ['dinner', 'Jantar'],
            ['night_snack', 'Ceia'],
          ].map(([k, l]) => (
            <div key={k}><label className="label">{l}</label>
              <input className="input" value={form[k]} onChange={set(k)} placeholder="Descreva o que comeu..." /></div>
          ))}
        </div>

        <div className="card space-y-4">
          <h2 className="font-semibold" style={{ color: 'var(--color-primary)' }}>Informações adicionais</h2>
          <div><label className="label">Mudanças em medicamentos</label>
            <textarea className="input" rows={2} value={form.medications_changes} onChange={set('medications_changes')} /></div>
          <div><label className="label">Observações gerais</label>
            <textarea className="input" rows={3} value={form.additional_notes} onChange={set('additional_notes')} /></div>
        </div>

        <button type="submit" className="btn-primary w-full justify-center" disabled={loading}>
          <Send className="w-4 h-4" /> {loading ? 'Enviando...' : 'Enviar para o nutricionista'}
        </button>
      </form>
    </div>
  )
}
