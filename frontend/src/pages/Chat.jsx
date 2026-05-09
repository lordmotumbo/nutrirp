import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Send, Paperclip, X, Download, Video, Image as ImageIcon, File } from 'lucide-react'
import api from '../api'
import { useAuth } from '../context/AuthContext'
import { format, isToday, isYesterday } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import toast from 'react-hot-toast'

const BASE = import.meta.env.VITE_API_URL || 'https://nutrirp-api.onrender.com/api'

function dateSeparator(date) {
  const d = new Date(date)
  if (isToday(d)) return 'Hoje'
  if (isYesterday(d)) return 'Ontem'
  return format(d, "dd 'de' MMMM", { locale: ptBR })
}

function shouldShowSeparator(msgs, idx) {
  if (idx === 0) return true
  const prev = new Date(msgs[idx - 1].created_at)
  const curr = new Date(msgs[idx].created_at)
  return prev.toDateString() !== curr.toDateString()
}

export default function Chat() {
  const { id } = useParams()
  const { user } = useAuth()
  const [patient, setPatient] = useState(null)
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [attachment, setAttachment] = useState(null) // { file, preview, type, name }
  const [lightbox, setLightbox] = useState(null)
  const bottomRef = useRef(null)
  const fileInputRef = useRef(null)
  const textareaRef = useRef(null)
  const lastCountRef = useRef(0)

  const load = useCallback(async (silent = false) => {
    try {
      const [p, m] = await Promise.all([
        patient ? Promise.resolve({ data: patient }) : api.get(`/patients/${id}`),
        api.get(`/messaging/chat/${id}`)
      ])
      if (!patient) setPatient(p.data)
      setMessages(m.data)
      // Notificação de nova mensagem
      if (silent && m.data.length > lastCountRef.current) {
        const newMsgs = m.data.slice(lastCountRef.current)
        const fromPatient = newMsgs.filter(msg => msg.sender === 'patient')
        if (fromPatient.length > 0 && document.hidden) {
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(`💬 Nova mensagem de ${p.data?.name || 'paciente'}`, {
              body: fromPatient[fromPatient.length - 1].message || '[Anexo]',
              icon: '/favicon.ico',
            })
          }
        }
      }
      lastCountRef.current = m.data.length
    } catch {}
  }, [id, patient])

  useEffect(() => { load() }, [id])
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Polling a cada 3s
  useEffect(() => {
    const interval = setInterval(() => load(true), 3000)
    return () => clearInterval(interval)
  }, [load])

  // Pede permissão de notificação
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  // Ctrl+V para colar imagem
  useEffect(() => {
    function handlePaste(e) {
      const items = e.clipboardData?.items
      if (!items) return
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile()
          if (file) handleFileSelect(file)
          break
        }
      }
    }
    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [])

  function handleFileSelect(file) {
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo 10MB.')
      return
    }
    const isImage = file.type.startsWith('image/')
    const reader = new FileReader()
    reader.onload = (e) => {
      setAttachment({
        file,
        preview: isImage ? e.target.result : null,
        dataUrl: e.target.result,
        type: isImage ? 'image' : 'file',
        name: file.name,
        mimeType: file.type,
      })
    }
    reader.readAsDataURL(file)
  }

  function handleFileInputChange(e) {
    const file = e.target.files?.[0]
    if (file) handleFileSelect(file)
    e.target.value = ''
  }

  // Drag & drop
  function handleDrop(e) {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) handleFileSelect(file)
  }

  async function handleSend(e) {
    e?.preventDefault()
    if (!text.trim() && !attachment) return
    setSending(true)
    try {
      if (attachment) {
        // Envia com FormData
        const formData = new FormData()
        formData.append('patient_id', id)
        formData.append('sender', 'nutritionist')
        if (text.trim()) formData.append('message', text.trim())
        formData.append('file', attachment.file)
        await api.post('/messaging/chat/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        setAttachment(null)
      } else {
        await api.post('/messaging/chat', {
          patient_id: Number(id),
          message: text.trim(),
          sender: 'nutritionist',
        })
      }
      setText('')
      load()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erro ao enviar')
    } finally {
      setSending(false)
    }
  }

  // Enter envia, Shift+Enter nova linha
  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function startVideoCall() {
    const roomName = `nutrirp-${user?.id}-${id}-${Date.now()}`
    const url = `https://meet.jit.si/${roomName}`
    api.post('/messaging/chat', {
      patient_id: Number(id),
      message: `🎥 Videochamada iniciada! Acesse: ${url}`,
      sender: 'nutritionist',
    }).then(() => load())
    window.open(url, '_blank')
  }

  return (
    <div
      className="flex flex-col bg-white dark:bg-gray-900 rounded-xl border dark:border-gray-700 overflow-hidden"
      style={{ height: 'calc(100vh - 100px)' }}
      onDrop={handleDrop}
      onDragOver={e => e.preventDefault()}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b dark:border-gray-700 bg-white dark:bg-gray-900 flex-shrink-0">
        <Link to={patient ? `/patients/${id}` : '#'} className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate">{patient?.name || 'Chat'}</p>
          <p className="text-xs text-green-500">● Online</p>
        </div>
        <button onClick={startVideoCall} className="btn-secondary text-xs py-1.5 px-3">
          <Video className="w-4 h-4" /> Videochamada
        </button>
      </div>

      {/* Mensagens */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1 bg-gray-50 dark:bg-gray-950">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400 text-sm">Nenhuma mensagem ainda. Diga olá! 👋</p>
          </div>
        )}
        {messages.map((m, idx) => (
          <div key={m.id}>
            {/* Separador de data */}
            {shouldShowSeparator(messages, idx) && (
              <div className="flex items-center gap-3 my-3">
                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                <span className="text-xs text-gray-400 px-2">{dateSeparator(m.created_at)}</span>
                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
              </div>
            )}

            <div className={`flex ${m.sender === 'nutritionist' ? 'justify-end' : 'justify-start'} mb-1`}>
              <div
                className={`max-w-xs lg:max-w-md rounded-2xl overflow-hidden ${
                  m.sender === 'nutritionist'
                    ? 'bg-primary-600 text-white rounded-br-sm'
                    : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-white rounded-bl-sm shadow-sm border dark:border-gray-700'
                }`}
              >
                {/* Imagem */}
                {m.attachment_type === 'image' && m.attachment_url && (
                  <button
                    onClick={() => setLightbox(m.attachment_url)}
                    className="block w-full"
                  >
                    <img
                      src={m.attachment_url}
                      alt={m.attachment_name || 'imagem'}
                      className="max-w-full max-h-64 object-cover w-full"
                    />
                  </button>
                )}

                {/* Arquivo */}
                {m.attachment_type === 'file' && m.attachment_url && (
                  <a
                    href={m.attachment_url}
                    download={m.attachment_name || 'arquivo'}
                    className={`flex items-center gap-2 px-3 py-2 ${
                      m.sender === 'nutritionist' ? 'text-white/90 hover:text-white' : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    <File className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm truncate max-w-[180px]">{m.attachment_name || 'arquivo'}</span>
                    <Download className="w-4 h-4 flex-shrink-0 ml-auto" />
                  </a>
                )}

                {/* Texto */}
                {m.message && (
                  <div className="px-3 py-2">
                    <p className="text-sm whitespace-pre-wrap break-words">{m.message}</p>
                  </div>
                )}

                {/* Hora */}
                <div className={`px-3 pb-1.5 flex justify-end ${m.attachment_type === 'image' && !m.message ? '-mt-6' : ''}`}>
                  <span className={`text-[10px] ${
                    m.sender === 'nutritionist'
                      ? m.attachment_type === 'image' ? 'text-white bg-black/30 px-1 rounded' : 'text-white/60'
                      : 'text-gray-400'
                  }`}>
                    {format(new Date(m.created_at), 'HH:mm')}
                    {m.sender === 'nutritionist' && (
                      <span className="ml-1">{m.is_read ? '✓✓' : '✓'}</span>
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Preview do anexo */}
      {attachment && (
        <div className="px-4 py-2 border-t dark:border-gray-700 bg-white dark:bg-gray-900 flex-shrink-0">
          <div className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-800 rounded-xl">
            {attachment.type === 'image' ? (
              <img src={attachment.preview} alt="" className="w-12 h-12 object-cover rounded-lg" />
            ) : (
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <File className="w-6 h-6 text-blue-600" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate dark:text-white">{attachment.name}</p>
              <p className="text-xs text-gray-400">{attachment.type === 'image' ? 'Imagem' : 'Arquivo'}</p>
            </div>
            <button onClick={() => setAttachment(null)} className="text-gray-400 hover:text-red-500">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-4 py-3 border-t dark:border-gray-700 bg-white dark:bg-gray-900 flex-shrink-0">
        <div className="flex items-end gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 rounded-xl text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors flex-shrink-0"
            title="Anexar arquivo ou imagem (ou Ctrl+V para colar)"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileInputChange}
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip" />

          <textarea
            ref={textareaRef}
            className="input flex-1 resize-none min-h-[40px] max-h-32 py-2"
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite uma mensagem... (Enter para enviar, Shift+Enter para nova linha)"
            disabled={sending}
            rows={1}
            style={{ height: 'auto' }}
            onInput={e => {
              e.target.style.height = 'auto'
              e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px'
            }}
          />

          <button
            onClick={handleSend}
            disabled={sending || (!text.trim() && !attachment)}
            className="btn-primary p-2 rounded-xl flex-shrink-0 disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-1 text-center">
          Ctrl+V para colar imagem · Arraste arquivos aqui
        </p>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button className="absolute top-4 right-4 text-white/70 hover:text-white">
            <X className="w-8 h-8" />
          </button>
          <img
            src={lightbox}
            alt="imagem"
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={e => e.stopPropagation()}
          />
          <a
            href={lightbox}
            download="imagem"
            className="absolute bottom-4 right-4 btn-secondary text-white border-white/30"
            onClick={e => e.stopPropagation()}
          >
            <Download className="w-4 h-4" /> Baixar
          </a>
        </div>
      )}
    </div>
  )
}
