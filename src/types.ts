export type MoodLevel = 1 | 2 | 3 | 4 | 5
export type EnergyLevel = 1 | 2 | 3 | 4 | 5

export interface JournalEntry {
  id: string
  /** Day the entry is about, as a local YYYY-MM-DD key. */
  date: string
  title: string
  body: string
  mood: MoodLevel | null
  energy: EnergyLevel | null
  /** Activity ids, see ACTIVITIES in lib/journal.ts */
  activities: string[]
  tags: string[]
  gratitude: string
  favorite: boolean
  createdAt: string
  updatedAt?: string
}

/** The editable part of an entry, used by the composer (and autosaved as a draft). */
export type JournalDraft = Pick<
  JournalEntry,
  'date' | 'title' | 'body' | 'mood' | 'energy' | 'activities' | 'tags' | 'gratitude'
>

/** 0 = none, 1 = low, 2 = medium, 3 = high */
export type Priority = 0 | 1 | 2 | 3

export interface Todo {
  id: string
  text: string
  notes: string
  done: boolean
  priority: Priority
  /** Local YYYY-MM-DD key, or null for no due date. */
  due: string | null
  tags: string[]
  createdAt: string
  completedAt: string | null
}
