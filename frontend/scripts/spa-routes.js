// Cria index.html físico para cada rota SPA
// Resolve o problema do Render Static Site não servir rotas de subpastas
import { copyFileSync, mkdirSync, existsSync } from 'fs'
import { join } from 'path'

const dist = 'dist'
const routes = [
  'patient/login',
  'patient/dashboard',
  'patient/diary',
  'patient/chat',
  'patient/diet',
  'patient/appointments',
  'patient/preconsult',
  'patient/goals',
  'login',
  'register',
]

for (const route of routes) {
  const dir = join(dist, route)
  mkdirSync(dir, { recursive: true })
  copyFileSync(join(dist, 'index.html'), join(dir, 'index.html'))
  console.log(`✓ ${route}/index.html`)
}

console.log('SPA routes criadas com sucesso!')
