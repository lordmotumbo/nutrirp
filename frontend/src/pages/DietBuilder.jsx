import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2, Save, FileDown, ChevronDown, ChevronUp } from 'lucide-react'
import api from '../api'
import toast from 'react-hot-toast'

const DEFAULT_MEALS = [
  { name: 'Café da manhã', time: '07:00', order: 0, notes: '', foods: [] },
  { name: 'Lanche da manhã', time: '10:00', order: 1, notes: '', foods: [] },
  { name: 'Almoço', time: '12:30', order: 2, notes: '', foods: [] },
  { name: 'Lanche da tarde', time: '15:30', order: 3, notes: '', foods: [] },
  { name: 'Jantar', time: '19:00', order: 4, notes: '', foods: [] },
]

const UNITS = ['g', 'ml', 'unidade', 'colher de sopa', 'colher de chá', 'xícara', 'fatia', 'porção']

function FoodRow({ food, onChange, onRemove }) {
  return (
    <div className="grid grid-cols-12 gap-1.5 items-center text-sm">
      <input
        className="input col-span-4"
        placeholder="Alimento"
        value={food.food_name}
        onChange={e => onChange('food_name', e.target.value)}
      />
      <input
        type="number"
        step="0.1"
        className="input col-span-2"
        placeholder="Qtd"
        value={food.quantity}
        onChange={e => onChange('quantity', e.target.value)}
      />
      <select
        className="input col-span-2"
        value={food.unit}
        onChange={e => onChange('unit', e.target.value)}
      >
        <option value="">Unid.</option>
        {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
      </select>
      <input
        type="number"
        className="input col-span-1"
        placeholder="kcal"
        value={food.calories}
        onChange={e => onChange('calories', e.target.value)}
      />
      <input
        type="number"
        step="0.1"
        className="input col-span-1"
        placeholder="P"
        value={food.protein}
        onChange={e => onChange('protein', e.target.value)}
      />
      <input
        type="number"
        step="0.1"
        className="input col-span-1"
        placeholder="C"
        value={food.carbs}
        onChange={e => onChange('carbs', e.target.value)}
      />
      <button type="button" onClick={onRemove} className="col-span-1 text-red-400 hover:text-red-600 flex justify-center">
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  )
}

export default function DietBuilder() {
  const { id } = useParams()
  const [patient, setPatient] = useState(null)
  const [title, setTitle] = useState('Plano Alimentar')
  const [description, setDescription] = useState('')
  const [meals, setMeals] = useState(DEFAULT_MEALS.map(m => ({ ...m, foods: [] })))
  const [collapsed, setCollapsed] = useState({})
  const [saving, setSaving] = useState(false)
  const [savedDietId, setSavedDietId] = useState(null)

  useEffect(() => {
    api.get(`/patients/${id}`).then(r => setPatient(r.data))
  }, [id])

  function toggleCollapse(i) {
    setCollapsed(c => ({ ...c, [i]: !c[i] }))
  }

  function addFood(mealIdx) {
    setMeals(ms => ms.map((m, i) =>
      i === mealIdx
        ? { ...m, foods: [...m.foods, { food_name: '', quantity: '', unit: 'g', calories: '', protein: '', carbs: '', fat: '', notes: '' }] }
        : m
    ))
  }

  function updateFood(mealIdx, foodIdx, key, value) {
    setMeals(ms => ms.map((m, i) =>
      i === mealIdx
        ? { ...m, foods: m.foods.map((f, j) => j === foodIdx ? { ...f, [key]: value } : f) }
        : m
    ))
  }

  function removeFood(mealIdx, foodIdx) {
    setMeals(ms => ms.map((m, i) =>
      i === mealIdx ? { ...m, foods: m.foods.filter((_, j) => j !== foodIdx) } : m
    ))
  }

  function addMeal() {
    setMeals(ms => [...ms, { name: 'Nova refeição', time: '', order: ms.length, notes: '', foods: [] }])
  }

  function removeMeal(i) {
    setMeals(ms => ms.filter((_, idx) => idx !== i))
  }

  function updateMeal(i, key, value) {
    setMeals(ms => ms.map((m, idx) => idx === i ? { ...m, [key]: value } : m))
  }

  // Totais
  const totals = meals.reduce((acc, m) => {
    m.foods.forEach(f => {
      acc.calories += parseFloat(f.calories) || 0
      acc.protein += parseFloat(f.protein) || 0
      acc.carbs += parseFloat(f.carbs) || 0
      acc.fat += parseFloat(f.fat) || 0
    })
    return acc
  }, { calories: 0, protein: 0, carbs: 0, fat: 0 })

  async function handleSave() {
    setSaving(true)
    try {
      const payload = {
        patient_id: Number(id),
        title,
        description,
        total_calories: totals.calories || null,
        meals: meals.map((m, i) => ({
          name: m.name,
          time: m.time || null,
          order: i,
          notes: m.notes || null,
          foods: m.foods
            .filter(f => f.food_name)
            .map(f => ({
              food_name: f.food_name,
              quantity: parseFloat(f.quantity) || null,
              unit: f.unit || null,
              calories: parseFloat(f.calories) || null,
              protein: parseFloat(f.protein) || null,
              carbs: parseFloat(f.carbs) || null,
              fat: parseFloat(f.fat) || null,
            })),
        })),
      }
      const { data } = await api.post('/diets', payload)
      setSavedDietId(data.id)
      toast.success('Dieta salva!')
    } catch { toast.error('Erro ao salvar') }
    finally { setSaving(false) }
  }

  return (
    <div className="max-w-3xl space-y-5">
      <div className="flex items-center gap-3">
        <Link to={`/patients/${id}`} className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold">Montar Dieta</h1>
          {patient && <p className="text-sm text-gray-500">{patient.name}</p>}
        </div>
      </div>

      {/* Cabeçalho da dieta */}
      <div className="card space-y-3">
        <div>
          <label className="label">Título do plano</label>
          <input className="input" value={title} onChange={e => setTitle(e.target.value)} />
        </div>
        <div>
          <label className="label">Descrição / Orientações gerais</label>
          <textarea className="input" rows={2} value={description} onChange={e => setDescription(e.target.value)} />
        </div>
      </div>

      {/* Totais */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Calorias', value: `${totals.calories.toFixed(0)} kcal` },
          { label: 'Proteínas', value: `${totals.protein.toFixed(1)}g` },
          { label: 'Carboidratos', value: `${totals.carbs.toFixed(1)}g` },
          { label: 'Gorduras', value: `${totals.fat.toFixed(1)}g` },
        ].map(({ label, value }) => (
          <div key={label} className="card text-center py-3">
            <p className="text-base font-bold text-primary-700">{value}</p>
            <p className="text-xs text-gray-400">{label}</p>
          </div>
        ))}
      </div>

      {/* Refeições */}
      {meals.map((meal, mealIdx) => (
        <div key={mealIdx} className="card space-y-3">
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => toggleCollapse(mealIdx)} className="text-gray-400">
              {collapsed[mealIdx] ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
            <input
              className="input flex-1 font-medium"
              value={meal.name}
              onChange={e => updateMeal(mealIdx, 'name', e.target.value)}
            />
            <input
              type="time"
              className="input w-28"
              value={meal.time}
              onChange={e => updateMeal(mealIdx, 'time', e.target.value)}
            />
            <button type="button" onClick={() => removeMeal(mealIdx)} className="text-red-400 hover:text-red-600">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {!collapsed[mealIdx] && (
            <>
              {/* Header colunas */}
              {meal.foods.length > 0 && (
                <div className="grid grid-cols-12 gap-1.5 text-xs text-gray-400 px-0.5">
                  <span className="col-span-4">Alimento</span>
                  <span className="col-span-2">Qtd</span>
                  <span className="col-span-2">Unid.</span>
                  <span className="col-span-1">kcal</span>
                  <span className="col-span-1">Prot</span>
                  <span className="col-span-1">Carb</span>
                  <span className="col-span-1" />
                </div>
              )}

              {meal.foods.map((food, foodIdx) => (
                <FoodRow
                  key={foodIdx}
                  food={food}
                  onChange={(k, v) => updateFood(mealIdx, foodIdx, k, v)}
                  onRemove={() => removeFood(mealIdx, foodIdx)}
                />
              ))}

              <button
                type="button"
                className="text-sm text-primary-700 hover:text-primary-900 flex items-center gap-1"
                onClick={() => addFood(mealIdx)}
              >
                <Plus className="w-4 h-4" /> Adicionar alimento
              </button>

              <div>
                <label className="label text-xs">Observações da refeição</label>
                <input
                  className="input text-sm"
                  value={meal.notes}
                  onChange={e => updateMeal(mealIdx, 'notes', e.target.value)}
                  placeholder="Ex: Pode substituir por..."
                />
              </div>
            </>
          )}
        </div>
      ))}

      <button type="button" className="btn-secondary w-full justify-center" onClick={addMeal}>
        <Plus className="w-4 h-4" /> Adicionar refeição
      </button>

      <div className="flex gap-3">
        <button className="btn-primary flex-1 justify-center" onClick={handleSave} disabled={saving}>
          <Save className="w-4 h-4" /> {saving ? 'Salvando...' : 'Salvar Dieta'}
        </button>
        {savedDietId && (
          <a
            href={`/api/diets/${savedDietId}/pdf`}
            target="_blank"
            rel="noreferrer"
            className="btn-secondary flex items-center gap-2"
          >
            <FileDown className="w-4 h-4" /> Baixar PDF
          </a>
        )}
      </div>
    </div>
  )
}
