import { useEffect, useState } from 'react'

/** useState that persists its value to localStorage under `key`. */
export function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key)
      return stored !== null ? (JSON.parse(stored) as T) : initial
    } catch {
      return initial
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // storage unavailable (private mode, quota) — keep in-memory state
    }
  }, [key, value])

  return [value, setValue] as const
}
