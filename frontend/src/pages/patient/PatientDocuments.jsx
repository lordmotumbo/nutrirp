import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, FileDown, FileText, Loader } from 'lucide-react'
import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL || 'https://nutrirp-api.onrender.com/api'

function patientApi() {
  const token = localStorage.getItem('nutrirp_patient_token')
  return axios.create({ baseURL: BASE, headers: { Authorization: `Bearer ${token}` } })
}

export default function PatientDocuments() {
  const [diet, setDiet] = useState(null)
  const [anamneses, setAnamneses] = useState([])
  const [anthropometries, setAnthropometries] = useState([])
  const [supplements, setSupplements] = useState([])
  const [patientId, setPatientId] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const api = patientApi()
    Promise.allSettled([
      api.get('/patient-portal/me'),
      api.get('/patient-portal/diet'),
      api.get('/patient-portal/documents/anamnese'),
      api.get('/patient-portal/documents/anthropometry'),
      api.get('/patient-portal/documents/supplements'),
    ]).then(([meRes, dietRes, aRes, anthRes, supRes]) => {
      if (meRes.status === 'fulfilled') setPatientId(meRes.value.data.id)
      if (dietRes.status === 'fulfilled') setDiet(dietRes.value.data)
      if (aRes.status === 'fulfilled') setAnamneses(aRes.value.data)
      if (anthRes.status === 'fulfilled') setAnthropometries(anthRes.value.data)
      if (supRes.status === 'fulfilled') setSupplements(supRes.value.data)
      setLoading(false)
    })
  }, [])

  const token = localStorage.getItem('nutrirp_patient_token')

  // Monta lista de documentos disponíveis
  const sections = [
    {
      category: '🥗 Nutrição',
      items: [
        diet && {
          label: 'Plano Alimentar',
          sublabel: diet.title,
          url: `${BASE}/diets/${diet.id}/pdf-for-patient?token=${token}`,
        },
        anamneses.length > 0 && {
          label: 'Anamnese',
          sublabel: 'Histórico de saúde e hábitos',
          url: `${BASE}/anamnese/${anamneses[0].id}/pdf-for-patient?token=${token}`,
        },
        supplements.length > 0 && patientId && {
          label: 'Suplementos Prescritos',
          sublabel: `${supplements.length} suplemento(s) ativo(s)`,
          url: `${BASE}/exams/supplement/patient/${patientId}/pdf-for-patient?token=${token}`,
        },
      ].filter(Boolean),
    },
    {
      category: '📏 Avaliação Física',
      items: [
        anthropometries.length > 0 && {
          label: 'Avaliação Antropométrica',
          sublabel: 'Composição corporal e gasto energético',
          url: `${BASE}/anthropometry/${anthropometries[0].id}/pdf-for-patient?token=${token}`,
        },
      ].filter(Boolean),
    },
  ].filter(s => s.items.length > 0)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header
        className="text-white px-5 py-4 flex items-center gap-3"
        style={{ backgroundColor: 'var(--color-primary)' }}
      >
        <Link to="/paciente/dashboard"><ArrowLeft className="w-5 h-5" /></Link>
        <h1 className="font-bold text-lg">Meus Documentos</h1>
      </header>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-5">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : sections.length === 0 ? (
          <div className="card text-center py-14">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Nenhum documento disponível</p>
            <p className="text-xs text-gray-400 mt-1">
              Seus documentos aparecerão aqui quando seu profissional os criar.
            </p>
          </div>
        ) : (
          sections.map(sec => (
            <div key={sec.category}>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2 px-1">
                {sec.category}
              </h2>
              <div className="space-y-2">
                {sec.items.map((doc, i) => (
                  <div key={i} className="card flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-xl bg-primary-50 flex-shrink-0">
                        <FileText className="w-5 h-5 text-primary-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm dark:text-white truncate">{doc.label}</p>
                        {doc.sublabel && (
                          <p className="text-xs text-gray-400 truncate">{doc.sublabel}</p>
                        )}
                      </div>
                    </div>
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-primary-50 text-primary-700 hover:bg-primary-100 transition-colors flex-shrink-0"
                    >
                      <FileDown className="w-4 h-4" />
                      Baixar
                    </a>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}

        <div className="card bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <p className="text-xs text-blue-700 dark:text-blue-300">
            📄 Os documentos são gerados em PDF e podem ser salvos ou impressos.
            Novos documentos aparecem automaticamente quando seu profissional os atualizar.
          </p>
        </div>
      </div>
    </div>
  )
}
