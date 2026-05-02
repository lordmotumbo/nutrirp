import axios from 'axios'

// Em produção: VITE_API_URL = https://nutrirp-api.onrender.com/api
// Em dev: proxy via vite.config.js redireciona /api → localhost:8000
const BASE_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: BASE_URL,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('nutrirp_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    // Só redireciona para login se for 401 E não for a rota de login/register
    if (
      err.response?.status === 401 &&
      !err.config?.url?.includes('/auth/')
    ) {
      localStorage.removeItem('nutrirp_token')
      localStorage.removeItem('nutrirp_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
