import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import NexfitLogo from '../../components/NexfitLogo'
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
      navigate('/paciente/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'E-mail ou senha incorretos')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50 px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="px-6 py-4 rounded-2xl bg-green-700">
            <NexfitLogo size={44} textSize="text-2xl" />
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold mb-1 text-gray-800">Área do Paciente</h2>
          <p className="text-xs text-gray-400 mb-5">Acesse seu plano alimentar e acompanhe sua evolução</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
              <input
                type="email"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                value={form.email}
                onChange={set('email')}
                required
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
              <input
                type="password"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                value={form.password}
                onChange={set('password')}
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-700 hover:bg-green-800 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-4">
            Nutricionista?{' '}
            <Link to="/login" className="text-green-700 font-medium hover:underline">
              Acesse aqui
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
