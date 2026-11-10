import { addDays, todayKey } from '../../lib/date'
import { dueLabel, nextMonday } from '../../lib/todos'
import { CalendarIcon, XIcon } from '../Icons'

interface Props {
  value: string | null
  onChange: (due: string | null) => void
}

export default function DuePicker({ value, onChange }: Props) {
  const today = todayKey()
  const quick = [
    { label: 'Today', date: today },
    { label: 'Tomorrow', date: addDays(today, 1) },
    { label: 'Next week', date: nextMonday(today) },
  ]
  const isCustom = value !== null && !quick.some((q) => q.date === value)

  return (
    <div className="option-group" role="group" aria-label="Due date">
      {quick.map((q) => (
        <button
          key={q.label}
          type="button"
          aria-pressed={value === q.date}
          className={value === q.date ? 'chip xs toggle on' : 'chip xs toggle'}
          onClick={() => onChange(value === q.date ? null : q.date)}
        >
          {q.label}
        </button>
      ))}
      <label className={isCustom ? 'chip xs toggle on date-chip' : 'chip xs toggle date-chip'} title="Pick a date">
        <CalendarIcon size={13} />
        <span>{isCustom ? dueLabel(value, today) : 'Pick date'}</span>
        <input
          type="date"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value || null)}
          onClick={(e) => e.currentTarget.showPicker?.()}
          aria-label="Due date"
        />
      </label>
      {value && (
        <button type="button" className="icon-btn xs" onClick={() => onChange(null)} aria-label="Clear due date">
          <XIcon size={14} />
        </button>
      )}
    </div>
  )
}
