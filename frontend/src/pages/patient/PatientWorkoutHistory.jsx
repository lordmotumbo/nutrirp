import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ChevronDown, ChevronUp, Dumbbell } from 'lucide-react'
import axios from 'axios'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const BASE = import.meta.env.VITE_API_URL || 'https://nutrirp-api.onrender.com/api'

function patientApi() {
  const token = localStorage.getItem('nutrirp_patient_token')
  return axios.create({ baseURL: BASE, headers: { Authorization: `Bearer ${token}` } })
}

const RPE_LABELS = {
  0: 'Repouso', 1: 'Muito leve', 2: 'Muito leve',
  3: 'Leve', 4: 'Leve', 5: 'Moderado',
  6: 'Moderado', 7: 'Intenso', 8: 'Intenso',
  9: 'Muito intenso', 10: 'Máximo',
}

function rpeBadgeColor(rpe) {
  if (rpe <= 3) return 'bg-green-100 text-green-700'
  if (rpe <= 6) return 'bg-yellow-100 text-yellow-700'
  if (rpe <= 8) return 'bg-orange-100 text-orange-700'
  return 'bg-red-100 text-red-700'
}

export default function PatientWorkoutHistory() {
  const [checkins, setCheckins] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState({})

  useEffect(() => {
    patientApi().get('/patient/workout/checkins')
      .then(r => setCheckins(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function toggle(id) {
    setExpanded(p => ({ ...p, [id]: !p[id] }))
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="text-white px-5 py-4 flex items-center gap-3"
        style={{ backgroundColor: 'var(--color-primary)' }}>
        <Link to="/paciente/workout"><ArrowLeft className="w-5 h-5" /></Link>
        <h1 className="font-bold text-lg">Histórico de Treinos</h1>
      </header>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : checkins.length === 0 ? (
          <div className="card text-center py-14">
            <Dumbbell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Nenhum treino registrado ainda</p>
            <p className="text-xs text-gray-400 mt-1">
              Registre seus treinos para acompanhar sua evolução.
            </p>
            <Link to="/paciente/workout" className="btn-primary mt-4 inline-flex">
              Ver meu treino
            </Link>
          </div>
        ) : (
          checkins.map(ci => (
            <div key={ci.id} className="card overflow-hidden">
              <button
                className="w-full flex items-center justify-between"
                onClick={() => toggle(ci.id)}
              >
                <div className="text-left">
                  <p className="font-semibold dark:text-white text-sm">
                    {format(new Date(ci.performed_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {format(new Date(ci.performed_at), 'HH:mm')}
                    {ci.duration_minutes && ` · ${ci.duration_minutes} min`}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${rpeBadgeColor(ci.rpe)}`}>
                    RPE {ci.rpe} — {RPE_LABELS[ci.rpe]}
                  </span>
                  {expanded[ci.id]
                    ? <ChevronUp className="w-4 h-4 text-gray-400" />
                    : <ChevronDown className="w-4 h-4 text-gray-400" />
                  }
                </div>
              </button>

              {expanded[ci.id] && (
                <div className="mt-3 pt-3 border-t dark:border-gray-700">
                  {ci.notes && (
                    <p className="text-xs text-gray-500 italic mb-3">{ci.notes}</p>
                  )}
                  {ci.exercise_logs && ci.exercise_logs.length > 0 ? (
                    <div className="space-y-1.5">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        Exercícios realizados
                      </p>
                      {ci.exercise_logs.map((log, idx) => (
                        <div key={idx} className="flex items-center justify-between py-1.5 border-b last:border-0 dark:border-gray-700">
                          <div className="flex items-center gap-2 min-w-0">
                            {log.exercise_id && (
                              <Link
                                to={`/paciente/workout/exercise/${log.exercise_id}`}
                                className="text-sm font-medium text-primary-600 hover:underline truncate"
                              >
                                {log.exercise_name || `Exercício ${log.exercise_id}`}
                              </Link>
                            )}
                            {!log.exercise_id && (
                              <span className="text-sm dark:text-white truncate">
                                {log.exercise_name || 'Exercício'}
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-gray-400 shrink-0 ml-2">
                            {log.sets_done && `${log.sets_done}×`}
                            {log.reps_done && `${log.reps_done}`}
                            {log.load_used && ` · ${log.load_used}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400">Sem detalhes de exercícios</p>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
