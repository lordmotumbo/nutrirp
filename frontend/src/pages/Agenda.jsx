import { useEffect, useState } from 'react'
import { Plus, ChevronLeft, ChevronRight, X, CheckCircle, RefreshCw, XCircle } from 'lucide-react'
import api from '../api'
import toast from 'react-hot-toast'
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  isSameMonth, isToday, isSameDay, addMonths, subMonths, parseISO
} from 'date-fns'
import { ptBR } from 'date-fns/locale'

const STATUS_COLOR = {
  agendado: 'bg-blue-500',
  confirmado: 'bg-green-500',
  realizado: 'bg-gray-400',
  cancelado: 'bg-red-400',
  reagendado: 'bg-yellow-500',
  reagendamento_solicitado: 'bg-orange-400',
}

const STATUS_BADGE = {
  agendado: 'bg-blue-100 text-blue-700',
  confirmado: 'bg-green-100 text-green-700',
  realizado: 'bg-gray-100 text-gray-600',
  cancelado: 'bg-red-100 text-red-600',
  reagendado: 'bg-yellow-100 text-yellow-700',
  reagendamento_solicitado: 'bg-orange-100 text-orange-700',
}

const STATUS_LABEL = {
  agendado: 'Agendado',
  confirmado: 'Confirmado',
  realizado: 'Realizado',
  cancelado: 'Cancelado',
  reagendado: 'Reagendado',
  reagendamento_solicitado: 'Reagend. solicitado',
}

export default function Agenda() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [appointments, setAppointments] = useState([])
  const [patients, setPatients] = useState([])
  const [selected, setSelected] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [showActionModal, setShowActionModal] = useState(false)
  const [actionAppt, setActionAppt] = useState(null)
  const [actionType, setActionType] = useState(null) // confirmar | reagendar | cancelar
  const [actionReason, setActionReason] = useState('')
  const [newDate, setNewDate] = useState('')
  const [newTime, setNewTime] = useState('09:00')
  const [form, setForm] = useState({ patient_id: '', date: '', time: '09:00', duration_minutes: 60, type: 'consulta', notes: '' })

  async function load() {
    const [a, p] = await Promise.all([
      api.get('/appointments'),
      api.get('/patients'),
    ])
    setAppointments(a.data)
    setPatients(p.data)
  }

  useEffect(() => { load() }, [])

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  })

  const startDay = startOfMonth(currentMonth).getDay()
  const blanks = Array(startDay).fill(null)

  function aptsForDay(day) {
    return appointments.filter(a => isSameDay(parseISO(a.scheduled_at), day))
  }

  const selectedApts = selected ? aptsForDay(selected) : []

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleCreate(e) {
    e.preventDefault()
    try {
      const scheduled_at = `${form.date}T${form.time}:00`
      await api.post('/appointments', {
        patient_id: Number(form.patient_id),
        scheduled_at,
        duration_minutes: Number(form.duration_minutes),
        type: form.type,
        notes: form.notes || null,
      })
      toast.success('Consulta agendada!')
      setShowModal(false)
      setForm({ patient_id: '', date: '', time: '09:00', duration_minutes: 60, type: 'consulta', notes: '' })
      load()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erro ao agendar')
    }
  }

  function openAction(appt, type) {
    setActionAppt(appt)
    setActionType(type)
    setActionReason('')
    setNewDate(format(parseISO(appt.scheduled_at), 'yyyy-MM-dd'))
    setNewTime(format(parseISO(appt.scheduled_at), 'HH:mm'))
    setShowActionModal(true)
  }

  async function handleAction(e) {
    e.preventDefault()
    try {
      const payload = { status: actionType === 'confirmar' ? 'confirmado' : actionType === 'cancelar' ? 'cancelado' : 'reagendado' }
      if (actionReason) payload.reason = actionReason
      if (actionType === 'reagendar' && newDate) {
        payload.new_scheduled_at = `${newDate}T${newTime}:00`
      }
      await api.put(`/appointments/${actionAppt.id}/status`, payload)
      const msgs = {
        confirmar: 'Consulta confirmada!',
        cancelar: 'Consulta cancelada.',
        reagendar: 'Consulta reagendada! Paciente notificado via chat.',
      }
      toast.success(msgs[actionType])
      setShowActionModal(false)
      load()
    } catch { toast.error('Erro ao atualizar') }
  }

  async function updateStatus(id, status) {
    try {
      await api.put(`/appointments/${id}/status`, { status })
      toast.success('Status atualizado')
      load()
    } catch { toast.error('Erro') }
  }

  async function deleteApt(id) {
    if (!confirm('Cancelar esta consulta?')) return
    await api.delete(`/appointments/${id}`)
    toast.success('Consulta removida')
    load()
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Agenda</h1>
        <button
          className="btn-primary"
          onClick={() => {
            setForm(f => ({ ...f, date: selected ? format(selected, 'yyyy-MM-dd') : '' }))
            setShowModal(true)
          }}
        >
          <Plus className="w-4 h-4" /> Nova consulta
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        {/* Calendário */}
        <div className="md:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setCurrentMonth(m => subMonths(m, 1))} className="p-1 hover:bg-gray-100 rounded">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="font-semibold capitalize">
              {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
            </h2>
            <button onClick={() => setCurrentMonth(m => addMonths(m, 1))} className="p-1 hover:bg-gray-100 rounded">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-7 mb-1">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
              <div key={d} className="text-center text-xs text-gray-400 font-medium py-1">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0.5">
            {blanks.map((_, i) => <div key={`b${i}`} />)}
            {days.map(day => {
              const apts = aptsForDay(day)
              const isSelected = selected && isSameDay(day, selected)
              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelected(isSelected ? null : day)}
                  className={`
                    min-h-[52px] p-1 rounded-lg text-left transition-colors
                    ${!isSameMonth(day, currentMonth) ? 'opacity-30' : ''}
                    ${isToday(day) ? 'bg-primary-50 border border-primary-300' : ''}
                    ${isSelected ? 'bg-primary-100 border border-primary-500' : 'hover:bg-gray-50'}
                  `}
                >
                  <span className={`text-xs font-medium block mb-0.5 ${isToday(day) ? 'text-primary-700' : 'text-gray-700'}`}>
                    {format(day, 'd')}
                  </span>
                  <div className="space-y-0.5">
                    {apts.slice(0, 2).map(a => (
                      <div
                        key={a.id}
                        className={`text-[10px] text-white rounded px-1 truncate ${STATUS_COLOR[a.status] || 'bg-gray-400'}`}
                      >
                        {format(parseISO(a.scheduled_at), 'HH:mm')} {a.patient_name?.split(' ')[0]}
                      </div>
                    ))}
                    {apts.length > 2 && (
                      <div className="text-[10px] text-gray-400">+{apts.length - 2}</div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Painel lateral */}
        <div className="card">
          <h2 className="font-semibold mb-3">
            {selected
              ? format(selected, "dd 'de' MMMM", { locale: ptBR })
              : 'Selecione um dia'}
          </h2>
          {!selected ? (
            <p className="text-sm text-gray-400">Clique em um dia para ver as consultas</p>
          ) : selectedApts.length === 0 ? (
            <p className="text-sm text-gray-400">Nenhuma consulta neste dia</p>
          ) : (
            <ul className="space-y-3">
              {selectedApts.map(a => (
                <li key={a.id} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium">{a.patient_name}</p>
                      <p className="text-xs text-gray-400">
                        {format(parseISO(a.scheduled_at), 'HH:mm')} · {a.duration_minutes}min · {a.type}
                      </p>
                    </div>
                    <button onClick={() => deleteApt(a.id)} className="text-gray-300 hover:text-red-400">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <span className={`badge text-xs ${STATUS_BADGE[a.status] || 'bg-gray-100 text-gray-600'}`}>
                    {STATUS_LABEL[a.status] || a.status}
                  </span>

                  {a.cancel_reason && (
                    <p className="text-xs text-orange-500 italic">Motivo: {a.cancel_reason}</p>
                  )}

                  {/* Ações rápidas */}
                  <div className="flex gap-1.5 flex-wrap">
                    {a.status !== 'confirmado' && a.status !== 'realizado' && a.status !== 'cancelado' && (
                      <button
                        onClick={() => openAction(a, 'confirmar')}
                        className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-green-50 text-green-700 hover:bg-green-100"
                      >
                        <CheckCircle className="w-3 h-3" /> Confirmar
                      </button>
                    )}
                    {a.status !== 'realizado' && a.status !== 'cancelado' && (
                      <button
                        onClick={() => openAction(a, 'reagendar')}
                        className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-yellow-50 text-yellow-700 hover:bg-yellow-100"
                      >
                        <RefreshCw className="w-3 h-3" /> Reagendar
                      </button>
                    )}
                    {a.status !== 'realizado' && a.status !== 'cancelado' && (
                      <button
                        onClick={() => openAction(a, 'cancelar')}
                        className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-red-50 text-red-700 hover:bg-red-100"
                      >
                        <XCircle className="w-3 h-3" /> Cancelar
                      </button>
                    )}
                    {a.status !== 'realizado' && (
                      <button
                        onClick={() => updateStatus(a.id, 'realizado')}
                        className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-gray-100 text-gray-600 hover:bg-gray-200"
                      >
                        ✓ Realizado
                      </button>
                    )}
                  </div>

                  {a.notes && <p className="text-xs text-gray-500 italic">{a.notes}</p>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Modal nova consulta */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="font-semibold">Nova Consulta</h2>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleCreate} className="px-6 py-5 space-y-4">
              <div>
                <label className="label">Paciente *</label>
                <select className="input" value={form.patient_id} onChange={set('patient_id')} required>
                  <option value="">Selecione</option>
                  {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Data *</label>
                  <input type="date" className="input" value={form.date} onChange={set('date')} required />
                </div>
                <div>
                  <label className="label">Horário *</label>
                  <input type="time" className="input" value={form.time} onChange={set('time')} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Duração (min)</label>
                  <input type="number" className="input" value={form.duration_minutes} onChange={set('duration_minutes')} min={15} step={15} />
                </div>
                <div>
                  <label className="label">Tipo</label>
                  <select className="input" value={form.type} onChange={set('type')}>
                    <option value="consulta">Consulta</option>
                    <option value="retorno">Retorno</option>
                    <option value="avaliacao">Avaliação</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Observações</label>
                <textarea className="input" rows={2} value={form.notes} onChange={set('notes')} />
              </div>
              <div className="flex gap-3">
                <button type="button" className="btn-secondary flex-1 justify-center" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn-primary flex-1 justify-center">Agendar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal ação na consulta */}
      {showActionModal && actionAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b dark:border-gray-700">
              <h2 className="font-semibold dark:text-white">
                {actionType === 'confirmar' && '✅ Confirmar consulta'}
                {actionType === 'cancelar' && '❌ Cancelar consulta'}
                {actionType === 'reagendar' && '🔄 Reagendar consulta'}
              </h2>
              <button onClick={() => setShowActionModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleAction} className="px-6 py-5 space-y-4">
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                <p className="text-sm font-medium dark:text-white">{actionAppt.patient_name}</p>
                <p className="text-xs text-gray-400">
                  {format(parseISO(actionAppt.scheduled_at), "dd/MM/yyyy 'às' HH:mm")} · {actionAppt.type}
                </p>
              </div>

              {actionType === 'reagendar' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Nova data *</label>
                      <input type="date" className="input" value={newDate} onChange={e => setNewDate(e.target.value)} required />
                    </div>
                    <div>
                      <label className="label">Novo horário *</label>
                      <input type="time" className="input" value={newTime} onChange={e => setNewTime(e.target.value)} required />
                    </div>
                  </div>
                  <p className="text-xs text-blue-600 bg-blue-50 p-2 rounded-lg">
                    💬 O paciente receberá uma mensagem no chat informando o novo horário e precisará confirmar, reagendar ou cancelar.
                  </p>
                </>
              )}

              {(actionType === 'cancelar' || actionType === 'reagendar') && (
                <div>
                  <label className="label">
                    {actionType === 'cancelar' ? 'Motivo do cancelamento' : 'Motivo do reagendamento'}
                    {actionType === 'cancelar' && ' *'}
                  </label>
                  <textarea
                    className="input"
                    rows={3}
                    value={actionReason}
                    onChange={e => setActionReason(e.target.value)}
                    placeholder="Descreva o motivo..."
                    required={actionType === 'cancelar'}
                  />
                </div>
              )}

              <div className="flex gap-3">
                <button type="button" className="btn-secondary flex-1 justify-center" onClick={() => setShowActionModal(false)}>
                  Voltar
                </button>
                <button type="submit" className="btn-primary flex-1 justify-center">
                  {actionType === 'confirmar' && 'Confirmar'}
                  {actionType === 'cancelar' && 'Cancelar consulta'}
                  {actionType === 'reagendar' && 'Reagendar e notificar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
