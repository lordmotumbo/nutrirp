import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Bell, Mail, Send, Save, TestTube } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'

const BASE = import.meta.env.VITE_API_URL || 'https://nutrirp-api.onrender.com/api'
const api = () => axios.create({
  baseURL: BASE,
  headers: { Authorization: `Bearer ${localStorage.getItem('nutrirp_patient_token')}` }
})

const DEFAULT = {
  email_alerts: false,
  alert_email: '',
  telegram_alerts: false,
  telegram_chat_id: '',
  meal_alerts: true,
  water_alerts: true,
  water_interval_hours: 2,
  water_start_hour: 7,
  water_end_hour: 22,
}

export default function PatientAlerts() {
  const [config, setConfig] = useState(DEFAULT)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testingWater, setTestingWater] = useState(false)
  const [testingMeal, setTestingMeal] = useState(false)

  useEffect(() => {
    api().get('/alerts/config')
      .then(r => setConfig({ ...DEFAULT, ...r.data }))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const set = k => e => setConfig(c => ({ ...c, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))
  const setNum = k => e => setConfig(c => ({ ...c, [k]: parseInt(e.target.value) || 0 }))

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await api().put('/alerts/config', {
        ...config,
        water_interval_hours: parseInt(config.water_interval_hours),
        water_start_hour: parseInt(config.water_start_hour),
        water_end_hour: parseInt(config.water_end_hour),
      })
      toast.success('Configurações salvas!')
    } catch { toast.error('Erro ao salvar') }
    finally { setSaving(false) }
  }

  async function testWater() {
    setTestingWater(true)
    try {
      const { data } = await api().post('/alerts/test/water')
      if (data.ok) toast.success(`Alerta de água enviado via: ${data.sent_via.join(', ')}`)
      else toast.error(data.message || 'Nenhum canal configurado')
    } catch { toast.error('Erro ao testar') }
    finally { setTestingWater(false) }
  }

  async function testMeal() {
    setTestingMeal(true)
    try {
      const { data } = await api().post('/alerts/test/meal')
      if (data.ok) toast.success(`Alerta de refeição enviado via: ${data.sent_via.join(', ')}`)
      else toast.error(data.message || 'Nenhum canal configurado')
    } catch { toast.error('Erro ao testar') }
    finally { setTestingMeal(false) }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <p className="text-gray-400">Carregando...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="text-white px-5 py-4 flex items-center gap-3" style={{ backgroundColor: 'var(--color-primary)' }}>
        <Link to="/paciente/dashboard"><ArrowLeft className="w-5 h-5" /></Link>
        <h1 className="font-bold text-lg">Configurar Alertas</h1>
      </header>

      <div className="max-w-lg mx-auto px-4 py-5">
        <form onSubmit={handleSave} className="space-y-4">

          {/* Info */}
          <div className="card bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <Bell className="w-4 h-4 inline mr-1" />
              Configure como deseja receber lembretes de refeição e hidratação.
              Os alertas são enviados nos horários da sua dieta ativa.
            </p>
          </div>

          {/* Email */}
          <div className="card space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-primary-600" />
                <span className="font-semibold dark:text-white">Alertas por E-mail</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={config.email_alerts} onChange={set('email_alerts')} />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500" />
              </label>
            </div>
            {config.email_alerts && (
              <div>
                <label className="label">E-mail para receber alertas</label>
                <input
                  type="email" className="input"
                  value={config.alert_email}
                  onChange={set('alert_email')}
                  placeholder="seu@email.com"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Deixe em branco para usar o e-mail do seu cadastro.
                </p>
              </div>
            )}
          </div>

          {/* Telegram */}
          <div className="card space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-blue-500" />
                <span className="font-semibold dark:text-white">Alertas por Telegram</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={config.telegram_alerts} onChange={set('telegram_alerts')} />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500" />
              </label>
            </div>
            {config.telegram_alerts && (
              <div>
                <label className="label">Seu Chat ID do Telegram</label>
                <input
                  type="text" className="input"
                  value={config.telegram_chat_id}
                  onChange={set('telegram_chat_id')}
                  placeholder="ex: 123456789"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Para obter seu Chat ID: abra o Telegram, procure por <b>@userinfobot</b> e envie /start.
                  O bot do nutricionista precisa estar configurado.
                </p>
              </div>
            )}
          </div>

          {/* Alertas de refeição */}
          <div className="card space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold dark:text-white">🍽 Alertas de refeição</p>
                <p className="text-xs text-gray-400">Nos horários definidos na sua dieta ativa</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={config.meal_alerts} onChange={set('meal_alerts')} />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500" />
              </label>
            </div>
            <button
              type="button"
              onClick={testMeal}
              disabled={testingMeal || (!config.email_alerts && !config.telegram_alerts)}
              className="btn-secondary w-full justify-center text-sm"
            >
              <TestTube className="w-4 h-4" />
              {testingMeal ? 'Enviando...' : 'Testar alerta de refeição'}
            </button>
          </div>

          {/* Alertas de água */}
          <div className="card space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold dark:text-white">💧 Alertas de água</p>
                <p className="text-xs text-gray-400">Lembrete periódico para se hidratar</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={config.water_alerts} onChange={set('water_alerts')} />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500" />
              </label>
            </div>

            {config.water_alerts && (
              <div className="space-y-3">
                <div>
                  <label className="label">Intervalo entre alertas</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4].map(h => (
                      <button
                        key={h} type="button"
                        onClick={() => setConfig(c => ({ ...c, water_interval_hours: h }))}
                        className={`flex-1 py-2 rounded-lg text-sm border-2 font-medium transition-all ${
                          config.water_interval_hours === h
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 text-gray-600 dark:border-gray-600 dark:text-gray-300'
                        }`}
                      >
                        {h}h
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Início (hora)</label>
                    <input type="number" min="0" max="23" className="input"
                      value={config.water_start_hour} onChange={setNum('water_start_hour')} />
                  </div>
                  <div>
                    <label className="label">Fim (hora)</label>
                    <input type="number" min="0" max="23" className="input"
                      value={config.water_end_hour} onChange={setNum('water_end_hour')} />
                  </div>
                </div>
                <p className="text-xs text-gray-400">
                  Alertas enviados das {config.water_start_hour}h às {config.water_end_hour}h, a cada {config.water_interval_hours}h.
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={testWater}
              disabled={testingWater || (!config.email_alerts && !config.telegram_alerts)}
              className="btn-secondary w-full justify-center text-sm"
            >
              <TestTube className="w-4 h-4" />
              {testingWater ? 'Enviando...' : 'Testar alerta de água'}
            </button>
          </div>

          {(!config.email_alerts && !config.telegram_alerts) && (
            <div className="card bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200">
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                ⚠️ Ative pelo menos um canal (email ou Telegram) para receber alertas.
              </p>
            </div>
          )}

          <button type="submit" className="btn-primary w-full justify-center" disabled={saving}>
            <Save className="w-4 h-4" />
            {saving ? 'Salvando...' : 'Salvar configurações'}
          </button>
        </form>
      </div>
    </div>
  )
}
