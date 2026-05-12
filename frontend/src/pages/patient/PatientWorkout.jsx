import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Dumbbell, ChevronRight, PlayCircle, History } from 'lucide-react'
import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL || 'https://nutrirp-api.onrender.com/api'

function patientApi() {
  const token = localStorage.getItem('nutrirp_patient_token')
  return axios.create({ baseURL: BASE, headers: { Authorization: `Bearer ${token}` } })
}

const MUSCLE_GROUP_COLORS = {
  peito: 'bg-red-100 text-red-700',
  costas: 'bg-blue-100 text-blue-700',
  pernas: 'bg-green-100 text-green-700',
  ombros: 'bg-purple-100 text-purple-700',
  bracos: 'bg-orange-100 text-orange-700',
  core: 'bg-yellow-100 text-yellow-700',
  full_body: 'bg-indigo-100 text-indigo-700',
  gluteos: 'bg-pink-100 text-pink-700',
  panturrilha: 'bg-teal-100 text-teal-700',
}

export default function PatientWorkout() {
  const [plan, setPlan] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [activeSession, setActiveSession] = useState(null)

  useEffect(() => {
    patientApi().get('/patient/workout/active-plan')
      .then(r => {
        setPlan(r.data)
        const sessions = [...(r.data.sessions || [])].sort((a, b) => a.order_index - b.order_index)
        if (sessions.length > 0) setActiveSession(sessions[0].id)
      })
      .catch(err => {
        if (err.response?.status === 404) setNotFound(true)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-gray-400 text-sm">Carregando treino...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="text-white px-5 py-4 flex items-center gap-3" style={{ backgroundColor: 'var(--color-primary)' }}>
        <Link to="/paciente/dashboard"><ArrowLeft className="w-5 h-5" /></Link>
        <h1 className="font-bold text-lg flex-1">Meu Treino</h1>
        <Link to="/paciente/workout/history" className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-colors" title="Histórico de treinos">
          <History className="w-5 h-5" />
        </Link>
      </header>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">
        {notFound ? (
          <div className="card text-center py-12">
            <Dumbbell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Nenhum plano de treino ativo</p>
            <p className="text-xs text-gray-400 mt-1">
              Seu personal trainer ainda não publicou um plano de treino para você.
            </p>
          </div>
        ) : plan ? (
          <>
            {/* Info do plano */}
            <div className="card">
              <h2 className="font-bold text-lg dark:text-white">{plan.title}</h2>
              {plan.objective && (
                <p className="text-sm text-gray-500 mt-0.5 capitalize">{plan.objective}</p>
              )}
              {plan.frequency_per_week && (
                <p className="text-xs text-gray-400 mt-1">{plan.frequency_per_week}x por semana</p>
              )}
            </div>

            {/* Abas de sessões */}
            {plan.sessions && plan.sessions.length > 0 && (
              <>
                <div className="flex gap-2 flex-wrap">
                  {[...plan.sessions]
                    .sort((a, b) => a.order_index - b.order_index)
                    .map(s => (
                      <button
                        key={s.id}
                        onClick={() => setActiveSession(s.id)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition-all ${
                          activeSession === s.id
                            ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)] text-[var(--color-primary)]'
                            : 'border-gray-200 text-gray-600 bg-white dark:bg-gray-900 dark:border-gray-700'
                        }`}
                      >
                        {s.name}
                      </button>
                    ))}
                </div>

                {/* Sessão ativa */}
                {plan.sessions
                  .filter(s => s.id === activeSession)
                  .map(session => {
                    const exercises = [...(session.exercises || [])].sort((a, b) => a.order_index - b.order_index)
                    const grouped = exercises.reduce((acc, ex) => {
                      const key = ex.muscle_group || 'outros'
                      if (!acc[key]) acc[key] = []
                      acc[key].push(ex)
                      return acc
                    }, {})

                    return (
                      <div key={session.id} className="card space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold dark:text-white">{session.name}</h3>
                          <Link
                            to={`/paciente/workout/checkin/${session.id}`}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90"
                            style={{ backgroundColor: 'var(--color-primary)' }}
                          >
                            <PlayCircle className="w-4 h-4" /> Registrar treino
                          </Link>
                        </div>

                        {exercises.length === 0 ? (
                          <p className="text-sm text-gray-400">Nenhum exercício nesta sessão</p>
                        ) : (
                          Object.entries(grouped).map(([group, exList]) => (
                            <div key={group}>
                              <div className="flex items-center gap-2 mb-2">
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${MUSCLE_GROUP_COLORS[group] || 'bg-gray-100 text-gray-600'}`}>
                                  {group.replace('_', ' ')}
                                </span>
                                <div className="flex-1 h-px bg-gray-100 dark:bg-gray-700" />
                              </div>
                              <div className="space-y-2">
                                {exList.map(ex => (
                                  <div key={ex.id} className="flex items-center gap-3 py-2 border-b last:border-0 dark:border-gray-700">
                                    {ex.thumbnail ? (
                                      <img src={ex.thumbnail} alt={ex.exercise_name} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                                    ) : (
                                      <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
                                        <Dumbbell className="w-4 h-4 text-gray-400" />
                                      </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium dark:text-white truncate">{ex.exercise_name}</p>
                                      <p className="text-xs text-gray-400">
                                        {ex.sets && `${ex.sets} séries`}
                                        {ex.reps && ` × ${ex.reps}`}
                                        {ex.load && ` · ${ex.load}`}
                                        {ex.rest_time && ` · ${ex.rest_time}s`}
                                      </p>
                                    </div>
                                    {ex.exercise_id && (
                                      <Link
                                        to={`/paciente/workout/exercise/${ex.exercise_id}`}
                                        className="text-gray-400 hover:text-primary-600 shrink-0"
                                      >
                                        <ChevronRight className="w-4 h-4" />
                                      </Link>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )
                  })}
              </>
            )}
          </>
        ) : null}
      </div>
    </div>
  )
}
