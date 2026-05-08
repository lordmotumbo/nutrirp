import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Share2, Users, ChevronRight, Info } from 'lucide-react'
import api from '../api'
import { useAuth } from '../context/AuthContext'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const ROLE_COLORS = {
  nutritionist: 'bg-green-100 text-green-700',
  personal_trainer: 'bg-orange-100 text-orange-700',
  physiotherapist: 'bg-blue-100 text-blue-700',
  all: 'bg-purple-100 text-purple-700',
}

const ROLE_ROUTES = {
  nutritionist: (id) => `/patients/${id}`,
  personal_trainer: (id) => `/personal/clients/${id}`,
  physiotherapist: (id) => `/physio/patients/${id}`,
  all: (id) => `/patients/${id}`,
}

const DATA_ICONS = {
  dados_pessoais: '👤',
  anamnese: '📋',
  dieta: '🥗',
  exames: '🔬',
  suplementos: '💊',
  antropometria: '📏',
  metas: '🎯',
  diario: '📓',
  treinos: '💪',
  checkins: '✅',
  evolucao_corporal: '📈',
  restricoes: '⚠️',
  prontuarios: '🦴',
}

export default function SharedPatients() {
  const { user } = useAuth()
  const [shared, setShared] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    api.get('/share/my-shared-patients')
      .then(r => setShared(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <p className="text-gray-400">Carregando...</p>
    </div>
  )

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Share2 className="w-5 h-5 text-primary-600" />
            Pacientes Compartilhados
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Pacientes que outros profissionais compartilharam com você
          </p>
        </div>
        <span className="badge bg-primary-50 text-primary-700 text-sm px-3 py-1">
          {shared.length} {shared.length === 1 ? 'paciente' : 'pacientes'}
        </span>
      </div>

      {shared.length === 0 ? (
        <div className="card text-center py-16">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Nenhum paciente compartilhado</p>
          <p className="text-xs text-gray-400 mt-1">
            Quando outro profissional compartilhar um paciente com você, ele aparecerá aqui.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {shared.map(item => {
            const route = ROLE_ROUTES[item.access_role]?.(item.patient_id) || `/patients/${item.patient_id}`
            const isExpanded = expanded === item.link_id

            return (
              <div key={item.link_id} className="card">
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                    style={{ backgroundColor: 'var(--color-primary)' }}
                  >
                    {item.patient_name.charAt(0).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold dark:text-white">{item.patient_name}</p>
                      <span className={`badge text-xs ${ROLE_COLORS[item.access_role] || 'bg-gray-100 text-gray-600'}`}>
                        {item.access_role_label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                      {item.patient_weight && <span>{item.patient_weight}kg</span>}
                      {item.patient_height && <span>{item.patient_height}cm</span>}
                      {item.patient_goal && <span>{item.patient_goal}</span>}
                      {item.created_at && (
                        <span>
                          Compartilhado em {format(new Date(item.created_at), "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => setExpanded(isExpanded ? null : item.link_id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                      title="Ver dados compartilhados"
                    >
                      <Info className="w-4 h-4" />
                    </button>
                    <Link
                      to={route}
                      className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1"
                    >
                      Abrir <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>

                {/* Dados compartilhados expandidos */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t dark:border-gray-700">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      Dados que você pode acessar
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {(item.data_labels || []).map((label, i) => (
                        <span
                          key={i}
                          className="flex items-center gap-1 px-2 py-1 bg-gray-50 dark:bg-gray-800 rounded-lg text-xs border dark:border-gray-700 dark:text-gray-300"
                        >
                          <span>{DATA_ICONS[item.shared_data?.[i]] || '📄'}</span>
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
