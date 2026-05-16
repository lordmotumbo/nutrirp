import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft, Plus, Save, Trash2, X, CheckCircle, Clock,
  Dumbbell, ChevronDown, ChevronUp, Send
} from 'lucide-react'
import api from '../../api'
import toast from 'react-hot-toast'
import ExerciseLibraryModal from '../../components/ExerciseLibraryModal'

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

export default function PersonalWorkoutBuilder() {
  const { planId } = useParams()
  const [plan, setPlan] = useState(null)
  const [sessions, setSessions] = useState([])
  const [activeSession, setActiveSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showLibrary, setShowLibrary] = useState(false)
  const [showNewSession, setShowNewSession] = useState(false)
  const [newSessionName, setNewSessionName] = useState('')
  const [editingExercise, setEditingExercise] = useState({}) // { [exerciseId]: formData }
  const [publishing, setPublishing] = useState(false)

  async function loadPlan() {
    try {
      const { data } = await api.get(`/personal/plans/${planId}`)
      setPlan(data)
      const sorted = [...(data.sessions || [])].sort((a, b) => a.order_index - b.order_index)
      setSessions(sorted)
      if (sorted.length > 0 && !activeSession) {
        setActiveSession(sorted[0].id)
      }
    } catch (err) {
      toast.error('Erro ao carregar plano')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadPlan() }, [planId])

  async function handleAddSession(e) {
    e.preventDefault()
    if (!newSessionName.trim()) return
    try {
      await api.post('/personal/sessions', {
        plan_id: Number(planId),
        name: newSessionName.trim(),
        order_index: sessions.length,
      })
      toast.success('Sessão criada!')
      setShowNewSession(false)
      setNewSessionName('')
      loadPlan()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erro ao criar sessão')
    }
  }

  async function handleDeleteSession(sessionId) {
    if (!confirm('Remover esta sessão e todos os exercícios?')) return
    try {
      await api.delete(`/personal/sessions/${sessionId}`)
      toast.success('Sessão removida')
      if (activeSession === sessionId) setActiveSession(null)
      loadPlan()
    } catch {
      toast.error('Erro ao remover sessão')
    }
  }

  async function handleSelectExercise(exercise) {
    const session = sessions.find(s => s.id === activeSession)
    if (!session) return
    try {
      await api.post('/personal/exercises', {
        session_id: session.id,
        exercise_id: exercise.id,
        exercise_name: exercise.name,
        muscle_group: exercise.muscle_group,
        sets: 3,
        reps: '10',
        load: '',
        rest_time: 60,
        order_index: (session.exercises || []).length,
      })
      toast.success(`${exercise.name} adicionado!`)
      loadPlan()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erro ao adicionar exercício')
    }
  }

  function startEditing(ex) {
    setEditingExercise(prev => ({
      ...prev,
      [ex.id]: {
        sets: ex.sets ?? 3,
        reps: ex.reps ?? '10',
        load: ex.load ?? '',
        rest_time: ex.rest_time ?? 60,
        execution_notes: ex.execution_notes ?? '',
      }
    }))
  }

  function cancelEditing(exId) {
    setEditingExercise(prev => {
      const next = { ...prev }
      delete next[exId]
      return next
    })
  }

  async function handleSaveExercise(exId) {
    const form = editingExercise[exId]
    if (!form) return
    try {
      await api.put(`/personal/exercises/${exId}`, {
        sets: Number(form.sets),
        reps: form.reps,
        load: form.load,
        rest_time: form.rest_time ? Number(form.rest_time) : null,
        execution_notes: form.execution_notes || null,
      })
      toast.success('Exercício salvo!')
      cancelEditing(exId)
      loadPlan()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erro ao salvar exercício')
    }
  }

  async function handleDeleteExercise(exId) {
    if (!confirm('Remover este exercício?')) return
    try {
      await api.delete(`/personal/exercises/${exId}`)
      toast.success('Exercício removido')
      loadPlan()
    } catch {
      toast.error('Erro ao remover exercício')
    }
  }

  async function handlePublish() {
    setPublishing(true)
    try {
      await api.post(`/personal/plans/${planId}/publish`)
      toast.success('Plano publicado!')
      loadPlan()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erro ao publicar plano')
    } finally {
      setPublishing(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-gray-400 text-sm">Carregando plano...</p>
      </div>
    </div>
  )

  if (!plan) return (
    <div className="card text-center py-12 max-w-md mx-auto mt-10">
      <p className="text-gray-500">Plano não encontrado</p>
      <Link to="/personal/workouts" className="btn-secondary mt-4 inline-flex">
        <ArrowLeft className="w-4 h-4" /> Voltar
      </Link>
    </div>
  )

  const currentSession = sessions.find(s => s.id === activeSession)
  const exercises = currentSession
    ? [...(currentSession.exercises || [])].sort((a, b) => a.order_index - b.order_index)
    : []

  // Group exercises by muscle_group
  const grouped = exercises.reduce((acc, ex) => {
    const key = ex.muscle_group || 'outros'
    if (!acc[key]) acc[key] = []
    acc[key].push(ex)
    return acc
  }, {})

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <Link to="/personal/workouts" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold">{plan.title}</h1>
            {plan.is_published ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                <CheckCircle className="w-3 h-3" /> Publicado
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                <Clock className="w-3 h-3" /> Rascunho
              </span>
            )}
          </div>
          <p className="text-sm text-gray-400">
            {plan.objective || 'Sem objetivo'} · {plan.frequency_per_week}x/semana
          </p>
        </div>
        {!plan.is_published && (
          <button
            className="btn-primary"
            onClick={handlePublish}
            disabled={publishing}
          >
            <Send className="w-4 h-4" />
            {publishing ? 'Publicando...' : 'Publicar plano'}
          </button>
        )}
      </div>

      {/* Sessões — abas */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Dumbbell className="w-4 h-4 text-primary-600" /> Sessões
          </h2>
          <button className="btn-secondary text-xs py-1.5" onClick={() => setShowNewSession(true)}>
            <Plus className="w-3 h-3" /> Nova sessão
          </button>
        </div>

        {sessions.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">
            Nenhuma sessão criada. Adicione uma sessão para começar.
          </p>
        ) : (
          <div className="flex gap-2 flex-wrap">
            {sessions.map(s => (
              <div key={s.id} className="flex items-center gap-1">
                <button
                  onClick={() => setActiveSession(s.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition-all ${
                    activeSession === s.id
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)] text-[var(--color-primary)]'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {s.name}
                </button>
                <button
                  onClick={() => handleDeleteSession(s.id)}
                  className="text-gray-300 hover:text-red-400 p-1 transition-colors"
                  title="Remover sessão"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Exercícios da sessão ativa */}
      {currentSession && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">{currentSession.name}</h2>
            <button
              className="btn-primary text-xs py-1.5"
              onClick={() => setShowLibrary(true)}
            >
              <Plus className="w-3 h-3" /> Adicionar exercício
            </button>
          </div>

          {exercises.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">
              Nenhum exercício nesta sessão. Clique em "Adicionar exercício".
            </p>
          ) : (
            <div className="space-y-5">
              {Object.entries(grouped).map(([group, exList]) => (
                <div key={group}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${MUSCLE_GROUP_COLORS[group] || 'bg-gray-100 text-gray-600'}`}>
                      {group.replace('_', ' ')}
                    </span>
                    <div className="flex-1 h-px bg-gray-100 dark:bg-gray-700" />
                  </div>
                  <div className="space-y-3">
                    {exList.map(ex => {
                      const isEditing = !!editingExercise[ex.id]
                      const form = editingExercise[ex.id] || {}
                      return (
                        <div key={ex.id} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <p className="font-medium text-sm">{ex.exercise_name}</p>
                              {!isEditing && (
                                <p className="text-xs text-gray-400 mt-0.5">
                                  {ex.sets && `${ex.sets} séries`}
                                  {ex.reps && ` × ${ex.reps} reps`}
                                  {ex.load && ` · ${ex.load}`}
                                  {ex.rest_time && ` · ${ex.rest_time}s descanso`}
                                </p>
                              )}
                            </div>
                            <div className="flex gap-1 shrink-0">
                              {!isEditing ? (
                                <button
                                  onClick={() => startEditing(ex)}
                                  className="text-xs text-primary-600 hover:text-primary-800 px-2 py-1 rounded border border-primary-200 hover:border-primary-400 transition-colors"
                                >
                                  Editar
                                </button>
                              ) : null}
                              <button
                                onClick={() => handleDeleteExercise(ex.id)}
                                className="text-red-400 hover:text-red-600 p-1 transition-colors"
                                title="Remover"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {isEditing && (
                            <div className="mt-3 space-y-3">
                              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                                <div>
                                  <label className="label">Séries</label>
                                  <input
                                    type="number"
                                    className="input"
                                    value={form.sets}
                                    onChange={e => setEditingExercise(prev => ({
                                      ...prev,
                                      [ex.id]: { ...prev[ex.id], sets: e.target.value }
                                    }))}
                                  />
                                </div>
                                <div>
                                  <label className="label">Reps</label>
                                  <input
                                    type="text"
                                    className="input"
                                    placeholder="ex: 8-12"
                                    value={form.reps}
                                    onChange={e => setEditingExercise(prev => ({
                                      ...prev,
                                      [ex.id]: { ...prev[ex.id], reps: e.target.value }
                                    }))}
                                  />
                                </div>
                                <div>
                                  <label className="label">Carga</label>
                                  <input
                                    type="text"
                                    className="input"
                                    placeholder="ex: 20kg"
                                    value={form.load}
                                    onChange={e => setEditingExercise(prev => ({
                                      ...prev,
                                      [ex.id]: { ...prev[ex.id], load: e.target.value }
                                    }))}
                                  />
                                </div>
                                <div>
                                  <label className="label">Descanso (s)</label>
                                  <input
                                    type="number"
                                    className="input"
                                    value={form.rest_time}
                                    onChange={e => setEditingExercise(prev => ({
                                      ...prev,
                                      [ex.id]: { ...prev[ex.id], rest_time: e.target.value }
                                    }))}
                                  />
                                </div>
                              </div>
                              <div>
                                <label className="label">Notas de execução</label>
                                <textarea
                                  className="input"
                                  rows={2}
                                  placeholder="Instruções, observações..."
                                  value={form.execution_notes}
                                  onChange={e => setEditingExercise(prev => ({
                                    ...prev,
                                    [ex.id]: { ...prev[ex.id], execution_notes: e.target.value }
                                  }))}
                                />
                              </div>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  className="btn-secondary flex-1 justify-center text-sm"
                                  onClick={() => cancelEditing(ex.id)}
                                >
                                  Cancelar
                                </button>
                                <button
                                  type="button"
                                  className="btn-primary flex-1 justify-center text-sm"
                                  onClick={() => handleSaveExercise(ex.id)}
                                >
                                  <Save className="w-3.5 h-3.5" /> Salvar
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal nova sessão */}
      {showNewSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-[#0f0f1c] rounded-2xl shadow-xl w-full max-w-sm border border-purple-900/30">
            <div className="flex items-center justify-between px-6 py-4 border-b border-purple-900/30">
              <h2 className="font-semibold text-white">Nova Sessão</h2>
              <button onClick={() => setShowNewSession(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleAddSession} className="px-6 py-5 space-y-4">
              <div>
                <label className="label">Nome da sessão *</label>
                <input
                  className="input"
                  placeholder="ex: Treino A, Treino B, Peito e Tríceps..."
                  value={newSessionName}
                  onChange={e => setNewSessionName(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div className="flex gap-3">
                <button type="button" className="btn-secondary flex-1 justify-center" onClick={() => setShowNewSession(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary flex-1 justify-center">
                  Criar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal biblioteca de exercícios */}
      {showLibrary && (
        <ExerciseLibraryModal
          onSelect={handleSelectExercise}
          onClose={() => setShowLibrary(false)}
        />
      )}
    </div>
  )
}
