'use client'
// Minimal toast using a simple state approach
import { useState, createContext, useContext, useCallback } from 'react'
import { X, CheckCircle, AlertCircle } from 'lucide-react'

type Toast = { id: string; title: string; description?: string; type?: 'success' | 'error' }
type ToastCtx = { toast: (t: Omit<Toast, 'id'>) => void }

const ToastContext = createContext<ToastCtx>({ toast: () => {} })

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((t: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).slice(2)
    setToasts((prev) => [...prev, { ...t, id }])
    setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 4000)
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2" style={{ maxWidth: 380 }}>
        {toasts.map((t) => (
          <div
            key={t.id}
            className="flex items-start gap-3 p-4 rounded-xl shadow-lg border bg-white"
            style={{ borderColor: 'var(--border)' }}
          >
            {t.type === 'success' ? (
              <CheckCircle className="w-4 h-4 mt-0.5 shrink-0 text-green-500" />
            ) : t.type === 'error' ? (
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-500" />
            ) : null}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{t.title}</p>
              {t.description && <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{t.description}</p>}
            </div>
            <button
              onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
              className="btn-ghost p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function Toaster() {
  return null // placeholder — layout wraps with ToastProvider
}

export function useToast() {
  return useContext(ToastContext)
}
