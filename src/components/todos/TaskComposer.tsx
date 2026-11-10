import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { Priority, Todo } from '../../types'
import { PlusIcon } from '../Icons'
import TagInput from '../TagInput'
import DuePicker from './DuePicker'
import PriorityPicker from './PriorityPicker'

type NewTask = Pick<Todo, 'text' | 'priority' | 'due' | 'tags'>

interface Props {
  onAdd: (task: NewTask) => void
  tagSuggestions: string[]
  /** Pre-selected due date, e.g. today when adding from the Today view. */
  defaultDue?: string | null
  /** Changing this value focuses the input (used by the sidebar's "New → Task"). */
  focusToken?: string | null
}

export default function TaskComposer({ onAdd, tagSuggestions, defaultDue = null, focusToken }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (focusToken) inputRef.current?.focus()
  }, [focusToken])

  const [text, setText] = useState('')
  const [priority, setPriority] = useState<Priority>(0)
  const [due, setDue] = useState<string | null>(defaultDue)
  const [tags, setTags] = useState<string[]>([])
  const [focused, setFocused] = useState(false)

  const showOptions = focused || text.trim() !== '' || priority !== 0 || due !== defaultDue || tags.length > 0

  function submit(e: FormEvent) {
    e.preventDefault()
    if (!text.trim()) return
    onAdd({ text, priority, due, tags })
    setText('')
    setPriority(0)
    setDue(defaultDue)
    setTags([])
  }

  return (
    <form
      className="card task-composer"
      onSubmit={submit}
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false)
      }}
    >
      <div className="task-composer-main">
        <PlusIcon size={18} className="task-composer-icon" />
        <input
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setText('')
              e.currentTarget.blur()
            }
          }}
          placeholder="Add a task…"
          aria-label="New task"
        />
        <button type="submit" className="btn primary" disabled={!text.trim()}>
          Add
        </button>
      </div>
      {showOptions && (
        <div className="task-composer-options">
          <DuePicker value={due} onChange={setDue} />
          <PriorityPicker value={priority} onChange={setPriority} />
          <TagInput value={tags} onChange={setTags} suggestions={tagSuggestions} placeholder="+ tag" />
        </div>
      )}
    </form>
  )
}
