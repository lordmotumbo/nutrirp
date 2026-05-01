import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Leaf } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', crn: '', phone: '' })
  const [loading, setLoading] = useState(false)

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      await register(form)
      toast.success('Conta criada! Faça login.')
      navigate('/login')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erro ao cadastrar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-primary-700 rounded-2xl mb-3">
            <Leaf className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-primary-900">NUTRIRP</h1>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold mb-5">Criar conta</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Nome completo</label>
              <input className="input" value={form.name} onChange={set('name')} required />
            </div>
            <div>
              <label className="label">E-mail</label>
              <input type="email" className="input" value={form.email} onChange={set('email')} required />
            </div>
            <div>
              <label className="label">Senha</label>
              <input type="password" className="input" value={form.password} onChange={set('password')} required minLength={6} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">CRN (opcional)</label>
                <input className="input" value={form.crn} onChange={set('crn')} placeholder="CRN-0 00000" />
              </div>
              <div>
                <label className="label">Telefone</label>
                <input className="input" value={form.phone} onChange={set('phone')} placeholder="(00) 00000-0000" />
              </div>
            </div>
            <button type="submit" className="btn-primary w-full justify-center" disabled={loading}>
              {loading ? 'Criando...' : 'Criar conta'}
            </button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-4">
            Já tem conta?{' '}
            <Link to="/login" className="text-primary-700 font-medium hover:underline">Entrar</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
