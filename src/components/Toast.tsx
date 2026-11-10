import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'

interface ToastOptions {
  message: string
  action?: { label: string; onClick: () => void }
}
interface Toast extends ToastOptions {
  id: number
}

const ToastContext = createContext<(t: ToastOptions) => void>(() => {})

let nextId = 1

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismiss = useCallback((id: number) => setToasts((ts) => ts.filter((t) => t.id !== id)), [])

  const show = useCallback(
    (t: ToastOptions) => {
      const id = nextId++
      setToasts((ts) => [...ts.slice(-2), { ...t, id }])
      setTimeout(() => dismiss(id), t.action ? 6000 : 3000)
    },
    [dismiss],
  )

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className="toast-region" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className="toast">
            <span>{t.message}</span>
            {t.action && (
              <button
                className="toast-action"
                onClick={() => {
                  t.action!.onClick()
                  dismiss(t.id)
                }}
              >
                {t.action.label}
              </button>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
