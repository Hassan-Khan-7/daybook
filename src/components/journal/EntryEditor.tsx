import { useState } from 'react'
import type { JournalEntry } from '../../types'
import { ACTIVITIES, ENERGY, PROMPTS, countWords, isEntryEmpty } from '../../lib/journal'
import { fullDate, relativeTime, todayKey } from '../../lib/date'
import { ArrowLeftIcon, CalendarIcon, StarIcon, TrashIcon } from '../Icons'
import TagInput from '../TagInput'
import MoodPicker from './MoodPicker'

interface Props {
  entry: JournalEntry
  onChange: (entry: JournalEntry) => void
  onDelete: () => void
  onBack: () => void
  tagSuggestions: string[]
}

/** Full-page editor; every change is saved immediately. */
export default function EntryEditor({ entry, onChange, onDelete, onBack, tagSuggestions }: Props) {
  const [prompt] = useState(() => PROMPTS[Math.floor(Math.random() * PROMPTS.length)])
  const [isNew] = useState(() => isEntryEmpty(entry))

  const update = (patch: Partial<JournalEntry>) =>
    onChange({ ...entry, ...patch, updatedAt: new Date().toISOString() })

  const words = countWords(entry.body)

  return (
    <article className="editor">
      <div className="editor-toolbar">
        <button className="icon-btn mobile-only" onClick={onBack} aria-label="Back to entries">
          <ArrowLeftIcon size={18} />
        </button>
        <label className="date-pill" title="Change date">
          <CalendarIcon size={14} />
          <span>{fullDate(entry.date)}</span>
          <input
            type="date"
            value={entry.date}
            max={todayKey()}
            onChange={(e) => e.target.value && update({ date: e.target.value })}
            onClick={(e) => e.currentTarget.showPicker?.()}
            aria-label="Entry date"
          />
        </label>
        <span className="spacer" />
        <span className="editor-status">{isEntryEmpty(entry) ? 'Draft' : 'Saved'}</span>
        <button
          className={entry.favorite ? 'icon-btn fav on' : 'icon-btn fav'}
          onClick={() => onChange({ ...entry, favorite: !entry.favorite })}
          aria-pressed={entry.favorite}
          aria-label={entry.favorite ? 'Remove from favourites' : 'Add to favourites'}
          title={entry.favorite ? 'Remove from favourites' : 'Add to favourites'}
        >
          <StarIcon size={18} filled={entry.favorite} />
        </button>
        <button className="icon-btn danger" onClick={onDelete} aria-label="Delete entry" title="Delete entry">
          <TrashIcon size={18} />
        </button>
      </div>

      <div className="editor-body">
        <input
          className="editor-title"
          placeholder="Untitled"
          value={entry.title}
          onChange={(e) => update({ title: e.target.value })}
          aria-label="Title"
          autoFocus={isNew}
        />

        <div className="editor-meta">
          <div className="meta-row">
            <span className="meta-label">Mood</span>
            <MoodPicker value={entry.mood} onChange={(mood) => update({ mood })} />
          </div>
          <div className="meta-row">
            <span className="meta-label">Energy</span>
            <div className="segmented" role="radiogroup" aria-label="Energy">
              {ENERGY.map((e) => (
                <button
                  key={e.level}
                  type="button"
                  role="radio"
                  aria-checked={entry.energy === e.level}
                  className={entry.energy === e.level ? 'segment selected' : 'segment'}
                  onClick={() => update({ energy: entry.energy === e.level ? null : e.level })}
                >
                  {e.label}
                </button>
              ))}
            </div>
          </div>
          <div className="meta-row">
            <span className="meta-label">Tags</span>
            <TagInput value={entry.tags} onChange={(tags) => update({ tags })} suggestions={tagSuggestions} />
          </div>
        </div>

        <textarea
          className="editor-text"
          placeholder={prompt}
          value={entry.body}
          onChange={(e) => update({ body: e.target.value })}
          aria-label="Entry text"
        />

        <section className="editor-extras">
          <div className="field">
            <span className="field-label">Activities</span>
            <div className="chip-group">
              {ACTIVITIES.map((a) => {
                const on = entry.activities.includes(a.id)
                return (
                  <button
                    key={a.id}
                    type="button"
                    aria-pressed={on}
                    className={on ? 'chip toggle on' : 'chip toggle'}
                    onClick={() =>
                      update({
                        activities: on ? entry.activities.filter((x) => x !== a.id) : [...entry.activities, a.id],
                      })
                    }
                  >
                    <span aria-hidden="true">{a.emoji}</span> {a.label}
                  </button>
                )
              })}
            </div>
          </div>
          <div className="field">
            <span className="field-label">Grateful for</span>
            <input
              placeholder="One thing you're grateful for today"
              value={entry.gratitude}
              onChange={(e) => update({ gratitude: e.target.value })}
            />
          </div>
        </section>

        <footer className="editor-footer">
          {words} {words === 1 ? 'word' : 'words'} · Created {relativeTime(entry.createdAt)}
          {entry.updatedAt && ` · Edited ${relativeTime(entry.updatedAt)}`}
        </footer>
      </div>
    </article>
  )
}
