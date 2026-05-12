import { useEffect, useState, useRef } from 'react'
import { X, Search, Plus, Dumbbell } from 'lucide-react'
import api from '../api'
import toast from 'react-hot-toast'

const MUSCLE_GROUPS = [
  { value: '', label: 'Todos os grupos' },
  { value: 'peito', label: 'Peito' },
  { value: 'costas', label: 'Costas' },
  { value: 'pernas', label: 'Pernas' },
  { value: 'ombros', label: 'Ombros' },
  { value: 'bracos', label: 'Braços' },
  { value: 'core', label: 'Core' },
  { value: 'full_body', label: 'Full Body' },
  { value: 'gluteos', label: 'Glúteos' },
  { value: 'panturrilha', label: 'Panturrilha' },
]

const DIFFICULTY_LABELS = {
  iniciante: { label: 'Iniciante', color: 'bg-green-100 text-green-700' },
  intermediario: { label: 'Intermediário', color: 'bg-yellow-100 text-yellow-700' },
  avancado: { label: 'Avançado', color: 'bg-red-100 text-red-700' },
}

export default function ExerciseLibraryModal({ onSelect, onClose }) {
  const [query, setQuery] = useState('')
  const [muscleGroup, setMuscleGroup] = useState('')
  const [exercises, setExercises] = useState([])
  const [loading, setLoading] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
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
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b dark:border-gray-700 shrink-0">
          <h2 className="font-semibold dark:text-white flex items-center gap-2">
            <Dumbbell className="w-4 h-4 text-primary-600" /> Biblioteca de Exercícios
          </h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>

        {/* Filtros */}
        <div className="px-6 py-3 border-b dark:border-gray-700 space-y-2 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              className="input pl-9"
              placeholder="Buscar exercício..."
              value={query}
              onChange={handleQueryChange}
            />
          </div>
          <select className="input" value={muscleGroup} onChange={handleMuscleGroupChange}>
            {MUSCLE_GROUPS.map(mg => (
              <option key={mg.value} value={mg.value}>{mg.label}</option>
            ))}
          </select>
        </div>

        {/* Lista */}
        <div className="flex-1 overflow-y-auto px-6 py-3 space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : exercises.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400 text-sm">Nenhum exercício encontrado</p>
            </div>
          ) : (
            exercises.map(ex => (
              <button
                key={ex.id}
                onClick={() => { onSelect(ex); onClose() }}
                className="w-full text-left p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-gray-800 transition-all flex items-center gap-3"
              >
                {ex.thumbnail ? (
                  <img src={ex.thumbnail} alt={ex.name} className="w-12 h-12 rounded-lg object-cover shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
                    <Dumbbell className="w-5 h-5 text-gray-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm dark:text-white truncate">{ex.name}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-xs text-gray-400 capitalize">{ex.muscle_group}</span>
                    {ex.difficulty && (
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${DIFFICULTY_LABELS[ex.difficulty]?.color || 'bg-gray-100 text-gray-600'}`}>
                        {DIFFICULTY_LABELS[ex.difficulty]?.label || ex.difficulty}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t dark:border-gray-700 shrink-0">
          {!showCreate ? (
            <button
              className="btn-secondary w-full justify-center text-sm"
              onClick={() => setShowCreate(true)}
            >
              <Plus className="w-4 h-4" /> Criar exercício
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
                placeholder="Descrição (opcional)"
                value={createForm.description}
                onChange={e => setCreateForm(f => ({ ...f, description: e.target.value }))}
              />
              <input
                className="input"
                placeholder="URL do vídeo (opcional)"
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
