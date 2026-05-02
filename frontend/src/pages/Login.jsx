import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import NutrirpLogo from '../components/NutrirpLogo'
import toast from 'react-hot-toast'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      await login(form.email, form.password)
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erro ao entrar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'linear-gradient(135deg, var(--color-primary-light) 0%, #fff 100%)' }}>
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <div className="px-6 py-4 rounded-2xl" style={{ backgroundColor: 'var(--color-primary)' }}>
            <NutrirpLogo size={44} textSize="text-2xl" />
          </div>
        </div>

        <div className="card shadow-lg">
          <h2 className="text-lg font-semibold mb-5 dark:text-white">Entrar</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">E-mail</label>
              <input type="email" className="input" value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required autoFocus />
            </div>
            <div>
              <label className="label">Senha</label>
              <input type="password" className="input" value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
            </div>
            <button type="submit" className="btn-primary w-full justify-center" disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-4">
            Não tem conta?{' '}
            <Link to="/register" className="font-medium hover:underline" style={{ color: 'var(--color-primary)' }}>
              Cadastre-se
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
