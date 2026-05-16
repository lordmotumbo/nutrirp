import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Plus, X, CheckCircle, XCircle, RefreshCw } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const BASE = import.meta.env.VITE_API_URL || 'https://nutrirp-api.onrender.com/api'
const api = () => axios.create({ baseURL: BASE, headers: { Authorization: `Bearer ${localStorage.getItem('nutrirp_patient_token')}` } })

const STATUS = {
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

export default function PatientAppointments() {
  const [appointments, setAppointments] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [showActionModal, setShowActionModal] = useState(false)
  const [selectedAppt, setSelectedAppt] = useState(null)
  const [actionType, setActionType] = useState(null) // confirmar | cancelar | reagendar
  const [reason, setReason] = useState('')
  const [newDate, setNewDate] = useState('')
  const [newTime, setNewTime] = useState('09:00')
  const [form, setForm] = useState({ date: '', time: '09:00', notes: '' })

  async function load() {
    const { data } = await api().get('/patient-portal/appointments')
    setAppointments(data)
  }

  useEffect(() => { load() }, [])

  async function handleRequest(e) {
    e.preventDefault()
    try {
      const preferred_date = `${form.date}T${form.time}:00`
      await api().post(`/patient-portal/appointments/request?preferred_date=${preferred_date}&notes=${form.notes || ''}`)
      toast.success('Solicitação enviada!')
      setShowModal(false)
      setForm({ date: '', time: '09:00', notes: '' })
      load()
    } catch { toast.error('Erro ao solicitar') }
  }

  function openAction(appt, type) {
    setSelectedAppt(appt)
    setActionType(type)
    setReason('')
    setNewDate('')
    setNewTime('09:00')
    setShowActionModal(true)
  }

  async function handleAction(e) {
    e.preventDefault()
    try {
      const payload = { action: actionType, reason: reason || null }
      if (actionType === 'reagendar' && newDate) {
        payload.new_date = `${newDate}T${newTime}:00`
      }
      await api().post(`/patient-portal/appointments/${selectedAppt.id}/action`, payload)
      const msgs = {
        confirmar: 'Consulta confirmada!',
        cancelar: 'Consulta cancelada.',
        reagendar: 'Solicitação de reagendamento enviada!',
      }
      toast.success(msgs[actionType])
      setShowActionModal(false)
      load()
    } catch { toast.error('Erro ao processar ação') }
  }

  const upcoming = appointments.filter(a => new Date(a.scheduled_at) >= new Date() && a.status !== 'cancelado')
  const past = appointments.filter(a => new Date(a.scheduled_at) < new Date() || a.status === 'cancelado')

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="text-white px-5 py-4 flex items-center gap-3" style={{ backgroundColor: 'var(--color-primary)' }}>
        <Link to="/paciente/dashboard"><ArrowLeft className="w-5 h-5" /></Link>
        <h1 className="font-bold text-lg flex-1">Minhas Consultas</h1>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-1 text-white/80 hover:text-white text-sm">
          <Plus className="w-4 h-4" /> Solicitar
        </button>
      </header>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">
        {appointments.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-4xl mb-3">📅</p>
            <p className="text-gray-500">Nenhuma consulta agendada</p>
          </div>
        ) : (
          <>
            {upcoming.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Próximas</h2>
                <div className="space-y-3">
                  {upcoming.map(a => (
                    <div key={a.id} className="card">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-semibold dark:text-white">
                            {format(new Date(a.scheduled_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                          </p>
                          <p className="text-sm text-gray-400">
                            {format(new Date(a.scheduled_at), 'HH:mm')} · {a.duration_minutes}min · {a.type}
                          </p>
                          {a.notes && <p className="text-xs text-gray-400 mt-1">{a.notes}</p>}
                          {a.cancel_reason && (
                            <p className="text-xs text-orange-500 mt-1">Motivo: {a.cancel_reason}</p>
                          )}
                        </div>
                        <span className={`badge ${STATUS[a.status] || 'bg-gray-100 text-gray-600'}`}>
                          {STATUS_LABEL[a.status] || a.status}
                        </span>
                      </div>

                      {/* Ações disponíveis */}
                      {(a.status === 'agendado' || a.status === 'reagendado') && (
                        <div className="flex gap-2 pt-2 border-t dark:border-gray-700">
                          <button
                            onClick={() => openAction(a, 'confirmar')}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
                          >
                            <CheckCircle className="w-4 h-4" /> Confirmar
                          </button>
                          <button
                            onClick={() => openAction(a, 'reagendar')}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium bg-yellow-50 text-yellow-700 hover:bg-yellow-100 transition-colors"
                          >
                            <RefreshCw className="w-4 h-4" /> Reagendar
                          </button>
                          <button
                            onClick={() => openAction(a, 'cancelar')}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
                          >
                            <XCircle className="w-4 h-4" /> Cancelar
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {past.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Histórico</h2>
                <div className="space-y-2">
                  {past.map(a => (
                    <div key={a.id} className="card opacity-70">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium dark:text-white">
                            {format(new Date(a.scheduled_at), "dd/MM/yyyy 'às' HH:mm")}
                          </p>
                          <p className="text-xs text-gray-400">{a.type}</p>
                        </div>
                        <span className={`badge ${STATUS[a.status] || 'bg-gray-100 text-gray-600'}`}>
                          {STATUS_LABEL[a.status] || a.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal solicitar consulta */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
          <div className="bg-[#0f0f1c] rounded-t-2xl w-full max-w-lg border border-purple-900/30">
            <div className="flex items-center justify-between px-5 py-4 border-b border-purple-900/30">
              <h2 className="font-semibold text-white">Solicitar Consulta</h2>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleRequest} className="px-5 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Data *</label>
                  <input type="date" className="input" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required /></div>
                <div><label className="label">Horário preferido</label>
                  <input type="time" className="input" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} /></div>
              </div>
              <div><label className="label">Observações</label>
                <textarea className="input" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Motivo, preferências..." /></div>
              <button type="submit" className="btn-primary w-full justify-center">Enviar solicitação</button>
            </form>
          </div>
        </div>
      )}

      {/* Modal ação na consulta */}
      {showActionModal && selectedAppt && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
          <div className="bg-[#0f0f1c] rounded-t-2xl w-full max-w-lg border border-purple-900/30">
            <div className="flex items-center justify-between px-5 py-4 border-b border-purple-900/30">
              <h2 className="font-semibold text-white capitalize">
                {actionType === 'confirmar' && '✅ Confirmar consulta'}
                {actionType === 'cancelar' && '❌ Cancelar consulta'}
                {actionType === 'reagendar' && '🔄 Solicitar reagendamento'}
              </h2>
              <button onClick={() => setShowActionModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleAction} className="px-5 py-4 space-y-4">
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                <p className="text-sm font-medium dark:text-white">
                  {format(new Date(selectedAppt.scheduled_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
                <p className="text-xs text-gray-400">{selectedAppt.type}</p>
              </div>

              {actionType === 'reagendar' && (
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="label">Nova data sugerida</label>
                    <input type="date" className="input" value={newDate} onChange={e => setNewDate(e.target.value)} /></div>
                  <div><label className="label">Horário</label>
                    <input type="time" className="input" value={newTime} onChange={e => setNewTime(e.target.value)} /></div>
                </div>
              )}

              {(actionType === 'cancelar' || actionType === 'reagendar') && (
                <div>
                  <label className="label">
                    {actionType === 'cancelar' ? 'Motivo do cancelamento' : 'Motivo do reagendamento'}
                  </label>
                  <textarea
                    className="input"
                    rows={3}
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    placeholder="Descreva o motivo..."
                    required={actionType === 'cancelar'}
                  />
                </div>
              )}

              <div className="flex gap-3">
                <button type="button" className="btn-secondary flex-1 justify-center" onClick={() => setShowActionModal(false)}>
                  Voltar
                </button>
                <button
                  type="submit"
                  className={`flex-1 justify-center btn-primary ${actionType === 'cancelar' ? 'bg-red-600 hover:bg-red-700' : ''}`}
                >
                  {actionType === 'confirmar' && 'Confirmar'}
                  {actionType === 'cancelar' && 'Cancelar consulta'}
                  {actionType === 'reagendar' && 'Enviar solicitação'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
