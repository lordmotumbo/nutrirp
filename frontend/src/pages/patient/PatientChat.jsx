import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Send } from 'lucide-react'
import axios from 'axios'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

const BASE = import.meta.env.VITE_API_URL || 'https://nutrirp-api.onrender.com/api'

function patientApi() {
  const token = localStorage.getItem('nutrirp_patient_token')
  return axios.create({
    baseURL: BASE,
    headers: { Authorization: `Bearer ${token}` }
  })
}

export default function PatientChat() {
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)
  const bottomRef = useRef(null)

  async function load() {
    try {
      const { data } = await patientApi().get('/patient-portal/chat')
      setMessages(data)
      setError(null)
    } catch (err) {
      const msg = err.response?.data?.detail || 'Erro ao carregar mensagens'
      setError(msg)
    }
  }

  useEffect(() => { load() }, [])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])
  useEffect(() => {
    const interval = setInterval(load, 10000)
    return () => clearInterval(interval)
  }, [])

  async function handleSend(e) {
    e.preventDefault()
    if (!text.trim()) return
    setSending(true)
    try {
      await patientApi().post('/patient-portal/chat', { message: text })
      setText('')
      load()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erro ao enviar')
    }
    finally { setSending(false) }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <header className="text-white px-5 py-4 flex items-center gap-3" style={{ backgroundColor: 'var(--color-primary)' }}>
        <Link to="/paciente/dashboard"><ArrowLeft className="w-5 h-5" /></Link>
        <h1 className="font-bold text-lg">Chat com Nutricionista</h1>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 max-w-lg mx-auto w-full">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
            <p className="text-red-600 text-sm">{error}</p>
            <button onClick={load} className="mt-2 text-xs text-red-500 underline">Tentar novamente</button>
          </div>
        )}
        {!error && messages.length === 0 && (
          <p className="text-center text-gray-400 py-10">Nenhuma mensagem ainda</p>
        )}
        {messages.map(m => (
          <div key={m.id} className={`flex ${m.sender === 'patient' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs px-4 py-2 rounded-2xl text-sm ${
              m.sender === 'patient'
                ? 'text-white rounded-br-sm'
                : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-white rounded-bl-sm shadow-sm'
            }`} style={m.sender === 'patient' ? { backgroundColor: 'var(--color-primary)' } : {}}>
              <p className="whitespace-pre-wrap break-words">{m.message}</p>
              <p className={`text-xs mt-1 ${m.sender === 'patient' ? 'text-white/60' : 'text-gray-400'}`}>
                {format(new Date(m.created_at), 'HH:mm')}
              </p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="px-4 py-3 bg-white dark:bg-gray-900 border-t dark:border-gray-700 max-w-lg mx-auto w-full">
        <form onSubmit={handleSend} className="flex gap-2">
          <input className="input flex-1" value={text} onChange={e => setText(e.target.value)}
            placeholder="Digite uma mensagem..." disabled={sending} />
          <button type="submit" className="btn-primary px-4" disabled={sending || !text.trim()}>
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  )
}
