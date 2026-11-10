import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useCreateEntry, useData } from '../store/DataContext'
import { useToast } from '../components/Toast'
import type { JournalEntry, MoodLevel } from '../types'
import { MOODS, allTags, isEntryEmpty, sortEntries } from '../lib/journal'
import { monthLabel } from '../lib/date'
import EntryEditor from '../components/journal/EntryEditor'
import EntryListItem from '../components/journal/EntryListItem'
import JournalOverview from '../components/journal/JournalOverview'
import { PlusIcon, SearchIcon, StarIcon, XIcon } from '../components/Icons'

export default function JournalPage() {
  const { entries, setEntries } = useData()
  const { entryId } = useParams()
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const showToast = useToast()
  const createEntry = useCreateEntry()

  const favoritesOnly = params.get('fav') === '1'
  const tagFilter = params.get('tag')
  const [query, setQuery] = useState('')
  const [moodFilter, setMoodFilter] = useState<MoodLevel | null>(null)

  const selected = entries.find((e) => e.id === entryId) ?? null
  const search = params.toString() ? `?${params}` : ''
  const open = (id?: string) => navigate({ pathname: id ? `/journal/${id}` : '/journal', search })

  // Unknown entry id (e.g. deleted) → back to the list.
  useEffect(() => {
    if (entryId && !selected) navigate({ pathname: '/journal', search }, { replace: true })
  }, [entryId, selected, navigate, search])

  // New entries are created blank; drop any that were left empty once the user moves on.
  useEffect(() => {
    if (entries.some((e) => e.id !== entryId && isEntryEmpty(e))) {
      setEntries((prev) => prev.filter((e) => e.id === entryId || !isEntryEmpty(e)))
    }
  }, [entryId]) // run when the open entry changes

  const tags = useMemo(() => allTags(entries), [entries])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return sortEntries(entries).filter(
      (e) =>
        (!moodFilter || e.mood === moodFilter) &&
        (!tagFilter || e.tags.includes(tagFilter)) &&
        (!favoritesOnly || e.favorite) &&
        (!q || [e.title, e.body, e.gratitude, ...e.tags, ...e.activities].join(' ').toLowerCase().includes(q)),
    )
  }, [entries, query, moodFilter, tagFilter, favoritesOnly])

  const groups = useMemo(() => {
    const out: { month: string; items: JournalEntry[] }[] = []
    for (const e of visible) {
      const month = monthLabel(e.date)
      const last = out[out.length - 1]
      if (last?.month === month) last.items.push(e)
      else out.push({ month, items: [e] })
    }
    return out
  }, [visible])

  function updateEntry(updated: JournalEntry) {
    setEntries((prev) => prev.map((e) => (e.id === updated.id ? updated : e)))
  }

  function deleteEntry(entry: JournalEntry) {
    setEntries((prev) => prev.filter((e) => e.id !== entry.id))
    open()
    if (!isEntryEmpty(entry)) {
      showToast({
        message: 'Entry deleted',
        action: { label: 'Undo', onClick: () => setEntries((prev) => [...prev, entry]) },
      })
    }
  }

  function removeParam(key: string) {
    const next = new URLSearchParams(params)
    next.delete(key)
    setParams(next)
  }

  const title = favoritesOnly ? 'Favourites' : tagFilter ? `#${tagFilter}` : 'Journal'
  const filtersActive = Boolean(query.trim() || moodFilter || tagFilter || favoritesOnly)

  return (
    <div className={selected ? 'split journal has-selection' : 'split journal'}>
      <section className="pane pane-list" aria-label="Entries">
        <header className="pane-header">
          <div className="pane-heading">
            <h1 className="pane-title">{title}</h1>
            <span className="pane-subtitle">
              {visible.length} {visible.length === 1 ? 'entry' : 'entries'}
            </span>
          </div>
          <button className="btn primary sm" onClick={() => createEntry()}>
            <PlusIcon size={16} /> New
          </button>
        </header>

        <div className="pane-tools">
          <label className="search-field">
            <SearchIcon size={16} />
            <input
              type="search"
              placeholder="Search entries"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search entries"
            />
          </label>
          <div className="mood-filter" role="group" aria-label="Filter by mood">
            {MOODS.map((m) => (
              <button
                key={m.level}
                className={moodFilter === m.level ? 'filter-btn on' : 'filter-btn'}
                aria-pressed={moodFilter === m.level}
                onClick={() => setMoodFilter(moodFilter === m.level ? null : m.level)}
                title={`Only “${m.label}” entries`}
              >
                {m.emoji}
              </button>
            ))}
          </div>
          {(favoritesOnly || tagFilter) && (
            <div className="filter-chips">
              {favoritesOnly && (
                <span className="chip small">
                  <StarIcon size={12} filled /> Favourites
                  <button onClick={() => removeParam('fav')} aria-label="Show all entries">
                    <XIcon size={12} />
                  </button>
                </span>
              )}
              {tagFilter && (
                <span className="chip small tag-chip">
                  #{tagFilter}
                  <button onClick={() => removeParam('tag')} aria-label="Remove tag filter">
                    <XIcon size={12} />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>

        <div className="note-list">
          {visible.length === 0 ? (
            <div className="empty-state compact">
              <span className="empty-emoji" aria-hidden="true">
                {filtersActive ? '🔍' : '📖'}
              </span>
              <h2>{filtersActive ? 'No matching entries' : 'No entries yet'}</h2>
              <p>{filtersActive ? 'Try a different search or filter.' : 'Create your first entry to get started.'}</p>
            </div>
          ) : (
            groups.map((g) => (
              <div key={g.month} className="note-group">
                <h2 className="note-group-label">{g.month}</h2>
                {g.items.map((e) => (
                  <EntryListItem key={e.id} entry={e} selected={e.id === entryId} onSelect={() => open(e.id)} />
                ))}
              </div>
            ))
          )}
        </div>
      </section>

      <section className="pane pane-detail" aria-label={selected ? 'Entry editor' : 'Overview'}>
        {selected ? (
          <EntryEditor
            key={selected.id}
            entry={selected}
            onChange={updateEntry}
            onDelete={() => deleteEntry(selected)}
            onBack={() => open()}
            tagSuggestions={tags}
          />
        ) : (
          <JournalOverview entries={entries} onCheckIn={(mood) => createEntry({ mood })} onNew={() => createEntry()} />
        )}
      </section>
    </div>
  )
}
