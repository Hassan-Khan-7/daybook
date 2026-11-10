import type { MoodLevel } from '../../types'
import { MOODS, moodStyle } from '../../lib/journal'

interface Props {
  value: MoodLevel | null
  onChange: (mood: MoodLevel | null) => void
  /** "pills" for inline metadata rows, "cards" for the large check-in picker. */
  variant?: 'pills' | 'cards'
}

export default function MoodPicker({ value, onChange, variant = 'pills' }: Props) {
  return (
    <div className={`mood-picker ${variant}`} role="radiogroup" aria-label="Mood">
      {MOODS.map((m) => {
        const selected = value === m.level
        return (
          <button
            key={m.level}
            type="button"
            role="radio"
            aria-checked={selected}
            className={selected ? 'mood-option selected' : 'mood-option'}
            style={moodStyle(m.level)}
            onClick={() => onChange(selected ? null : m.level)}
          >
            <span className="mood-emoji" aria-hidden="true">
              {m.emoji}
            </span>
            <span className="mood-label">{m.label}</span>
          </button>
        )
      })}
    </div>
  )
}
