import { useEffect, useState, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Send, Paperclip, X, Download, File } from 'lucide-react'
import axios from 'axios'
import { format, isToday, isYesterday } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import toast from 'react-hot-toast'

const BASE = import.meta.env.VITE_API_URL || 'https://nutrirp-api.onrender.com/api'

function patientApi() {
  const token = localStorage.getItem('nutrirp_patient_token')
  return axios.create({ baseURL: BASE, headers: { Authorization: `Bearer ${token}` } })
}

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

export default function PatientChat() {
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [attachment, setAttachment] = useState(null)
  const [lightbox, setLightbox] = useState(null)
  const [error, setError] = useState(null)
  const bottomRef = useRef(null)
  const fileInputRef = useRef(null)
  const lastCountRef = useRef(0)

  const load = useCallback(async (silent = false) => {
    try {
      const { data } = await patientApi().get('/patient-portal/chat')
      setMessages(data)
      setError(null)
      if (silent && data.length > lastCountRef.current) {
        const newMsgs = data.slice(lastCountRef.current)
        const fromNutri = newMsgs.filter(m => m.sender === 'nutritionist')
        if (fromNutri.length > 0 && document.hidden) {
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('💬 Nova mensagem do seu nutricionista', {
              body: fromNutri[fromNutri.length - 1].message || '[Anexo]',
              icon: '/favicon.ico',
            })
          }
        }
      }
      lastCountRef.current = data.length
    } catch (err) {
      setError(err.response?.data?.detail || 'Erro ao carregar mensagens')
    }
  }, [])

  useEffect(() => { load() }, [])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])
  useEffect(() => {
    const interval = setInterval(() => load(true), 3000)
    return () => clearInterval(interval)
  }, [load])

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
        // Envia como base64 no JSON
        await patientApi().post('/patient-portal/chat', {
          message: text.trim() || null,
          attachment_url: attachment.dataUrl,
          attachment_type: attachment.type,
          attachment_name: attachment.name,
        })
        setAttachment(null)
      } else {
        await patientApi().post('/patient-portal/chat', { message: text.trim() })
      }
      setText('')
      load()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erro ao enviar')
    } finally {
      setSending(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div
      className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col"
      onDrop={handleDrop}
      onDragOver={e => e.preventDefault()}
    >
      <header className="text-white px-5 py-4 flex items-center gap-3 flex-shrink-0"
        style={{ backgroundColor: 'var(--color-primary)' }}>
        <Link to="/paciente/dashboard"><ArrowLeft className="w-5 h-5" /></Link>
        <h1 className="font-bold text-lg flex-1">Chat com Nutricionista</h1>
      </header>

      {/* Mensagens */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
        <div className="max-w-lg mx-auto w-full space-y-1">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center my-4">
              <p className="text-red-600 text-sm">{error}</p>
              <button onClick={() => load()} className="mt-2 text-xs text-red-500 underline">Tentar novamente</button>
            </div>
          )}
          {!error && messages.length === 0 && (
            <p className="text-center text-gray-400 py-10">Nenhuma mensagem ainda. Diga olá! 👋</p>
          )}
          {messages.map((m, idx) => (
            <div key={m.id}>
              {shouldShowSeparator(messages, idx) && (
                <div className="flex items-center gap-3 my-3">
                  <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                  <span className="text-xs text-gray-400 px-2">{dateSeparator(m.created_at)}</span>
                  <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                </div>
              )}
              <div className={`flex ${m.sender === 'patient' ? 'justify-end' : 'justify-start'} mb-1`}>
                <div className={`max-w-xs rounded-2xl overflow-hidden ${
                  m.sender === 'patient'
                    ? 'text-white rounded-br-sm'
                    : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-white rounded-bl-sm shadow-sm'
                }`} style={m.sender === 'patient' ? { backgroundColor: 'var(--color-primary)' } : {}}>

                  {m.attachment_type === 'image' && m.attachment_url && (
                    <button onClick={() => setLightbox(m.attachment_url)} className="block w-full">
                      <img src={m.attachment_url} alt={m.attachment_name || 'imagem'}
                        className="max-w-full max-h-64 object-cover w-full" />
                    </button>
                  )}

                  {m.attachment_type === 'file' && m.attachment_url && (
                    <a href={m.attachment_url} download={m.attachment_name || 'arquivo'}
                      className={`flex items-center gap-2 px-3 py-2 ${
                        m.sender === 'patient' ? 'text-white/90' : 'text-gray-600'
                      }`}>
                      <File className="w-5 h-5 flex-shrink-0" />
                      <span className="text-sm truncate max-w-[160px]">{m.attachment_name || 'arquivo'}</span>
                      <Download className="w-4 h-4 flex-shrink-0 ml-auto" />
                    </a>
                  )}

                  {m.message && (
                    <div className="px-3 py-2">
                      <p className="text-sm whitespace-pre-wrap break-words">{m.message}</p>
                    </div>
                  )}

                  <div className="px-3 pb-1.5 flex justify-end">
                    <span className={`text-[10px] ${m.sender === 'patient' ? 'text-white/60' : 'text-gray-400'}`}>
                      {format(new Date(m.created_at), 'HH:mm')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Preview anexo */}
      {attachment && (
        <div className="px-4 py-2 bg-white dark:bg-gray-900 border-t dark:border-gray-700 flex-shrink-0">
          <div className="max-w-lg mx-auto flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-800 rounded-xl">
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
      <div className="px-4 py-3 bg-white dark:bg-gray-900 border-t dark:border-gray-700 flex-shrink-0">
        <div className="max-w-lg mx-auto flex items-end gap-2">
          <button type="button" onClick={() => fileInputRef.current?.click()}
            className="p-2 rounded-xl text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors flex-shrink-0"
            title="Anexar arquivo (ou Ctrl+V para colar imagem)">
            <Paperclip className="w-5 h-5" />
          </button>
          <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileInputChange}
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip" />

          <textarea
            className="input flex-1 resize-none min-h-[40px] max-h-32 py-2"
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite... (Enter envia, Shift+Enter nova linha)"
            disabled={sending}
            rows={1}
            onInput={e => {
              e.target.style.height = 'auto'
              e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px'
            }}
          />

          <button onClick={handleSend} disabled={sending || (!text.trim() && !attachment)}
            className="btn-primary p-2 rounded-xl flex-shrink-0 disabled:opacity-50">
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-1 text-center max-w-lg mx-auto">
          Ctrl+V para colar imagem · Arraste arquivos aqui
        </p>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}>
          <button className="absolute top-4 right-4 text-white/70 hover:text-white">
            <X className="w-8 h-8" />
          </button>
          <img src={lightbox} alt="imagem"
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={e => e.stopPropagation()} />
          <a href={lightbox} download="imagem"
            className="absolute bottom-4 right-4 btn-secondary"
            onClick={e => e.stopPropagation()}>
            <Download className="w-4 h-4" /> Baixar
          </a>
        </div>
      )}
    </div>
  )
}
