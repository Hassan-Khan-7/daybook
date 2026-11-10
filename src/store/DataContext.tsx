import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLocalStorage } from '../hooks/useLocalStorage'
import type { JournalDraft, JournalEntry, Todo } from '../types'
import { createEntry, emptyDraft, isDraftEmpty, normalizeDraft, normalizeEntry } from '../lib/journal'
import { normalizeTodo } from '../lib/todos'

type Updater<T> = (fn: (prev: T[]) => T[]) => void

interface Data {
  entries: JournalEntry[]
  setEntries: Updater<JournalEntry>
  todos: Todo[]
  setTodos: Updater<Todo>
}

const DataContext = createContext<Data | null>(null)

/** Single source of truth for journal entries and todos, shared by the sidebar and pages. */
export function DataProvider({ children }: { children: ReactNode }) {
  const [rawEntries, setRawEntries] = useLocalStorage<unknown[]>('journal.entries', [])
  const [rawTodos, setRawTodos] = useLocalStorage<unknown[]>('todos.items', [])

  const entries = useMemo(() => (Array.isArray(rawEntries) ? rawEntries.map(normalizeEntry) : []), [rawEntries])
  const todos = useMemo(() => (Array.isArray(rawTodos) ? rawTodos.map(normalizeTodo) : []), [rawTodos])

  const setEntries = useCallback<Updater<JournalEntry>>(
    (fn) => setRawEntries((prev) => fn(Array.isArray(prev) ? prev.map(normalizeEntry) : [])),
    [setRawEntries],
  )
  const setTodos = useCallback<Updater<Todo>>(
    (fn) => setRawTodos((prev) => fn(Array.isArray(prev) ? prev.map(normalizeTodo) : [])),
    [setRawTodos],
  )

  // The previous design kept an unsaved composer draft separately; turn it into a real entry.
  useEffect(() => {
    try {
      const raw = localStorage.getItem('journal.draft')
      if (raw === null) return
      const draft = normalizeDraft(JSON.parse(raw))
      if (!isDraftEmpty(draft)) setEntries((prev) => [createEntry(draft), ...prev])
      localStorage.removeItem('journal.draft')
    } catch {
      // ignore unreadable legacy drafts
    }
  }, [setEntries])

  const value = useMemo(() => ({ entries, setEntries, todos, setTodos }), [entries, setEntries, todos, setTodos])
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData(): Data {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used inside <DataProvider>')
  return ctx
}

/** Creates a journal entry (optionally pre-filled) and opens it in the editor. */
export function useCreateEntry() {
  const { setEntries } = useData()
  const navigate = useNavigate()
  return useCallback(
    (patch: Partial<JournalDraft> = {}) => {
      const entry = createEntry({ ...emptyDraft(), ...patch })
      setEntries((prev) => [entry, ...prev])
      navigate(`/journal/${entry.id}`)
    },
    [setEntries, navigate],
  )
}
