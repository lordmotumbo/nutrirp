import { useEffect, useState } from 'react'
import { Plus, TrendingUp, TrendingDown, DollarSign, Check, Trash2, X } from 'lucide-react'
import api from '../api'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const CATEGORIES = ['consulta', 'retorno', 'avaliação', 'material', 'aluguel', 'marketing', 'curso', 'outros']
const METHODS = ['pix', 'dinheiro', 'cartão crédito', 'cartão débito', 'transferência', 'boleto']

export default function Financial() {
  const [data, setData] = useState({ records: [], total_receita: 0, total_despesa: 0, saldo: 0 })
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ type: 'receita', category: 'consulta', description: '', amount: '', payment_method: 'pix', is_paid: true })
  const [filter, setFilter] = useState({ month: new Date().getMonth() + 1, year: new Date().getFullYear() })
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  async function load() {
    const { data: d } = await api.get('/financial/records', { params: filter })
    setData(d)
  }

  useEffect(() => { load() }, [filter])

  async function handleCreate(e) {
    e.preventDefault()
    try {
      await api.post('/financial/record', { ...form, amount: parseFloat(form.amount) })
      toast.success('Registro salvo!')
      setShowModal(false)
      setForm({ type: 'receita', category: 'consulta', description: '', amount: '', payment_method: 'pix', is_paid: true })
      load()
    } catch { toast.error('Erro ao salvar') }
  }

  async function markPaid(id) {
    await api.put(`/financial/record/${id}/pay`)
    toast.success('Marcado como pago')
    load()
  }

  async function deleteRecord(id) {
    if (!confirm('Excluir registro?')) return
    await api.delete(`/financial/record/${id}`)
    load()
  }

  const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Controle Financeiro</h1>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4" /> Novo registro
        </button>
      </div>

      {/* Filtro de mês */}
      <div className="flex gap-3 items-center">
        <select className="input w-36" value={filter.month} onChange={e => setFilter(f => ({ ...f, month: Number(e.target.value) }))}>
          {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
        <select className="input w-28" value={filter.year} onChange={e => setFilter(f => ({ ...f, year: Number(e.target.value) }))}>
          {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card flex items-center gap-4">
          <div className="p-3 bg-green-50 rounded-xl"><TrendingUp className="w-5 h-5 text-green-600" /></div>
          <div><p className="text-xl font-bold text-green-600">R$ {data.total_receita.toFixed(2)}</p><p className="text-xs text-gray-400">Receitas</p></div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="p-3 bg-red-50 rounded-xl"><TrendingDown className="w-5 h-5 text-red-500" /></div>
          <div><p className="text-xl font-bold text-red-500">R$ {data.total_despesa.toFixed(2)}</p><p className="text-xs text-gray-400">Despesas</p></div>
        </div>
        <div className="card flex items-center gap-4">
          <div className={`p-3 rounded-xl ${data.saldo >= 0 ? 'bg-blue-50' : 'bg-orange-50'}`}>
            <DollarSign className={`w-5 h-5 ${data.saldo >= 0 ? 'text-blue-600' : 'text-orange-500'}`} />
          </div>
          <div><p className={`text-xl font-bold ${data.saldo >= 0 ? 'text-blue-600' : 'text-orange-500'}`}>R$ {data.saldo.toFixed(2)}</p><p className="text-xs text-gray-400">Saldo</p></div>
        </div>
      </div>

      {/* Lista de registros */}
      <div className="card">
        <h2 className="font-semibold mb-4">Registros</h2>
        {data.records.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">Nenhum registro neste período</p>
        ) : (
          <div className="space-y-2">
            {data.records.map(r => (
              <div key={r.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-8 rounded-full ${r.type === 'receita' ? 'bg-green-400' : 'bg-red-400'}`} />
                  <div>
                    <p className="text-sm font-medium">{r.description}</p>
                    <p className="text-xs text-gray-400">{r.category} · {r.payment_method} · {format(new Date(r.created_at), 'dd/MM/yyyy')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`font-semibold ${r.type === 'receita' ? 'text-green-600' : 'text-red-500'}`}>
                    {r.type === 'receita' ? '+' : '-'}R$ {r.amount.toFixed(2)}
                  </span>
                  {!r.is_paid && (
                    <button onClick={() => markPaid(r.id)} className="text-xs text-primary-600 hover:text-primary-800 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Pago
                    </button>
                  )}
                  {r.is_paid && <span className="text-xs text-green-500 flex items-center gap-1"><Check className="w-3 h-3" /> Pago</span>}
                  <button onClick={() => deleteRecord(r.id)} className="text-gray-300 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-[#0f0f1c] rounded-2xl shadow-xl w-full max-w-md border border-purple-900/30">
            <div className="flex items-center justify-between px-6 py-4 border-b border-purple-900/30">
              <h2 className="font-semibold text-white">Novo Registro</h2>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleCreate} className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Tipo</label>
                  <select className="input" value={form.type} onChange={set('type')}>
                    <option value="receita">Receita</option>
                    <option value="despesa">Despesa</option>
                  </select></div>
                <div><label className="label">Categoria</label>
                  <select className="input" value={form.category} onChange={set('category')}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select></div>
              </div>
              <div><label className="label">Descrição *</label>
                <input className="input" value={form.description} onChange={set('description')} required /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Valor (R$) *</label>
                  <input type="number" step="0.01" className="input" value={form.amount} onChange={set('amount')} required /></div>
                <div><label className="label">Forma de pagamento</label>
                  <select className="input" value={form.payment_method} onChange={set('payment_method')}>
                    {METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select></div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="paid" checked={form.is_paid} onChange={e => setForm(f => ({ ...f, is_paid: e.target.checked }))} />
                <label htmlFor="paid" className="text-sm text-gray-600">Já foi pago</label>
              </div>
              <div className="flex gap-3">
                <button type="button" className="btn-secondary flex-1 justify-center" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn-primary flex-1 justify-center">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
