const { copyFileSync, mkdirSync } = require('fs')
const { join } = require('path')

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
  const dir = join('dist', route)
  mkdirSync(dir, { recursive: true })
  copyFileSync(join('dist', 'index.html'), join(dir, 'index.html'))
  console.log('created: dist/' + route + '/index.html')
}
