const { copyFileSync, mkdirSync } = require('fs')
const { join } = require('path')

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
  'paciente/alerts',
  'paciente/documents',
  'login',
  'register',
]

for (const route of routes) {
  const dir = join('dist', route)
  mkdirSync(dir, { recursive: true })
  copyFileSync(join('dist', 'index.html'), join(dir, 'index.html'))
  console.log('created: dist/' + route + '/index.html')
}
