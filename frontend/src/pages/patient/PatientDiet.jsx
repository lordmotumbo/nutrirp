import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, FileDown } from 'lucide-react'
import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL || 'https://nutrirp-api.onrender.com/api'
const api = () => axios.create({ baseURL: BASE, headers: { Authorization: `Bearer ${localStorage.getItem('nutrirp_patient_token')}` } })

export default function PatientDiet() {
  const [diet, setDiet] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api().get('/patient-portal/diet').then(r => setDiet(r.data)).catch(() => setDiet(null)).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-400">Carregando...</p></div>

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="text-white px-5 py-4 flex items-center gap-3" style={{ backgroundColor: 'var(--color-primary)' }}>
        <Link to="/paciente/dashboard"><ArrowLeft className="w-5 h-5" /></Link>
        <h1 className="font-bold text-lg">Minha Dieta</h1>
      </header>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">
        {!diet ? (
          <div className="card text-center py-12">
            <p className="text-4xl mb-3">🥗</p>
            <p className="text-gray-500">Nenhuma dieta ativa ainda</p>
            <p className="text-xs text-gray-400 mt-1">Seu nutricionista irá criar seu plano alimentar</p>
          </div>
        ) : (
          <>
            <div className="card">
              <h2 className="font-bold text-lg dark:text-white">{diet.title}</h2>
              {diet.description && <p className="text-sm text-gray-500 mt-1">{diet.description}</p>}
              {diet.total_calories && (
                <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium text-white"
                  style={{ backgroundColor: 'var(--color-primary)' }}>
                  🔥 {diet.total_calories.toFixed(0)} kcal/dia
                </div>
              )}
            </div>

            {(diet.meals || []).map(meal => (
              <div key={meal.id} className="card">
                <h3 className="font-semibold mb-3 dark:text-white">
                  🍽 {meal.name} {meal.time && <span className="text-gray-400 font-normal text-sm">— {meal.time}</span>}
                </h3>
                {(meal.foods || []).map(food => (
                  <div key={food.id} className="flex items-center justify-between py-1.5 border-b last:border-0">
                    <span className="text-sm dark:text-white">{food.food_name}</span>
                    <span className="text-xs text-gray-400">
                      {food.quantity && `${food.quantity}${food.unit || 'g'}`}
                      {food.calories && ` · ${food.calories.toFixed(0)} kcal`}
                    </span>
                  </div>
                ))}
                {meal.notes && <p className="text-xs text-gray-400 mt-2 italic">{meal.notes}</p>}
              </div>
            ))}

            <a
              href={`${BASE}/diets/${diet.id}/pdf?token=${localStorage.getItem('nutrirp_patient_token')}`}
              target="_blank" rel="noreferrer"
              className="btn-secondary w-full justify-center"
            >
              <FileDown className="w-4 h-4" /> Baixar PDF
            </a>
          </>
        )}
      </div>
    </div>
  )
}
