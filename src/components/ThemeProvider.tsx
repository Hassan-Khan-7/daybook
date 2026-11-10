import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'

export type Theme = 'light' | 'dark'

const ThemeContext = createContext<{ theme: Theme; toggle: () => void }>({ theme: 'light', toggle: () => {} })

const systemTheme = (): Theme =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'

/** Light/dark theme. Follows the OS until the user flips the switch, then remembers their choice. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [saved, setSaved] = useLocalStorage<string | null>('ui.theme', null)
  const theme: Theme = saved === 'light' || saved === 'dark' ? saved : systemTheme()

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const toggle = useCallback(() => setSaved(theme === 'dark' ? 'light' : 'dark'), [theme, setSaved])
  const value = useMemo(() => ({ theme, toggle }), [theme, toggle])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export const useTheme = () => useContext(ThemeContext)
