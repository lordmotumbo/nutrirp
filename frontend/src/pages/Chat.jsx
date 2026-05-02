import { useEffect, useState, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Send, Video } from 'lucide-react'
import api from '../api'
import { useAuth } from '../context/AuthContext'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

export default function Chat() {
  const { id } = useParams()
  const { user } = useAuth()
  const [patient, setPatient] = useState(null)
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)

  async function load() {
    const [p, m] = await Promise.all([api.get(`/patients/${id}`), api.get(`/messaging/chat/${id}`)])
    setPatient(p.data); setMessages(m.data)
  }

  useEffect(() => { load() }, [id])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  // Polling a cada 10s para novas mensagens
  useEffect(() => {
    const interval = setInterval(() => {
      api.get(`/messaging/chat/${id}`).then(r => setMessages(r.data)).catch(() => {})
    }, 10000)
    return () => clearInterval(interval)
  }, [id])

  async function handleSend(e) {
    e.preventDefault()
    if (!text.trim()) return
    setSending(true)
    try {
      await api.post('/messaging/chat', { patient_id: Number(id), message: text, sender: 'nutritionist' })
      setText('')
      load()
    } catch { toast.error('Erro ao enviar') }
    finally { setSending(false) }
  }

  // Gerar link de videochamada Jitsi
  function startVideoCall() {
    const roomName = `nutrirp-${user.id}-${id}-${Date.now()}`
    const url = `https://meet.jit.si/${roomName}`
    // Enviar link via chat
    api.post('/messaging/chat', {
      patient_id: Number(id),
      message: `🎥 Videochamada iniciada! Acesse: ${url}`,
      sender: 'nutritionist'
    }).then(() => load())
    window.open(url, '_blank')
  }

  return (
    <div className="max-w-2xl flex flex-col h-[calc(100vh-120px)]">
      <div className="flex items-center gap-3 mb-4">
        <Link to={`/patients/${id}`} className="text-gray-400 hover:text-gray-600"><ArrowLeft className="w-5 h-5" /></Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold">Chat</h1>
          {patient && <p className="text-sm text-gray-500">{patient.name}</p>}
        </div>
        <button onClick={startVideoCall} className="btn-secondary text-sm">
          <Video className="w-4 h-4" /> Videochamada (Jitsi)
        </button>
      </div>

      {/* Mensagens */}
      <div className="flex-1 overflow-y-auto card space-y-3 p-4">
        {messages.length === 0 && (
          <p className="text-center text-gray-400 text-sm py-8">Nenhuma mensagem ainda</p>
        )}
        {messages.map(m => (
          <div key={m.id} className={`flex ${m.sender === 'nutritionist' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl text-sm ${
              m.sender === 'nutritionist'
                ? 'bg-primary-700 text-white rounded-br-sm'
                : 'bg-gray-100 text-gray-800 rounded-bl-sm'
            }`}>
              <p className="whitespace-pre-wrap break-words">{m.message}</p>
              <p className={`text-xs mt-1 ${m.sender === 'nutritionist' ? 'text-primary-200' : 'text-gray-400'}`}>
                {format(new Date(m.created_at), 'HH:mm')}
              </p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="flex gap-2 mt-3">
        <input
          className="input flex-1"
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Digite uma mensagem..."
          disabled={sending}
        />
        <button type="submit" className="btn-primary px-4" disabled={sending || !text.trim()}>
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  )
}
