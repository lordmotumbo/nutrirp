import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Send } from 'lucide-react'
import axios from 'axios'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

const BASE = import.meta.env.VITE_API_URL || 'https://nutrirp-api.onrender.com/api'
const api = () => axios.create({ baseURL: BASE, headers: { Authorization: `Bearer ${localStorage.getItem('nutrirp_patient_token')}` } })

export default function PatientChat() {
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)

  async function load() {
    const { data } = await api().get('/patient-portal/chat')
    setMessages(data)
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
      await api().post('/patient-portal/chat', { message: text })
      setText('')
      load()
    } catch { toast.error('Erro ao enviar') }
    finally { setSending(false) }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <header className="text-white px-5 py-4 flex items-center gap-3" style={{ backgroundColor: 'var(--color-primary)' }}>
        <Link to="/paciente/dashboard"><ArrowLeft className="w-5 h-5" /></Link>
        <h1 className="font-bold text-lg">Chat com Nutricionista</h1>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 max-w-lg mx-auto w-full">
        {messages.length === 0 && (
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
