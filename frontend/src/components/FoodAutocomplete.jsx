import { useState, useRef, useEffect, useCallback } from 'react'
import { Search, Loader2, Leaf, Globe } from 'lucide-react'
import api from '../api'

/**
 * Campo de busca de alimentos com autocomplete.
 * Ao selecionar um alimento, chama onSelect(food) com os dados nutricionais.
 */
export default function FoodAutocomplete({ onSelect, placeholder = "Buscar alimento..." }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const debounceRef = useRef(null)
  const wrapperRef = useRef(null)

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    function handleClick(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const search = useCallback(async (q) => {
    if (q.length < 2) { setResults([]); setOpen(false); return }
    setLoading(true)
    try {
      const { data } = await api.get('/foods/search', { params: { q, limit: 12 } })
      setResults(data)
      setOpen(true)
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  function handleChange(e) {
    const val = e.target.value
    setQuery(val)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(val), 300)
  }

  function handleSelect(food) {
    onSelect(food)
    setQuery('')
    setResults([])
    setOpen(false)
  }

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        {loading
          ? <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
          : <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        }
        <input
          className="input pl-9 text-sm"
          value={query}
          onChange={handleChange}
          placeholder={placeholder}
          onFocus={() => results.length > 0 && setOpen(true)}
          autoComplete="off"
        />
      </div>

      {open && results.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 bg-[#0f0f1c] border border-purple-900/30 rounded-xl shadow-lg max-h-72 overflow-y-auto">
          {results.map((food, i) => (
            <li key={i}>
              <button
                type="button"
                className="w-full text-left px-4 py-2.5 hover:bg-primary-50 transition-colors flex items-start justify-between gap-3"
                onClick={() => handleSelect(food)}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{food.nome}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {food.kcal} kcal · P: {food.prot}g · C: {food.carb}g · G: {food.gord}g
                    {food.fibra > 0 ? ` · F: ${food.fibra}g` : ''}
                    <span className="ml-1 text-gray-300">· {food.porcao}</span>
                  </p>
                </div>
                {food.fonte === 'TACO'
                  ? <span title="Tabela TACO (Brasil)"><Leaf className="w-3.5 h-3.5 text-primary-500 flex-shrink-0 mt-0.5" /></span>
                  : <span title="USDA FoodData Central"><Globe className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 mt-0.5" /></span>
                }
              </button>
            </li>
          ))}
          <li className="px-4 py-1.5 border-t border-gray-100">
            <p className="text-[10px] text-gray-300">
              🌿 TACO (UNICAMP) · 🌐 USDA FoodData Central · valores por 100g
            </p>
          </li>
        </ul>
      )}

      {open && query.length >= 2 && results.length === 0 && !loading && (
        <div className="absolute z-50 w-full mt-1 bg-[#0f0f1c] border border-purple-900/30 rounded-xl shadow-lg px-4 py-3">
          <p className="text-sm text-gray-400">Nenhum alimento encontrado para "{query}"</p>
        </div>
      )}
    </div>
  )
}
