import { useId, useState } from 'react'
import { XIcon } from './Icons'

interface Props {
  value: string[]
  onChange: (tags: string[]) => void
  suggestions: string[]
  placeholder?: string
}

const toTag = (raw: string) => raw.trim().replace(/^#+/, '').toLowerCase().replace(/\s+/g, '-')

export default function TagInput({ value, onChange, suggestions, placeholder }: Props) {
  const [text, setText] = useState('')
  const listId = useId()

  function commit() {
    const tag = toTag(text)
    if (tag && !value.includes(tag)) onChange([...value, tag])
    setText('')
  }

  return (
    <div className="tag-input">
      {value.map((tag) => (
        <span key={tag} className="chip tag-chip">
          #{tag}
          <button type="button" onClick={() => onChange(value.filter((t) => t !== tag))} aria-label={`Remove tag ${tag}`}>
            <XIcon size={12} />
          </button>
        </span>
      ))}
      <input
        list={listId}
        value={text}
        placeholder={placeholder ?? (value.length ? 'Add another…' : 'Add tags, e.g. travel')}
        aria-label="Add tag"
        onChange={(e) => setText(e.target.value.replace(',', ''))}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault()
            commit()
          } else if (e.key === 'Backspace' && !text && value.length) {
            onChange(value.slice(0, -1))
          }
        }}
      />
      <datalist id={listId}>
        {suggestions
          .filter((s) => !value.includes(s))
          .map((s) => (
            <option key={s} value={s} />
          ))}
      </datalist>
    </div>
  )
}
