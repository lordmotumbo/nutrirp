import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, User, Share2 } from 'lucide-react'
import api from '../api'
import toast from 'react-hot-toast'
import PatientModal from '../components/PatientModal'
import SharePatientModal from '../components/SharePatientModal'

const GOAL_LABEL = {
  emagrecimento: 'Emagrecimento',
  ganho_massa: 'Ganho de Massa',
  manutencao: 'Manutenção',
  saude: 'Saúde Geral',
}

export default function Patients() {
  const [patients, setPatients] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [sharePatient, setSharePatient] = useState(null)

  async function load() {
    setLoading(true)
    try {
      const { data } = await api.get('/patients', { params: { search } })
      setPatients(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [search])

  async function handleCreate(payload) {
    try {
      await api.post('/patients', payload)
      toast.success('Paciente cadastrado!')
      setShowModal(false)
      load()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erro ao cadastrar')
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Pacientes</h1>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4" /> Novo paciente
        </button>
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

      {loading ? (
        <p className="text-center text-gray-400 py-10">Carregando...</p>
      ) : patients.length === 0 ? (
        <div className="card text-center py-12">
          <User className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Nenhum paciente encontrado</p>
          <button className="btn-primary mt-4 mx-auto" onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4" /> Cadastrar primeiro paciente
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {patients.map(p => (
            <div key={p.id} className="card hover:shadow-md transition-shadow flex items-start gap-4 relative group">
              <Link to={`/patients/${p.id}`} className="flex items-start gap-4 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-lg font-bold flex-shrink-0">
                  {p.name[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold truncate">{p.name}</p>
                  {p.goal && (
                    <span className="badge bg-primary-50 text-primary-700 mt-1">
                      {GOAL_LABEL[p.goal] || p.goal}
                    </span>
                  )}
                  <div className="text-xs text-gray-400 mt-1 space-y-0.5">
                    {p.weight && <p>Peso: {p.weight} kg</p>}
                    {p.phone && <p>{p.phone}</p>}
                  </div>
                </div>
              </Link>
              {/* Botão compartilhar — aparece no hover */}
              <button
                onClick={e => { e.preventDefault(); setSharePatient(p) }}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 flex-shrink-0"
                title="Compartilhar com outro profissional"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <PatientModal onClose={() => setShowModal(false)} onSave={handleCreate} />
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
