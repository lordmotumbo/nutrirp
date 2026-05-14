import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const THEMES = {
  nexfit: {
    name: 'NEXFIT (padrão)',
    primary: '#7C3AED',
    primaryLight: '#2d1b69',
    primaryDark: '#5B21B6',
    sidebar: '#0f0f1a',
  },
  verde: {
    name: 'Verde',
    primary: '#2E7D32',
    primaryLight: '#E8F5E9',
    primaryDark: '#1B5E20',
    sidebar: '#2E7D32',
  },
  azul: {
    name: 'Azul',
    primary: '#1565C0',
    primaryLight: '#E3F2FD',
    primaryDark: '#0D47A1',
    sidebar: '#1565C0',
  },
  roxo: {
    name: 'Roxo',
    primary: '#6A1B9A',
    primaryLight: '#F3E5F5',
    primaryDark: '#4A148C',
    sidebar: '#6A1B9A',
  },
  laranja: {
    name: 'Laranja',
    primary: '#E65100',
    primaryLight: '#FFF3E0',
    primaryDark: '#BF360C',
    sidebar: '#E65100',
  },
  cinza: {
    name: 'Cinza escuro',
    primary: '#37474F',
    primaryLight: '#ECEFF1',
    primaryDark: '#263238',
    sidebar: '#263238',
  },
}

const ThemeContext = createContext(null)

function applyTheme(themeKey, dark) {
  const theme = THEMES[themeKey] || THEMES.nexfit
  const root = document.documentElement

  root.style.setProperty('--color-primary', theme.primary)
  root.style.setProperty('--color-primary-light', theme.primaryLight)
  root.style.setProperty('--color-primary-dark', theme.primaryDark)
  root.style.setProperty('--color-sidebar', theme.sidebar)

  if (dark) {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
}

export function ThemeProvider({ children }) {
  const [themeKey, setThemeKey] = useState(() => localStorage.getItem('nutrirp_theme') || 'nexfit')
  const [dark, setDark] = useState(() => {
    const stored = localStorage.getItem('nutrirp_dark')
    return stored === null ? true : stored === 'true'
  })

  useEffect(() => {
    applyTheme(themeKey, dark)
  }, [themeKey, dark])

  const changeTheme = useCallback((key) => {
    setThemeKey(key)
    localStorage.setItem('nutrirp_theme', key)
  }, [])

  const toggleDark = useCallback(() => {
    setDark(d => {
      const next = !d
      localStorage.setItem('nutrirp_dark', String(next))
      return next
    })
  }, [])

  return (
    <ThemeContext.Provider value={{ themeKey, dark, changeTheme, toggleDark, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
export { THEMES }
