import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard, Users, CalendarDays, LogOut, Menu,
  DollarSign, Dumbbell, Activity, Share2
} from 'lucide-react'
import { useState } from 'react'
import NutrirpLogo from './NutrirpLogo'

// Navegação por tipo de profissional
const NAV_BY_ROLE = {
  nutritionist: [
    { to: '/',              label: 'Dashboard',   icon: LayoutDashboard, end: true },
    { to: '/patients',      label: 'Pacientes',   icon: Users },
    { to: '/shared',        label: 'Compartilhados', icon: Share2 },
    { to: '/agenda',        label: 'Agenda',      icon: CalendarDays },
    { to: '/financial',     label: 'Financeiro',  icon: DollarSign },
  ],
  personal_trainer: [
    { to: '/',              label: 'Dashboard',      icon: LayoutDashboard, end: true },
    { to: '/personal/clients', label: 'Alunos',      icon: Users },
    { to: '/personal/workouts', label: 'Treinos',    icon: Dumbbell },
    { to: '/shared',        label: 'Compartilhados', icon: Share2 },
    { to: '/agenda',        label: 'Agenda',         icon: CalendarDays },
    { to: '/financial',     label: 'Financeiro',     icon: DollarSign },
  ],
  physiotherapist: [
    { to: '/',              label: 'Dashboard',      icon: LayoutDashboard, end: true },
    { to: '/physio/patients', label: 'Pacientes',    icon: Users },
    { to: '/physio/records',  label: 'Prontuários',  icon: Activity },
    { to: '/shared',        label: 'Compartilhados', icon: Share2 },
    { to: '/agenda',        label: 'Agenda',         icon: CalendarDays },
    { to: '/financial',     label: 'Financeiro',     icon: DollarSign },
  ],
}

const ROLE_LABEL = {
  nutritionist: 'Nutricionista',
  personal_trainer: 'Personal Trainer',
  physiotherapist: 'Fisioterapeuta',
  admin: 'Administrador',
}

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  function handleLogout() { logout(); navigate('/login') }

  const role = user?.role || 'nutritionist'
  const nav = NAV_BY_ROLE[role] || NAV_BY_ROLE.nutritionist

  // Registro profissional
  const regNumber = user?.crn || user?.cref || user?.crefito

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40 w-60 flex flex-col
          transform transition-transform duration-200
          ${open ? 'translate-x-0' : '-translate-x-full'}
          md:relative md:translate-x-0 md:flex-shrink-0
        `}
        style={{ backgroundColor: 'var(--color-sidebar)' }}
      >
        {/* Logo */}
        <div className="px-4 py-4 border-b border-white/10">
          <NutrirpLogo size={36} textSize="text-lg" />
          {role !== 'nutritionist' && (
            <p className="text-xs text-white/60 mt-1">{ROLE_LABEL[role]}</p>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {nav.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-white
                ${isActive ? 'sidebar-active bg-black/20' : 'hover:bg-black/15 text-white/80'}`
              }
            >
              <Icon className="w-5 h-5" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User info */}
        <div className="px-4 py-4 border-t border-white/10">
          <p className="text-xs text-white/80 truncate font-medium">{user?.name}</p>
          <p className="text-xs text-white/50 truncate">{user?.email}</p>
          {regNumber && <p className="text-xs text-white/50">{regNumber}</p>}
          <p className="text-xs text-white/40 mt-0.5">{ROLE_LABEL[role]}</p>

          <div className="mt-3 flex items-center justify-between">
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs text-white/60 hover:text-white transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" /> Sair
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay mobile */}
      {open && (
        <div className="fixed inset-0 z-30 bg-black/40 md:hidden" onClick={() => setOpen(false)} />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar mobile */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
          <button onClick={() => setOpen(true)}>
            <Menu className="w-6 h-6 text-gray-600 dark:text-gray-300" />
          </button>
          <NutrirpLogo
            size={28}
            textSize="text-base"
            className="[&_span]:text-gray-800 dark:[&_span]:text-white"
          />
          <div />
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50 dark:bg-gray-950">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
