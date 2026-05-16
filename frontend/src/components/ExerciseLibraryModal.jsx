import { useEffect, useState, useRef } from 'react'
import { X, Search, Plus, Dumbbell } from 'lucide-react'
import api from '../api'
import toast from 'react-hot-toast'

const MUSCLE_GROUPS = [
  { value: '', label: 'Todos os grupos' },
  { value: 'peito', label: '🔴 Peito' },
  { value: 'costas', label: '🔵 Costas' },
  { value: 'pernas', label: '🟢 Pernas' },
  { value: 'ombros', label: '🟣 Ombros' },
  { value: 'bracos', label: '🟠 Braços' },
  { value: 'core', label: '🟡 Core' },
  { value: 'full_body', label: '🔷 Full Body' },
  { value: 'gluteos', label: '🩷 Glúteos' },
  { value: 'panturrilha', label: '🩵 Panturrilha' },
]

const DIFFICULTY_LABELS = {
  iniciante: { label: 'Iniciante', color: 'bg-green-100 text-green-700' },
  intermediario: { label: 'Intermediário', color: 'bg-yellow-100 text-yellow-700' },
  avancado: { label: 'Avançado', color: 'bg-red-100 text-red-700' },
}

/**
 * Componente de animação de exercício.
 * Alterna entre thumbnail (frame 0) e video_url (frame 1) para simular animação.
 * Quando o usuário passa o mouse, mostra o segundo frame.
 */
function ExerciseAnimation({ thumbnail, videoUrl, name, className = '' }) {
  const [showAlt, setShowAlt] = useState(false)
  const intervalRef = useRef(null)

  // Auto-anima ao montar (alterna a cada 600ms)
  useEffect(() => {
    if (!thumbnail || !videoUrl) return
    intervalRef.current = setInterval(() => {
      setShowAlt(prev => !prev)
    }, 600)
    return () => clearInterval(intervalRef.current)
  }, [thumbnail, videoUrl])

  const src = showAlt && videoUrl ? videoUrl : thumbnail

  if (!src) return (
    <div className={`bg-gray-100 dark:bg-gray-800 flex items-center justify-center ${className}`}>
      <Dumbbell className="w-8 h-8 text-gray-300" />
    </div>
  )

  return (
    <img
      src={src}
      alt={name}
      className={`object-cover ${className}`}
      loading="lazy"
      onError={e => { e.target.style.display = 'none' }}
    />
  )
}

export default function ExerciseLibraryModal({ onSelect, onClose }) {
  const [query, setQuery] = useState('')
  const [muscleGroup, setMuscleGroup] = useState('')
  const [exercises, setExercises] = useState([])
  const [loading, setLoading] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [preview, setPreview] = useState(null) // exercício em preview
  const [createForm, setCreateForm] = useState({
    name: '', muscle_group: 'peito', difficulty: 'iniciante',
    description: '', video_url: '', thumbnail: '',
  })
  const debounceRef = useRef(null)

  async function fetchExercises(q, mg) {
    setLoading(true)
    try {
      const params = {}
      if (q) params.q = q
      if (mg) params.muscle_group = mg
      const { data } = await api.get('/personal/exercises/library', { params })
      setExercises(data)
    } catch {
      setExercises([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchExercises('', '')
  }, [])

  function handleQueryChange(e) {
    const val = e.target.value
    setQuery(val)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      fetchExercises(val, muscleGroup)
    }, 300)
  }

  function handleMuscleGroupChange(e) {
    const val = e.target.value
    setMuscleGroup(val)
    fetchExercises(query, val)
  }

  async function handleCreate(e) {
    e.preventDefault()
    try {
      const { data } = await api.post('/personal/exercises/library', {
        ...createForm,
        video_url: createForm.video_url || null,
        thumbnail: createForm.thumbnail || null,
        description: createForm.description || null,
      })
      toast.success('Exercício criado!')
      setShowCreate(false)
      setCreateForm({ name: '', muscle_group: 'peito', difficulty: 'iniciante', description: '', video_url: '', thumbnail: '' })
      fetchExercises(query, muscleGroup)
      onSelect(data)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erro ao criar exercício')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-[#0f0f1c] rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-purple-900/30">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-purple-900/30 shrink-0">
          <h2 className="font-semibold text-white flex items-center gap-2">
            <Dumbbell className="w-4 h-4 text-primary-600" /> Biblioteca de Exercícios
          </h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>

        {/* Filtros */}
        <div className="px-6 py-3 border-b border-purple-900/30 space-y-2 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              className="input pl-9"
              placeholder="Buscar exercício..."
              value={query}
              onChange={handleQueryChange}
              autoFocus
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {MUSCLE_GROUPS.map(mg => (
              <button
                key={mg.value}
                type="button"
                onClick={() => { setMuscleGroup(mg.value); fetchExercises(query, mg.value) }}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                  muscleGroup === mg.value
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)] text-[var(--color-primary)]'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:text-gray-300'
                }`}
              >
                {mg.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Lista de exercícios */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1.5">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : exercises.length === 0 ? (
              <div className="text-center py-8">
                <Dumbbell className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">Nenhum exercício encontrado</p>
              </div>
            ) : (
              exercises.map(ex => (
                <button
                  key={ex.id}
                  onClick={() => setPreview(ex)}
                  className={`w-full text-left p-3 rounded-xl border transition-all flex items-center gap-3 ${
                    preview?.id === ex.id
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)]'
                      : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 hover:bg-primary-50 dark:hover:bg-gray-800'
                  }`}
                >
                  {/* Miniatura animada */}
                  <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-gray-100 dark:bg-gray-800">
                    <ExerciseAnimation
                      thumbnail={ex.thumbnail}
                      videoUrl={ex.video_url}
                      name={ex.name}
                      className="w-full h-full"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm dark:text-white truncate">{ex.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <span className="text-xs text-gray-400 capitalize">{ex.muscle_group?.replace('_', ' ')}</span>
                      {ex.difficulty && (
                        <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${DIFFICULTY_LABELS[ex.difficulty]?.color || 'bg-gray-100 text-gray-600'}`}>
                          {DIFFICULTY_LABELS[ex.difficulty]?.label || ex.difficulty}
                        </span>
                      )}
                      {ex.equipment && (
                        <span className="text-xs text-gray-400">· {ex.equipment}</span>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Preview do exercício selecionado */}
          {preview && (
            <div className="w-72 border-l border-purple-900/30 flex flex-col shrink-0">
              <div className="p-4 space-y-3 overflow-y-auto flex-1">
                {/* Animação grande */}
                <div className="w-full h-48 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800">
                  <ExerciseAnimation
                    thumbnail={preview.thumbnail}
                    videoUrl={preview.video_url}
                    name={preview.name}
                    className="w-full h-full"
                  />
                </div>

                <div>
                  <h3 className="font-semibold dark:text-white">{preview.name}</h3>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {preview.muscle_group && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 capitalize">
                        {preview.muscle_group.replace('_', ' ')}
                      </span>
                    )}
                    {preview.difficulty && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${DIFFICULTY_LABELS[preview.difficulty]?.color || 'bg-gray-100 text-gray-600'}`}>
                        {DIFFICULTY_LABELS[preview.difficulty]?.label}
                      </span>
                    )}
                  </div>
                </div>

                {preview.equipment && (
                  <p className="text-xs text-gray-500">
                    <span className="font-medium">Equipamento:</span> {preview.equipment}
                  </p>
                )}

                {preview.description && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">Como executar:</p>
                    <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                      {preview.description}
                    </p>
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-purple-900/30 shrink-0">
                <button
                  className="btn-primary w-full justify-center"
                  onClick={() => { onSelect(preview); onClose() }}
                >
                  Adicionar ao treino
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-purple-900/30 shrink-0">
          {!showCreate ? (
            <button
              className="btn-secondary w-full justify-center text-sm"
              onClick={() => setShowCreate(true)}
            >
              <Plus className="w-4 h-4" /> Criar exercício personalizado
            </button>
          ) : (
            <form onSubmit={handleCreate} className="space-y-3">
              <p className="text-sm font-medium dark:text-white">Novo exercício</p>
              <input
                className="input"
                placeholder="Nome do exercício *"
                value={createForm.name}
                onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))}
                required
              />
              <div className="grid grid-cols-2 gap-2">
                <select
                  className="input"
                  value={createForm.muscle_group}
                  onChange={e => setCreateForm(f => ({ ...f, muscle_group: e.target.value }))}
                >
                  {MUSCLE_GROUPS.filter(mg => mg.value).map(mg => (
                    <option key={mg.value} value={mg.value}>{mg.label}</option>
                  ))}
                </select>
                <select
                  className="input"
                  value={createForm.difficulty}
                  onChange={e => setCreateForm(f => ({ ...f, difficulty: e.target.value }))}
                >
                  <option value="iniciante">Iniciante</option>
                  <option value="intermediario">Intermediário</option>
                  <option value="avancado">Avançado</option>
                </select>
              </div>
              <textarea
                className="input"
                rows={2}
                placeholder="Descrição / instruções de execução"
                value={createForm.description}
                onChange={e => setCreateForm(f => ({ ...f, description: e.target.value }))}
              />
              <input
                className="input"
                placeholder="URL do vídeo (YouTube, etc.) — opcional"
                value={createForm.video_url}
                onChange={e => setCreateForm(f => ({ ...f, video_url: e.target.value }))}
              />
              <div className="flex gap-2">
                <button type="button" className="btn-secondary flex-1 justify-center text-sm" onClick={() => setShowCreate(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary flex-1 justify-center text-sm">
                  Criar
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
