import Modal from './Modal'
import Button from './Button'
import { AlertTriangle } from 'lucide-react'

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmLabel?: string
  isLoading?: boolean
  variant?: 'danger' | 'warning'
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirmar',
  isLoading,
  variant = 'danger',
}: ConfirmDialogProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={onConfirm} loading={isLoading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex gap-3">
        <div
          className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
            variant === 'danger' ? 'bg-red-500/15' : 'bg-yellow-500/15'
          }`}
        >
          <AlertTriangle
            className={`w-5 h-5 ${variant === 'danger' ? 'text-red-400' : 'text-yellow-400'}`}
          />
        </div>
        <p className="text-sm text-gym-text-secondary leading-relaxed">{message}</p>
      </div>
    </Modal>
  )
}
