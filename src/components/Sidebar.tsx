import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useCreateEntry, useData } from '../store/DataContext'
import { useTheme } from './ThemeProvider'
import { todayKey } from '../lib/date'
import { allTags } from '../lib/journal'
import {
  AlertIcon,
  BookIcon,
  CalendarIcon,
  CheckCircleIcon,
  ChecklistIcon,
  HashIcon,
  InboxIcon,
  MoonIcon,
  PlusIcon,
  StarIcon,
  SunIcon,
} from './Icons'

interface LinkDef {
  to: string
  label: string
  icon: ReactNode
  count?: number
  alert?: boolean
  active: boolean
}

export default function Sidebar() {
  const { entries, todos } = useData()
  const { theme, toggle } = useTheme()
  const createEntry = useCreateEntry()
  const navigate = useNavigate()
  const { pathname, search } = useLocation()
  const params = new URLSearchParams(search)

  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const onDown = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  const today = todayKey()
  const active = todos.filter((t) => !t.done)
  const tags = useMemo(() => allTags(entries), [entries])

  const inJournal = pathname.startsWith('/journal')
  const inTodos = pathname.startsWith('/todos')
  const todoView = inTodos ? pathname.split('/')[2] || 'all' : null
  const fav = params.get('fav') === '1'
  const tag = params.get('tag')

  const journalLinks: LinkDef[] = [
    { to: '/journal', label: 'All entries', icon: <BookIcon />, count: entries.length, active: inJournal && !fav && !tag },
    {
      to: '/journal?fav=1',
      label: 'Favourites',
      icon: <StarIcon />,
      count: entries.filter((e) => e.favorite).length,
      active: inJournal && fav,
    },
  ]

  const overdue = active.filter((t) => t.due && t.due < today).length
  const taskLinks: LinkDef[] = [
    { to: '/todos', label: 'All tasks', icon: <InboxIcon />, count: active.length, active: todoView === 'all' },
    {
      to: '/todos/today',
      label: 'Today',
      icon: <SunIcon />,
      count: active.filter((t) => t.due === today).length,
      active: todoView === 'today',
    },
    {
      to: '/todos/upcoming',
      label: 'Upcoming',
      icon: <CalendarIcon />,
      count: active.filter((t) => t.due && t.due > today).length,
      active: todoView === 'upcoming',
    },
    { to: '/todos/overdue', label: 'Overdue', icon: <AlertIcon />, count: overdue, alert: overdue > 0, active: todoView === 'overdue' },
    {
      to: '/todos/completed',
      label: 'Completed',
      icon: <CheckCircleIcon />,
      count: todos.length - active.length,
      active: todoView === 'completed',
    },
  ]

  const tagLinks: LinkDef[] = tags.map((t) => ({
    to: `/journal?tag=${encodeURIComponent(t)}`,
    label: t,
    icon: <HashIcon />,
    active: inJournal && tag === t,
  }))

  return (
    <aside className="sidebar" aria-label="Sidebar">
      <div className="sidebar-brand">
        <span className="brand-mark" aria-hidden="true" />
        <span className="brand-name">Daybook</span>
      </div>

      <div className="new-menu" ref={menuRef}>
        <button
          className="btn primary new-btn"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((o) => !o)}
        >
          <PlusIcon size={18} /> New
        </button>
        {menuOpen && (
          <div className="menu" role="menu">
            <button
              role="menuitem"
              className="menu-item"
              onClick={() => {
                setMenuOpen(false)
                createEntry()
              }}
            >
              <BookIcon size={16} /> Journal entry
            </button>
            <button
              role="menuitem"
              className="menu-item"
              onClick={() => {
                setMenuOpen(false)
                navigate(`/todos?new=${Date.now()}`)
              }}
            >
              <ChecklistIcon size={16} /> Task
            </button>
          </div>
        )}
      </div>

      <nav className="sidebar-nav" aria-label="Main">
        <Section title="Journal" links={journalLinks} />
        <Section title="Tasks" links={taskLinks} />
        {tagLinks.length > 0 && <Section title="Tags" links={tagLinks} />}
      </nav>

      <div className="sidebar-footer">
        <button className="theme-switch" role="switch" aria-checked={theme === 'dark'} onClick={toggle}>
          {theme === 'dark' ? <MoonIcon size={16} /> : <SunIcon size={16} />}
          <span>Dark mode</span>
          <span className="switch" aria-hidden="true">
            <span className="switch-thumb" />
          </span>
        </button>
      </div>
    </aside>
  )
}

function Section({ title, links }: { title: string; links: LinkDef[] }) {
  return (
    <div className="sidebar-section">
      <h2 className="sidebar-heading">{title}</h2>
      {links.map((l) => (
        <Link key={l.to} to={l.to} className={l.active ? 'side-link active' : 'side-link'} aria-current={l.active ? 'page' : undefined}>
          <span className="side-icon">{l.icon}</span>
          <span className="side-label">{l.label}</span>
          {l.count !== undefined && l.count > 0 && (
            <span className={l.alert ? 'side-count alert' : 'side-count'}>{l.count}</span>
          )}
        </Link>
      ))}
    </div>
  )
}
