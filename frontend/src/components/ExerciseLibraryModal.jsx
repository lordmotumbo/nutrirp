import { useEffect, useState, useRef } from 'react'
import { X, Search, Plus, Dumbbell } from 'lucide-react'
import api from '../api'
import toast from 'react-hot-toast'

/* ─── Grupos musculares do body map (bem divididos anatomicamente) ─── */
const BODY_MUSCLES = [
  { id: 'peitoral_superior', label: 'Peitoral Superior', group: 'peito', subgroup: 'peitoral_superior' },
  { id: 'peitoral_medio', label: 'Peitoral Médio', group: 'peito', subgroup: 'peitoral_medio' },
  { id: 'peitoral_inferior', label: 'Peitoral Inferior', group: 'peito', subgroup: 'peitoral_inferior' },
  { id: 'deltoide_anterior', label: 'Deltóide Anterior', group: 'ombros', subgroup: 'deltoide_anterior' },
  { id: 'deltoide_lateral', label: 'Deltóide Lateral', group: 'ombros', subgroup: 'deltoide_lateral' },
  { id: 'deltoide_posterior', label: 'Deltóide Posterior', group: 'ombros', subgroup: 'deltoide_posterior' },
  { id: 'biceps', label: 'Bíceps', group: 'bracos', subgroup: 'biceps' },
  { id: 'triceps', label: 'Tríceps', group: 'bracos', subgroup: 'triceps' },
  { id: 'antebraco', label: 'Antebraço', group: 'bracos', subgroup: 'antebraco' },
  { id: 'dorsal', label: 'Dorsal', group: 'costas', subgroup: 'dorsal' },
  { id: 'trapezio', label: 'Trapézio', group: 'costas', subgroup: 'trapezio' },
  { id: 'romboide', label: 'Rombóide', group: 'costas', subgroup: 'romboide' },
  { id: 'lombar', label: 'Lombar', group: 'costas', subgroup: 'lombar' },
  { id: 'abdomen_superior', label: 'Abdômen Sup.', group: 'core', subgroup: 'abdomen_superior' },
  { id: 'abdomen_inferior', label: 'Abdômen Inf.', group: 'core', subgroup: 'abdomen_inferior' },
  { id: 'obliquos', label: 'Oblíquos', group: 'core', subgroup: 'obliquos' },
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
 * Body Map SVG - Corpo humano anatômico detalhado estilo MuscleWiki
 * Cada músculo é individualmente clicável com subdivisões completas
 */
function BodyMap({ selectedMuscle, onSelectMuscle }) {
  const isSelected = (muscle) => selectedMuscle === muscle
  const getFill = (muscle) => isSelected(muscle) ? '#7C3AED' : '#c4a882'
  const getStroke = (muscle) => isSelected(muscle) ? '#5B21B6' : '#8b7355'
  const getOpacity = (muscle) => isSelected(muscle) ? 1 : 0.75

  const muscleStyle = (muscle) => ({
    fill: getFill(muscle),
    stroke: getStroke(muscle),
    strokeWidth: 0.6,
    opacity: getOpacity(muscle),
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  })

  const hoverClass = "hover:opacity-100 hover:brightness-110"

  return (
    <div className="flex items-center justify-center gap-4">
      {/* ─── FRENTE ─── */}
      <div className="relative">
        <svg width="140" height="330" viewBox="0 0 140 330" className="select-none">
          {/* Cabeça */}
          <ellipse cx="70" cy="26" rx="14" ry="18" fill="#c9a87c" stroke="#8b7355" strokeWidth="0.6" />
          <path d="M56 16 C56 7 84 7 84 16 C84 11 56 11 56 16Z" fill="#3d2b1f" opacity="0.7" />
          {/* Pescoço */}
          <rect x="63" y="42" width="14" height="12" rx="3" fill="#c9a87c" stroke="#8b7355" strokeWidth="0.4" />

          {/* ─ Trapézio (parte superior visível na frente) ─ */}
          <path d="M50 54 L63 54 L63 58 L56 62 L44 60 Z"
            className={hoverClass} style={muscleStyle('trapezio')} onClick={() => onSelectMuscle('trapezio')} />
          <path d="M77 54 L90 54 L96 60 L84 62 L77 58 Z"
            className={hoverClass} style={muscleStyle('trapezio')} onClick={() => onSelectMuscle('trapezio')} />

          {/* ─ Deltóide Anterior ─ */}
          <path d="M42 60 C36 60 30 66 28 72 L30 78 L38 74 L44 64 Z"
            className={hoverClass} style={muscleStyle('deltoide_anterior')} onClick={() => onSelectMuscle('deltoide_anterior')} />
          <path d="M98 60 C104 60 110 66 112 72 L110 78 L102 74 L96 64 Z"
            className={hoverClass} style={muscleStyle('deltoide_anterior')} onClick={() => onSelectMuscle('deltoide_anterior')} />

          {/* ─ Peitoral Superior ─ */}
          <path d="M48 62 C48 60 56 58 70 58 C84 58 92 60 92 62 L92 72 C92 76 84 78 70 78 C56 78 48 76 48 72 Z"
            className={hoverClass} style={muscleStyle('peitoral_superior')} onClick={() => onSelectMuscle('peitoral_superior')} />

          {/* ─ Peitoral Médio ─ */}
          <path d="M48 74 C48 72 56 78 70 78 C84 78 92 72 92 74 L92 88 C92 92 84 94 70 94 C56 94 48 92 48 88 Z"
            className={hoverClass} style={muscleStyle('peitoral_medio')} onClick={() => onSelectMuscle('peitoral_medio')} />

          {/* ─ Peitoral Inferior ─ */}
          <path d="M50 90 C50 88 58 94 70 94 C82 94 90 88 90 90 L88 100 C86 102 80 104 70 104 C60 104 54 102 52 100 Z"
            className={hoverClass} style={muscleStyle('peitoral_inferior')} onClick={() => onSelectMuscle('peitoral_inferior')} />

          {/* ─ Bíceps ─ */}
          <path d="M26 78 C22 78 20 84 18 90 L17 116 C17 120 19 122 23 122 L29 122 C33 122 35 120 35 116 L35 90 C35 84 32 78 28 78 Z"
            className={hoverClass} style={muscleStyle('biceps')} onClick={() => onSelectMuscle('biceps')} />
          <path d="M114 78 C118 78 120 84 122 90 L123 116 C123 120 121 122 117 122 L111 122 C107 122 105 120 105 116 L105 90 C105 84 108 78 112 78 Z"
            className={hoverClass} style={muscleStyle('biceps')} onClick={() => onSelectMuscle('biceps')} />

          {/* ─ Antebraço ─ */}
          <path d="M17 124 C15 124 13 130 12 140 L10 162 C10 166 12 168 15 168 L22 166 C24 164 26 160 26 156 L28 140 C28 132 26 124 24 124 Z"
            className={hoverClass} style={muscleStyle('antebraco')} onClick={() => onSelectMuscle('antebraco')} />
          <path d="M123 124 C125 124 127 130 128 140 L130 162 C130 166 128 168 125 168 L118 166 C116 164 114 160 114 156 L112 140 C112 132 114 124 116 124 Z"
            className={hoverClass} style={muscleStyle('antebraco')} onClick={() => onSelectMuscle('antebraco')} />

          {/* ─ Abdômen Superior ─ */}
          <path d="M54 106 L86 106 L85 128 C85 130 80 131 70 131 C60 131 55 130 55 128 Z"
            className={hoverClass} style={muscleStyle('abdomen_superior')} onClick={() => onSelectMuscle('abdomen_superior')} />
          {/* Linhas do six-pack */}
          <line x1="70" y1="106" x2="70" y2="131" stroke="#8b7355" strokeWidth="0.3" opacity="0.4" />
          <line x1="55" y1="116" x2="85" y2="116" stroke="#8b7355" strokeWidth="0.2" opacity="0.3" />

          {/* ─ Abdômen Inferior ─ */}
          <path d="M55 131 L85 131 L84 152 C84 155 80 157 70 157 C60 157 56 155 56 152 Z"
            className={hoverClass} style={muscleStyle('abdomen_inferior')} onClick={() => onSelectMuscle('abdomen_inferior')} />
          <line x1="70" y1="131" x2="70" y2="152" stroke="#8b7355" strokeWidth="0.3" opacity="0.4" />
          <line x1="56" y1="140" x2="84" y2="140" stroke="#8b7355" strokeWidth="0.2" opacity="0.3" />

          {/* ─ Oblíquos ─ */}
          <path d="M48 106 L54 106 L55 150 L52 152 L46 140 L44 120 Z"
            className={hoverClass} style={muscleStyle('obliquos')} onClick={() => onSelectMuscle('obliquos')} />
          <path d="M92 106 L86 106 L85 150 L88 152 L94 140 L96 120 Z"
            className={hoverClass} style={muscleStyle('obliquos')} onClick={() => onSelectMuscle('obliquos')} />

          {/* ─ Quadríceps ─ */}
          <path d="M50 160 C47 160 45 166 44 174 L43 216 C43 222 46 226 52 226 L64 226 C68 226 70 222 70 216 L70 174 C70 166 68 160 64 160 Z"
            className={hoverClass} style={muscleStyle('quadriceps')} onClick={() => onSelectMuscle('quadriceps')} />
          <path d="M76 160 C72 160 70 166 70 174 L70 216 C70 222 72 226 76 226 L88 226 C92 226 94 222 95 216 L97 174 C97 166 94 160 90 160 Z"
            className={hoverClass} style={muscleStyle('quadriceps')} onClick={() => onSelectMuscle('quadriceps')} />

          {/* ─ Adutores ─ */}
          <path d="M64 162 L70 162 L70 200 L67 205 L64 200 Z"
            className={hoverClass} style={muscleStyle('adutores')} onClick={() => onSelectMuscle('adutores')} />
          <path d="M70 162 L76 162 L76 200 L73 205 L70 200 Z"
            className={hoverClass} style={muscleStyle('adutores')} onClick={() => onSelectMuscle('adutores')} />

          {/* ─ Panturrilha (tibial anterior) ─ */}
          <path d="M45 230 C43 230 42 236 42 242 L42 272 C42 278 44 282 48 282 L58 282 C62 282 64 278 64 272 L64 242 C64 236 62 230 60 230 Z"
            className={hoverClass} style={muscleStyle('panturrilha')} onClick={() => onSelectMuscle('panturrilha')} />
          <path d="M80 230 C78 230 76 236 76 242 L76 272 C76 278 78 282 82 282 L92 282 C96 282 98 278 98 272 L98 242 C98 236 96 230 94 230 Z"
            className={hoverClass} style={muscleStyle('panturrilha')} onClick={() => onSelectMuscle('panturrilha')} />

          {/* Pés */}
          <ellipse cx="52" cy="290" rx="11" ry="5" fill="#c9a87c" stroke="#8b7355" strokeWidth="0.4" />
          <ellipse cx="88" cy="290" rx="11" ry="5" fill="#c9a87c" stroke="#8b7355" strokeWidth="0.4" />
          {/* Mãos */}
          <ellipse cx="10" cy="172" rx="5" ry="7" fill="#c9a87c" stroke="#8b7355" strokeWidth="0.4" />
          <ellipse cx="130" cy="172" rx="5" ry="7" fill="#c9a87c" stroke="#8b7355" strokeWidth="0.4" />
        </svg>
        <p className="text-center text-xs text-gray-400 mt-1 font-medium">Frente</p>
      </div>

      {/* ─── COSTAS ─── */}
      <div className="relative">
        <svg width="140" height="330" viewBox="0 0 140 330" className="select-none">
          {/* Cabeça */}
          <ellipse cx="70" cy="26" rx="14" ry="18" fill="#c9a87c" stroke="#8b7355" strokeWidth="0.6" />
          <path d="M56 26 C56 7 84 7 84 26 C84 16 76 12 70 12 C64 12 56 16 56 26Z" fill="#3d2b1f" opacity="0.7" />
          {/* Pescoço */}
          <rect x="63" y="42" width="14" height="12" rx="3" fill="#c9a87c" stroke="#8b7355" strokeWidth="0.4" />

          {/* ─ Trapézio ─ */}
          <path d="M48 54 L63 54 L70 58 L70 72 L60 74 L44 68 L42 60 Z"
            className={hoverClass} style={muscleStyle('trapezio')} onClick={() => onSelectMuscle('trapezio')} />
          <path d="M92 54 L77 54 L70 58 L70 72 L80 74 L96 68 L98 60 Z"
            className={hoverClass} style={muscleStyle('trapezio')} onClick={() => onSelectMuscle('trapezio')} />

          {/* ─ Deltóide Posterior ─ */}
          <path d="M40 58 C34 58 28 64 26 70 L28 76 L36 72 L42 62 Z"
            className={hoverClass} style={muscleStyle('deltoide_posterior')} onClick={() => onSelectMuscle('deltoide_posterior')} />
          <path d="M100 58 C106 58 112 64 114 70 L112 76 L104 72 L98 62 Z"
            className={hoverClass} style={muscleStyle('deltoide_posterior')} onClick={() => onSelectMuscle('deltoide_posterior')} />

          {/* ─ Rombóide (entre escápulas) ─ */}
          <path d="M58 72 L70 70 L70 100 L62 102 L54 96 L54 78 Z"
            className={hoverClass} style={muscleStyle('romboide')} onClick={() => onSelectMuscle('romboide')} />
          <path d="M82 72 L70 70 L70 100 L78 102 L86 96 L86 78 Z"
            className={hoverClass} style={muscleStyle('romboide')} onClick={() => onSelectMuscle('romboide')} />

          {/* ─ Dorsal (latíssimo do dorso) ─ */}
          <path d="M44 70 L54 78 L54 96 L62 102 L62 130 C62 134 58 136 52 134 L44 126 L40 100 L38 80 Z"
            className={hoverClass} style={muscleStyle('dorsal')} onClick={() => onSelectMuscle('dorsal')} />
          <path d="M96 70 L86 78 L86 96 L78 102 L78 130 C78 134 82 136 88 134 L96 126 L100 100 L102 80 Z"
            className={hoverClass} style={muscleStyle('dorsal')} onClick={() => onSelectMuscle('dorsal')} />

          {/* ─ Lombar ─ */}
          <path d="M56 134 L62 130 L70 132 L78 130 L84 134 L86 152 C86 156 80 158 70 158 C60 158 54 156 54 152 Z"
            className={hoverClass} style={muscleStyle('lombar')} onClick={() => onSelectMuscle('lombar')} />
          {/* Coluna */}
          <line x1="70" y1="58" x2="70" y2="152" stroke="#8b7355" strokeWidth="0.4" opacity="0.3" />

          {/* ─ Tríceps ─ */}
          <path d="M26 76 C22 76 20 82 18 88 L17 114 C17 118 19 120 23 120 L29 120 C33 120 35 118 35 114 L35 88 C35 82 32 76 28 76 Z"
            className={hoverClass} style={muscleStyle('triceps')} onClick={() => onSelectMuscle('triceps')} />
          <path d="M114 76 C118 76 120 82 122 88 L123 114 C123 118 121 120 117 120 L111 120 C107 120 105 118 105 114 L105 88 C105 82 108 76 112 76 Z"
            className={hoverClass} style={muscleStyle('triceps')} onClick={() => onSelectMuscle('triceps')} />

          {/* ─ Antebraço (costas) ─ */}
          <path d="M17 122 C15 122 13 128 12 138 L10 160 C10 164 12 166 15 166 L22 164 C24 162 26 158 26 154 L28 138 C28 130 26 122 24 122 Z"
            className={hoverClass} style={muscleStyle('antebraco')} onClick={() => onSelectMuscle('antebraco')} />
          <path d="M123 122 C125 122 127 128 128 138 L130 160 C130 164 128 166 125 166 L118 164 C116 162 114 158 114 154 L112 138 C112 130 114 122 116 122 Z"
            className={hoverClass} style={muscleStyle('antebraco')} onClick={() => onSelectMuscle('antebraco')} />

          {/* ─ Glúteos ─ */}
          <ellipse cx="58" cy="170" rx="14" ry="12"
            className={hoverClass} style={muscleStyle('gluteos')} onClick={() => onSelectMuscle('gluteos')} />
          <ellipse cx="82" cy="170" rx="14" ry="12"
            className={hoverClass} style={muscleStyle('gluteos')} onClick={() => onSelectMuscle('gluteos')} />

          {/* ─ Isquiotibiais ─ */}
          <path d="M44 184 C42 184 40 190 40 198 L40 232 C40 238 42 242 46 242 L60 242 C64 242 66 238 66 232 L66 198 C66 190 64 184 62 184 Z"
            className={hoverClass} style={muscleStyle('isquiotibiais')} onClick={() => onSelectMuscle('isquiotibiais')} />
          <path d="M78 184 C76 184 74 190 74 198 L74 232 C74 238 76 242 80 242 L94 242 C98 242 100 238 100 232 L100 198 C100 190 98 184 96 184 Z"
            className={hoverClass} style={muscleStyle('isquiotibiais')} onClick={() => onSelectMuscle('isquiotibiais')} />

          {/* ─ Panturrilha (gastrocnêmio) ─ */}
          <path d="M42 246 C40 246 38 252 38 258 L40 282 C40 286 43 288 47 288 L58 288 C62 288 64 286 64 282 L66 258 C66 252 64 246 62 246 Z"
            className={hoverClass} style={muscleStyle('panturrilha')} onClick={() => onSelectMuscle('panturrilha')} />
          <path d="M78 246 C76 246 74 252 74 258 L76 282 C76 286 78 288 82 288 L93 288 C97 288 99 286 100 282 L102 258 C102 252 100 246 98 246 Z"
            className={hoverClass} style={muscleStyle('panturrilha')} onClick={() => onSelectMuscle('panturrilha')} />

          {/* Pés */}
          <ellipse cx="52" cy="296" rx="11" ry="5" fill="#c9a87c" stroke="#8b7355" strokeWidth="0.4" />
          <ellipse cx="88" cy="296" rx="11" ry="5" fill="#c9a87c" stroke="#8b7355" strokeWidth="0.4" />
          {/* Mãos */}
          <ellipse cx="10" cy="170" rx="5" ry="7" fill="#c9a87c" stroke="#8b7355" strokeWidth="0.4" />
          <ellipse cx="130" cy="170" rx="5" ry="7" fill="#c9a87c" stroke="#8b7355" strokeWidth="0.4" />
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
  const [selectedMuscle, setSelectedMuscle] = useState(null)
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
              <span className="text-xs px-3 py-1 rounded-full bg-purple-900/30 text-purple-400 border border-purple-800">
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
          <div className="w-[380px] border-r border-purple-900/30 p-4 overflow-y-auto shrink-0 space-y-3">
            <p className="text-xs text-gray-500 text-center">Clique no músculo desejado</p>

            {/* Body Map */}
            <BodyMap selectedMuscle={selectedMuscle?.id} onSelectMuscle={handleMuscleSelect} />

            {/* Legenda / botões de seleção rápida */}
            <div className="flex flex-wrap gap-1 justify-center">
              {BODY_MUSCLES.map(m => (
                <button
                  key={m.id}
                  onClick={() => handleMuscleSelect(m.id)}
                  className={`text-[10px] px-1.5 py-0.5 rounded-full border transition-all ${
                    selectedMuscle?.id === m.id
                      ? 'border-purple-500 bg-purple-900/30 text-purple-400'
                      : 'border-gray-700 text-gray-500 hover:border-gray-500'
                  }`}
                >
                  {m.label}
                </button>
              ))}
              <button
                onClick={() => { setSelectedMuscle(null); fetchExercises(query, null, selectedEquipment) }}
                className={`text-[10px] px-1.5 py-0.5 rounded-full border transition-all ${
                  !selectedMuscle
                    ? 'border-purple-500 bg-purple-900/30 text-purple-400'
                    : 'border-gray-700 text-gray-500 hover:border-gray-500'
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
                            <span className="text-xs text-purple-400">· {ex.subgroup.replace(/_/g, ' ')}</span>
                          )}
                          {ex.equipment && (
                            <span className="text-xs text-gray-500">· {ex.equipment.replace(/_/g, ' ')}</span>
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
                      <span className="text-xs px-2 py-0.5 rounded-full bg-purple-900/30 text-purple-400 capitalize border border-purple-800">
                        {preview.muscle_group.replace('_', ' ')}
                      </span>
                    )}
                    {preview.subgroup && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-purple-900/20 text-purple-300 capitalize border border-purple-800/50">
                        {preview.subgroup.replace(/_/g, ' ')}
                      </span>
                    )}
                    {preview.equipment && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 capitalize border border-gray-700">
                        {preview.equipment.replace(/_/g, ' ')}
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
