import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Plus, X } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const BASE = import.meta.env.VITE_API_URL || 'https://nutrirp-api.onrender.com/api'
const api = () => axios.create({ baseURL: BASE, headers: { Authorization: `Bearer ${localStorage.getItem('nutrirp_patient_token')}` } })

const STATUS = { agendado: 'bg-blue-100 text-blue-700', confirmado: 'bg-green-100 text-green-700', realizado: 'bg-gray-100 text-gray-600', cancelado: 'bg-red-100 text-red-600' }

export default function PatientAppointments() {
  const [appointments, setAppointments] = useState([])
  const [showModal, setShowModal] = useState(false)
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
      load()
    } catch { toast.error('Erro ao solicitar') }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="text-white px-5 py-4 flex items-center gap-3" style={{ backgroundColor: 'var(--color-primary)' }}>
        <Link to="/paciente/dashboard"><ArrowLeft className="w-5 h-5" /></Link>
        <h1 className="font-bold text-lg flex-1">Minhas Consultas</h1>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-1 text-white/80 hover:text-white text-sm">
          <Plus className="w-4 h-4" /> Solicitar
        </button>
      </header>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-3">
        {appointments.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-4xl mb-3">📅</p>
            <p className="text-gray-500">Nenhuma consulta agendada</p>
          </div>
        ) : appointments.map(a => (
          <div key={a.id} className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold dark:text-white">
                  {format(new Date(a.scheduled_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
                <p className="text-sm text-gray-400">
                  {format(new Date(a.scheduled_at), 'HH:mm')} · {a.duration_minutes}min · {a.type}
                </p>
                {a.notes && <p className="text-xs text-gray-400 mt-1">{a.notes}</p>}
              </div>
              <span className={`badge ${STATUS[a.status] || 'bg-gray-100 text-gray-600'}`}>{a.status}</span>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
          <div className="bg-white dark:bg-gray-900 rounded-t-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-5 py-4 border-b dark:border-gray-700">
              <h2 className="font-semibold dark:text-white">Solicitar Consulta</h2>
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
    </div>
  )
}
