import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard, Users, CalendarDays, LogOut, Menu,
  DollarSign, Dumbbell, Activity, Share2, Bell
} from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import NutrirpLogo from './NutrirpLogo'
import api from '../api'

const NAV_BY_ROLE = {
  nutritionist: [
    { to: '/',              label: 'Dashboard',      icon: LayoutDashboard, end: true },
    { to: '/patients',      label: 'Pacientes',      icon: Users },
    { to: '/shared',        label: 'Compartilhados', icon: Share2 },
    { to: '/agenda',        label: 'Agenda',         icon: CalendarDays },
    { to: '/financial',     label: 'Financeiro',     icon: DollarSign },
  ],
  personal_trainer: [
    { to: '/',              label: 'Dashboard',      icon: LayoutDashboard, end: true },
    { to: '/personal/clients', label: 'Pacientes',   icon: Users },
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

// Hook para contar mensagens não lidas
function useUnreadMessages() {
  const [unread, setUnread] = useState(0)
  const [byPatient, setByPatient] = useState({})
  const prevUnread = useRef(0)

  useEffect(() => {
    async function fetchUnread() {
      try {
        const { data } = await api.get('/messaging/unread-count')
        setUnread(data.total)
        setByPatient(data.by_patient || {})

        // Notificação do browser se aumentou
        if (data.total > prevUnread.current && prevUnread.current >= 0) {
          if ('Notification' in window && Notification.permission === 'granted' && document.hidden) {
            new Notification('💬 Nova mensagem de paciente', {
              body: `Você tem ${data.total} mensagem(ns) não lida(s)`,
              icon: '/favicon.ico',
            })
          }
        }
        prevUnread.current = data.total
      } catch {}
    }

    fetchUnread()
    const interval = setInterval(fetchUnread, 5000)
    return () => clearInterval(interval)
  }, [])

  return { unread, byPatient }
}

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [showNotifPanel, setShowNotifPanel] = useState(false)
  const { unread, byPatient } = useUnreadMessages()

  function handleLogout() { logout(); navigate('/login') }

  const role = user?.role || 'nutritionist'
  const nav = NAV_BY_ROLE[role] || NAV_BY_ROLE.nutritionist
  const regNumber = user?.crn || user?.cref || user?.crefito

  // Pede permissão de notificação
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

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
        <div className="px-4 py-4 border-b border-white/10">
          <NutrirpLogo size={36} textSize="text-lg" />
          {role !== 'nutritionist' && (
            <p className="text-xs text-white/60 mt-1">{ROLE_LABEL[role]}</p>
          )}
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
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

        <div className="px-4 py-4 border-t border-white/10">
          <p className="text-xs text-white/80 truncate font-medium">{user?.name}</p>
          <p className="text-xs text-white/50 truncate">{user?.email}</p>
          {regNumber && <p className="text-xs text-white/50">{regNumber}</p>}
          <p className="text-xs text-white/40 mt-0.5">{ROLE_LABEL[role]}</p>
          <div className="mt-3">
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs text-white/60 hover:text-white transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" /> Sair
            </button>
          </div>
        </div>
      </aside>

      {open && (
        <div className="fixed inset-0 z-30 bg-black/40 md:hidden" onClick={() => setOpen(false)} />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <button className="md:hidden" onClick={() => setOpen(true)}>
            <Menu className="w-6 h-6 text-gray-600 dark:text-gray-300" />
          </button>
          <div className="md:hidden">
            <NutrirpLogo size={28} textSize="text-base" />
          </div>
          <div className="hidden md:block" />

          {/* Sino de notificações */}
          <div className="relative">
            <button
              onClick={() => setShowNotifPanel(p => !p)}
              className="relative p-2 rounded-xl text-gray-500 hover:text-primary-600 hover:bg-primary-50 transition-colors"
              title="Notificações"
            >
              <Bell className="w-5 h-5" />
              {unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 animate-pulse">
                  {unread > 99 ? '99+' : unread}
                </span>
              )}
            </button>

            {/* Painel de notificações */}
            {showNotifPanel && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border dark:border-gray-700 z-50 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b dark:border-gray-700">
                  <h3 className="font-semibold text-sm dark:text-white">Notificações</h3>
                  {unread > 0 && (
                    <span className="badge bg-red-100 text-red-600 text-xs">{unread} não lida(s)</span>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {unread === 0 ? (
                    <div className="px-4 py-8 text-center">
                      <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-400">Nenhuma mensagem nova</p>
                    </div>
                  ) : (
                    Object.entries(byPatient).map(([patientId, count]) => (
                      <NavLink
                        key={patientId}
                        to={`/patients/${patientId}/chat`}
                        onClick={() => setShowNotifPanel(false)}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-b dark:border-gray-700 last:border-0"
                      >
                        <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
                          💬
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium dark:text-white">Paciente #{patientId}</p>
                          <p className="text-xs text-gray-400">{count} mensagem(ns) não lida(s)</p>
                        </div>
                        <span className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0" />
                      </NavLink>
                    ))
                  )}
                </div>
                {unread > 0 && (
                  <div className="px-4 py-2 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                    <p className="text-xs text-gray-400 text-center">
                      Clique em uma conversa para abrir
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </header>

        {/* Fecha painel ao clicar fora */}
        {showNotifPanel && (
          <div className="fixed inset-0 z-40" onClick={() => setShowNotifPanel(false)} />
        )}

        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50 dark:bg-gray-950">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
