import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Dumbbell, TrendingUp, ExternalLink } from 'lucide-react'
import axios from 'axios'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

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

const DIFFICULTY_LABELS = {
  iniciante: { label: 'Iniciante', color: 'bg-green-100 text-green-700' },
  intermediario: { label: 'Intermediário', color: 'bg-yellow-100 text-yellow-700' },
  avancado: { label: 'Avançado', color: 'bg-red-100 text-red-700' },
}

/** Extract numeric value from a load string like "20kg", "60% 1RM", "80" */
function extractLoadNumber(loadStr) {
  if (!loadStr) return null
  const match = String(loadStr).match(/[\d]+(?:[.,]\d+)?/)
  if (!match) return null
  return parseFloat(match[0].replace(',', '.'))
}

export default function PatientExerciseDetail() {
  const { exerciseId } = useParams()
  const [exercise, setExercise] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const api = patientApi()
    Promise.all([
      api.get('/patient/exercises/library', { params: { exercise_id: exerciseId } }),
      api.get(`/patient/workout/exercise-history/${exerciseId}`).catch(() => ({ data: [] })),
    ])
      .then(([exRes, histRes]) => {
        // API may return array or single object
        const exData = Array.isArray(exRes.data) ? exRes.data[0] : exRes.data
        setExercise(exData || null)
        setHistory(histRes.data || [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [exerciseId])

  const chartData = history
    .map(h => ({
      date: format(new Date(h.performed_at), 'dd/MM', { locale: ptBR }),
      load: extractLoadNumber(h.load_used),
      rawLoad: h.load_used,
    }))
    .filter(d => d.load !== null)

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
        <h1 className="font-bold text-lg truncate">{exercise?.name || 'Exercício'}</h1>
      </header>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">
        {!exercise ? (
          <div className="card text-center py-12">
            <Dumbbell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Exercício não encontrado</p>
          </div>
        ) : (
          <>
            {/* Thumbnail */}
            {exercise.thumbnail && (
              <img
                src={exercise.thumbnail}
                alt={exercise.name}
                className="w-full rounded-2xl object-cover max-h-56"
              />
            )}

            {/* Info */}
            <div className="card space-y-3">
              <h2 className="font-bold text-lg dark:text-white">{exercise.name}</h2>
              <div className="flex flex-wrap gap-2">
                {exercise.muscle_group && (
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${MUSCLE_GROUP_COLORS[exercise.muscle_group] || 'bg-gray-100 text-gray-600'}`}>
                    {exercise.muscle_group.replace('_', ' ')}
                  </span>
                )}
                {exercise.difficulty && (
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${DIFFICULTY_LABELS[exercise.difficulty]?.color || 'bg-gray-100 text-gray-600'}`}>
                    {DIFFICULTY_LABELS[exercise.difficulty]?.label || exercise.difficulty}
                  </span>
                )}
                {exercise.equipment && (
                  <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-gray-100 text-gray-600">
                    {exercise.equipment}
                  </span>
                )}
              </div>
              {exercise.description && (
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                  {exercise.description}
                </p>
              )}
            </div>

            {/* Vídeo */}
            {exercise.video_url && (
              <div className="card">
                <h3 className="font-semibold mb-3 dark:text-white flex items-center gap-2">
                  <ExternalLink className="w-4 h-4 text-primary-600" /> Vídeo de execução
                </h3>
                {exercise.video_url.includes('youtube.com') || exercise.video_url.includes('youtu.be') ? (
                  <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                    <iframe
                      className="absolute inset-0 w-full h-full rounded-xl"
                      src={exercise.video_url.replace('watch?v=', 'embed/').replace('youtu.be/', 'www.youtube.com/embed/')}
                      title={exercise.name}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <a
                    href={exercise.video_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 text-primary-600 hover:underline text-sm"
                  >
                    <ExternalLink className="w-4 h-4" /> Ver vídeo
                  </a>
                )}
              </div>
            )}

            {/* Histórico de carga */}
            <div className="card">
              <h3 className="font-semibold mb-3 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary-600" /> Histórico de carga
              </h3>
              {chartData.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">
                  Nenhum registro de carga ainda. Registre seus treinos para acompanhar a evolução.
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(value, name, props) => [props.payload.rawLoad || `${value}`, 'Carga']}
                      labelFormatter={label => `Data: ${label}`}
                    />
                    <Line
                      type="monotone"
                      dataKey="load"
                      stroke="var(--color-primary)"
                      strokeWidth={2}
                      dot={{ r: 4, fill: 'var(--color-primary)' }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}

              {/* Tabela de histórico */}
              {history.length > 0 && (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-gray-400 border-b dark:border-gray-700">
                        <th className="text-left py-2">Data</th>
                        <th className="text-right py-2">Séries</th>
                        <th className="text-right py-2">Reps</th>
                        <th className="text-right py-2">Carga</th>
                        <th className="text-right py-2">RPE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((h, idx) => (
                        <tr key={idx} className="border-b last:border-0 dark:border-gray-700">
                          <td className="py-2 text-gray-600 dark:text-gray-300">
                            {format(new Date(h.performed_at), 'dd/MM/yy', { locale: ptBR })}
                          </td>
                          <td className="text-right py-2">{h.sets_done ?? '—'}</td>
                          <td className="text-right py-2">{h.reps_done ?? '—'}</td>
                          <td className="text-right py-2 font-medium">{h.load_used ?? '—'}</td>
                          <td className="text-right py-2">{h.rpe ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
