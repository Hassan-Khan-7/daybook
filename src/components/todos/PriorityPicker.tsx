import type { Priority } from '../../types'
import { PRIORITIES, priorityStyle } from '../../lib/todos'
import { FlagIcon } from '../Icons'

interface Props {
  value: Priority
  onChange: (p: Priority) => void
}

export default function PriorityPicker({ value, onChange }: Props) {
  return (
    <div className="option-group" role="radiogroup" aria-label="Priority">
      {PRIORITIES.map((p) => {
        const on = value === p.level
        return (
          <button
            key={p.level}
            type="button"
            role="radio"
            aria-checked={on}
            className={on ? 'chip xs toggle prio-chip on' : 'chip xs toggle prio-chip'}
            style={priorityStyle(p.level)}
            onClick={() => onChange(on ? 0 : p.level)}
          >
            <FlagIcon size={13} /> {p.label}
          </button>
        )
      })}
    </div>
  )
}
