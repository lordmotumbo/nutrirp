import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, Dumbbell, UserPlus, X } from 'lucide-react'
import api from '../../api'
import toast from 'react-hot-toast'

export default function PersonalClients() {
  const [clients, setClients] = useState([])
  const [search, setSearch] = useState('')
  const [showLink, setShowLink] = useState(false)
  const [allPatients, setAllPatients] = useState([])
  const [linkId, setLinkId] = useState('')

  async function load() {
    try {
      const { data } = await api.get('/personal/my-clients')
      setClients(data)
    } catch {}
  }

  useEffect(() => { load() }, [])

  async function handleLink(e) {
    e.preventDefault()
    try {
      await api.post(`/personal/link-client?client_id=${linkId}&role=personal_trainer`)
      toast.success('Aluno vinculado!')
      setShowLink(false)
      load()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erro ao vincular')
    }
  }

  async function loadAllPatients() {
    try {
      const { data } = await api.get('/patients')
      setAllPatients(data)
    } catch {}
  }

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Meus Alunos</h1>
        <div className="flex gap-2">
          <button
            className="btn-secondary"
            onClick={() => { setShowLink(true); loadAllPatients() }}
          >
            <UserPlus className="w-4 h-4" /> Vincular aluno
          </button>
          <Link to="/patients/new" className="btn-primary">
            <Plus className="w-4 h-4" /> Novo aluno
          </Link>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          className="input pl-9"
          placeholder="Buscar aluno..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="card text-center py-12">
          <Dumbbell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Nenhum aluno cadastrado</p>
          <p className="text-xs text-gray-400 mt-1">Crie um novo aluno ou vincule um paciente existente</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map(c => (
            <Link
              key={c.id}
              to={`/personal/clients/${c.id}`}
              className="card flex items-center gap-4 hover:shadow-md transition-shadow"
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                style={{ backgroundColor: 'var(--color-primary)' }}>
                {c.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{c.name}</p>
                <p className="text-xs text-gray-400">
                  {c.goal || 'Sem objetivo definido'}
                  {c.weight && ` · ${c.weight}kg`}
                </p>
              </div>
              <span className="text-xs text-gray-400">Ver →</span>
            </Link>
          ))}
        </div>
      )}

      {/* Modal vincular aluno */}
      {showLink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b dark:border-gray-700">
              <h2 className="font-semibold dark:text-white">Vincular aluno existente</h2>
              <button onClick={() => setShowLink(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleLink} className="px-6 py-5 space-y-4">
              <div>
                <label className="label">Selecione o paciente/aluno</label>
                <select className="input" value={linkId} onChange={e => setLinkId(e.target.value)} required>
                  <option value="">Selecione...</option>
                  {allPatients.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <p className="text-xs text-gray-400">
                O aluno já deve estar cadastrado no sistema por um nutricionista.
              </p>
              <div className="flex gap-3">
                <button type="button" className="btn-secondary flex-1 justify-center" onClick={() => setShowLink(false)}>Cancelar</button>
                <button type="submit" className="btn-primary flex-1 justify-center">Vincular</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
