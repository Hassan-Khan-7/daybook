import { useLocation } from 'react-router-dom'
import { useTheme } from './ThemeProvider'
import { MenuIcon, MoonIcon, SunIcon } from './Icons'

/** Compact header shown only on small screens; opens the sidebar drawer. */
export default function TopBar({ onMenu }: { onMenu: () => void }) {
  const { theme, toggle } = useTheme()
  const { pathname } = useLocation()
  const title = pathname.startsWith('/todos') ? 'Tasks' : 'Journal'

  return (
    <header className="topbar">
      <button className="icon-btn" onClick={onMenu} aria-label="Open menu">
        <MenuIcon size={20} />
      </button>
      <span className="topbar-title">{title}</span>
      <button
        className="icon-btn"
        onClick={toggle}
        aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {theme === 'dark' ? <SunIcon size={18} /> : <MoonIcon size={18} />}
      </button>
    </header>
  )
}
