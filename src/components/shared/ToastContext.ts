import { createContext, useContext } from 'react'

export type ToastVariant = 'info' | 'success' | 'error'

export interface ToastContextValue {
  toast: (message: string, variant?: ToastVariant) => void
  toastError: (message: string) => void
  toastSuccess: (message: string) => void
}

// Kept out of Toast.tsx so that file only exports components, which is what
// react-refresh needs to hot-reload it.
export const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
