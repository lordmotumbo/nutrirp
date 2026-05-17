import { useEffect, useState, useRef } from 'react'
import { X, Search, Plus, Dumbbell, Filter } from 'lucide-react'
import api from '../api'
import toast from 'react-hot-toast'

/* ─── Mapeamento de grupos musculares para o body map ─── */
const BODY_MUSCLES = {
  // Frente
  peito: { label: 'Peito', side: 'front' },
  ombros: { label: 'Ombros', side: 'front' },
  bracos: { label: 'Braços', side: 'front' },
  core: { label: 'Core', side: 'front' },
  pernas: { label: 'Pernas', side: 'front' },
  // Costas
  costas: { label: 'Costas', side: 'back' },
}

const EQUIPMENT_OPTIONS = [
  { value: 'destaque', label: 'Destaque', icon: '⭐' },
  { value: 'halteres', label: 'Halteres', icon: '🔩' },
  { value: 'máquina', label: 'Máquina', icon: '⚙️' },
  { value: 'kettlebell', label: 'Kettlebell', icon: '🔔' },
  { value: 'cabos', label: 'Cabos', icon: '🔗' },
  { value: 'prato', label: 'Prato', icon: '🥏' },
  { value: 'yoga', label: 'Yoga', icon: '🧘' },
  { value: 'cardio', label: 'Cardio', icon: '❤️' },
  { value: 'recuperacao', label: 'Recuperação', icon: '🩹' },
  { value: 'barra', label: 'Barra de Pesos', icon: '🏋️' },
  { value: 'peso_corporal', label: 'Peso Corporal', icon: '🧍' },
  { value: 'bola_medicina', label: 'Bola de Medicina', icon: '⚽' },
  { value: 'alongamentos', label: 'Alongamentos', icon: '🤸' },
  { value: 'banda', label: 'Banda', icon: '🎗️' },
  { value: 'trx', label: 'TRX', icon: '🪢' },
  { value: 'bosu_ball', label: 'Bosu Ball', icon: '🔵' },
  { value: 'smith_machine', label: 'Smith Machine', icon: '🏗️' },
  { value: 'pilates', label: 'Pilates', icon: '🧘‍♀️' },
]

const DIFFICULTY_LABELS = {
  iniciante: { label: 'Iniciante', color: 'bg-green-900/40 text-green-400' },
  intermediario: { label: 'Intermediário', color: 'bg-yellow-900/40 text-yellow-400' },
  avancado: { label: 'Avançado', color: 'bg-red-900/40 text-red-400' },
}

const MUSCLE_EMOJI = {
  peito: '🏋️', costas: '🔙', pernas: '🦵', ombros: '💪',
  bracos: '💪', core: '🎯', full_body: '🏃',
}


/**
 * Componente de animação de exercício.
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

/**
 * Body Map SVG - Corpo humano frente e costas com áreas clicáveis
 */
function BodyMap({ selectedMuscle, onSelectMuscle }) {
  const getColor = (muscle) => selectedMuscle === muscle ? '#ef4444' : '#d1d5db'
  const getOpacity = (muscle) => selectedMuscle === muscle ? 0.8 : 0.3

  return (
    <div className="flex items-center justify-center gap-4">
      {/* Corpo Frente */}
      <div className="relative">
        <svg width="140" height="320" viewBox="0 0 140 320" className="select-none">
          {/* Cabeça */}
          <ellipse cx="70" cy="25" rx="18" ry="22" fill="#c9c9c9" stroke="#999" strokeWidth="0.5" />
          {/* Pescoço */}
          <rect x="62" y="45" width="16" height="12" fill="#c9c9c9" />

          {/* Ombros - clicável */}
          <ellipse cx="38" cy="68" rx="14" ry="10" fill={getColor('ombros')} opacity={getOpacity('ombros')}
            className="cursor-pointer hover:opacity-70 transition-opacity"
            onClick={() => onSelectMuscle('ombros')} />
          <ellipse cx="102" cy="68" rx="14" ry="10" fill={getColor('ombros')} opacity={getOpacity('ombros')}
            className="cursor-pointer hover:opacity-70 transition-opacity"
            onClick={() => onSelectMuscle('ombros')} />

          {/* Peito - clicável */}
          <ellipse cx="52" cy="90" rx="18" ry="16" fill={getColor('peito')} opacity={getOpacity('peito')}
            className="cursor-pointer hover:opacity-70 transition-opacity"
            onClick={() => onSelectMuscle('peito')} />
          <ellipse cx="88" cy="90" rx="18" ry="16" fill={getColor('peito')} opacity={getOpacity('peito')}
            className="cursor-pointer hover:opacity-70 transition-opacity"
            onClick={() => onSelectMuscle('peito')} />

          {/* Core/Abdômen - clicável */}
          <rect x="50" y="108" width="40" height="50" rx="6" fill={getColor('core')} opacity={getOpacity('core')}
            className="cursor-pointer hover:opacity-70 transition-opacity"
            onClick={() => onSelectMuscle('core')} />

          {/* Braços - clicável */}
          <rect x="18" y="75" width="14" height="55" rx="7" fill={getColor('bracos')} opacity={getOpacity('bracos')}
            className="cursor-pointer hover:opacity-70 transition-opacity"
            onClick={() => onSelectMuscle('bracos')} />
          <rect x="108" y="75" width="14" height="55" rx="7" fill={getColor('bracos')} opacity={getOpacity('bracos')}
            className="cursor-pointer hover:opacity-70 transition-opacity"
            onClick={() => onSelectMuscle('bracos')} />
          {/* Antebraços */}
          <rect x="14" y="130" width="12" height="45" rx="6" fill={getColor('bracos')} opacity={getOpacity('bracos') * 0.7}
            className="cursor-pointer hover:opacity-70 transition-opacity"
            onClick={() => onSelectMuscle('bracos')} />
          <rect x="114" y="130" width="12" height="45" rx="6" fill={getColor('bracos')} opacity={getOpacity('bracos') * 0.7}
            className="cursor-pointer hover:opacity-70 transition-opacity"
            onClick={() => onSelectMuscle('bracos')} />

          {/* Pernas - clicável */}
          <rect x="46" y="162" width="20" height="80" rx="8" fill={getColor('pernas')} opacity={getOpacity('pernas')}
            className="cursor-pointer hover:opacity-70 transition-opacity"
            onClick={() => onSelectMuscle('pernas')} />
          <rect x="74" y="162" width="20" height="80" rx="8" fill={getColor('pernas')} opacity={getOpacity('pernas')}
            className="cursor-pointer hover:opacity-70 transition-opacity"
            onClick={() => onSelectMuscle('pernas')} />
          {/* Panturrilhas */}
          <rect x="48" y="248" width="16" height="55" rx="7" fill={getColor('pernas')} opacity={getOpacity('pernas') * 0.7}
            className="cursor-pointer hover:opacity-70 transition-opacity"
            onClick={() => onSelectMuscle('pernas')} />
          <rect x="76" y="248" width="16" height="55" rx="7" fill={getColor('pernas')} opacity={getOpacity('pernas') * 0.7}
            className="cursor-pointer hover:opacity-70 transition-opacity"
            onClick={() => onSelectMuscle('pernas')} />

          {/* Contorno do corpo */}
          <path d="M70 47 C50 47 35 55 30 65 L22 75 L14 130 L10 175 L14 175 L25 130 L32 110 L45 160 L44 245 L46 305 L66 305 L68 160 L70 155 L72 160 L74 305 L94 305 L96 245 L95 160 L108 110 L115 130 L126 175 L130 175 L126 130 L118 75 L110 65 C105 55 90 47 70 47Z"
            fill="none" stroke="#666" strokeWidth="1" opacity="0.4" />
        </svg>
        <p className="text-center text-xs text-gray-500 mt-1">Frente</p>
      </div>

      {/* Corpo Costas */}
      <div className="relative">
        <svg width="140" height="320" viewBox="0 0 140 320" className="select-none">
          {/* Cabeça */}
          <ellipse cx="70" cy="25" rx="18" ry="22" fill="#c9c9c9" stroke="#999" strokeWidth="0.5" />
          {/* Pescoço */}
          <rect x="62" y="45" width="16" height="12" fill="#c9c9c9" />

          {/* Ombros traseiros - clicável */}
          <ellipse cx="38" cy="68" rx="14" ry="10" fill={getColor('ombros')} opacity={getOpacity('ombros')}
            className="cursor-pointer hover:opacity-70 transition-opacity"
            onClick={() => onSelectMuscle('ombros')} />
          <ellipse cx="102" cy="68" rx="14" ry="10" fill={getColor('ombros')} opacity={getOpacity('ombros')}
            className="cursor-pointer hover:opacity-70 transition-opacity"
            onClick={() => onSelectMuscle('ombros')} />

          {/* Costas - clicável */}
          <rect x="42" y="72" width="56" height="65" rx="8" fill={getColor('costas')} opacity={getOpacity('costas')}
            className="cursor-pointer hover:opacity-70 transition-opacity"
            onClick={() => onSelectMuscle('costas')} />

          {/* Lombar */}
          <rect x="50" y="138" width="40" height="22" rx="6" fill={getColor('costas')} opacity={getOpacity('costas') * 0.7}
            className="cursor-pointer hover:opacity-70 transition-opacity"
            onClick={() => onSelectMuscle('costas')} />

          {/* Braços traseiros (tríceps) */}
          <rect x="18" y="75" width="14" height="55" rx="7" fill={getColor('bracos')} opacity={getOpacity('bracos')}
            className="cursor-pointer hover:opacity-70 transition-opacity"
            onClick={() => onSelectMuscle('bracos')} />
          <rect x="108" y="75" width="14" height="55" rx="7" fill={getColor('bracos')} opacity={getOpacity('bracos')}
            className="cursor-pointer hover:opacity-70 transition-opacity"
            onClick={() => onSelectMuscle('bracos')} />
          <rect x="14" y="130" width="12" height="45" rx="6" fill={getColor('bracos')} opacity={getOpacity('bracos') * 0.7}
            className="cursor-pointer hover:opacity-70 transition-opacity"
            onClick={() => onSelectMuscle('bracos')} />
          <rect x="114" y="130" width="12" height="45" rx="6" fill={getColor('bracos')} opacity={getOpacity('bracos') * 0.7}
            className="cursor-pointer hover:opacity-70 transition-opacity"
            onClick={() => onSelectMuscle('bracos')} />

          {/* Glúteos */}
          <ellipse cx="56" cy="168" rx="14" ry="12" fill={getColor('pernas')} opacity={getOpacity('pernas')}
            className="cursor-pointer hover:opacity-70 transition-opacity"
            onClick={() => onSelectMuscle('pernas')} />
          <ellipse cx="84" cy="168" rx="14" ry="12" fill={getColor('pernas')} opacity={getOpacity('pernas')}
            className="cursor-pointer hover:opacity-70 transition-opacity"
            onClick={() => onSelectMuscle('pernas')} />

          {/* Isquiotibiais */}
          <rect x="46" y="182" width="20" height="65" rx="8" fill={getColor('pernas')} opacity={getOpacity('pernas') * 0.8}
            className="cursor-pointer hover:opacity-70 transition-opacity"
            onClick={() => onSelectMuscle('pernas')} />
          <rect x="74" y="182" width="20" height="65" rx="8" fill={getColor('pernas')} opacity={getOpacity('pernas') * 0.8}
            className="cursor-pointer hover:opacity-70 transition-opacity"
            onClick={() => onSelectMuscle('pernas')} />

          {/* Panturrilhas */}
          <rect x="48" y="252" width="16" height="50" rx="7" fill={getColor('pernas')} opacity={getOpacity('pernas') * 0.6}
            className="cursor-pointer hover:opacity-70 transition-opacity"
            onClick={() => onSelectMuscle('pernas')} />
          <rect x="76" y="252" width="16" height="50" rx="7" fill={getColor('pernas')} opacity={getOpacity('pernas') * 0.6}
            className="cursor-pointer hover:opacity-70 transition-opacity"
            onClick={() => onSelectMuscle('pernas')} />

          {/* Contorno do corpo */}
          <path d="M70 47 C50 47 35 55 30 65 L22 75 L14 130 L10 175 L14 175 L25 130 L32 110 L45 160 L44 245 L46 305 L66 305 L68 160 L70 155 L72 160 L74 305 L94 305 L96 245 L95 160 L108 110 L115 130 L126 175 L130 175 L126 130 L118 75 L110 65 C105 55 90 47 70 47Z"
            fill="none" stroke="#666" strokeWidth="1" opacity="0.4" />
        </svg>
        <p className="text-center text-xs text-gray-500 mt-1">Costas</p>
      </div>
    </div>
  )
}


/**
 * Painel de Equipamentos com checkboxes (layout similar à imagem de referência)
 */
function EquipmentPanel({ selectedEquipment, onToggle }) {
  return (
    <div className="border border-purple-900/30 rounded-xl p-3 bg-[#0a0a16]">
      <p className="text-xs font-semibold text-gray-300 mb-2 uppercase tracking-wide">Equipamento</p>
      <div className="grid grid-cols-2 gap-1.5">
        {EQUIPMENT_OPTIONS.map(eq => (
          <label
            key={eq.value}
            className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-all text-xs select-none ${
              selectedEquipment.includes(eq.value)
                ? 'bg-purple-900/40 text-purple-300'
                : 'text-gray-400 hover:bg-purple-900/20 hover:text-gray-300'
            }`}
          >
            <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
              selectedEquipment.includes(eq.value)
                ? 'bg-purple-600 border-purple-600'
                : 'border-gray-600'
            }`}>
              {selectedEquipment.includes(eq.value) && (
                <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth="2">
                  <path d="M2 6l3 3 5-5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </span>
            <span className="shrink-0">{eq.icon}</span>
            <span className="truncate">{eq.label}</span>
          </label>
        ))}
      </div>
    </div>
  )
}

export default function ExerciseLibraryModal({ onSelect, onClose }) {
  const [query, setQuery] = useState('')
  const [muscleGroup, setMuscleGroup] = useState('')
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

  async function fetchExercises(q, mg, eqList) {
    setLoading(true)
    try {
      const params = {}
      if (q) params.q = q
      if (mg) params.muscle_group = mg
      if (eqList && eqList.length > 0) params.equipment = eqList[0]
      const { data } = await api.get('/personal/exercises/library', { params })
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
    fetchExercises('', '', [])
  }, [])

  function handleQueryChange(e) {
    const val = e.target.value
    setQuery(val)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      fetchExercises(val, muscleGroup, selectedEquipment)
    }, 300)
  }

  function handleMuscleSelect(muscle) {
    const newVal = muscleGroup === muscle ? '' : muscle
    setMuscleGroup(newVal)
    fetchExercises(query, newVal, selectedEquipment)
  }

  function handleEquipmentToggle(eqValue) {
    const newList = selectedEquipment.includes(eqValue)
      ? selectedEquipment.filter(e => e !== eqValue)
      : [...selectedEquipment, eqValue]
    setSelectedEquipment(newList)
    fetchExercises(query, muscleGroup, newList)
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
      fetchExercises(query, muscleGroup, selectedEquipment)
      onSelect(data)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erro ao criar exercício')
    }
  }

  const MUSCLE_GROUPS_CREATE = [
    { value: 'peito', label: 'Peito' },
    { value: 'costas', label: 'Costas' },
    { value: 'pernas', label: 'Pernas' },
    { value: 'ombros', label: 'Ombros' },
    { value: 'bracos', label: 'Braços' },
    { value: 'core', label: 'Core' },
    { value: 'full_body', label: 'Full Body' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-[#0f0f1c] rounded-2xl shadow-xl w-full max-w-6xl max-h-[92vh] flex flex-col border border-purple-900/30">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-purple-900/30 shrink-0">
          <h2 className="font-semibold text-white flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-purple-400" /> Biblioteca de Exercícios
          </h2>
          <div className="flex items-center gap-3">
            {muscleGroup && (
              <span className="text-xs px-3 py-1 rounded-full bg-red-900/30 text-red-400 border border-red-800 capitalize">
                {muscleGroup.replace('_', ' ')}
              </span>
            )}
            {selectedEquipment.length > 0 && (
              <span className="text-xs px-3 py-1 rounded-full bg-purple-900/30 text-purple-400 border border-purple-800">
                {selectedEquipment.length} equip.
              </span>
            )}
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Conteúdo principal */}
        <div className="flex flex-1 overflow-hidden min-h-0">
          {/* Painel esquerdo: Body Map + Equipamento */}
          <div className="w-[380px] border-r border-purple-900/30 p-4 overflow-y-auto shrink-0 space-y-4">
            {/* Instrução */}
            <p className="text-xs text-gray-500 text-center">Clique no grupo muscular desejado</p>

            {/* Body Map */}
            <BodyMap selectedMuscle={muscleGroup} onSelectMuscle={handleMuscleSelect} />

            {/* Legenda dos músculos */}
            <div className="flex flex-wrap gap-1.5 justify-center">
              {Object.entries(BODY_MUSCLES).map(([key, val]) => (
                <button
                  key={key}
                  onClick={() => handleMuscleSelect(key)}
                  className={`text-xs px-2 py-1 rounded-full border transition-all ${
                    muscleGroup === key
                      ? 'border-red-500 bg-red-900/30 text-red-400'
                      : 'border-gray-700 text-gray-400 hover:border-gray-500'
                  }`}
                >
                  {val.label}
                </button>
              ))}
              <button
                onClick={() => handleMuscleSelect('')}
                className={`text-xs px-2 py-1 rounded-full border transition-all ${
                  !muscleGroup
                    ? 'border-purple-500 bg-purple-900/30 text-purple-400'
                    : 'border-gray-700 text-gray-400 hover:border-gray-500'
                }`}
              >
                Todos
              </button>
            </div>

            {/* Equipamento */}
            <EquipmentPanel selectedEquipment={selectedEquipment} onToggle={handleEquipmentToggle} />
          </div>

          {/* Painel central: busca + lista de exercícios */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Busca */}
            <div className="px-4 py-3 border-b border-purple-900/30 shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  className="input pl-9"
                  placeholder="Buscar exercício por nome..."
                  value={query}
                  onChange={handleQueryChange}
                  autoFocus
                />
              </div>
            </div>

            {/* Lista */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1.5">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : exercises.length === 0 ? (
                <div className="text-center py-8">
                  <Dumbbell className="w-10 h-10 text-gray-600 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">Nenhum exercício encontrado</p>
                  <p className="text-gray-500 text-xs mt-1">Tente ajustar os filtros ou clique em outro grupo muscular</p>
                </div>
              ) : (
                <>
                  <p className="text-xs text-gray-500 mb-2">{exercises.length} exercício{exercises.length !== 1 ? 's' : ''}</p>
                  {exercises.map(ex => (
                    <button
                      key={ex.id}
                      onClick={() => setPreview(ex)}
                      className={`w-full text-left p-3 rounded-xl border transition-all flex items-center gap-3 ${
                        preview?.id === ex.id
                          ? 'border-purple-500 bg-purple-900/20'
                          : 'border-gray-700/50 hover:border-purple-700 hover:bg-purple-900/10'
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
                          {ex.equipment && (
                            <span className="text-xs text-purple-400">· {ex.equipment.replace('_', ' ')}</span>
                          )}
                          {ex.difficulty && (
                            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${DIFFICULTY_LABELS[ex.difficulty]?.color || 'bg-gray-800 text-gray-400'}`}>
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

            {/* Footer: criar exercício */}
            <div className="px-4 py-3 border-t border-purple-900/30 shrink-0">
              {!showCreate ? (
                <button
                  className="btn-secondary w-full justify-center text-sm"
                  onClick={() => setShowCreate(true)}
                >
                  <Plus className="w-4 h-4" /> Criar exercício personalizado
                </button>
              ) : (
                <form onSubmit={handleCreate} className="space-y-2">
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
                      {MUSCLE_GROUPS_CREATE.map(mg => (
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

          {/* Painel direito: Preview */}
          {preview && (
            <div className="w-72 border-l border-purple-900/30 flex flex-col shrink-0">
              <div className="p-4 space-y-3 overflow-y-auto flex-1">
                <div className="w-full h-48 rounded-xl overflow-hidden bg-gray-800">
                  <ExerciseAnimation
                    thumbnail={preview.thumbnail}
                    videoUrl={preview.video_url}
                    name={preview.name}
                    muscleGroup={preview.muscle_group}
                    className="w-full h-full"
                  />
                </div>

                <div>
                  <h3 className="font-semibold text-white text-base">{preview.name}</h3>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {preview.muscle_group && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-red-900/30 text-red-400 capitalize border border-red-800">
                        {preview.muscle_group.replace('_', ' ')}
                      </span>
                    )}
                    {preview.equipment && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-purple-900/30 text-purple-400 capitalize border border-purple-800">
                        {preview.equipment.replace('_', ' ')}
                      </span>
                    )}
                    {preview.difficulty && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${DIFFICULTY_LABELS[preview.difficulty]?.color}`}>
                        {DIFFICULTY_LABELS[preview.difficulty]?.label}
                      </span>
                    )}
                  </div>
                </div>

                {preview.description && (
                  <div>
                    <p className="text-xs font-medium text-gray-300 mb-1">Como executar:</p>
                    <p className="text-xs text-gray-400 leading-relaxed">{preview.description}</p>
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
      </div>
    </div>
  )
}
