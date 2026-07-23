'use client'

import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full'

const sizeClasses: Record<ModalSize, string> = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-7xl',
}

type Props = {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  size?: ModalSize
  children: React.ReactNode
  footer?: React.ReactNode
}

export function Modal({ open, onClose, title, description, size = 'md', children, footer }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose()
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className={cn(
          'animate-in relative z-10 w-full rounded-2xl border border-[hsl(214,32%,91%)] bg-white shadow-2xl dark:border-[hsl(217,33%,17%)] dark:bg-[hsl(222,47%,11%)]',
          sizeClasses[size]
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between border-b border-[hsl(214,32%,91%)] px-6 py-4 dark:border-[hsl(217,33%,17%)]">
            <div>
              <h2
                id="modal-title"
                className="text-base font-semibold text-[hsl(222,47%,11%)] dark:text-white"
              >
                {title}
              </h2>
              {description && (
                <p className="mt-0.5 text-sm text-[hsl(215,16%,47%)]">{description}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[hsl(215,16%,47%)] transition-all hover:bg-[hsl(210,40%,96%)] hover:text-[hsl(222,47%,11%)] dark:hover:bg-[hsl(217,33%,17%)] dark:hover:text-white"
              aria-label="Close modal"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Body */}
        <div className="max-h-[70vh] overflow-y-auto scrollbar-thin px-6 py-5">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 border-t border-[hsl(214,32%,91%)] px-6 py-4 dark:border-[hsl(217,33%,17%)]">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
