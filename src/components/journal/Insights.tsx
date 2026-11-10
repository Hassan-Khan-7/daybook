import type { CSSProperties } from 'react'
import type { MoodLevel } from '../../types'
import { computeStats, moodInfo, moodStyle } from '../../lib/journal'
import { dayLabel } from '../../lib/date'

type Stats = ReturnType<typeof computeStats>

export default function Insights({ stats }: { stats: Stats }) {
  const avgMood = stats.avgMood7 === null ? null : moodInfo(Math.round(stats.avgMood7) as MoodLevel)

  return (
    <section className="stats" aria-label="Journal insights">
      <div className="stat card">
        <span className="stat-label">Entries</span>
        <span className="stat-value">{stats.total}</span>
      </div>
      <div className="stat card">
        <span className="stat-label">Day streak</span>
        <span className="stat-value">
          {stats.streak}
          {stats.streak > 0 && <span className="stat-emoji"> 🔥</span>}
        </span>
      </div>
      <div className="stat card">
        <span className="stat-label">Avg mood · 7d</span>
        <span className="stat-value">
          {avgMood ? (
            <>
              <span className="stat-emoji">{avgMood.emoji}</span> {stats.avgMood7!.toFixed(1)}
            </>
          ) : (
            '—'
          )}
        </span>
      </div>
      <div className="stat card mood-chart-card">
        <span className="stat-label">Mood · last 14 days</span>
        <div className="mood-chart" role="img" aria-label="Mood over the last 14 days">
          {stats.last14.map((d) => (
            <span
              key={d.date}
              className={d.mood ? 'mood-bar' : d.count ? 'mood-bar logged' : 'mood-bar empty'}
              style={{ ...moodStyle(d.mood), '--h': d.mood ? d.mood / 5 : 0.12 } as CSSProperties}
              title={`${dayLabel(d.date)}: ${d.mood ? moodInfo(d.mood)!.label : d.count ? 'no mood logged' : 'no entry'}`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
