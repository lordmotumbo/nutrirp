import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Plus, X, FlaskConical } from 'lucide-react'
import api from '../api'
import toast from 'react-hot-toast'

const COMMON_EXAMS = [
  'Hemograma completo','Glicemia de jejum','HbA1c','Colesterol total','HDL','LDL','Triglicerídeos',
  'TSH','T4 livre','Vitamina D','Vitamina B12','Ferritina','Ferro sérico','Ácido fólico',
  'PCR','VHS','TGO','TGP','Creatinina','Ureia','Ácido úrico','Albumina','Proteínas totais',
  'Insulina de jejum','HOMA-IR','Cortisol','Testosterona','Estradiol','Zinco','Magnésio',
]

const STATUS_COLOR = { normal: 'text-green-600 bg-green-50', alto: 'text-red-600 bg-red-50', baixo: 'text-orange-600 bg-orange-50', critico: 'text-red-800 bg-red-100' }

export default function Exams() {
  const { id } = useParams()
  const [patient, setPatient] = useState(null)
  const [results, setResults] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [form, setForm] = useState({ exam_name: '', value: '', unit: '', reference_min: '', reference_max: '', analysis: '' })
  const [requestForm, setRequestForm] = useState({ title: 'Solicitação de Exames', exams: [], justification: '' })
  const [selectedExams, setSelectedExams] = useState([])
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  async function load() {
    const [p, r] = await Promise.all([api.get(`/patients/${id}`), api.get(`/exams/result/patient/${id}`)])
    setPatient(p.data); setResults(r.data)
  }

  useEffect(() => { load() }, [id])

  async function handleAddResult(e) {
    e.preventDefault()
    try {
      const payload = { ...form, patient_id: Number(id) }
      if (payload.reference_min) payload.reference_min = parseFloat(payload.reference_min)
      if (payload.reference_max) payload.reference_max = parseFloat(payload.reference_max)
      await api.post('/exams/result', payload)
      toast.success('Resultado salvo!')
      setShowModal(false)
      setForm({ exam_name: '', value: '', unit: '', reference_min: '', reference_max: '', analysis: '' })
      load()
    } catch { toast.error('Erro ao salvar') }
  }

  async function handleRequest(e) {
    e.preventDefault()
    try {
      await api.post('/exams/request', { ...requestForm, exams: selectedExams, patient_id: Number(id) })
      toast.success('Solicitação criada!')
      setShowRequestModal(false)
      setSelectedExams([])
    } catch { toast.error('Erro') }
  }

  function toggleExam(exam) {
    setSelectedExams(prev => prev.includes(exam) ? prev.filter(e => e !== exam) : [...prev, exam])
  }

  return (
    <div className="max-w-3xl space-y-5">
      <div className="flex items-center gap-3">
        <Link to={`/patients/${id}`} className="text-gray-400 hover:text-gray-600"><ArrowLeft className="w-5 h-5" /></Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold">Exames Laboratoriais</h1>
          {patient && <p className="text-sm text-gray-500">{patient.name}</p>}
        </div>
        <button className="btn-secondary text-sm" onClick={() => setShowRequestModal(true)}><Plus className="w-4 h-4" /> Solicitar</button>
        <button className="btn-primary text-sm" onClick={() => setShowModal(true)}><Plus className="w-4 h-4" /> Resultado</button>
      </div>

      {results.length === 0 ? (
        <div className="card text-center py-12">
          <FlaskConical className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400">Nenhum resultado cadastrado</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 text-gray-500 text-xs">
              <th className="text-left px-4 py-2">Exame</th>
              <th className="text-center px-2 py-2">Valor</th>
              <th className="text-center px-2 py-2">Referência</th>
              <th className="text-center px-2 py-2">Status</th>
              <th className="text-left px-4 py-2">Análise</th>
            </tr></thead>
            <tbody>
              {results.map(r => (
                <tr key={r.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium">{r.exam_name}</td>
                  <td className="px-2 py-2 text-center">{r.value} {r.unit}</td>
                  <td className="px-2 py-2 text-center text-gray-400 text-xs">
                    {r.reference_min && r.reference_max ? `${r.reference_min}–${r.reference_max}` : '—'}
                  </td>
                  <td className="px-2 py-2 text-center">
                    {r.status && <span className={`badge ${STATUS_COLOR[r.status] || 'bg-gray-100 text-gray-600'}`}>{r.status}</span>}
                  </td>
                  <td className="px-4 py-2 text-xs text-gray-500 max-w-xs truncate">{r.analysis || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal resultado */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-[#0f0f1c] rounded-2xl shadow-xl w-full max-w-lg border border-purple-900/30">
            <div className="flex items-center justify-between px-6 py-4 border-b border-purple-900/30">
              <h2 className="font-semibold text-white">Adicionar Resultado</h2>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleAddResult} className="px-6 py-5 space-y-4">
              <div><label className="label">Exame *</label>
                <input className="input" list="exams-list" value={form.exam_name} onChange={set('exam_name')} required />
                <datalist id="exams-list">{COMMON_EXAMS.map(e => <option key={e} value={e} />)}</datalist>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Valor</label><input className="input" value={form.value} onChange={set('value')} /></div>
                <div><label className="label">Unidade</label><input className="input" value={form.unit} onChange={set('unit')} placeholder="mg/dL, UI/L..." /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Ref. mínima</label><input type="number" step="0.01" className="input" value={form.reference_min} onChange={set('reference_min')} /></div>
                <div><label className="label">Ref. máxima</label><input type="number" step="0.01" className="input" value={form.reference_max} onChange={set('reference_max')} /></div>
              </div>
              <div><label className="label">Análise / Conduta</label><textarea className="input" rows={3} value={form.analysis} onChange={set('analysis')} /></div>
              <div className="flex gap-3">
                <button type="button" className="btn-secondary flex-1 justify-center" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn-primary flex-1 justify-center">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal solicitação */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-[#0f0f1c] rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-purple-900/30">
            <div className="flex items-center justify-between px-6 py-4 border-b border-purple-900/30">
              <h2 className="font-semibold text-white">Solicitar Exames</h2>
              <button onClick={() => setShowRequestModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleRequest} className="px-6 py-5 space-y-4">
              <div><label className="label">Título</label>
                <input className="input" value={requestForm.title} onChange={e => setRequestForm(f => ({ ...f, title: e.target.value }))} /></div>
              <div>
                <label className="label">Selecione os exames</label>
                <div className="grid grid-cols-2 gap-1 max-h-48 overflow-y-auto border border-purple-900/30 rounded-lg p-2 bg-[#12121f]">
                  {COMMON_EXAMS.map(exam => (
                    <label key={exam} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-purple-900/20 px-2 py-1 rounded text-gray-200">
                      <input type="checkbox" checked={selectedExams.includes(exam)} onChange={() => toggleExam(exam)} />
                      {exam}
                    </label>
                  ))}
                </div>
                {selectedExams.length > 0 && <p className="text-xs text-primary-600 mt-1">{selectedExams.length} exame(s) selecionado(s)</p>}
              </div>
              <div><label className="label">Justificativa</label>
                <textarea className="input" rows={2} value={requestForm.justification} onChange={e => setRequestForm(f => ({ ...f, justification: e.target.value }))} /></div>
              <div className="flex gap-3">
                <button type="button" className="btn-secondary flex-1 justify-center" onClick={() => setShowRequestModal(false)}>Cancelar</button>
                <button type="submit" className="btn-primary flex-1 justify-center">Criar Solicitação</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
