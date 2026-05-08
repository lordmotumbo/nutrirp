import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import NutrirpLogo from '../components/NutrirpLogo'
import toast from 'react-hot-toast'

const ROLES = [
  { value: 'nutritionist', label: '🥗 Nutricionista', reg: 'CRN', field: 'crn' },
  { value: 'personal_trainer', label: '💪 Personal Trainer', reg: 'CREF', field: 'cref' },
  { value: 'physiotherapist', label: '🦴 Fisioterapeuta', reg: 'CREFITO', field: 'crefito' },
]

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '',
    role: 'nutritionist', crn: '', cref: '', crefito: '',
  })
  const [loading, setLoading] = useState(false)
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const selectedRole = ROLES.find(r => r.value === form.role)

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
    <div
      className="min-h-screen flex items-center justify-center px-4 py-8"
      style={{ background: 'linear-gradient(135deg, var(--color-primary-light) 0%, #fff 100%)' }}
    >
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <div className="px-6 py-4 rounded-2xl" style={{ backgroundColor: 'var(--color-primary)' }}>
            <NutrirpLogo size={44} textSize="text-2xl" />
          </div>
        </div>

        <div className="card shadow-lg">
          <h2 className="text-lg font-semibold mb-5 dark:text-white">Criar conta</h2>
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Tipo de profissional */}
            <div>
              <label className="label">Tipo de profissional</label>
              <div className="grid grid-cols-1 gap-2">
                {ROLES.map(r => (
                  <button
                    key={r.value} type="button"
                    onClick={() => setForm(f => ({ ...f, role: r.value }))}
                    className={`py-2.5 px-3 rounded-lg text-sm text-left border-2 transition-all font-medium ${
                      form.role === r.value
                        ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)] text-[var(--color-primary)]'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label">Nome completo</label>
              <input className="input" value={form.name} onChange={set('name')} required autoFocus />
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
                <label className="label">{selectedRole?.reg} (opcional)</label>
                <input
                  className="input"
                  value={form[selectedRole?.field || 'crn']}
                  onChange={set(selectedRole?.field || 'crn')}
                  placeholder={`${selectedRole?.reg}-0 00000`}
                />
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
            <Link to="/login" className="font-medium hover:underline" style={{ color: 'var(--color-primary)' }}>
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
