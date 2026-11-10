import type { CSSProperties } from 'react'
import type { EnergyLevel, JournalDraft, JournalEntry, MoodLevel } from '../types'
import { addDays, isValidKey, toKey, todayKey } from './date'

export const MOODS: { level: MoodLevel; label: string; emoji: string }[] = [
  { level: 1, label: 'Awful', emoji: '😞' },
  { level: 2, label: 'Low', emoji: '😕' },
  { level: 3, label: 'Okay', emoji: '😐' },
  { level: 4, label: 'Good', emoji: '🙂' },
  { level: 5, label: 'Great', emoji: '😄' },
]

export const ENERGY: { level: EnergyLevel; label: string }[] = [
  { level: 1, label: 'Drained' },
  { level: 2, label: 'Tired' },
  { level: 3, label: 'Steady' },
  { level: 4, label: 'Energized' },
  { level: 5, label: 'Buzzing' },
]

export const ACTIVITIES = [
  { id: 'work', label: 'Work', emoji: '💼' },
  { id: 'exercise', label: 'Exercise', emoji: '🏃' },
  { id: 'family', label: 'Family', emoji: '🏡' },
  { id: 'friends', label: 'Friends', emoji: '👋' },
  { id: 'outdoors', label: 'Outdoors', emoji: '🌳' },
  { id: 'reading', label: 'Reading', emoji: '📚' },
  { id: 'creative', label: 'Creative', emoji: '🎨' },
  { id: 'learning', label: 'Learning', emoji: '🧠' },
  { id: 'self-care', label: 'Self-care', emoji: '🧘' },
  { id: 'rest', label: 'Rest', emoji: '😴' },
]

export const PROMPTS = [
  'What’s on your mind right now?',
  'What made you smile today?',
  'What’s one thing you learned today?',
  'What drained your energy, and what restored it?',
  'What are you looking forward to?',
  'Describe a small moment you want to remember.',
  'What would make tomorrow a good day?',
  'What’s something you handled well recently?',
]

export const moodInfo = (level: MoodLevel | null | undefined) =>
  MOODS.find((m) => m.level === level) ?? null

export const energyInfo = (level: EnergyLevel | null | undefined) =>
  ENERGY.find((e) => e.level === level) ?? null

export const activityInfo = (id: string) =>
  ACTIVITIES.find((a) => a.id === id) ?? { id, label: id, emoji: '•' }

/** Inline style that exposes the mood's colour as `--mood` for CSS. */
export function moodStyle(level: MoodLevel | null | undefined): CSSProperties {
  return { '--mood': level ? `var(--mood-${level})` : 'var(--border-strong)' } as CSSProperties
}

export function emptyDraft(): JournalDraft {
  return { date: todayKey(), title: '', body: '', mood: null, energy: null, activities: [], tags: [], gratitude: '' }
}

export function isDraftEmpty(d: JournalDraft): boolean {
  return (
    !d.title.trim() &&
    !d.body.trim() &&
    d.mood === null &&
    d.energy === null &&
    d.activities.length === 0 &&
    d.tags.length === 0 &&
    !d.gratitude.trim()
  )
}

export const isEntryEmpty = (e: JournalEntry) => isDraftEmpty(entryToDraft(e))

export const canSaveDraft =(d: JournalDraft) => Boolean(d.body.trim() || d.title.trim() || d.mood)

export const countWords = (text: string) => (text.trim() ? text.trim().split(/\s+/).length : 0)

const asLevel = <T extends number>(v: unknown): T | null =>
  typeof v === 'number' && v >= 1 && v <= 5 ? (Math.round(v) as T) : null
const asString = (v: unknown) => (typeof v === 'string' ? v : '')
const asStrings = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [])

/** Coerce anything read from storage (including entries from older app versions) into a draft. */
export function normalizeDraft(raw: unknown): JournalDraft {
  const r = (raw ?? {}) as Record<string, unknown>
  return {
    date: isValidKey(r.date) ? r.date : todayKey(),
    title: asString(r.title),
    body: asString(r.body),
    mood: asLevel<MoodLevel>(r.mood),
    energy: asLevel<EnergyLevel>(r.energy),
    activities: asStrings(r.activities),
    tags: asStrings(r.tags),
    gratitude: asString(r.gratitude),
  }
}

export function normalizeEntry(raw: unknown): JournalEntry {
  const r = (raw ?? {}) as Record<string, unknown>
  const createdAt = asString(r.createdAt) || new Date().toISOString()
  const draft = normalizeDraft({ ...r, date: isValidKey(r.date) ? r.date : toKey(new Date(createdAt)) })
  return {
    ...draft,
    // the first version of the app stored "Untitled" as a placeholder title
    title: draft.title === 'Untitled' ? '' : draft.title,
    id: asString(r.id) || crypto.randomUUID(),
    favorite: r.favorite === true,
    createdAt,
    updatedAt: asString(r.updatedAt) || undefined,
  }
}

function cleanDraft(d: JournalDraft): JournalDraft {
  return { ...d, title: d.title.trim(), body: d.body.trim(), gratitude: d.gratitude.trim() }
}

export function createEntry(d: JournalDraft): JournalEntry {
  return { ...cleanDraft(d), id: crypto.randomUUID(), favorite: false, createdAt: new Date().toISOString() }
}

export function applyDraft(entry: JournalEntry, d: JournalDraft): JournalEntry {
  return { ...entry, ...cleanDraft(d), updatedAt: new Date().toISOString() }
}

export function entryToDraft(e: JournalEntry): JournalDraft {
  const { date, title, body, mood, energy, activities, tags, gratitude } = e
  return { date, title, body, mood, energy, activities, tags, gratitude }
}

/** Newest day first; within a day, newest first. */
export function sortEntries(entries: JournalEntry[]): JournalEntry[] {
  return [...entries].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
}

export function groupByDate(sorted: JournalEntry[]): { date: string; entries: JournalEntry[] }[] {
  const groups: { date: string; entries: JournalEntry[] }[] = []
  for (const e of sorted) {
    const last = groups[groups.length - 1]
    if (last?.date === e.date) last.entries.push(e)
    else groups.push({ date: e.date, entries: [e] })
  }
  return groups
}

const average = (nums: number[]) => (nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null)

export function computeStats(entries: JournalEntry[]) {
  const today = todayKey()
  const byDay = new Map<string, JournalEntry[]>()
  for (const e of entries) byDay.set(e.date, [...(byDay.get(e.date) ?? []), e])

  // Consecutive days with at least one entry, ending today (or yesterday, if today isn't logged yet).
  let streak = 0
  let cursor = byDay.has(today) ? today : addDays(today, -1)
  while (byDay.has(cursor)) {
    streak++
    cursor = addDays(cursor, -1)
  }

  const weekStart = addDays(today, -6)
  const avgMood7 = average(
    entries.filter((e) => e.date >= weekStart && e.date <= today && e.mood).map((e) => e.mood as number),
  )

  const last14 = Array.from({ length: 14 }, (_, i) => {
    const date = addDays(today, i - 13)
    const dayEntries = byDay.get(date) ?? []
    const avg = average(dayEntries.filter((e) => e.mood).map((e) => e.mood as number))
    return { date, count: dayEntries.length, mood: avg === null ? null : (Math.round(avg) as MoodLevel) }
  })

  return { total: entries.length, streak, avgMood7, last14 }
}

export function allTags(entries: JournalEntry[]): string[] {
  return [...new Set(entries.flatMap((e) => e.tags))].sort()
}
