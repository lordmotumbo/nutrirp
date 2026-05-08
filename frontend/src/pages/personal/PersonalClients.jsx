import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, Dumbbell, Share2 } from 'lucide-react'
import api from '../../api'
import SharePatientModal from '../../components/SharePatientModal'

export default function PersonalClients() {
  const [clients, setClients] = useState([])
  const [search, setSearch] = useState('')
  const [sharePatient, setSharePatient] = useState(null) // paciente a compartilhar

  async function load() {
    try {
      const { data } = await api.get('/personal/my-clients')
      setClients(data)
    } catch {}
  }

  useEffect(() => { load() }, [])

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Meus Alunos</h1>
        <Link to="/patients/new" className="btn-primary">
          <Plus className="w-4 h-4" /> Novo aluno
        </Link>
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
          <p className="text-xs text-gray-400 mt-1">Crie um novo aluno ou receba um compartilhamento de outro profissional</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map(c => (
            <div key={c.id} className="card flex items-center gap-4">
              <Link
                to={`/personal/clients/${c.id}`}
                className="flex items-center gap-4 flex-1 min-w-0"
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
              </Link>
              <button
                onClick={() => setSharePatient(c)}
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
