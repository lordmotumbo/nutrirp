import { useState } from 'react'
import { Settings, X, Sun, Moon, Check } from 'lucide-react'
import { useTheme, THEMES } from '../context/ThemeContext'

const THEME_PREVIEWS = {
  verde:   'bg-green-700',
  azul:    'bg-blue-700',
  roxo:    'bg-purple-800',
  laranja: 'bg-orange-700',
  cinza:   'bg-gray-700',
}

export default function ThemePanel() {
  const [open, setOpen] = useState(false)
  const { themeKey, dark, changeTheme, toggleDark, themes } = useTheme()

  return (
    <>
      {/* Botão flutuante — canto inferior direito */}
      <button
        onClick={() => setOpen(o => !o)}
        title="Configurar aparência"
        className="fixed bottom-5 right-5 z-50 w-11 h-11 rounded-full shadow-lg
                   flex items-center justify-center text-white transition-transform
                   hover:scale-110 active:scale-95"
        style={{ backgroundColor: 'var(--color-primary)' }}
      >
        <Settings className="w-5 h-5" />
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/30"
          style={{ zIndex: 9998 }}
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer — desliza da direita */}
      <div
        className={`
          fixed top-0 right-0 h-full w-80 bg-white dark:bg-gray-900 shadow-2xl
          flex flex-col transition-transform duration-300
          ${open ? 'translate-x-0' : 'translate-x-full'}
        `}
        style={{ zIndex: 9999 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b dark:border-gray-700">
          <div>
            <h2 className="font-bold text-gray-800 dark:text-white">Aparência</h2>
            <p className="text-xs text-gray-400">Personalize o sistema</p>
          </div>
          <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
          {/* Modo claro/escuro */}
          <div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">Modo</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => dark && toggleDark()}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  !dark
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)]'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="w-10 h-10 bg-white rounded-lg shadow flex items-center justify-center">
                  <Sun className="w-5 h-5 text-yellow-500" />
                </div>
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Claro</span>
                {!dark && <Check className="w-3 h-3" style={{ color: 'var(--color-primary)' }} />}
              </button>

              <button
                onClick={() => !dark && toggleDark()}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  dark
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)]'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="w-10 h-10 bg-gray-900 rounded-lg shadow flex items-center justify-center">
                  <Moon className="w-5 h-5 text-blue-300" />
                </div>
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Escuro</span>
                {dark && <Check className="w-3 h-3" style={{ color: 'var(--color-primary)' }} />}
              </button>
            </div>
          </div>

          {/* Cores */}
          <div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">Cor do sistema</p>
            <div className="space-y-2">
              {Object.entries(themes).map(([key, theme]) => (
                <button
                  key={key}
                  onClick={() => changeTheme(key)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all ${
                    themeKey === key
                      ? 'border-[var(--color-primary)]'
                      : 'border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600'
                  }`}
                  style={themeKey === key ? { backgroundColor: 'var(--color-primary-light)' } : {}}
                >
                  <div className={`w-8 h-8 rounded-lg ${THEME_PREVIEWS[key]} flex-shrink-0`} />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200 flex-1 text-left">
                    {theme.name}
                  </span>
                  {themeKey === key && (
                    <Check className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">Preview</p>
            <div className="rounded-xl p-4 text-white text-sm font-medium"
              style={{ backgroundColor: 'var(--color-primary)' }}>
              <p className="font-bold">NUTRIRP</p>
              <p className="text-xs opacity-80 mt-1">Sistema para Nutricionistas</p>
              <div className="mt-3 flex gap-2">
                <div className="bg-white/20 rounded px-3 py-1 text-xs">Dashboard</div>
                <div className="bg-white/20 rounded px-3 py-1 text-xs">Pacientes</div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-5 py-4 border-t dark:border-gray-700">
          <button
            onClick={() => setOpen(false)}
            className="w-full py-2.5 rounded-xl text-sm font-medium text-white transition-colors"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            Fechar
          </button>
        </div>
      </div>
    </>
  )
}
