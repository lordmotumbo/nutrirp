/**
 * Modal de compartilhamento de paciente com outro profissional.
 * Usado em: PatientDetail, PersonalClients, PhysioPatients, PersonalClientDetail, PhysioPatientDetail
 */
import { useState, useEffect } from 'react'
import { X, Share2, CheckCircle, Users, ChevronDown, ChevronUp } from 'lucide-react'
import api from '../api'
import toast from 'react-hot-toast'

const ROLE_OPTIONS = [
  {
    value: 'nutritionist',
    label: '🥗 Nutricionista',
    description: 'Acesso a dieta, anamnese, exames, antropometria e metas',
    color: 'border-green-400 bg-green-50 text-green-800',
    activeColor: 'border-green-500 bg-green-100',
  },
  {
    value: 'personal_trainer',
    label: '💪 Personal Trainer',
    description: 'Acesso a treinos, check-ins, evolução corporal e restrições',
    color: 'border-orange-400 bg-orange-50 text-orange-800',
    activeColor: 'border-orange-500 bg-orange-100',
  },
  {
    value: 'physiotherapist',
    label: '🦴 Fisioterapeuta',
    description: 'Acesso a prontuários, restrições físicas e evolução corporal',
    color: 'border-blue-400 bg-blue-50 text-blue-800',
    activeColor: 'border-blue-500 bg-blue-100',
  },
  {
    value: 'all',
    label: '🔓 Acesso completo',
    description: 'Todos os dados do paciente em todas as áreas',
    color: 'border-purple-400 bg-purple-50 text-purple-800',
    activeColor: 'border-purple-500 bg-purple-100',
  },
]

const DATA_ICONS = {
  dados_pessoais: '👤',
  anamnese: '📋',
  dieta: '🥗',
  exames: '🔬',
  suplementos: '💊',
  antropometria: '📏',
  metas: '🎯',
  diario: '📓',
  treinos: '💪',
  checkins: '✅',
  evolucao_corporal: '📈',
  restricoes: '⚠️',
  prontuarios: '🦴',
}

export default function SharePatientModal({ patient, onClose, onShared }) {
  const [step, setStep] = useState(1) // 1: email, 2: role, 3: confirmação, 4: sucesso
  const [email, setEmail] = useState('')
  const [targetRole, setTargetRole] = useState('nutritionist')
  const [message, setMessage] = useState('')
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [professionals, setProfessionals] = useState([])
  const [showProfessionals, setShowProfessionals] = useState(false)

  // Carrega profissionais que já têm acesso
  useEffect(() => {
    if (patient?.id) {
      api.get(`/share/patient/${patient.id}/professionals`)
        .then(r => setProfessionals(r.data))
        .catch(() => {})
    }
  }, [patient?.id])

  // Carrega preview dos dados ao mudar o role
  useEffect(() => {
    api.get(`/share/preview/${targetRole}`)
      .then(r => setPreview(r.data))
      .catch(() => {})
  }, [targetRole])

  async function handleShare() {
    if (!email.trim()) {
      toast.error('Informe o email do profissional')
      return
    }
    setLoading(true)
    try {
      const { data } = await api.post('/share/patient', {
        patient_id: patient.id,
        target_professional_email: email.trim(),
        target_role: targetRole,
        message: message || null,
      })
      setResult(data)
      setStep(4)
      if (onShared) onShared()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erro ao compartilhar')
    } finally {
      setLoading(false)
    }
  }

  async function handleRevoke(linkId) {
    if (!confirm('Remover acesso deste profissional?')) return
    try {
      await api.delete(`/share/patient/${patient.id}/professional/${linkId}`)
      toast.success('Acesso removido')
      const { data } = await api.get(`/share/patient/${patient.id}/professionals`)
      setProfessionals(data)
    } catch { toast.error('Erro ao remover acesso') }
  }

  const selectedRoleOption = ROLE_OPTIONS.find(r => r.value === targetRole)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-[#0f0f1c] rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-purple-900/30">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-purple-900/30 sticky top-0 bg-[#0f0f1c] z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary-50">
              <Share2 className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h2 className="font-semibold text-white">Compartilhar paciente</h2>
              <p className="text-xs text-gray-400">{patient?.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">

          {/* Passo 4: Sucesso */}
          {step === 4 && result && (
            <div className="text-center space-y-4 py-4">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Compartilhado com sucesso!</h3>
                <p className="text-gray-500 text-sm mt-1">{result.message}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-left space-y-2">
                <p className="text-sm text-gray-200"><span className="font-medium">Paciente:</span> {result.patient_name}</p>
                <p className="text-sm text-gray-200"><span className="font-medium">Compartilhado com:</span> {result.shared_with}</p>
                <p className="text-sm text-gray-200"><span className="font-medium">Área de acesso:</span> {result.access_role}</p>
                <div>
                  <p className="text-sm font-medium mb-1">Dados compartilhados:</p>
                  <div className="flex flex-wrap gap-1">
                    {(result.data_labels || []).map(label => (
                      <span key={label} className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">
                        {label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <button className="btn-primary w-full justify-center" onClick={onClose}>
                Fechar
              </button>
            </div>
          )}

          {/* Passos 1-3 */}
          {step < 4 && (
            <>
              {/* Email do profissional */}
              <div>
                <label className="label">Email do profissional *</label>
                <input
                  type="email"
                  className="input"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="profissional@email.com"
                  autoFocus
                />
                <p className="text-xs text-gray-400 mt-1">
                  O profissional precisa ter uma conta cadastrada no sistema.
                </p>
              </div>

              {/* Seleção de área de acesso */}
              <div>
                <label className="label">Área de acesso</label>
                <div className="space-y-2">
                  {ROLE_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setTargetRole(opt.value)}
                      className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
                        targetRole === opt.value
                          ? opt.activeColor + ' border-2'
                          : 'border-purple-900/30 hover:border-purple-900/50'
                      }`}
                    >
                      <p className="font-medium text-sm text-white">{opt.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{opt.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview dos dados que serão compartilhados */}
              {preview && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Dados que serão compartilhados
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {preview.data_labels.map((label, i) => (
                      <span key={i} className="flex items-center gap-1 px-2 py-1 bg-[#12121f] rounded-lg text-xs border border-purple-900/30 text-gray-300">
                        <span>{DATA_ICONS[preview.shared_data[i]] || '📄'}</span>
                        {label}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Mensagem opcional */}
              <div>
                <label className="label">Mensagem (opcional)</label>
                <textarea
                  className="input"
                  rows={2}
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Ex: Paciente em tratamento de joelho, favor verificar restrições..."
                />
              </div>

              {/* Botão compartilhar */}
              <button
                className="btn-primary w-full justify-center"
                onClick={handleShare}
                disabled={loading || !email.trim()}
              >
                <Share2 className="w-4 h-4" />
                {loading ? 'Compartilhando...' : 'Compartilhar paciente'}
              </button>
            </>
          )}

          {/* Profissionais com acesso atual */}
          {professionals.length > 0 && step < 4 && (
            <div className="border-t border-purple-900/30 pt-4">
              <button
                className="flex items-center justify-between w-full text-sm font-medium text-gray-300"
                onClick={() => setShowProfessionals(!showProfessionals)}
              >
                <span className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Profissionais com acesso ({professionals.length})
                </span>
                {showProfessionals ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showProfessionals && (
                <div className="mt-3 space-y-2">
                  {professionals.map((p, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                      <div>
                        <p className="text-sm font-medium dark:text-white">{p.professional_name}</p>
                        <p className="text-xs text-gray-400">{p.professional_email}</p>
                        <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                          {p.access_role_label}
                        </span>
                      </div>
                      {p.link_id && (
                        <button
                          onClick={() => handleRevoke(p.link_id)}
                          className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded-lg hover:bg-red-50"
                        >
                          Remover
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
