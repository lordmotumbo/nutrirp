// Cria index.html físico para cada rota SPA
// Resolve o problema do Render Static Site não servir rotas de subpastas
import { copyFileSync, mkdirSync, existsSync } from 'fs'
import { join } from 'path'

const dist = 'dist'
const routes = [
  'paciente',
  'paciente/login',
  'paciente/dashboard',
  'paciente/diary',
  'paciente/chat',
  'paciente/diet',
  'paciente/appointments',
  'paciente/preconsult',
  'paciente/goals',
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
