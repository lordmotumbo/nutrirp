import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, Activity, UserPlus, X } from 'lucide-react'
import api from '../../api'
import toast from 'react-hot-toast'

export default function PhysioPatients() {
  const [patients, setPatients] = useState([])
  const [search, setSearch] = useState('')
  const [showLink, setShowLink] = useState(false)
  const [allPatients, setAllPatients] = useState([])
  const [linkId, setLinkId] = useState('')

  async function load() {
    try {
      const { data } = await api.get('/physio/my-patients')
      setPatients(data)
    } catch {}
  }

  useEffect(() => { load() }, [])

  async function handleLink(e) {
    e.preventDefault()
    try {
      await api.post(`/physio/link-patient?client_id=${linkId}`)
      toast.success('Paciente vinculado!')
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

  const filtered = patients.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Meus Pacientes</h1>
        <div className="flex gap-2">
          <button
            className="btn-secondary"
            onClick={() => { setShowLink(true); loadAllPatients() }}
          >
            <UserPlus className="w-4 h-4" /> Vincular paciente
          </button>
          <Link to="/patients/new" className="btn-primary">
            <Plus className="w-4 h-4" /> Novo paciente
          </Link>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          className="input pl-9"
          placeholder="Buscar paciente..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="card text-center py-12">
          <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Nenhum paciente cadastrado</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map(p => (
            <Link
              key={p.id}
              to={`/physio/patients/${p.id}`}
              className="card flex items-center gap-4 hover:shadow-md transition-shadow"
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                style={{ backgroundColor: 'var(--color-primary)' }}>
                {p.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{p.name}</p>
                <p className="text-xs text-gray-400">
                  {p.weight && `${p.weight}kg`}
                  {p.height && ` · ${p.height}cm`}
                  {p.gender && ` · ${p.gender}`}
                </p>
              </div>
              <span className="text-xs text-gray-400">Ver →</span>
            </Link>
          ))}
        </div>
      )}

      {/* Modal vincular */}
      {showLink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b dark:border-gray-700">
              <h2 className="font-semibold dark:text-white">Vincular paciente existente</h2>
              <button onClick={() => setShowLink(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleLink} className="px-6 py-5 space-y-4">
              <div>
                <label className="label">Selecione o paciente</label>
                <select className="input" value={linkId} onChange={e => setLinkId(e.target.value)} required>
                  <option value="">Selecione...</option>
                  {allPatients.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
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
