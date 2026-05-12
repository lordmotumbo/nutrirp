import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Send } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'

const BASE = import.meta.env.VITE_API_URL || 'https://nutrirp-api.onrender.com/api'

function patientApi() {
  const token = localStorage.getItem('nutrirp_patient_token')
  return axios.create({ baseURL: BASE, headers: { Authorization: `Bearer ${token}` } })
}

const RPE_LABELS = {
  0: 'Repouso',
  1: 'Muito leve',
  2: 'Muito leve',
  3: 'Leve',
  4: 'Leve',
  5: 'Moderado',
  6: 'Moderado',
  7: 'Intenso',
  8: 'Intenso',
  9: 'Muito intenso',
  10: 'Máximo',
}

function rpeColor(rpe) {
  if (rpe <= 3) return 'bg-green-500'
  if (rpe <= 6) return 'bg-yellow-500'
  if (rpe <= 8) return 'bg-orange-500'
  return 'bg-red-600'
}

export default function PatientWorkoutCheckin() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const [session, setSession] = useState(null)
  const [exercises, setExercises] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [rpe, setRpe] = useState(5)
  const [durationMinutes, setDurationMinutes] = useState('')
  const [notes, setNotes] = useState('')
  const [exerciseLogs, setExerciseLogs] = useState([])

  useEffect(() => {
    patientApi().get('/patient/workout/active-plan')
      .then(r => {
        const plan = r.data
        const found = (plan.sessions || []).find(s => String(s.id) === String(sessionId))
        if (found) {
          setSession(found)
          const sorted = [...(found.exercises || [])].sort((a, b) => a.order_index - b.order_index)
          setExercises(sorted)
          setExerciseLogs(sorted.map(ex => ({
            exercise_id: ex.exercise_id || ex.id,
            exercise_name: ex.exercise_name,
            sets_done: ex.sets || '',
            reps_done: ex.reps || '',
            load_used: ex.load || '',
            notes: '',
          })))
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [sessionId])

  function updateLog(idx, field, value) {
    setExerciseLogs(prev => prev.map((log, i) => i === idx ? { ...log, [field]: value } : log))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const payload = {
        session_id: Number(sessionId),
        rpe,
        performed_at: new Date().toISOString(),
        duration_minutes: durationMinutes ? Number(durationMinutes) : null,
        notes: notes || null,
        exercise_logs: exerciseLogs.map(log => ({
          exercise_id: log.exercise_id,
          exercise_name: log.exercise_name,
          sets_done: log.sets_done ? Number(log.sets_done) : null,
          reps_done: log.reps_done || null,
          load_used: log.load_used || null,
          notes: log.notes || null,
        })),
      }
      await patientApi().post('/patient/workout/checkin', payload)
      toast.success('Treino registrado!')
      navigate('/paciente/workout')
    } catch (err) {
      if (err.response?.status === 409) {
        toast.error('Você já registrou este treino hoje')
      } else {
        toast.error(err.response?.data?.detail || 'Erro ao registrar treino')
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="text-white px-5 py-4 flex items-center gap-3" style={{ backgroundColor: 'var(--color-primary)' }}>
        <Link to="/paciente/workout"><ArrowLeft className="w-5 h-5" /></Link>
        <h1 className="font-bold text-lg">
          {session ? `Check-in — ${session.name}` : 'Registrar Treino'}
        </h1>
      </header>

      <div className="max-w-lg mx-auto px-4 py-5">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* RPE */}
          <div className="card">
            <h2 className="font-semibold mb-1 dark:text-white">Como foi o esforço?</h2>
            <p className="text-xs text-gray-400 mb-4">Escala de Borg — RPE (0 a 10)</p>

            {/* Visual RPE selector */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold dark:text-white">{rpe}</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium text-white ${rpeColor(rpe)}`}>
                  {RPE_LABELS[rpe]}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                step="1"
                value={rpe}
                onChange={e => setRpe(Number(e.target.value))}
                className="w-full accent-primary-600"
              />
              <div className="flex justify-between text-xs text-gray-400">
                <span>0 Repouso</span>
                <span>5 Moderado</span>
                <span>10 Máximo</span>
              </div>
              {/* RPE buttons */}
              <div className="grid grid-cols-11 gap-1">
                {Array.from({ length: 11 }, (_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setRpe(i)}
                    className={`py-1.5 rounded text-xs font-bold transition-all ${
                      rpe === i
                        ? `text-white ${rpeColor(i)}`
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                    }`}
                  >
                    {i}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Duração e notas gerais */}
          <div className="card space-y-3">
            <h2 className="font-semibold dark:text-white">Informações gerais</h2>
            <div>
              <label className="label">Duração (minutos)</label>
              <input
                type="number"
                className="input"
                placeholder="ex: 60"
                value={durationMinutes}
                onChange={e => setDurationMinutes(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Observações</label>
              <textarea
                className="input"
                rows={2}
                placeholder="Como foi o treino? Alguma dificuldade?"
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>
          </div>

          {/* Exercícios */}
          {exercises.length > 0 && (
            <div className="card space-y-4">
              <h2 className="font-semibold dark:text-white">Exercícios realizados</h2>
              {exerciseLogs.map((log, idx) => (
                <div key={idx} className="border-b last:border-0 dark:border-gray-700 pb-4 last:pb-0">
                  <p className="text-sm font-medium dark:text-white mb-2">{log.exercise_name}</p>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="label">Séries</label>
                      <input
                        type="number"
                        className="input"
                        placeholder="3"
                        value={log.sets_done}
                        onChange={e => updateLog(idx, 'sets_done', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="label">Reps</label>
                      <input
                        type="text"
                        className="input"
                        placeholder="10"
                        value={log.reps_done}
                        onChange={e => updateLog(idx, 'reps_done', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="label">Carga</label>
                      <input
                        type="text"
                        className="input"
                        placeholder="20kg"
                        value={log.load_used}
                        onChange={e => updateLog(idx, 'load_used', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="mt-2">
                    <label className="label">Notas</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="Observações sobre este exercício..."
                      value={log.notes}
                      onChange={e => updateLog(idx, 'notes', e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-semibold transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            <Send className="w-4 h-4" />
            {submitting ? 'Registrando...' : 'Registrar treino'}
          </button>
        </form>
      </div>
    </div>
  )
}
