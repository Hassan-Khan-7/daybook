import type { JournalEntry } from '../../types'
import { moodInfo, moodStyle } from '../../lib/journal'
import { shortDate } from '../../lib/date'
import { StarIcon } from '../Icons'

interface Props {
  entry: JournalEntry
  selected: boolean
  onSelect: () => void
}

export default function EntryListItem({ entry, selected, onSelect }: Props) {
  const mood = moodInfo(entry.mood)
  const title = entry.title.trim() || (mood && !entry.body.trim() ? `Feeling ${mood.label.toLowerCase()}` : 'Untitled')
  const snippet = entry.body.trim().replace(/\s+/g, ' ') || entry.gratitude.trim()

  return (
    <button
      className={selected ? 'note-item selected' : 'note-item'}
      onClick={onSelect}
      aria-current={selected ? 'true' : undefined}
    >
      <span className="note-item-top">
        <span className="note-title">{title}</span>
        {entry.favorite && <StarIcon size={13} filled className="note-fav" />}
      </span>
      <span className="note-snippet">{snippet || 'No additional text'}</span>
      <span className="note-meta">
        <span>{shortDate(entry.date)}</span>
        {mood && (
          <span className="mood-pill" style={moodStyle(entry.mood)}>
            <span aria-hidden="true">{mood.emoji}</span> {mood.label}
          </span>
        )}
        {entry.tags.slice(0, 2).map((t) => (
          <span key={t} className="note-tag">
            #{t}
          </span>
        ))}
      </span>
    </button>
  )
}
