import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/shared/components/ui/Button'

type ModalProps = {
  open: boolean
  title: string
  children: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'primary'
  onConfirm: () => void
  onClose: () => void
  loading?: boolean
}

export function Modal({
  open,
  title,
  children,
  confirmLabel = 'Confirmă',
  cancelLabel = 'Anulează',
  variant = 'primary',
  onConfirm,
  onClose,
  loading,
}: ModalProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="zs-modal-root" role="presentation">
      <div className="zs-modal-root__backdrop" aria-hidden onClick={onClose} />
      <div
        className="zs-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="zs-modal-title"
      >
        <h2 id="zs-modal-title" className="zs-modal__title">
          {title}
        </h2>
        <div className="zs-modal__body">{children}</div>
        <div className="zs-modal__footer">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={variant === 'danger' ? 'danger' : 'primary'}
            loading={loading}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
