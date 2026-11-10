import type { Todo } from '../../types'
import { dueLabel, dueStatus, priorityInfo, priorityStyle } from '../../lib/todos'
import { relativeTime } from '../../lib/date'
import { CalendarIcon, CheckIcon, FlagIcon, NoteIcon, TrashIcon } from '../Icons'

interface Props {
  todo: Todo
  today: string
  selected: boolean
  onToggle: () => void
  onSelect: () => void
  onDelete: () => void
  onTagClick: (tag: string) => void
}

export default function TaskItem({ todo, today, selected, onToggle, onSelect, onDelete, onTagClick }: Props) {
  const status = todo.done ? null : dueStatus(todo.due, today)
  const priority = priorityInfo(todo.priority)

  return (
    <li
      className={['todo', todo.done && 'done', selected && 'selected'].filter(Boolean).join(' ')}
      data-priority={todo.done ? 0 : todo.priority}
      style={priorityStyle(todo.done ? 0 : todo.priority)}
    >
      <CheckButton todo={todo} onToggle={onToggle} />

      <div className="todo-main">
        <button className="todo-text" onClick={onSelect} title="Open task">
          {todo.text || 'Untitled task'}
        </button>
        <div className="todo-meta">
          {todo.done ? (
            todo.completedAt && <span className="meta-item">Completed {relativeTime(todo.completedAt)}</span>
          ) : (
            <>
              {todo.due && (
                <span className={`meta-item due-${status}`}>
                  <CalendarIcon size={13} />
                  {status === 'overdue' ? `Overdue · ${dueLabel(todo.due, today)}` : dueLabel(todo.due, today)}
                </span>
              )}
              {priority && (
                <span className="meta-item prio-label">
                  <FlagIcon size={13} /> {priority.label}
                </span>
              )}
            </>
          )}
          {todo.notes && (
            <span className="meta-item" title={todo.notes}>
              <NoteIcon size={13} /> Notes
            </span>
          )}
          {todo.tags.map((tag) => (
            <button key={tag} className="chip small tag-chip" onClick={() => onTagClick(tag)} title={`Show #${tag}`}>
              #{tag}
            </button>
          ))}
        </div>
      </div>

      <button className="icon-btn sm reveal danger" onClick={onDelete} aria-label="Delete task" title="Delete task">
        <TrashIcon size={16} />
      </button>
    </li>
  )
}

export function CheckButton({ todo, onToggle }: { todo: Todo; onToggle: () => void }) {
  return (
    <button
      className={todo.done ? 'check is-done' : 'check'}
      style={priorityStyle(todo.done ? 0 : todo.priority)}
      role="checkbox"
      aria-checked={todo.done}
      aria-label={todo.done ? `Mark "${todo.text}" as not done` : `Complete "${todo.text}"`}
      onClick={onToggle}
    >
      <CheckIcon size={13} strokeWidth={3} />
    </button>
  )
}
