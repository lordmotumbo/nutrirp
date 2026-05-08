import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, Activity, Share2 } from 'lucide-react'
import api from '../../api'
import SharePatientModal from '../../components/SharePatientModal'

export default function PhysioPatients() {
  const [patients, setPatients] = useState([])
  const [search, setSearch] = useState('')
  const [sharePatient, setSharePatient] = useState(null)

  async function load() {
    try {
      const { data } = await api.get('/physio/my-patients')
      setPatients(data)
    } catch {}
  }

  useEffect(() => { load() }, [])

  const filtered = patients.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Meus Pacientes</h1>
        <Link to="/patients/new" className="btn-primary">
          <Plus className="w-4 h-4" /> Novo paciente
        </Link>
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
          <p className="text-xs text-gray-400 mt-1">Crie um novo paciente ou receba um compartilhamento</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map(p => (
            <div key={p.id} className="card flex items-center gap-4">
              <Link
                to={`/physio/patients/${p.id}`}
                className="flex items-center gap-4 flex-1 min-w-0"
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
              </Link>
              <button
                onClick={() => setSharePatient(p)}
                className="p-2 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors flex-shrink-0"
                title="Compartilhar com outro profissional"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {sharePatient && (
        <SharePatientModal
          patient={sharePatient}
          onClose={() => setSharePatient(null)}
          onShared={load}
        />
      )}
    </div>
  )
}
