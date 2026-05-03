import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import NutrirpLogo from '../../components/NutrirpLogo'
import toast from 'react-hot-toast'

const BASE = import.meta.env.VITE_API_URL || 'https://nutrirp-api.onrender.com/api'

export default function PatientLogin() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await axios.post(`${BASE}/patient-portal/login`, form)
      localStorage.setItem('nutrirp_patient_token', data.access_token)
      localStorage.setItem('nutrirp_patient', JSON.stringify(data.patient))
      navigate('/patient/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erro ao entrar')
    } finally { setLoading(false) }
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
          <h2 className="text-lg font-semibold mb-1">Área do Paciente</h2>
          <p className="text-xs text-gray-400 mb-5">Acesse seu plano alimentar e acompanhe sua evolução</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><label className="label">E-mail</label>
              <input type="email" className="input" value={form.email} onChange={set('email')} required autoFocus /></div>
            <div><label className="label">Senha</label>
              <input type="password" className="input" value={form.password} onChange={set('password')} required /></div>
            <button type="submit" className="btn-primary w-full justify-center" disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
          <p className="text-center text-xs text-gray-400 mt-4">
            Nutricionista?{' '}
            <Link to="/login" className="font-medium hover:underline" style={{ color: 'var(--color-primary)' }}>Acesse aqui</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
