import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Save, TrendingUp, FileDown } from 'lucide-react'
import api from '../api'
import toast from 'react-hot-toast'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'
import { format } from 'date-fns'

const BASE = import.meta.env.VITE_API_URL || 'https://nutrirp-api.onrender.com/api'

const PROTOCOLS = [
  { value: 'pollock7', label: 'Pollock 7 dobras' },
  { value: 'pollock3', label: 'Pollock 3 dobras' },
]
const ACTIVITY_FACTORS = [
  { value: 1.2, label: 'Sedentário (sem exercício)' },
  { value: 1.375, label: 'Levemente ativo (1-3x/sem)' },
  { value: 1.55, label: 'Moderadamente ativo (3-5x/sem)' },
  { value: 1.725, label: 'Muito ativo (6-7x/sem)' },
  { value: 1.9, label: 'Extremamente ativo (2x/dia)' },
]

export default function Anthropometry() {
  const { id } = useParams()
  const [patient, setPatient] = useState(null)
  const [history, setHistory] = useState([])
  const [form, setForm] = useState({
    weight: '', height: '', age: '',
    triceps: '', biceps: '', subscapular: '', suprailiac: '',
    abdominal: '', thigh: '', calf: '', chest: '', midaxillary: '',
    waist: '', hip: '', neck: '', arm: '', forearm: '', thigh_circ: '', calf_circ: '',
    protocol: 'pollock7', activity_factor: 1.55, bmr_formula: 'mifflin', notes: '',
  })
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [lastRecordId, setLastRecordId] = useState(null)
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  useEffect(() => {
    api.get(`/patients/${id}`).then(r => setPatient(r.data))
    api.get(`/anthropometry/patient/${id}`).then(r => {
      setHistory(r.data)
      if (r.data.length > 0) setLastRecordId(r.data[0].id)
    }).catch(() => {})
  }, [id])

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = { patient_id: Number(id) }
      Object.entries(form).forEach(([k, v]) => { if (v !== '') payload[k] = isNaN(v) ? v : Number(v) })
      const { data } = await api.post('/anthropometry', payload)
      setResult(data)
      setLastRecordId(data.id)
      toast.success('Avaliação salva!')
      api.get(`/anthropometry/patient/${id}`).then(r => {
        setHistory(r.data)
        if (r.data.length > 0) setLastRecordId(r.data[0].id)
      })
    } catch { toast.error('Erro ao salvar') }
    finally { setLoading(false) }
  }

  const chartData = history.slice().reverse().map(h => ({
    data: format(new Date(h.recorded_at), 'dd/MM'),
    'Peso (kg)': h.weight,
    '% Gordura': h.body_fat_pct,
    'Massa Magra (kg)': h.lean_mass,
  }))

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <Link to={`/patients/${id}`} className="text-gray-400 hover:text-gray-600"><ArrowLeft className="w-5 h-5" /></Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold">Antropometria & Gasto Energético</h1>
          {patient && <p className="text-sm text-gray-500">{patient.name}</p>}
        </div>
        {lastRecordId && (
          <a
            href={`${BASE}/anthropometry/${lastRecordId}/pdf?token=${localStorage.getItem('nutrirp_token')}`}
            target="_blank" rel="noreferrer"
            className="btn-secondary text-sm"
          >
            <FileDown className="w-4 h-4" /> PDF
          </a>
        )}
      </div>

      {/* Gráficos de evolução */}
      {chartData.length >= 2 && (
        <div className="card">
          <h2 className="font-semibold mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary-600" /> Evolução</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="data" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="Peso (kg)" stroke="#2E7D32" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="% Gordura" stroke="#F57C00" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="Massa Magra (kg)" stroke="#1565C0" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Medidas básicas */}
        <div className="card space-y-4">
          <h2 className="font-semibold text-primary-800">📏 Medidas Básicas</h2>
          <div className="grid grid-cols-3 gap-3">
            {[['weight','Peso (kg)'],['height','Altura (cm)'],['age','Idade']].map(([k,l]) => (
              <div key={k}><label className="label">{l}</label>
                <input type="number" step="0.1" className="input" value={form[k]} onChange={set(k)} /></div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Protocolo de dobras</label>
              <select className="input" value={form.protocol} onChange={set('protocol')}>
                {PROTOCOLS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select></div>
            <div><label className="label">Fórmula TMB</label>
              <select className="input" value={form.bmr_formula} onChange={set('bmr_formula')}>
                <option value="mifflin">Mifflin-St Jeor</option>
                <option value="harris_benedict">Harris-Benedict</option>
              </select></div>
          </div>
          <div><label className="label">Nível de atividade física</label>
            <select className="input" value={form.activity_factor} onChange={set('activity_factor')}>
              {ACTIVITY_FACTORS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
            </select></div>
        </div>

        {/* Dobras cutâneas */}
        <div className="card space-y-4">
          <h2 className="font-semibold text-primary-800">📐 Dobras Cutâneas (mm)</h2>
          <div className="grid grid-cols-3 gap-3">
            {[['triceps','Tríceps'],['biceps','Bíceps'],['subscapular','Subescapular'],
              ['suprailiac','Suprailíaca'],['abdominal','Abdominal'],['thigh','Coxa'],
              ['calf','Panturrilha'],['chest','Peitoral'],['midaxillary','Axilar média']
            ].map(([k,l]) => (
              <div key={k}><label className="label text-xs">{l}</label>
                <input type="number" step="0.1" className="input" value={form[k]} onChange={set(k)} /></div>
            ))}
          </div>
        </div>

        {/* Circunferências */}
        <div className="card space-y-4">
          <h2 className="font-semibold text-primary-800">📏 Circunferências (cm)</h2>
          <div className="grid grid-cols-3 gap-3">
            {[['waist','Cintura'],['hip','Quadril'],['neck','Pescoço'],
              ['arm','Braço'],['forearm','Antebraço'],['thigh_circ','Coxa'],['calf_circ','Panturrilha']
            ].map(([k,l]) => (
              <div key={k}><label className="label text-xs">{l}</label>
                <input type="number" step="0.1" className="input" value={form[k]} onChange={set(k)} /></div>
            ))}
          </div>
        </div>

        <div className="card">
          <label className="label">Observações</label>
          <textarea className="input" rows={2} value={form.notes} onChange={set('notes')} />
        </div>

        <button type="submit" className="btn-primary" disabled={loading}>
          <Save className="w-4 h-4" /> {loading ? 'Calculando...' : 'Salvar Avaliação'}
        </button>
      </form>

      {/* Resultado */}
      {result && (
        <div className="card bg-primary-50 border-primary-200">
          <h2 className="font-semibold text-primary-800 mb-4">📊 Resultados Calculados</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'IMC', value: result.bmi, unit: 'kg/m²' },
              { label: '% Gordura', value: result.body_fat_pct, unit: '%' },
              { label: 'Massa Gorda', value: result.fat_mass, unit: 'kg' },
              { label: 'Massa Magra', value: result.lean_mass, unit: 'kg' },
              { label: 'RCQ', value: result.waist_hip_ratio, unit: '' },
              { label: 'TMB', value: result.bmr, unit: 'kcal' },
              { label: 'GET', value: result.tdee, unit: 'kcal/dia' },
            ].filter(r => r.value).map(({ label, value, unit }) => (
              <div key={label} className="bg-white rounded-lg p-3 text-center shadow-sm">
                <p className="text-lg font-bold text-primary-700">{value} <span className="text-xs font-normal text-gray-400">{unit}</span></p>
                <p className="text-xs text-gray-500">{label}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
