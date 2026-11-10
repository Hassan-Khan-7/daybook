import type { Todo } from '../../types'
import { relativeTime } from '../../lib/date'
import { ArrowLeftIcon, TrashIcon, XIcon } from '../Icons'
import TagInput from '../TagInput'
import DuePicker from './DuePicker'
import PriorityPicker from './PriorityPicker'
import { CheckButton } from './TaskItem'

interface Props {
  todo: Todo
  tagSuggestions: string[]
  onChange: (todo: Todo) => void
  onToggle: () => void
  onDelete: () => void
  onClose: () => void
}

/** Side panel for a single task; edits are saved as you type. */
export default function TaskDetail({ todo, tagSuggestions, onChange, onToggle, onDelete, onClose }: Props) {
  const set = <K extends keyof Todo>(key: K, value: Todo[K]) => onChange({ ...todo, [key]: value })

  return (
    <article className="task-detail">
      <div className="editor-toolbar">
        <button className="icon-btn mobile-only" onClick={onClose} aria-label="Back to tasks">
          <ArrowLeftIcon size={18} />
        </button>
        <span className="editor-status">{todo.done ? 'Completed' : 'Task'}</span>
        <span className="spacer" />
        <button className="icon-btn danger" onClick={onDelete} aria-label="Delete task" title="Delete task">
          <TrashIcon size={18} />
        </button>
        <button className="icon-btn desktop-only" onClick={onClose} aria-label="Close" title="Close">
          <XIcon size={18} />
        </button>
      </div>

      <div className="task-detail-body">
        <div className="task-title-row">
          <CheckButton todo={todo} onToggle={onToggle} />
          <textarea
            className={todo.done ? 'task-title done' : 'task-title'}
            rows={1}
            value={todo.text}
            placeholder="Task name"
            onChange={(e) => set('text', e.target.value.replace(/\n/g, ' '))}
            aria-label="Task name"
          />
        </div>

        <div className="field">
          <span className="field-label">Due date</span>
          <DuePicker value={todo.due} onChange={(due) => set('due', due)} />
        </div>
        <div className="field">
          <span className="field-label">Priority</span>
          <PriorityPicker value={todo.priority} onChange={(p) => set('priority', p)} />
        </div>
        <div className="field">
          <span className="field-label">Tags</span>
          <TagInput value={todo.tags} onChange={(tags) => set('tags', tags)} suggestions={tagSuggestions} />
        </div>
        <div className="field">
          <span className="field-label">Notes</span>
          <textarea
            className="task-notes"
            rows={5}
            placeholder="Add details, links or sub-steps…"
            value={todo.notes}
            onChange={(e) => set('notes', e.target.value)}
            aria-label="Notes"
          />
        </div>

        <p className="detail-meta">
          Created {relativeTime(todo.createdAt)}
          {todo.completedAt && ` · Completed ${relativeTime(todo.completedAt)}`}
        </p>
      </div>
    </article>
  )
}
