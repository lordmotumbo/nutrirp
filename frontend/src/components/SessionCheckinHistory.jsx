import { useEffect, useState } from 'react'
import { ChevronDown, ChevronUp, Activity } from 'lucide-react'
import api from '../api'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

function rpeBadge(rpe) {
  if (rpe <= 3) return 'bg-green-100 text-green-700'
  if (rpe <= 6) return 'bg-yellow-100 text-yellow-700'
  return 'bg-red-100 text-red-700'
}

function rpeLabel(rpe) {
  if (rpe === 0) return 'Repouso'
  if (rpe <= 2) return 'Muito leve'
  if (rpe <= 4) return 'Leve'
  if (rpe <= 6) return 'Moderado'
  if (rpe <= 8) return 'Intenso'
  if (rpe === 9) return 'Muito intenso'
  return 'Máximo'
}

export default function SessionCheckinHistory({ clientId }) {
  const [checkins, setCheckins] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState({})

  useEffect(() => {
    if (!clientId) return
    api.get(`/personal/clients/${clientId}/session-checkins`)
      .then(r => setCheckins(r.data))
      .catch(() => setCheckins([]))
      .finally(() => setLoading(false))
  }, [clientId])

  function toggleExpand(id) {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }))
  }

  // Compute average RPE per session_id
  const rpeBySession = checkins.reduce((acc, ci) => {
    if (!acc[ci.session_id]) acc[ci.session_id] = { sum: 0, count: 0, name: ci.session_name || `Sessão ${ci.session_id}` }
    acc[ci.session_id].sum += ci.rpe
    acc[ci.session_id].count += 1
    return acc
  }, {})

  if (loading) return (
    <div className="flex items-center justify-center py-6">
      <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-3">
      {/* Médias de RPE por sessão */}
      {Object.keys(rpeBySession).length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {Object.entries(rpeBySession).map(([sessionId, data]) => {
            const avg = (data.sum / data.count).toFixed(1)
            return (
              <div key={sessionId} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-xs">
                <Activity className="w-3 h-3 text-gray-400" />
                <span className="text-gray-600 dark:text-gray-300">{data.name}</span>
                <span className={`px-1.5 py-0.5 rounded-full font-medium ${rpeBadge(Math.round(parseFloat(avg)))}`}>
                  RPE médio: {avg}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {checkins.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">Nenhum check-in de sessão registrado</p>
      ) : (
        checkins.map(ci => (
          <div key={ci.id} className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
            <button
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              onClick={() => toggleExpand(ci.id)}
            >
              <div className="flex items-center gap-3 text-left">
                <div>
                  <p className="text-sm font-medium dark:text-white">
                    {ci.session_name || `Sessão ${ci.session_id}`}
                  </p>
                  <p className="text-xs text-gray-400">
                    {format(new Date(ci.performed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    {ci.duration_minutes && ` · ${ci.duration_minutes} min`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${rpeBadge(ci.rpe)}`}>
                  RPE {ci.rpe} — {rpeLabel(ci.rpe)}
                </span>
                {expanded[ci.id]
                  ? <ChevronUp className="w-4 h-4 text-gray-400" />
                  : <ChevronDown className="w-4 h-4 text-gray-400" />
                }
              </div>
            </button>

            {expanded[ci.id] && (
              <div className="px-4 pb-4 border-t dark:border-gray-700">
                {ci.notes && (
                  <p className="text-xs text-gray-500 italic mt-2 mb-3">{ci.notes}</p>
                )}
                {ci.exercise_logs && ci.exercise_logs.length > 0 ? (
                  <div className="space-y-1 mt-2">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Exercícios realizados</p>
                    {ci.exercise_logs.map((log, idx) => (
                      <div key={idx} className="flex items-center justify-between py-1.5 border-b last:border-0 dark:border-gray-700">
                        <span className="text-sm dark:text-white">{log.exercise_name || `Exercício ${log.exercise_id}`}</span>
                        <span className="text-xs text-gray-400">
                          {log.sets_done && `${log.sets_done}×`}
                          {log.reps_done && `${log.reps_done}`}
                          {log.load_used && ` · ${log.load_used}`}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 mt-2">Sem logs de exercícios</p>
                )}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  )
}
