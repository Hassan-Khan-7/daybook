import { useMemo } from 'react'
import type { JournalEntry, MoodLevel } from '../../types'
import { computeStats } from '../../lib/journal'
import { greeting, longDate } from '../../lib/date'
import { EditIcon } from '../Icons'
import Insights from './Insights'
import MoodPicker from './MoodPicker'

interface Props {
  entries: JournalEntry[]
  onCheckIn: (mood: MoodLevel) => void
  onNew: () => void
}

/** Shown in the editor pane when no entry is open. */
export default function JournalOverview({ entries, onCheckIn, onNew }: Props) {
  const stats = useMemo(() => computeStats(entries), [entries])

  return (
    <div className="overview">
      <header className="overview-header">
        <p className="eyebrow">{longDate()}</p>
        <h1 className="overview-title">{greeting()}</h1>
      </header>

      <section className="card checkin">
        <div>
          <h2 className="card-title">How are you feeling?</h2>
          <p className="card-subtitle">Tap a mood to log a quick check-in.</p>
        </div>
        <MoodPicker variant="cards" value={null} onChange={(m) => m && onCheckIn(m)} />
        <button className="btn secondary" onClick={onNew}>
          <EditIcon size={16} /> Write a full entry
        </button>
      </section>

      {entries.length > 0 && <Insights stats={stats} />}
    </div>
  )
}
