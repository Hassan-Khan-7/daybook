import type { CSSProperties } from 'react'
import type { Priority, Todo } from '../types'
import { addDays, fromKey, isValidKey, todayKey } from './date'

export const PRIORITIES: { level: Exclude<Priority, 0>; label: string }[] = [
  { level: 3, label: 'High' },
  { level: 2, label: 'Medium' },
  { level: 1, label: 'Low' },
]

export const priorityInfo = (p: Priority) => PRIORITIES.find((x) => x.level === p) ?? null

/** Inline style exposing the priority colour as `--p` for CSS. */
export function priorityStyle(p: Priority): CSSProperties {
  return { '--p': p ? `var(--p${p})` : 'var(--border-strong)' } as CSSProperties
}

/** Coerce anything read from storage (including todos from older app versions) into a Todo. */
export function normalizeTodo(raw: unknown): Todo {
  const r = (raw ?? {}) as Record<string, unknown>
  const done = r.done === true
  const createdAt = typeof r.createdAt === 'string' ? r.createdAt : new Date().toISOString()
  return {
    id: typeof r.id === 'string' ? r.id : crypto.randomUUID(),
    text: typeof r.text === 'string' ? r.text : '',
    notes: typeof r.notes === 'string' ? r.notes : '',
    done,
    priority: r.priority === 1 || r.priority === 2 || r.priority === 3 ? r.priority : 0,
    due: isValidKey(r.due) ? r.due : null,
    tags: Array.isArray(r.tags) ? r.tags.filter((x): x is string => typeof x === 'string') : [],
    createdAt,
    completedAt: done ? (typeof r.completedAt === 'string' ? r.completedAt : createdAt) : null,
  }
}

export function newTodo(fields: Pick<Todo, 'text' | 'priority' | 'due' | 'tags'>): Todo {
  return {
    ...fields,
    text: fields.text.trim(),
    id: crypto.randomUUID(),
    notes: '',
    done: false,
    createdAt: new Date().toISOString(),
    completedAt: null,
  }
}

export type DueStatus = 'overdue' | 'today' | 'soon' | 'later'

export function dueStatus(due: string | null, today = todayKey()): DueStatus | null {
  if (!due) return null
  if (due < today) return 'overdue'
  if (due === today) return 'today'
  return due <= addDays(today, 7) ? 'soon' : 'later'
}

/** "Today", "Tomorrow", "Friday", or e.g. "Mon, 17 Nov". */
export function dueLabel(due: string, today = todayKey()): string {
  if (due === today) return 'Today'
  if (due === addDays(today, 1)) return 'Tomorrow'
  if (due === addDays(today, -1)) return 'Yesterday'
  const d = fromKey(due)
  if (due > today && due < addDays(today, 7)) return d.toLocaleDateString(undefined, { weekday: 'long' })
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: d.getFullYear() === new Date().getFullYear() ? undefined : 'numeric',
  })
}

export function nextMonday(today = todayKey()): string {
  const day = fromKey(today).getDay() // 0 = Sunday
  return addDays(today, (8 - day) % 7 || 7)
}

export type SortMode = 'smart' | 'priority' | 'newest' | 'alpha'

type Cmp = (a: Todo, b: Todo) => number
const dueKey = (t: Todo) => t.due ?? '9999-12-31'
const byDue: Cmp = (a, b) => dueKey(a).localeCompare(dueKey(b))
const byPriority: Cmp = (a, b) => b.priority - a.priority
const byCreated: Cmp = (a, b) => a.createdAt.localeCompare(b.createdAt)

const COMPARATORS: Record<SortMode, Cmp> = {
  smart: (a, b) => byDue(a, b) || byPriority(a, b) || byCreated(a, b),
  priority: (a, b) => byPriority(a, b) || byDue(a, b) || byCreated(a, b),
  newest: (a, b) => b.createdAt.localeCompare(a.createdAt),
  alpha: (a, b) => a.text.localeCompare(b.text, undefined, { sensitivity: 'base' }),
}

export const sortTodos = (list: Todo[], mode: SortMode) => [...list].sort(COMPARATORS[mode])

const BUCKETS = [
  { key: 'overdue', label: 'Overdue' },
  { key: 'today', label: 'Today' },
  { key: 'tomorrow', label: 'Tomorrow' },
  { key: 'week', label: 'Next 7 days' },
  { key: 'later', label: 'Later' },
  { key: 'none', label: 'No due date' },
]

function bucketKey(t: Todo, today: string): string {
  if (!t.due) return 'none'
  if (t.due < today) return 'overdue'
  if (t.due === today) return 'today'
  if (t.due === addDays(today, 1)) return 'tomorrow'
  return t.due <= addDays(today, 7) ? 'week' : 'later'
}

/** Groups (already sorted) tasks into due-date buckets, dropping empty ones. */
export function groupByDue(sorted: Todo[], today = todayKey()) {
  return BUCKETS.map((b) => ({ ...b, items: sorted.filter((t) => bucketKey(t, today) === b.key) })).filter(
    (g) => g.items.length > 0,
  )
}
