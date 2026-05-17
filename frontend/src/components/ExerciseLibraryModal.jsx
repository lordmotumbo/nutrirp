import { useEffect, useState, useRef } from 'react'
import { X, Search, Plus, Dumbbell, Filter } from 'lucide-react'
import api from '../api'
import toast from 'react-hot-toast'

const MUSCLE_GROUPS = [
  { value: '', label: 'Todos' },
  { value: 'peito', label: '🔴 Peito' },
  { value: 'costas', label: '🔵 Costas' },
  { value: 'pernas', label: '🟢 Pernas' },
  { value: 'ombros', label: '🟣 Ombros' },
  { value: 'bracos', label: '🟠 Braços' },
  { value: 'core', label: '🟡 Core' },
  { value: 'full_body', label: '🔷 Full Body' },
]

const SUBGROUPS = {
  peito: [
    { value: 'peitoral_superior', label: 'Peitoral Superior' },
    { value: 'peitoral_medio', label: 'Peitoral Médio' },
    { value: 'peitoral_inferior', label: 'Peitoral Inferior' },
  ],
  costas: [
    { value: 'dorsal', label: 'Dorsal' },
    { value: 'trapezio', label: 'Trapézio' },
    { value: 'romboide', label: 'Rombóide' },
    { value: 'lombar', label: 'Lombar' },
  ],
  pernas: [
    { value: 'quadriceps', label: 'Quadríceps' },
    { value: 'isquiotibiais', label: 'Isquiotibiais' },
    { value: 'gluteos', label: 'Glúteos' },
    { value: 'adutores', label: 'Adutores' },
    { value: 'abdutores', label: 'Abdutores' },
    { value: 'panturrilha', label: 'Panturrilha' },
  ],
  ombros: [
    { value: 'deltoide_anterior', label: 'Deltóide Anterior' },
    { value: 'deltoide_lateral', label: 'Deltóide Lateral' },
    { value: 'deltoide_posterior', label: 'Deltóide Posterior' },
  ],
  bracos: [
    { value: 'biceps', label: 'Bíceps' },
    { value: 'triceps', label: 'Tríceps' },
    { value: 'antebraco', label: 'Antebraço' },
  ],
  core: [
    { value: 'abdomen_superior', label: 'Abdômen Superior' },
    { value: 'abdomen_inferior', label: 'Abdômen Inferior' },
    { value: 'obliquos', label: 'Oblíquos' },
    { value: 'transverso', label: 'Transverso' },
  ],
  full_body: [
    { value: 'compostos', label: 'Compostos' },
    { value: 'cardio', label: 'Cardio' },
  ],
}

const EQUIPMENT_OPTIONS = [
  { value: 'barra', label: '🏋️ Barra' },
  { value: 'halteres', label: '🔩 Halteres' },
  { value: 'máquina', label: '⚙️ Máquina' },
  { value: 'cabos', label: '🔗 Cabos' },
  { value: 'peso_corporal', label: '🧍 Peso Corporal' },
  { value: 'kettlebell', label: '🔔 Kettlebell' },
  { value: 'elástico', label: '🎗️ Elástico' },
  { value: 'smith_machine', label: '🏗️ Smith' },
  { value: 'banco', label: '🪑 Banco' },
  { value: 'corda', label: '🪢 Corda' },
]

const DIFFICULTY_LABELS = {
  iniciante: { label: 'Iniciante', color: 'bg-green-100 text-green-700' },
  intermediario: { label: 'Intermediário', color: 'bg-yellow-100 text-yellow-700' },
  avancado: { label: 'Avançado', color: 'bg-red-100 text-red-700' },
}

const MUSCLE_EMOJI = {
  peito: '🏋️', costas: '🔙', pernas: '🦵', ombros: '💪',
  bracos: '💪', core: '🎯', full_body: '🏃',
}

/**
 * Componente de animação de exercício.
 * Alterna entre thumbnail (frame 0) e video_url (frame 1) para simular animação.
 */
function ExerciseAnimation({ thumbnail, videoUrl, name, muscleGroup, className = '' }) {
  const [showAlt, setShowAlt] = useState(false)
  const intervalRef = useRef(null)

  useEffect(() => {
    if (!thumbnail || !videoUrl) return
    intervalRef.current = setInterval(() => {
      setShowAlt(prev => !prev)
    }, 600)
    return () => clearInterval(intervalRef.current)
  }, [thumbnail, videoUrl])

  const src = showAlt && videoUrl ? videoUrl : thumbnail

  if (!src) return (
    <div className={`bg-purple-900/30 flex items-center justify-center text-2xl ${className}`}>
      {MUSCLE_EMOJI[muscleGroup] || '🏋️'}
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
  const [subgroup, setSubgroup] = useState('')
  const [selectedEquipment, setSelectedEquipment] = useState([])
  const [exercises, setExercises] = useState([])
  const [loading, setLoading] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [preview, setPreview] = useState(null)
  const [createForm, setCreateForm] = useState({
    name: '', muscle_group: 'peito', difficulty: 'iniciante',
    description: '', video_url: '', thumbnail: '',
  })
  const debounceRef = useRef(null)

  async function fetchExercises(q, mg, sg, eqList) {
    setLoading(true)
    try {
      const params = {}
      if (q) params.q = q
      if (mg) params.muscle_group = mg
      if (sg) params.subgroup = sg
      // Send first selected equipment (API accepts single value)
      if (eqList && eqList.length > 0) params.equipment = eqList[0]
      const { data } = await api.get('/personal/exercises/library', { params })
      // Client-side filter for multiple equipment if needed
      let filtered = data
      if (eqList && eqList.length > 1) {
        filtered = data.filter(ex => eqList.includes(ex.equipment))
      }
      setExercises(filtered)
    } catch {
      setExercises([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchExercises('', '', '', [])
  }, [])

  function handleQueryChange(e) {
    const val = e.target.value
    setQuery(val)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      fetchExercises(val, muscleGroup, subgroup, selectedEquipment)
    }, 300)
  }

  function handleMuscleGroupChange(val) {
    setMuscleGroup(val)
    setSubgroup('')
    fetchExercises(query, val, '', selectedEquipment)
  }

  function handleSubgroupChange(val) {
    const newVal = subgroup === val ? '' : val
    setSubgroup(newVal)
    fetchExercises(query, muscleGroup, newVal, selectedEquipment)
  }

  function handleEquipmentToggle(eqValue) {
    const newList = selectedEquipment.includes(eqValue)
      ? selectedEquipment.filter(e => e !== eqValue)
      : [...selectedEquipment, eqValue]
    setSelectedEquipment(newList)
    fetchExercises(query, muscleGroup, subgroup, newList)
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
      fetchExercises(query, muscleGroup, subgroup, selectedEquipment)
      onSelect(data)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erro ao criar exercício')
    }
  }

  const currentSubgroups = muscleGroup ? (SUBGROUPS[muscleGroup] || []) : []

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-[#0f0f1c] rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-purple-900/30">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-purple-900/30 shrink-0">
          <h2 className="font-semibold text-white flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-primary-600" /> Biblioteca de Exercícios
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filtros */}
        <div className="px-6 py-3 border-b border-purple-900/30 space-y-3 shrink-0">
          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              className="input pl-9"
              placeholder="🔍 Buscar exercício..."
              value={query}
              onChange={handleQueryChange}
              autoFocus
            />
          </div>

          {/* Grupo muscular */}
          <div>
            <p className="text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">Grupo Muscular</p>
            <div className="flex gap-2 flex-wrap">
              {MUSCLE_GROUPS.map(mg => (
                <button
                  key={mg.value}
                  type="button"
                  onClick={() => handleMuscleGroupChange(mg.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    muscleGroup === mg.value
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)] text-[var(--color-primary)]'
                      : 'border-gray-700 text-gray-300 hover:border-gray-500'
                  }`}
                >
                  {mg.label}
                </button>
              ))}
            </div>
          </div>

          {/* Subgrupo (aparece ao selecionar grupo) */}
          {currentSubgroups.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">Subgrupo</p>
              <div className="flex gap-2 flex-wrap">
                {currentSubgroups.map(sg => (
                  <button
                    key={sg.value}
                    type="button"
                    onClick={() => handleSubgroupChange(sg.value)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                      subgroup === sg.value
                        ? 'border-purple-500 bg-purple-900/40 text-purple-300'
                        : 'border-purple-900/40 text-gray-400 hover:border-purple-700 hover:text-gray-300'
                    }`}
                  >
                    {sg.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Equipamento (checkboxes) */}
          <div>
            <p className="text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide flex items-center gap-1">
              <Filter className="w-3 h-3" /> Equipamento
            </p>
            <div className="flex gap-2 flex-wrap">
              {EQUIPMENT_OPTIONS.map(eq => (
                <label
                  key={eq.value}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border cursor-pointer transition-all select-none ${
                    selectedEquipment.includes(eq.value)
                      ? 'border-emerald-500 bg-emerald-900/30 text-emerald-300'
                      : 'border-gray-700 text-gray-400 hover:border-gray-500'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={selectedEquipment.includes(eq.value)}
                    onChange={() => handleEquipmentToggle(eq.value)}
                  />
                  <span className={`w-3 h-3 rounded border flex items-center justify-center ${
                    selectedEquipment.includes(eq.value)
                      ? 'bg-emerald-500 border-emerald-500'
                      : 'border-gray-500'
                  }`}>
                    {selectedEquipment.includes(eq.value) && (
                      <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 12 12">
                        <path d="M10 3L4.5 8.5 2 6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </span>
                  {eq.label}
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Conteúdo principal: lista + preview */}
        <div className="flex flex-1 overflow-hidden min-h-0">
          {/* Lista de exercícios */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1.5">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : exercises.length === 0 ? (
              <div className="text-center py-8">
                <Dumbbell className="w-10 h-10 text-gray-600 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">Nenhum exercício encontrado</p>
                <p className="text-gray-500 text-xs mt-1">Tente ajustar os filtros</p>
              </div>
            ) : (
              <>
                <p className="text-xs text-gray-500 mb-2">{exercises.length} exercício{exercises.length !== 1 ? 's' : ''} encontrado{exercises.length !== 1 ? 's' : ''}</p>
                {exercises.map(ex => (
                  <button
                    key={ex.id}
                    onClick={() => setPreview(ex)}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-center gap-3 ${
                      preview?.id === ex.id
                        ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)]'
                        : 'border-gray-700 hover:border-purple-700 hover:bg-purple-900/10'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-gray-800">
                      <ExerciseAnimation
                        thumbnail={ex.thumbnail}
                        videoUrl={ex.video_url}
                        name={ex.name}
                        muscleGroup={ex.muscle_group}
                        className="w-full h-full"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-white truncate">{ex.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <span className="text-xs text-gray-400 capitalize">{ex.muscle_group?.replace('_', ' ')}</span>
                        {ex.subgroup && (
                          <span className="text-xs text-purple-400">· {ex.subgroup.replace('_', ' ')}</span>
                        )}
                        {ex.difficulty && (
                          <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${DIFFICULTY_LABELS[ex.difficulty]?.color || 'bg-gray-100 text-gray-600'}`}>
                            {DIFFICULTY_LABELS[ex.difficulty]?.label || ex.difficulty}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </>
            )}
          </div>

          {/* Preview do exercício selecionado */}
          {preview && (
            <div className="w-80 border-l border-purple-900/30 flex flex-col shrink-0">
              <div className="p-4 space-y-3 overflow-y-auto flex-1">
                {/* Animação grande */}
                <div className="w-full h-52 rounded-xl overflow-hidden bg-gray-800">
                  <ExerciseAnimation
                    thumbnail={preview.thumbnail}
                    videoUrl={preview.video_url}
                    name={preview.name}
                    muscleGroup={preview.muscle_group}
                    className="w-full h-full"
                  />
                </div>

                <div>
                  <h3 className="font-semibold text-white text-lg">{preview.name}</h3>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {preview.muscle_group && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary-900/30 text-primary-400 capitalize border border-primary-800">
                        {preview.muscle_group.replace('_', ' ')}
                      </span>
                    )}
                    {preview.subgroup && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-purple-900/30 text-purple-400 capitalize border border-purple-800">
                        {preview.subgroup.replace('_', ' ')}
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
                  <p className="text-xs text-gray-400">
                    <span className="font-medium text-gray-300">Equipamento:</span> {preview.equipment.replace('_', ' ')}
                  </p>
                )}

                {preview.description && (
                  <div>
                    <p className="text-xs font-medium text-gray-300 mb-1">Como executar:</p>
                    <p className="text-xs text-gray-400 leading-relaxed">
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
                  <Plus className="w-4 h-4" /> Adicionar ao treino
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
              <p className="text-sm font-medium text-white">Novo exercício</p>
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
