import { useEffect, useState, useRef } from 'react'
import { X, Search, Plus, Dumbbell } from 'lucide-react'
import api from '../api'
import toast from 'react-hot-toast'

/* ─── Grupos musculares do body map (separados individualmente) ─── */
const BODY_MUSCLES = [
  { id: 'peito', label: 'Peito', group: 'peito', subgroup: null },
  { id: 'costas', label: 'Costas', group: 'costas', subgroup: null },
  { id: 'ombros', label: 'Ombros', group: 'ombros', subgroup: null },
  { id: 'bracos', label: 'Braços', group: 'bracos', subgroup: null },
  { id: 'core', label: 'Core', group: 'core', subgroup: null },
  { id: 'quadriceps', label: 'Quadríceps', group: 'pernas', subgroup: 'quadriceps' },
  { id: 'gluteos', label: 'Glúteos', group: 'pernas', subgroup: 'gluteos' },
  { id: 'isquiotibiais', label: 'Posterior', group: 'pernas', subgroup: 'isquiotibiais' },
  { id: 'panturrilha', label: 'Panturrilha', group: 'pernas', subgroup: 'panturrilha' },
  { id: 'adutores', label: 'Adutores', group: 'pernas', subgroup: 'adutores' },
]

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
  { value: 'banda', label: 'Banda/Elástico', icon: '🎗️' },
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
 * Body Map SVG - Corpo humano realista com áreas clicáveis separadas
 * Cada parte das pernas é independente (quadríceps, glúteos, isquiotibiais, panturrilha)
 */
function BodyMap({ selectedMuscle, onSelectMuscle }) {
  const isSelected = (muscle) => selectedMuscle === muscle
  const getFill = (muscle) => isSelected(muscle) ? '#ef4444' : '#b8c4ce'
  const getStroke = (muscle) => isSelected(muscle) ? '#dc2626' : '#8899a6'
  const getOpacity = (muscle) => isSelected(muscle) ? 0.9 : 0.6

  const muscleStyle = (muscle) => ({
    fill: getFill(muscle),
    stroke: getStroke(muscle),
    strokeWidth: 0.8,
    opacity: getOpacity(muscle),
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  })

  return (
    <div className="flex items-center justify-center gap-6">
      {/* ─── FRENTE ─── */}
      <div className="relative">
        <svg width="150" height="340" viewBox="0 0 150 340" className="select-none">
          {/* Cabeça */}
          <ellipse cx="75" cy="28" rx="16" ry="20" fill="#d4b896" stroke="#a08060" strokeWidth="0.8" />
          {/* Cabelo */}
          <path d="M59 18 C59 8 91 8 91 18 C91 12 59 12 59 18Z" fill="#4a3728" opacity="0.7" />
          {/* Pescoço */}
          <rect x="67" y="46" width="16" height="14" rx="3" fill="#d4b896" stroke="#a08060" strokeWidth="0.5" />

          {/* ─ Ombros (deltóides) ─ */}
          <path d="M45 62 C38 62 30 68 28 76 L32 80 C36 72 42 66 50 64 Z"
            style={muscleStyle('ombros')} onClick={() => onSelectMuscle('ombros')} />
          <path d="M105 62 C112 62 120 68 122 76 L118 80 C114 72 108 66 100 64 Z"
            style={muscleStyle('ombros')} onClick={() => onSelectMuscle('ombros')} />

          {/* ─ Peito (peitoral) ─ */}
          <path d="M50 68 C50 64 58 62 75 62 C92 62 100 64 100 68 L100 92 C100 100 92 104 75 104 C58 104 50 100 50 92 Z"
            style={muscleStyle('peito')} onClick={() => onSelectMuscle('peito')} />

          {/* ─ Core (abdômen) ─ */}
          <path d="M54 106 L96 106 L94 158 C94 162 88 164 75 164 C62 164 56 162 56 158 Z"
            style={muscleStyle('core')} onClick={() => onSelectMuscle('core')} />
          {/* Linhas do abdômen */}
          <line x1="75" y1="108" x2="75" y2="158" stroke="#8899a6" strokeWidth="0.4" opacity="0.5" />
          <line x1="56" y1="120" x2="94" y2="120" stroke="#8899a6" strokeWidth="0.3" opacity="0.4" />
          <line x1="57" y1="134" x2="93" y2="134" stroke="#8899a6" strokeWidth="0.3" opacity="0.4" />
          <line x1="58" y1="148" x2="92" y2="148" stroke="#8899a6" strokeWidth="0.3" opacity="0.4" />

          {/* ─ Braços (bíceps + antebraço) ─ */}
          <path d="M28 78 C24 78 20 84 18 92 L16 120 C16 126 18 130 22 130 L30 130 C34 130 36 126 36 120 L36 92 C36 84 34 78 30 78 Z"
            style={muscleStyle('bracos')} onClick={() => onSelectMuscle('bracos')} />
          <path d="M122 78 C126 78 130 84 132 92 L134 120 C134 126 132 130 128 130 L120 130 C116 130 114 126 114 120 L114 92 C114 84 116 78 120 78 Z"
            style={muscleStyle('bracos')} onClick={() => onSelectMuscle('bracos')} />
          {/* Antebraços */}
          <path d="M18 132 C16 132 14 138 12 150 L10 172 C10 176 12 178 16 178 L24 176 C26 174 28 170 28 166 L30 150 C30 140 28 132 26 132 Z"
            style={{...muscleStyle('bracos'), opacity: getOpacity('bracos') * 0.8}} onClick={() => onSelectMuscle('bracos')} />
          <path d="M132 132 C134 132 136 138 138 150 L140 172 C140 176 138 178 134 178 L126 176 C124 174 122 170 122 166 L120 150 C120 140 122 132 124 132 Z"
            style={{...muscleStyle('bracos'), opacity: getOpacity('bracos') * 0.8}} onClick={() => onSelectMuscle('bracos')} />

          {/* ─ Quadríceps (frente da coxa) ─ */}
          <path d="M54 166 C50 166 48 172 47 180 L45 220 C45 228 48 232 54 232 L68 232 C72 232 74 228 74 220 L74 180 C74 172 72 166 68 166 Z"
            style={muscleStyle('quadriceps')} onClick={() => onSelectMuscle('quadriceps')} />
          <path d="M82 166 C78 166 76 172 76 180 L76 220 C76 228 78 232 82 232 L96 232 C100 232 102 228 103 220 L105 180 C105 172 102 166 96 166 Z"
            style={muscleStyle('quadriceps')} onClick={() => onSelectMuscle('quadriceps')} />

          {/* ─ Adutores (interno da coxa) ─ */}
          <path d="M68 170 L74 170 L74 210 L72 215 L70 210 L68 215 L66 210 Z"
            style={muscleStyle('adutores')} onClick={() => onSelectMuscle('adutores')} />
          <path d="M76 170 L82 170 L84 210 L82 215 L80 210 L78 215 L76 210 Z"
            style={muscleStyle('adutores')} onClick={() => onSelectMuscle('adutores')} />

          {/* ─ Panturrilha (frente - tibial) ─ */}
          <path d="M48 236 C46 236 44 242 44 250 L44 280 C44 288 46 292 50 292 L62 292 C66 292 68 288 68 280 L68 250 C68 242 66 236 64 236 Z"
            style={muscleStyle('panturrilha')} onClick={() => onSelectMuscle('panturrilha')} />
          <path d="M86 236 C84 236 82 242 82 250 L82 280 C82 288 84 292 88 292 L100 292 C104 292 106 288 106 280 L106 250 C106 242 104 236 102 236 Z"
            style={muscleStyle('panturrilha')} onClick={() => onSelectMuscle('panturrilha')} />

          {/* Pés */}
          <ellipse cx="56" cy="300" rx="12" ry="6" fill="#d4b896" stroke="#a08060" strokeWidth="0.5" />
          <ellipse cx="94" cy="300" rx="12" ry="6" fill="#d4b896" stroke="#a08060" strokeWidth="0.5" />

          {/* Mãos */}
          <ellipse cx="12" cy="182" rx="6" ry="8" fill="#d4b896" stroke="#a08060" strokeWidth="0.5" />
          <ellipse cx="138" cy="182" rx="6" ry="8" fill="#d4b896" stroke="#a08060" strokeWidth="0.5" />
        </svg>
        <p className="text-center text-xs text-gray-400 mt-1 font-medium">Frente</p>
      </div>

      {/* ─── COSTAS ─── */}
      <div className="relative">
        <svg width="150" height="340" viewBox="0 0 150 340" className="select-none">
          {/* Cabeça */}
          <ellipse cx="75" cy="28" rx="16" ry="20" fill="#d4b896" stroke="#a08060" strokeWidth="0.8" />
          {/* Cabelo */}
          <path d="M59 28 C59 8 91 8 91 28 C91 18 80 14 75 14 C70 14 59 18 59 28Z" fill="#4a3728" opacity="0.7" />
          {/* Pescoço */}
          <rect x="67" y="46" width="16" height="14" rx="3" fill="#d4b896" stroke="#a08060" strokeWidth="0.5" />

          {/* ─ Ombros traseiros ─ */}
          <path d="M45 62 C38 62 30 68 28 76 L32 80 C36 72 42 66 50 64 Z"
            style={muscleStyle('ombros')} onClick={() => onSelectMuscle('ombros')} />
          <path d="M105 62 C112 62 120 68 122 76 L118 80 C114 72 108 66 100 64 Z"
            style={muscleStyle('ombros')} onClick={() => onSelectMuscle('ombros')} />

          {/* ─ Costas (dorsal + trapézio) ─ */}
          <path d="M48 62 L102 62 L104 70 C104 74 100 78 98 82 L98 140 C98 148 90 152 75 152 C60 152 52 148 52 140 L52 82 C50 78 46 74 46 70 Z"
            style={muscleStyle('costas')} onClick={() => onSelectMuscle('costas')} />
          {/* Coluna vertebral */}
          <line x1="75" y1="62" x2="75" y2="152" stroke="#8899a6" strokeWidth="0.6" opacity="0.4" />
          {/* Lombar */}
          <path d="M56 152 L94 152 L92 166 C92 168 86 170 75 170 C64 170 58 168 58 166 Z"
            style={{...muscleStyle('costas'), opacity: getOpacity('costas') * 0.8}} onClick={() => onSelectMuscle('costas')} />

          {/* ─ Braços traseiros (tríceps) ─ */}
          <path d="M28 78 C24 78 20 84 18 92 L16 120 C16 126 18 130 22 130 L30 130 C34 130 36 126 36 120 L36 92 C36 84 34 78 30 78 Z"
            style={muscleStyle('bracos')} onClick={() => onSelectMuscle('bracos')} />
          <path d="M122 78 C126 78 130 84 132 92 L134 120 C134 126 132 130 128 130 L120 130 C116 130 114 126 114 120 L114 92 C114 84 116 78 120 78 Z"
            style={muscleStyle('bracos')} onClick={() => onSelectMuscle('bracos')} />
          {/* Antebraços */}
          <path d="M18 132 C16 132 14 138 12 150 L10 172 C10 176 12 178 16 178 L24 176 C26 174 28 170 28 166 L30 150 C30 140 28 132 26 132 Z"
            style={{...muscleStyle('bracos'), opacity: getOpacity('bracos') * 0.8}} onClick={() => onSelectMuscle('bracos')} />
          <path d="M132 132 C134 132 136 138 138 150 L140 172 C140 176 138 178 134 178 L126 176 C124 174 122 170 122 166 L120 150 C120 140 122 132 124 132 Z"
            style={{...muscleStyle('bracos'), opacity: getOpacity('bracos') * 0.8}} onClick={() => onSelectMuscle('bracos')} />

          {/* ─ Glúteos ─ */}
          <ellipse cx="62" cy="178" rx="14" ry="12"
            style={muscleStyle('gluteos')} onClick={() => onSelectMuscle('gluteos')} />
          <ellipse cx="88" cy="178" rx="14" ry="12"
            style={muscleStyle('gluteos')} onClick={() => onSelectMuscle('gluteos')} />

          {/* ─ Isquiotibiais (posterior da coxa) ─ */}
          <path d="M48 192 C46 192 44 198 44 206 L44 240 C44 248 46 252 50 252 L64 252 C68 252 70 248 70 240 L70 206 C70 198 68 192 66 192 Z"
            style={muscleStyle('isquiotibiais')} onClick={() => onSelectMuscle('isquiotibiais')} />
          <path d="M80 192 C78 192 76 198 76 206 L76 240 C76 248 78 252 82 252 L96 252 C100 252 102 248 102 240 L102 206 C102 198 100 192 98 192 Z"
            style={muscleStyle('isquiotibiais')} onClick={() => onSelectMuscle('isquiotibiais')} />

          {/* ─ Panturrilha (gastrocnêmio) ─ */}
          <path d="M46 256 C44 256 42 262 42 268 L44 290 C44 296 48 298 52 298 L62 298 C66 298 68 296 68 290 L70 268 C70 262 68 256 66 256 Z"
            style={muscleStyle('panturrilha')} onClick={() => onSelectMuscle('panturrilha')} />
          <path d="M84 256 C82 256 80 262 80 268 L82 290 C82 296 84 298 88 298 L98 298 C102 298 104 296 104 290 L106 268 C106 262 104 256 102 256 Z"
            style={muscleStyle('panturrilha')} onClick={() => onSelectMuscle('panturrilha')} />

          {/* Pés */}
          <ellipse cx="56" cy="306" rx="12" ry="6" fill="#d4b896" stroke="#a08060" strokeWidth="0.5" />
          <ellipse cx="94" cy="306" rx="12" ry="6" fill="#d4b896" stroke="#a08060" strokeWidth="0.5" />

          {/* Mãos */}
          <ellipse cx="12" cy="182" rx="6" ry="8" fill="#d4b896" stroke="#a08060" strokeWidth="0.5" />
          <ellipse cx="138" cy="182" rx="6" ry="8" fill="#d4b896" stroke="#a08060" strokeWidth="0.5" />
        </svg>
        <p className="text-center text-xs text-gray-400 mt-1 font-medium">Costas</p>
      </div>
    </div>
  )
}


/**
 * Painel de Equipamentos com checkboxes funcionais
 */
function EquipmentPanel({ selectedEquipment, onToggle }) {
  return (
    <div className="border border-purple-900/30 rounded-xl p-3 bg-[#0a0a16]">
      <p className="text-xs font-semibold text-gray-300 mb-2 uppercase tracking-wide">Equipamento</p>
      <div className="grid grid-cols-2 gap-1">
        {EQUIPMENT_OPTIONS.map(eq => {
          const isChecked = selectedEquipment.includes(eq.value)
          return (
            <button
              key={eq.value}
              type="button"
              onClick={() => onToggle(eq.value)}
              className={`flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all text-xs text-left ${
                isChecked
                  ? 'bg-purple-900/40 text-purple-300'
                  : 'text-gray-400 hover:bg-purple-900/20 hover:text-gray-300'
              }`}
            >
              <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                isChecked
                  ? 'bg-purple-600 border-purple-600'
                  : 'border-gray-600'
              }`}>
                {isChecked && (
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth="2.5">
                    <path d="M2 6l3 3 5-5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </span>
              <span className="shrink-0">{eq.icon}</span>
              <span className="truncate">{eq.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function ExerciseLibraryModal({ onSelect, onClose }) {
  const [query, setQuery] = useState('')
  const [selectedMuscle, setSelectedMuscle] = useState(null) // { id, group, subgroup }
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

  async function fetchExercises(q, muscle, eqList) {
    setLoading(true)
    try {
      const params = {}
      if (q) params.q = q
      if (muscle) {
        params.muscle_group = muscle.group
        if (muscle.subgroup) params.subgroup = muscle.subgroup
      }
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
    fetchExercises('', null, [])
  }, [])

  function handleQueryChange(e) {
    const val = e.target.value
    setQuery(val)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      fetchExercises(val, selectedMuscle, selectedEquipment)
    }, 300)
  }

  function handleMuscleSelect(muscleId) {
    if (selectedMuscle?.id === muscleId) {
      // Deselect
      setSelectedMuscle(null)
      fetchExercises(query, null, selectedEquipment)
    } else {
      const muscle = BODY_MUSCLES.find(m => m.id === muscleId)
      setSelectedMuscle(muscle)
      fetchExercises(query, muscle, selectedEquipment)
    }
  }

  function handleEquipmentToggle(eqValue) {
    const newList = selectedEquipment.includes(eqValue)
      ? selectedEquipment.filter(e => e !== eqValue)
      : [...selectedEquipment, eqValue]
    setSelectedEquipment(newList)
    fetchExercises(query, selectedMuscle, newList)
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
      fetchExercises(query, selectedMuscle, selectedEquipment)
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
            {selectedMuscle && (
              <span className="text-xs px-3 py-1 rounded-full bg-red-900/30 text-red-400 border border-red-800">
                {selectedMuscle.label}
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
          <div className="w-[400px] border-r border-purple-900/30 p-4 overflow-y-auto shrink-0 space-y-4">
            {/* Instrução */}
            <p className="text-xs text-gray-500 text-center">Clique no músculo desejado no corpo</p>

            {/* Body Map */}
            <BodyMap selectedMuscle={selectedMuscle?.id} onSelectMuscle={handleMuscleSelect} />

            {/* Legenda / botões de seleção rápida */}
            <div className="flex flex-wrap gap-1.5 justify-center">
              {BODY_MUSCLES.map(m => (
                <button
                  key={m.id}
                  onClick={() => handleMuscleSelect(m.id)}
                  className={`text-xs px-2 py-1 rounded-full border transition-all ${
                    selectedMuscle?.id === m.id
                      ? 'border-red-500 bg-red-900/30 text-red-400'
                      : 'border-gray-700 text-gray-400 hover:border-gray-500'
                  }`}
                >
                  {m.label}
                </button>
              ))}
              <button
                onClick={() => { setSelectedMuscle(null); fetchExercises(query, null, selectedEquipment) }}
                className={`text-xs px-2 py-1 rounded-full border transition-all ${
                  !selectedMuscle
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
                  <p className="text-gray-500 text-xs mt-1">Tente ajustar os filtros ou clique em outro músculo</p>
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
                          {ex.subgroup && (
                            <span className="text-xs text-red-400">· {ex.subgroup.replace('_', ' ')}</span>
                          )}
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
                    {preview.subgroup && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-orange-900/30 text-orange-400 capitalize border border-orange-800">
                        {preview.subgroup.replace('_', ' ')}
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
