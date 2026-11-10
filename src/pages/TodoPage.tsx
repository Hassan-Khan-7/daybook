import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useData } from '../store/DataContext'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { useToast } from '../components/Toast'
import TaskComposer from '../components/todos/TaskComposer'
import TaskDetail from '../components/todos/TaskDetail'
import TaskItem from '../components/todos/TaskItem'
import { ChevronDownIcon, SearchIcon, XIcon } from '../components/Icons'
import type { Priority, Todo } from '../types'
import { PRIORITIES, groupByDue, newTodo, priorityStyle, sortTodos, type SortMode } from '../lib/todos'
import { dayLabel, toKey, todayKey } from '../lib/date'

const VIEWS = ['all', 'today', 'upcoming', 'overdue', 'completed'] as const
type View = (typeof VIEWS)[number]

const VIEW_LABEL: Record<View, string> = {
  all: 'All tasks',
  today: 'Today',
  upcoming: 'Upcoming',
  overdue: 'Overdue',
  completed: 'Completed',
}

const EMPTY: Record<View, { emoji: string; title: string; text: string }> = {
  all: { emoji: '✨', title: 'A clear list', text: 'Add your first task above.' },
  today: { emoji: '☀️', title: 'Nothing due today', text: 'Tasks you add here are due today.' },
  upcoming: { emoji: '🗓️', title: 'Nothing scheduled', text: 'Tasks with a future due date show up here.' },
  overdue: { emoji: '🎉', title: 'You’re all caught up', text: 'No overdue tasks.' },
  completed: { emoji: '✅', title: 'Nothing completed yet', text: 'Tick off a task and it lands here.' },
}

export default function TodoPage() {
  const { todos, setTodos } = useData()
  const showToast = useToast()
  const params = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const view: View = VIEWS.includes(params.view as View) ? (params.view as View) : 'all'

  const [sort, setSort] = useLocalStorage<SortMode>('todos.sort', 'smart')
  const [showCompleted, setShowCompleted] = useLocalStorage('todos.showCompleted', true)
  const [query, setQuery] = useState('')
  const [priorityFilter, setPriorityFilter] = useState<Priority | null>(null)
  const [tagFilter, setTagFilter] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // "New → Task" from the sidebar arrives as ?new=<timestamp>; focus the composer, then tidy the URL.
  const focusToken = searchParams.get('new')
  useEffect(() => {
    if (focusToken) {
      setSelectedId(null)
      setSearchParams({}, { replace: true })
    }
  }, [focusToken, setSearchParams])

  const today = todayKey()
  const active = todos.filter((t) => !t.done)
  const completed = todos.filter((t) => t.done)
  const tags = useMemo(() => [...new Set(todos.flatMap((t) => t.tags))].sort(), [todos])

  const counts: Record<View, number> = {
    all: active.length,
    today: active.filter((t) => t.due === today).length,
    upcoming: active.filter((t) => t.due && t.due > today).length,
    overdue: active.filter((t) => t.due && t.due < today).length,
    completed: completed.length,
  }

  const q = query.trim().toLowerCase()
  const filtersActive = Boolean(q || priorityFilter !== null || tagFilter)
  const matches = (t: Todo) =>
    (!q || [t.text, t.notes, ...t.tags].join(' ').toLowerCase().includes(q)) &&
    (priorityFilter === null || t.priority === priorityFilter) &&
    (!tagFilter || t.tags.includes(tagFilter))
  const inView = (t: Todo) =>
    view === 'today'
      ? t.due === today
      : view === 'upcoming'
        ? !!t.due && t.due > today
        : view === 'overdue'
          ? !!t.due && t.due < today
          : true

  const visibleActive = sortTodos(active.filter((t) => inView(t) && matches(t)), sort)
  const visibleCompleted = completed
    .filter(matches)
    .sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''))

  const activeGroups =
    sort === 'smart' && (view === 'all' || view === 'upcoming')
      ? groupByDue(visibleActive, today)
      : [{ key: 'flat', label: '', items: visibleActive }]

  const completedByDay: { date: string; items: Todo[] }[] = []
  for (const t of visibleCompleted) {
    const date = toKey(new Date(t.completedAt!))
    const last = completedByDay[completedByDay.length - 1]
    if (last?.date === date) last.items.push(t)
    else completedByDay.push({ date, items: [t] })
  }

  const selected = todos.find((t) => t.id === selectedId) ?? null

  // ── actions ──
  function addTask(fields: Pick<Todo, 'text' | 'priority' | 'due' | 'tags'>) {
    setTodos((prev) => [...prev, newTodo(fields)])
  }

  function setDone(id: string, done: boolean) {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done, completedAt: done ? new Date().toISOString() : null } : t)),
    )
  }

  function toggle(todo: Todo) {
    setDone(todo.id, !todo.done)
    if (!todo.done) {
      showToast({ message: 'Task completed', action: { label: 'Undo', onClick: () => setDone(todo.id, false) } })
    }
  }

  function update(todo: Todo) {
    setTodos((prev) => prev.map((t) => (t.id === todo.id ? todo : t)))
  }

  function closeDetail() {
    if (selected && !selected.text.trim()) update({ ...selected, text: 'Untitled task' })
    setSelectedId(null)
  }

  function remove(todo: Todo) {
    const index = todos.findIndex((t) => t.id === todo.id)
    setTodos((prev) => prev.filter((t) => t.id !== todo.id))
    if (selectedId === todo.id) setSelectedId(null)
    const restore = () =>
      setTodos((prev) => {
        const next = [...prev]
        next.splice(Math.min(index, next.length), 0, todo)
        return next
      })
    showToast({ message: 'Task deleted', action: { label: 'Undo', onClick: restore } })
  }

  function clearCompleted() {
    const removed = completed
    setTodos((prev) => prev.filter((t) => !t.done))
    if (selected?.done) setSelectedId(null)
    showToast({
      message: `Cleared ${removed.length} completed`,
      action: { label: 'Undo', onClick: () => setTodos((prev) => [...prev, ...removed]) },
    })
  }

  function clearFilters() {
    setQuery('')
    setPriorityFilter(null)
    setTagFilter(null)
  }

  const renderList = (items: Todo[], className = 'todo-list') => (
    <ul className={className}>
      {items.map((t) => (
        <TaskItem
          key={t.id}
          todo={t}
          today={today}
          selected={t.id === selectedId}
          onToggle={() => toggle(t)}
          onSelect={() => setSelectedId(t.id)}
          onDelete={() => remove(t)}
          onTagClick={setTagFilter}
        />
      ))}
    </ul>
  )

  const emptyState = filtersActive
    ? { emoji: '🔍', title: 'No matching tasks', text: 'Try a different search or filter.' }
    : view === 'all' && todos.length > 0
      ? { emoji: '🎉', title: 'All done', text: 'Every task is complete.' }
      : EMPTY[view]

  const shownCount = view === 'completed' ? visibleCompleted.length : visibleActive.length
  const pct = todos.length ? (completed.length / todos.length) * 100 : 0

  return (
    <div className={selected ? 'split tasks has-selection' : 'split tasks'}>
      <section className="pane pane-list" aria-label="Tasks">
        <header className="pane-header">
          <div className="pane-heading">
            <h1 className="pane-title">{VIEW_LABEL[view]}</h1>
            <span className="pane-subtitle">
              {view === 'completed'
                ? `${counts.completed} completed`
                : `${counts[view]} ${counts[view] === 1 ? 'task' : 'tasks'}`}
            </span>
          </div>
          {todos.length > 0 && (
            <div className="progress-summary" title={`${completed.length} of ${todos.length} tasks done`}>
              <span>
                {completed.length}/{todos.length} done
              </span>
              <div
                className="progress"
                role="progressbar"
                aria-valuenow={completed.length}
                aria-valuemin={0}
                aria-valuemax={todos.length}
                aria-label="Tasks completed"
              >
                <div className="progress-fill" style={{ width: `${pct}%` }} />
              </div>
            </div>
          )}
        </header>

        <div className="pane-content">
          <nav className="view-tabs" aria-label="Task views">
            {VIEWS.map((v) => (
              <Link
                key={v}
                to={v === 'all' ? '/todos' : `/todos/${v}`}
                className={['view-tab', view === v && 'active', v === 'overdue' && counts.overdue > 0 && 'alert']
                  .filter(Boolean)
                  .join(' ')}
                aria-current={view === v ? 'page' : undefined}
              >
                {v === 'all' ? 'All' : VIEW_LABEL[v]}
                <span className="count">{counts[v]}</span>
              </Link>
            ))}
          </nav>

          {view !== 'completed' && (
            <TaskComposer
              key={view}
              onAdd={addTask}
              tagSuggestions={tags}
              defaultDue={view === 'today' ? today : null}
              focusToken={focusToken}
            />
          )}

          {todos.length > 0 && (
            <div className="toolbar">
              <label className="search-field">
                <SearchIcon size={16} />
                <input
                  type="search"
                  placeholder="Search tasks"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  aria-label="Search tasks"
                />
              </label>
              <div className="segmented compact" role="group" aria-label="Filter by priority">
                <button
                  className={priorityFilter === null ? 'segment selected' : 'segment'}
                  aria-pressed={priorityFilter === null}
                  onClick={() => setPriorityFilter(null)}
                >
                  Any
                </button>
                {PRIORITIES.map((p) => (
                  <button
                    key={p.level}
                    className={priorityFilter === p.level ? 'segment selected' : 'segment'}
                    aria-pressed={priorityFilter === p.level}
                    style={priorityStyle(p.level)}
                    onClick={() => setPriorityFilter(priorityFilter === p.level ? null : p.level)}
                  >
                    <span className="prio-dot" aria-hidden="true" />
                    {p.label}
                  </button>
                ))}
              </div>
              {tags.length > 0 && (
                <select
                  className="select"
                  value={tagFilter ?? ''}
                  onChange={(e) => setTagFilter(e.target.value || null)}
                  aria-label="Filter by tag"
                >
                  <option value="">All tags</option>
                  {tags.map((t) => (
                    <option key={t} value={t}>
                      #{t}
                    </option>
                  ))}
                </select>
              )}
              {view !== 'completed' && (
                <select
                  className="select"
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortMode)}
                  aria-label="Sort tasks"
                >
                  <option value="smart">Sort: Due date</option>
                  <option value="priority">Sort: Priority</option>
                  <option value="newest">Sort: Newest</option>
                  <option value="alpha">Sort: A–Z</option>
                </select>
              )}
            </div>
          )}

          {filtersActive && (
            <div className="filter-summary">
              <span>
                {shownCount} {shownCount === 1 ? 'task matches' : 'tasks match'}
              </span>
              {tagFilter && (
                <span className="chip small tag-chip">
                  #{tagFilter}
                  <button onClick={() => setTagFilter(null)} aria-label="Remove tag filter">
                    <XIcon size={12} />
                  </button>
                </span>
              )}
              <button className="link-btn" onClick={clearFilters}>
                Clear filters
              </button>
            </div>
          )}

          {view === 'completed' ? (
            visibleCompleted.length === 0 ? (
              <EmptyState {...emptyState} />
            ) : (
              completedByDay.map((g, i) => (
                <section key={g.date} className="task-group">
                  <div className="group-header">
                    <h2 className="group-label">
                      {dayLabel(g.date)} <span className="count">{g.items.length}</span>
                    </h2>
                    {i === 0 && (
                      <button className="link-btn" onClick={clearCompleted}>
                        Clear all
                      </button>
                    )}
                  </div>
                  {renderList(g.items, 'todo-list completed-list')}
                </section>
              ))
            )
          ) : (
            <>
              {visibleActive.length === 0 ? (
                <EmptyState {...emptyState} />
              ) : (
                activeGroups.map((g) => (
                  <section key={g.key} className="task-group">
                    {g.label && (
                      <h2 className={`group-label ${g.key}`}>
                        {g.label} <span className="count">{g.items.length}</span>
                      </h2>
                    )}
                    {renderList(g.items)}
                  </section>
                ))
              )}

              {view === 'all' && visibleCompleted.length > 0 && (
                <section className="completed-section">
                  <div className="group-header">
                    <button
                      className="completed-toggle"
                      aria-expanded={showCompleted}
                      onClick={() => setShowCompleted((s) => !s)}
                    >
                      <ChevronDownIcon size={16} className="chevron" />
                      Completed <span className="count">{visibleCompleted.length}</span>
                    </button>
                    <button className="link-btn" onClick={clearCompleted}>
                      Clear completed
                    </button>
                  </div>
                  {showCompleted && renderList(visibleCompleted, 'todo-list completed-list')}
                </section>
              )}
            </>
          )}
        </div>
      </section>

      {selected && (
        <section className="pane pane-detail" aria-label="Task details">
          <TaskDetail
            key={selected.id}
            todo={selected}
            tagSuggestions={tags}
            onChange={update}
            onToggle={() => toggle(selected)}
            onDelete={() => remove(selected)}
            onClose={closeDetail}
          />
        </section>
      )}
    </div>
  )
}

function EmptyState({ emoji, title, text }: { emoji: string; title: string; text: string }) {
  return (
    <div className="empty-state">
      <span className="empty-emoji" aria-hidden="true">
        {emoji}
      </span>
      <h2>{title}</h2>
      <p>{text}</p>
    </div>
  )
}
