import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LayoutDashboard, Users, CalendarDays, LogOut, Leaf, Menu, DollarSign } from 'lucide-react'
import { useState } from 'react'

const nav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/patients', label: 'Pacientes', icon: Users },
  { to: '/agenda', label: 'Agenda', icon: CalendarDays },
  { to: '/financial', label: 'Financeiro', icon: DollarSign },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  function handleLogout() { logout(); navigate('/login') }

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className={`fixed inset-y-0 left-0 z-40 w-60 bg-primary-800 text-white flex flex-col transform transition-transform duration-200 ${open ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0`}>
        <div className="flex items-center gap-2 px-5 py-5 border-b border-primary-700">
          <Leaf className="w-7 h-7 text-primary-200" />
          <span className="text-xl font-bold tracking-tight">NUTRIRP</span>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {nav.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} onClick={() => setOpen(false)}
              className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-primary-700 text-white' : 'text-primary-100 hover:bg-primary-700/60'}`}>
              <Icon className="w-5 h-5" />{label}
            </NavLink>
          ))}
        </nav>
        <div className="px-4 py-4 border-t border-primary-700">
          <p className="text-xs text-primary-300 truncate font-medium">{user?.name}</p>
          <p className="text-xs text-primary-400 truncate">{user?.email}</p>
          {user?.crn && <p className="text-xs text-primary-400">{user.crn}</p>}
          <button onClick={handleLogout} className="mt-3 flex items-center gap-2 text-xs text-primary-200 hover:text-white transition-colors">
            <LogOut className="w-4 h-4" /> Sair
          </button>
        </div>
      </aside>

      {open && <div className="fixed inset-0 z-30 bg-black/40 md:hidden" onClick={() => setOpen(false)} />}

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
          <button onClick={() => setOpen(true)}><Menu className="w-6 h-6 text-gray-600" /></button>
          <span className="font-bold text-primary-800">NUTRIRP</span>
          <div />
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6"><Outlet /></main>
      </div>
    </div>
  )
}
