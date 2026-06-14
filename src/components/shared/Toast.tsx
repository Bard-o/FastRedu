import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { IconX, IconCheck, IconInfoCircle, IconAlertCircle } from '@tabler/icons-react'
import styles from './Toast.module.css'

type ToastVariant = 'info' | 'success' | 'error'

interface Toast {
  id: string
  message: string
  variant: ToastVariant
  exiting?: boolean
}

interface ToastContextValue {
  toast: (message: string, variant?: ToastVariant) => void
  toastError: (message: string) => void
  toastSuccess: (message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

const ICONS = {
  info: <IconInfoCircle />,
  success: <IconCheck />,
  error: <IconAlertCircle />,
} as const

const DISMISS_DELAY = 5000

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const timerRefs = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const dismiss = useCallback((id: string) => {
    // Start exit animation
    setToasts(prev =>
      prev.map(t => (t.id === id ? { ...t, exiting: true } : t))
    )
    // Remove after animation
    const timeout = setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
      timerRefs.current.delete(id)
    }, 150)
    timerRefs.current.set(id, timeout)
  }, [])

  const toast = useCallback(
    (message: string, variant: ToastVariant = 'info') => {
      const id = `toast-${Date.now()}-${Math.random()}`
      setToasts(prev => [...prev, { id, message, variant }])

      const timeout = setTimeout(() => dismiss(id), DISMISS_DELAY)
      timerRefs.current.set(id, timeout)
    },
    [dismiss]
  )

  const toastError = useCallback((message: string) => toast(message, 'error'), [toast])
  const toastSuccess = useCallback((message: string) => toast(message, 'success'), [toast])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      timerRefs.current.forEach(timeout => clearTimeout(timeout))
    }
  }, [])

  return (
    <ToastContext.Provider value={{ toast, toastError, toastSuccess }}>
      {children}
      {createPortal(
        <div className={styles.toastContainer} aria-live="polite" aria-atomic="false">
          {toasts.map(t => (
            <div
              key={t.id}
              className={`${styles.toast} ${styles[`toast${capitalize(t.variant)}`]} ${
                t.exiting ? styles.toastExiting : ''
              }`}
              role="alert"
            >
              <span className={styles.toastIcon}>{ICONS[t.variant]}</span>
              <span className={styles.toastMessage}>{t.message}</span>
              <button
                className={styles.toastDismiss}
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss"
              >
                <IconX size={14} />
              </button>
            </div>
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  )
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}