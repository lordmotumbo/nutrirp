import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Target } from 'lucide-react'
import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL || 'https://nutrirp-api.onrender.com/api'
const api = () => axios.create({ baseURL: BASE, headers: { Authorization: `Bearer ${localStorage.getItem('nutrirp_patient_token')}` } })

const STATUS_BADGE = {
  ativo: 'bg-green-100 text-green-700',
  concluido: 'bg-blue-100 text-blue-700',
  cancelado: 'bg-gray-100 text-gray-500',
}

export default function PatientGoals() {
  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api().get('/patient-portal/goals')
      .then(r => setGoals(r.data))
      .catch(() => setGoals([]))
      .finally(() => setLoading(false))
  }, [])

  const active = goals.filter(g => g.status === 'ativo')
  const done = goals.filter(g => g.status !== 'ativo')

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="text-white px-5 py-4 flex items-center gap-3" style={{ backgroundColor: 'var(--color-primary)' }}>
        <Link to="/paciente/dashboard"><ArrowLeft className="w-5 h-5" /></Link>
        <h1 className="font-bold text-lg">Minhas Metas</h1>
      </header>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">
        {loading ? (
          <p className="text-center text-gray-400 py-10">Carregando...</p>
        ) : goals.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-4xl mb-3">🎯</p>
            <p className="text-gray-500">Nenhuma meta definida ainda</p>
            <p className="text-xs text-gray-400 mt-1">Seu nutricionista irá definir suas metas</p>
          </div>
        ) : (
          <>
            {active.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Metas Ativas</h2>
                <div className="space-y-3">
                  {active.map(g => {
                    const pct = g.target_value && g.current_value
                      ? Math.min(100, Math.round((g.current_value / g.target_value) * 100))
                      : 0
                    return (
                      <div key={g.id} className="card">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Target className="w-4 h-4 text-primary-600 flex-shrink-0" />
                            <p className="font-semibold dark:text-white">{g.title}</p>
                          </div>
                          <span className={`badge text-xs ${STATUS_BADGE[g.status] || 'bg-gray-100 text-gray-500'}`}>
                            {g.status}
                          </span>
                        </div>
                        {g.description && (
                          <p className="text-xs text-gray-500 mb-3">{g.description}</p>
                        )}
                        {g.target_value && (
                          <>
                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                              <span>Progresso</span>
                              <span className="font-medium">
                                {g.current_value || 0} / {g.target_value} {g.unit}
                              </span>
                            </div>
                            <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{ width: `${pct}%`, backgroundColor: 'var(--color-primary)' }}
                              />
                            </div>
                            <p className="text-right text-xs text-gray-400 mt-1">{pct}%</p>
                          </>
                        )}
                        {g.deadline && (
                          <p className="text-xs text-gray-400 mt-2">
                            📅 Prazo: {new Date(g.deadline).toLocaleDateString('pt-BR')}
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {done.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Histórico</h2>
                <div className="space-y-2">
                  {done.map(g => (
                    <div key={g.id} className="card opacity-70">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium dark:text-white">{g.title}</p>
                        <span className={`badge text-xs ${STATUS_BADGE[g.status] || 'bg-gray-100 text-gray-500'}`}>
                          {g.status}
                        </span>
                      </div>
                      {g.target_value && (
                        <p className="text-xs text-gray-400 mt-1">
                          {g.current_value || 0} / {g.target_value} {g.unit}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
