import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Dumbbell, TrendingUp, CheckSquare, AlertTriangle, Plus, X, Share2 } from 'lucide-react'
import api from '../../api'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import SharePatientModal from '../../components/SharePatientModal'
import SessionCheckinHistory from '../../components/SessionCheckinHistory'

export default function PersonalClientDetail() {
  const { id } = useParams()
  const [patient, setPatient] = useState(null)
  const [plans, setPlans] = useState([])
  const [checkins, setCheckins] = useState([])
  const [evolutions, setEvolutions] = useState([])
  const [restrictions, setRestrictions] = useState([])
  const [showCheckin, setShowCheckin] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [error, setError] = useState(null)
  const [checkinForm, setCheckinForm] = useState({
    mood: 3, energy: 3, sleep_hours: '', stress: 3,
    workout_done: true, workout_adherence: 100,
    diet_adherence: 80, water_ml: '', pain_level: 0, notes: '',
  })

  async function load() {
    try {
      // GET /patients/{id} agora aceita profissionais compartilhados
      const [p, ci, ev, res] = await Promise.all([
        api.get(`/patients/${id}`),
        api.get(`/personal/clients/${id}/checkins`).catch(() => ({ data: [] })),
        api.get(`/personal/clients/${id}/body-evolution`).catch(() => ({ data: [] })),
        api.get(`/personal/clients/${id}/restrictions`).catch(() => ({ data: [] })),
      ])
      setPatient(p.data)
      setCheckins(ci.data)
      setEvolutions(ev.data)
      setRestrictions(res.data)
      setError(null)

      // Planos — só carrega se tiver acesso
      api.get(`/personal/clients/${id}/plans`)
        .then(r => setPlans(r.data))
        .catch(() => setPlans([]))
    } catch (err) {
      setError(err.response?.data?.detail || 'Erro ao carregar paciente')
    }
  }

  useEffect(() => { load() }, [id])

  async function handleCheckin(e) {
    e.preventDefault()
    try {
      const payload = {
        client_id: Number(id),
        ...checkinForm,
        sleep_hours: checkinForm.sleep_hours ? parseFloat(checkinForm.sleep_hours) : null,
        water_ml: checkinForm.water_ml ? parseInt(checkinForm.water_ml) : null,
      }
      await api.post('/personal/checkins', payload)
      toast.success('Check-in registrado!')
      setShowCheckin(false)
      load()
    } catch { toast.error('Erro ao registrar check-in') }
  }

  if (error) return (
    <div className="card text-center py-12 max-w-md mx-auto mt-10">
      <p className="text-4xl mb-3">⚠️</p>
      <p className="text-gray-700 font-medium">{error}</p>
      <Link to="/personal/clients" className="btn-secondary mt-4 inline-flex">
        <ArrowLeft className="w-4 h-4" /> Voltar
      </Link>
    </div>
  )

  if (!patient) return (
    <div className="flex items-center justify-center py-20">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-gray-400 text-sm">Carregando paciente...</p>
      </div>
    </div>
  )

  const lastCheckin = checkins[0]
  const lastEvo = evolutions[0]

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <Link to="/personal/clients" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold">{patient.name}</h1>
          <p className="text-sm text-gray-400">{patient.goal || 'Sem objetivo definido'}</p>
        </div>
        <button className="btn-primary" onClick={() => setShowCheckin(true)}>
          <CheckSquare className="w-4 h-4" /> Check-in
        </button>
        <button className="btn-secondary" onClick={() => setShowShare(true)}>
          <Share2 className="w-4 h-4" /> Compartilhar
        </button>
      </div>

      {/* Dados rápidos */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Peso', value: lastEvo?.weight ? `${lastEvo.weight}kg` : patient.weight ? `${patient.weight}kg` : '—' },
          { label: '% Gordura', value: lastEvo?.body_fat ? `${lastEvo.body_fat}%` : '—' },
          { label: 'Massa Magra', value: lastEvo?.muscle_mass ? `${lastEvo.muscle_mass}kg` : '—' },
          { label: 'Último check-in', value: lastCheckin ? format(new Date(lastCheckin.date), 'dd/MM', { locale: ptBR }) : '—' },
        ].map(({ label, value }) => (
          <div key={label} className="card text-center">
            <p className="text-lg font-bold text-primary-700">{value}</p>
            <p className="text-xs text-gray-400">{label}</p>
          </div>
        ))}
      </div>

      {/* Restrições */}
      {restrictions.length > 0 && (
        <div className="card border-l-4 border-orange-400">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            <h2 className="font-semibold text-orange-700">Restrições físicas</h2>
          </div>
          <div className="space-y-1">
            {restrictions.map(r => (
              <div key={r.id} className="flex items-start gap-2">
                <span className={`badge text-xs ${r.severity === 'grave' ? 'bg-red-100 text-red-700' : r.severity === 'moderada' ? 'bg-orange-100 text-orange-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {r.severity || 'leve'}
                </span>
                <p className="text-sm">{r.description} {r.affected_area && `(${r.affected_area})`}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Planos de treino */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Dumbbell className="w-4 h-4 text-primary-600" /> Planos de Treino
          </h2>
          <Link to="/personal/workouts" className="btn-primary text-xs py-1.5">
            <Plus className="w-3 h-3" /> Novo plano
          </Link>
        </div>
        {plans.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">Nenhum plano criado</p>
        ) : (
          <div className="space-y-2">
            {plans.map(p => (
              <div key={p.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="text-sm font-medium">{p.title}</p>
                  <p className="text-xs text-gray-400">
                    {p.objective || '—'} · {p.frequency_per_week}x/semana
                    {p.is_active && <span className="ml-2 text-green-600">● ativo</span>}
                  </p>
                </div>
                <Link to={`/personal/plans/${p.id}`} className="btn-secondary text-xs py-1.5">
                  Ver treino
                </Link>

              </div>
            ))}
          </div>
        )}
      </div>

      {/* Check-ins de Sessão */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Dumbbell className="w-4 h-4 text-primary-600" /> Check-ins de Sessão
          </h2>
        </div>
        <SessionCheckinHistory clientId={id} />
      </div>

      {/* Check-ins */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-primary-600" /> Check-ins recentes
          </h2>
        </div>
        {checkins.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">Nenhum check-in registrado</p>
        ) : (
          <div className="space-y-2">
            {checkins.slice(0, 5).map(ci => (
              <div key={ci.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="text-sm font-medium">
                    {format(new Date(ci.date), "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                  <div className="flex gap-3 text-xs text-gray-400 mt-0.5">
                    {ci.mood && <span>😊 Humor: {ci.mood}/5</span>}
                    {ci.energy && <span>⚡ Energia: {ci.energy}/5</span>}
                    {ci.workout_done !== null && (
                      <span>{ci.workout_done ? '✅ Treinou' : '❌ Não treinou'}</span>
                    )}
                    {ci.pain_level > 0 && <span>🔴 Dor: {ci.pain_level}/10</span>}
                  </div>
                </div>
                {ci.notes && <p className="text-xs text-gray-400 italic max-w-xs truncate">{ci.notes}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Evolução corporal */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary-600" /> Evolução Corporal
          </h2>
        </div>
        {evolutions.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">Nenhuma evolução registrada</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-400 border-b">
                  <th className="text-left py-2">Data</th>
                  <th className="text-right py-2">Peso</th>
                  <th className="text-right py-2">% Gord.</th>
                  <th className="text-right py-2">M. Magra</th>
                </tr>
              </thead>
              <tbody>
                {evolutions.slice(0, 8).map(e => (
                  <tr key={e.id} className="border-b last:border-0">
                    <td className="py-2">{format(new Date(e.recorded_at), 'dd/MM/yy')}</td>
                    <td className="text-right py-2">{e.weight ? `${e.weight}kg` : '—'}</td>
                    <td className="text-right py-2">{e.body_fat ? `${e.body_fat}%` : '—'}</td>
                    <td className="text-right py-2">{e.muscle_mass ? `${e.muscle_mass}kg` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal check-in */}
      {showCheckin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-900">
              <h2 className="font-semibold dark:text-white">Check-in — {patient.name}</h2>
              <button onClick={() => setShowCheckin(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleCheckin} className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Humor', key: 'mood' },
                  { label: 'Energia', key: 'energy' },
                  { label: 'Estresse', key: 'stress' },
                ].map(({ label, key }) => (
                  <div key={key}>
                    <label className="label">{label} (1-5)</label>
                    <input type="range" min="1" max="5" className="w-full"
                      value={checkinForm[key]}
                      onChange={e => setCheckinForm(f => ({ ...f, [key]: parseInt(e.target.value) }))} />
                    <p className="text-center text-xs text-gray-500">{checkinForm[key]}/5</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Sono (horas)</label>
                  <input type="number" step="0.5" className="input" value={checkinForm.sleep_hours}
                    onChange={e => setCheckinForm(f => ({ ...f, sleep_hours: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Água (ml)</label>
                  <input type="number" className="input" value={checkinForm.water_ml}
                    onChange={e => setCheckinForm(f => ({ ...f, water_ml: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="label">Treinou hoje?</label>
                <div className="flex gap-3">
                  {[true, false].map(v => (
                    <button key={String(v)} type="button"
                      onClick={() => setCheckinForm(f => ({ ...f, workout_done: v }))}
                      className={`flex-1 py-2 rounded-lg text-sm border-2 font-medium transition-all ${checkinForm.workout_done === v ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)]' : 'border-gray-200'}`}>
                      {v ? '✅ Sim' : '❌ Não'}
                    </button>
                  ))}
                </div>
              </div>
              {checkinForm.workout_done && (
                <div>
                  <label className="label">Adesão ao treino: {checkinForm.workout_adherence}%</label>
                  <input type="range" min="0" max="100" step="10" className="w-full"
                    value={checkinForm.workout_adherence}
                    onChange={e => setCheckinForm(f => ({ ...f, workout_adherence: parseInt(e.target.value) }))} />
                </div>
              )}
              <div>
                <label className="label">Nível de dor (0-10)</label>
                <input type="range" min="0" max="10" className="w-full"
                  value={checkinForm.pain_level}
                  onChange={e => setCheckinForm(f => ({ ...f, pain_level: parseInt(e.target.value) }))} />
                <p className="text-center text-xs text-gray-500">{checkinForm.pain_level}/10</p>
              </div>
              <div>
                <label className="label">Observações</label>
                <textarea className="input" rows={2} value={checkinForm.notes}
                  onChange={e => setCheckinForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
              <div className="flex gap-3">
                <button type="button" className="btn-secondary flex-1 justify-center" onClick={() => setShowCheckin(false)}>Cancelar</button>
                <button type="submit" className="btn-primary flex-1 justify-center">Salvar check-in</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showShare && patient && (
        <SharePatientModal
          patient={patient}
          onClose={() => setShowShare(false)}
          onShared={load}
        />
      )}
    </div>
  )
}
