import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import api from '../api'
import toast from 'react-hot-toast'

const STRESS = ['baixo', 'médio', 'alto']
const FREQ = ['Sedentário', '1-2x/semana', '3-4x/semana', '5+x/semana', 'Diariamente']

export default function Anamnese() {
  const { id } = useParams()
  const [patient, setPatient] = useState(null)
  const [form, setForm] = useState({
    meals_per_day: '', water_intake: '', physical_activity: '', activity_frequency: '',
    pathologies: '', medications: '', allergies: '', food_intolerances: '',
    food_preferences: '', food_aversions: '', sleep_hours: '',
    stress_level: '', alcohol: '', smoking: '', notes: '',
  })
  const [loading, setLoading] = useState(false)

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  useEffect(() => {
    api.get(`/patients/${id}`).then(r => setPatient(r.data))
    api.get(`/anamnese/patient/${id}`).then(r => {
      if (r.data.length > 0) {
        const last = r.data[0]
        setForm(prev => ({ ...prev, ...last }))
      }
    })
  }, [id])

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = { ...form, patient_id: Number(id) }
      Object.keys(payload).forEach(k => { if (payload[k] === '') delete payload[k] })
      await api.post('/anamnese', payload)
      toast.success('Anamnese salva!')
    } catch { toast.error('Erro ao salvar') }
    finally { setLoading(false) }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link to={`/patients/${id}`} className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold">Anamnese</h1>
          {patient && <p className="text-sm text-gray-500">{patient.name}</p>}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Hábitos alimentares */}
        <div className="card space-y-4">
          <h2 className="font-semibold text-primary-800">🍽 Hábitos Alimentares</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Refeições por dia</label>
              <input type="number" className="input" value={form.meals_per_day} onChange={set('meals_per_day')} min={1} max={10} />
            </div>
            <div>
              <label className="label">Ingestão de água (L/dia)</label>
              <input className="input" value={form.water_intake} onChange={set('water_intake')} placeholder="ex: 2L" />
            </div>
          </div>
          <div>
            <label className="label">Preferências alimentares</label>
            <textarea className="input" rows={2} value={form.food_preferences} onChange={set('food_preferences')} placeholder="Alimentos que gosta..." />
          </div>
          <div>
            <label className="label">Aversões alimentares</label>
            <textarea className="input" rows={2} value={form.food_aversions} onChange={set('food_aversions')} placeholder="Alimentos que não gosta..." />
          </div>
          <div>
            <label className="label">Intolerâncias / Alergias alimentares</label>
            <input className="input" value={form.food_intolerances} onChange={set('food_intolerances')} placeholder="Lactose, glúten, etc." />
          </div>
        </div>

        {/* Atividade física */}
        <div className="card space-y-4">
          <h2 className="font-semibold text-primary-800">🏃 Atividade Física</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Tipo de atividade</label>
              <input className="input" value={form.physical_activity} onChange={set('physical_activity')} placeholder="Musculação, corrida..." />
            </div>
            <div>
              <label className="label">Frequência</label>
              <select className="input" value={form.activity_frequency} onChange={set('activity_frequency')}>
                <option value="">Selecione</option>
                {FREQ.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Saúde */}
        <div className="card space-y-4">
          <h2 className="font-semibold text-primary-800">🏥 Histórico de Saúde</h2>
          <div>
            <label className="label">Patologias / Condições de saúde</label>
            <textarea className="input" rows={2} value={form.pathologies} onChange={set('pathologies')} placeholder="Diabetes, hipertensão, etc." />
          </div>
          <div>
            <label className="label">Medicamentos em uso</label>
            <textarea className="input" rows={2} value={form.medications} onChange={set('medications')} />
          </div>
          <div>
            <label className="label">Alergias (não alimentares)</label>
            <input className="input" value={form.allergies} onChange={set('allergies')} />
          </div>
        </div>

        {/* Hábitos de vida */}
        <div className="card space-y-4">
          <h2 className="font-semibold text-primary-800">💤 Hábitos de Vida</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">Horas de sono</label>
              <input type="number" step="0.5" className="input" value={form.sleep_hours} onChange={set('sleep_hours')} />
            </div>
            <div>
              <label className="label">Nível de estresse</label>
              <select className="input" value={form.stress_level} onChange={set('stress_level')}>
                <option value="">Selecione</option>
                {STRESS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Álcool</label>
              <select className="input" value={form.alcohol} onChange={set('alcohol')}>
                <option value="">Selecione</option>
                <option value="não">Não</option>
                <option value="ocasional">Ocasional</option>
                <option value="frequente">Frequente</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">Tabagismo</label>
            <select className="input" value={form.smoking} onChange={set('smoking')}>
              <option value="">Selecione</option>
              <option value="não">Não fumante</option>
              <option value="ex-fumante">Ex-fumante</option>
              <option value="fumante">Fumante</option>
            </select>
          </div>
        </div>

        <div className="card">
          <label className="label">Observações gerais</label>
          <textarea className="input" rows={3} value={form.notes} onChange={set('notes')} />
        </div>

        <button type="submit" className="btn-primary" disabled={loading}>
          <Save className="w-4 h-4" /> {loading ? 'Salvando...' : 'Salvar Anamnese'}
        </button>
      </form>
    </div>
  )
}
