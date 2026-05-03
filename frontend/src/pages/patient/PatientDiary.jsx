import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Plus, X, Bell, BellOff, Droplets } from 'lucide-react'
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

const SLEEP_QUALITY = [
  { value: 'otima', label: '😴 Ótima' },
  { value: 'boa', label: '🙂 Boa' },
  { value: 'regular', label: '😐 Regular' },
  { value: 'ruim', label: '😩 Ruim' },
]

const INTENSITY = [
  { value: 'leve', label: '🚶 Leve' },
  { value: 'moderada', label: '🏃 Moderada' },
  { value: 'intensa', label: '💪 Intensa' },
]

const BOWEL = [
  { value: 'normal', label: 'Normal' },
  { value: 'constipado', label: 'Constipado' },
  { value: 'diarreia', label: 'Diarreia' },
  { value: 'irregular', label: 'Irregular' },
]

const LEVEL_LABELS = ['', '1 - Muito baixo', '2 - Baixo', '3 - Médio', '4 - Alto', '5 - Muito alto']

const WATER_AMOUNTS = [150, 200, 250, 300, 500]

const DEFAULT_FORM = {
  date: new Date().toISOString().slice(0, 16),
  mood: 'bom',
  sleep_hours: '',
  sleep_quality: '',
  water_ml: '',
  physical_activity: '',
  activity_duration_min: '',
  activity_intensity: '',
  diet_adherence: 80,
  hunger_level: 3,
  energy_level: 3,
  stress_level: 2,
  bowel_function: '',
  symptoms: '',
  medications_taken: '',
  notes: '',
}

// ── Alertas / Notificações ────────────────────────────────────────────
function useAlerts(diet) {
  const [alertsEnabled, setAlertsEnabled] = useState(() => {
    return localStorage.getItem('nutrirp_alerts_enabled') === 'true'
  })
  const [waterAlertsEnabled, setWaterAlertsEnabled] = useState(() => {
    return localStorage.getItem('nutrirp_water_alerts_enabled') === 'true'
  })
  const [waterIntervalH, setWaterIntervalH] = useState(() => {
    return parseInt(localStorage.getItem('nutrirp_water_interval') || '2')
  })

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      toast.error('Seu navegador não suporta notificações')
      return false
    }
    if (Notification.permission === 'granted') return true
    const perm = await Notification.requestPermission()
    return perm === 'granted'
  }, [])

  const toggleMealAlerts = useCallback(async () => {
    if (!alertsEnabled) {
      const ok = await requestPermission()
      if (!ok) return
      toast.success('Alertas de refeição ativados!')
    } else {
      toast('Alertas de refeição desativados')
    }
    const next = !alertsEnabled
    setAlertsEnabled(next)
    localStorage.setItem('nutrirp_alerts_enabled', String(next))
  }, [alertsEnabled, requestPermission])

  const toggleWaterAlerts = useCallback(async () => {
    if (!waterAlertsEnabled) {
      const ok = await requestPermission()
      if (!ok) return
      toast.success(`Alertas de água a cada ${waterIntervalH}h ativados!`)
    } else {
      toast('Alertas de água desativados')
    }
    const next = !waterAlertsEnabled
    setWaterAlertsEnabled(next)
    localStorage.setItem('nutrirp_water_alerts_enabled', String(next))
  }, [waterAlertsEnabled, waterIntervalH, requestPermission])

  const changeWaterInterval = useCallback((h) => {
    setWaterIntervalH(h)
    localStorage.setItem('nutrirp_water_interval', String(h))
  }, [])

  // Agenda alertas de refeição baseados na dieta
  useEffect(() => {
    if (!alertsEnabled || !diet?.meals?.length) return
    const timers = []
    diet.meals.forEach(meal => {
      if (!meal.time) return
      const [h, m] = meal.time.split(':').map(Number)
      const now = new Date()
      const target = new Date()
      target.setHours(h, m, 0, 0)
      if (target <= now) return // já passou hoje
      const diff = target - now
      const t = setTimeout(() => {
        if (Notification.permission === 'granted') {
          new Notification(`🍽 Hora da refeição!`, {
            body: `${meal.name} — ${meal.time}`,
            icon: '/favicon.ico',
          })
        }
      }, diff)
      timers.push(t)
    })
    return () => timers.forEach(clearTimeout)
  }, [alertsEnabled, diet])

  // Agenda alertas de água
  useEffect(() => {
    if (!waterAlertsEnabled) return
    const intervalMs = waterIntervalH * 60 * 60 * 1000
    const t = setInterval(() => {
      if (Notification.permission === 'granted') {
        new Notification('💧 Hora de beber água!', {
          body: 'Lembre-se de se manter hidratado.',
          icon: '/favicon.ico',
        })
      }
    }, intervalMs)
    return () => clearInterval(t)
  }, [waterAlertsEnabled, waterIntervalH])

  return { alertsEnabled, waterAlertsEnabled, waterIntervalH, toggleMealAlerts, toggleWaterAlerts, changeWaterInterval }
}

export default function PatientDiary() {
  const [entries, setEntries] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [showAlertPanel, setShowAlertPanel] = useState(false)
  const [form, setForm] = useState(DEFAULT_FORM)
  const [diet, setDiet] = useState(null)
  const [addingWater, setAddingWater] = useState(false)
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const { alertsEnabled, waterAlertsEnabled, waterIntervalH, toggleMealAlerts, toggleWaterAlerts, changeWaterInterval } = useAlerts(diet)

  async function load() {
    const { data } = await api().get('/patient-portal/diary')
    setEntries(data)
  }

  useEffect(() => {
    load()
    // Carrega dieta para alertas de refeição
    api().get('/patient-portal/diet').then(r => setDiet(r.data)).catch(() => {})
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      const payload = { ...form }
      if (payload.sleep_hours) payload.sleep_hours = parseFloat(payload.sleep_hours)
      if (payload.water_ml) payload.water_ml = parseInt(payload.water_ml)
      if (payload.activity_duration_min) payload.activity_duration_min = parseInt(payload.activity_duration_min)
      payload.diet_adherence = parseInt(payload.diet_adherence)
      payload.hunger_level = parseInt(payload.hunger_level)
      payload.energy_level = parseInt(payload.energy_level)
      payload.stress_level = parseInt(payload.stress_level)
      await api().post('/patient-portal/diary', payload)
      toast.success('Registrado!')
      setShowModal(false)
      setForm(DEFAULT_FORM)
      load()
    } catch { toast.error('Erro ao salvar') }
  }

  async function handleAddWater(ml) {
    setAddingWater(true)
    try {
      await api().patch('/patient-portal/diary/water', { water_ml: ml })
      toast.success(`+${ml}ml de água registrado!`)
      load()
    } catch { toast.error('Erro ao registrar água') }
    finally { setAddingWater(false) }
  }

  const moodEmoji = { otimo: '😄', bom: '🙂', regular: '😐', ruim: '😔' }

  // Água total de hoje
  const today = new Date().toDateString()
  const todayEntries = entries.filter(e => new Date(e.date).toDateString() === today)
  const todayWater = todayEntries.reduce((sum, e) => sum + (e.water_ml || 0), 0)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="text-white px-5 py-4 flex items-center gap-3" style={{ backgroundColor: 'var(--color-primary)' }}>
        <Link to="/paciente/dashboard"><ArrowLeft className="w-5 h-5" /></Link>
        <h1 className="font-bold text-lg flex-1">Meu Diário</h1>
        <button
          onClick={() => setShowAlertPanel(true)}
          className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
          title="Configurar alertas"
        >
          {alertsEnabled || waterAlertsEnabled ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
        </button>
      </header>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">
        {/* Água de hoje */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Droplets className="w-5 h-5 text-blue-500" />
              <span className="font-semibold dark:text-white">Água hoje</span>
            </div>
            <span className="text-lg font-bold text-blue-600">{todayWater}ml</span>
          </div>
          <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mb-3">
            <div
              className="h-full bg-blue-400 rounded-full transition-all"
              style={{ width: `${Math.min(100, (todayWater / 2000) * 100)}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mb-3">Meta: 2000ml/dia</p>
          <div className="flex gap-2 flex-wrap">
            {WATER_AMOUNTS.map(ml => (
              <button
                key={ml}
                onClick={() => handleAddWater(ml)}
                disabled={addingWater}
                className="px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors disabled:opacity-50"
              >
                +{ml}ml
              </button>
            ))}
          </div>
        </div>

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
              {e.energy_level && <span>⚡ Energia: {e.energy_level}/5</span>}
              {e.stress_level && <span>😤 Estresse: {e.stress_level}/5</span>}
              {e.hunger_level && <span>🍽 Fome: {e.hunger_level}/5</span>}
            </div>
            {e.physical_activity && (
              <p className="text-xs text-gray-500">
                🏃 {e.physical_activity}
                {e.activity_duration_min && ` · ${e.activity_duration_min}min`}
                {e.activity_intensity && ` · ${e.activity_intensity}`}
              </p>
            )}
            {e.symptoms && <p className="text-xs text-orange-500 mt-1">⚠️ {e.symptoms}</p>}
            {e.bowel_function && e.bowel_function !== 'normal' && (
              <p className="text-xs text-gray-500 mt-1">🚽 Intestino: {e.bowel_function}</p>
            )}
            {e.notes && <p className="text-xs text-gray-400 mt-1 italic">{e.notes}</p>}
          </div>
        ))}
      </div>

      {/* Modal novo registro */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
          <div className="bg-white dark:bg-gray-900 rounded-t-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-900 z-10">
              <h2 className="font-semibold dark:text-white">Novo Registro</h2>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="px-5 py-4 space-y-5">
              {/* Data */}
              <div>
                <label className="label">Data e hora</label>
                <input type="datetime-local" className="input" value={form.date} onChange={set('date')} />
              </div>

              {/* Humor */}
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

              {/* Sono */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Sono (horas)</label>
                  <input type="number" step="0.5" min="0" max="24" className="input" value={form.sleep_hours} onChange={set('sleep_hours')} placeholder="ex: 7.5" />
                </div>
                <div>
                  <label className="label">Qualidade do sono</label>
                  <select className="input" value={form.sleep_quality} onChange={set('sleep_quality')}>
                    <option value="">Selecione</option>
                    {SLEEP_QUALITY.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
              </div>

              {/* Água */}
              <div>
                <label className="label">Água consumida (ml)</label>
                <input type="number" className="input" value={form.water_ml} onChange={set('water_ml')} placeholder="ex: 2000" />
              </div>

              {/* Atividade física */}
              <div>
                <label className="label">Atividade física</label>
                <input className="input" value={form.physical_activity} onChange={set('physical_activity')} placeholder="ex: Caminhada, musculação..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Duração (min)</label>
                  <input type="number" className="input" value={form.activity_duration_min} onChange={set('activity_duration_min')} placeholder="ex: 45" />
                </div>
                <div>
                  <label className="label">Intensidade</label>
                  <select className="input" value={form.activity_intensity} onChange={set('activity_intensity')}>
                    <option value="">Selecione</option>
                    {INTENSITY.map(i => <option key={i.value} value={i.value}>{i.label}</option>)}
                  </select>
                </div>
              </div>

              {/* Escalas */}
              <div className="space-y-3">
                <div>
                  <label className="label">Adesão à dieta: {form.diet_adherence}%</label>
                  <input type="range" min="0" max="100" step="5" className="w-full" value={form.diet_adherence} onChange={set('diet_adherence')} />
                </div>
                <div>
                  <label className="label">Nível de fome: {LEVEL_LABELS[form.hunger_level]}</label>
                  <input type="range" min="1" max="5" step="1" className="w-full" value={form.hunger_level} onChange={set('hunger_level')} />
                </div>
                <div>
                  <label className="label">Nível de energia: {LEVEL_LABELS[form.energy_level]}</label>
                  <input type="range" min="1" max="5" step="1" className="w-full" value={form.energy_level} onChange={set('energy_level')} />
                </div>
                <div>
                  <label className="label">Nível de estresse: {LEVEL_LABELS[form.stress_level]}</label>
                  <input type="range" min="1" max="5" step="1" className="w-full" value={form.stress_level} onChange={set('stress_level')} />
                </div>
              </div>

              {/* Funcionamento intestinal */}
              <div>
                <label className="label">Funcionamento intestinal</label>
                <div className="grid grid-cols-2 gap-2">
                  {BOWEL.map(b => (
                    <button key={b.value} type="button"
                      onClick={() => setForm(f => ({ ...f, bowel_function: b.value }))}
                      className={`py-2 rounded-lg text-sm border-2 transition-all ${form.bowel_function === b.value ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)]' : 'border-gray-200'}`}>
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sintomas */}
              <div>
                <label className="label">Sintomas (inchaço, gases, refluxo, etc.)</label>
                <textarea className="input" rows={2} value={form.symptoms} onChange={set('symptoms')} placeholder="Descreva qualquer sintoma..." />
              </div>

              {/* Medicamentos/suplementos */}
              <div>
                <label className="label">Medicamentos / Suplementos tomados</label>
                <textarea className="input" rows={2} value={form.medications_taken} onChange={set('medications_taken')} placeholder="ex: Vitamina D, Ômega 3..." />
              </div>

              {/* Observações */}
              <div>
                <label className="label">Observações gerais</label>
                <textarea className="input" rows={2} value={form.notes} onChange={set('notes')} />
              </div>

              <button type="submit" className="btn-primary w-full justify-center">Salvar</button>
            </form>
          </div>
        </div>
      )}

      {/* Painel de alertas */}
      {showAlertPanel && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
          <div className="bg-white dark:bg-gray-900 rounded-t-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-5 py-4 border-b dark:border-gray-700">
              <h2 className="font-semibold dark:text-white">⏰ Configurar Alertas</h2>
              <button onClick={() => setShowAlertPanel(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="px-5 py-4 space-y-4">
              {/* Alertas de refeição */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                <div>
                  <p className="font-medium dark:text-white">🍽 Alertas de refeição</p>
                  <p className="text-xs text-gray-400">Notificação nos horários da sua dieta</p>
                  {!diet?.meals?.length && (
                    <p className="text-xs text-orange-400 mt-0.5">Você precisa ter uma dieta ativa com horários</p>
                  )}
                </div>
                <button
                  onClick={toggleMealAlerts}
                  className={`relative w-12 h-6 rounded-full transition-colors ${alertsEnabled ? 'bg-green-500' : 'bg-gray-300'}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${alertsEnabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </button>
              </div>

              {/* Alertas de água */}
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium dark:text-white">💧 Alertas de água</p>
                    <p className="text-xs text-gray-400">Lembrete para se hidratar</p>
                  </div>
                  <button
                    onClick={toggleWaterAlerts}
                    className={`relative w-12 h-6 rounded-full transition-colors ${waterAlertsEnabled ? 'bg-blue-500' : 'bg-gray-300'}`}
                  >
                    <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${waterAlertsEnabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
                  </button>
                </div>
                {waterAlertsEnabled && (
                  <div>
                    <label className="label text-xs">Intervalo entre alertas</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4].map(h => (
                        <button
                          key={h}
                          onClick={() => changeWaterInterval(h)}
                          className={`flex-1 py-1.5 rounded-lg text-sm border-2 transition-all ${waterIntervalH === h ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600'}`}
                        >
                          {h}h
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <p className="text-xs text-gray-400 text-center">
                Os alertas funcionam enquanto o app estiver aberto no navegador.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
