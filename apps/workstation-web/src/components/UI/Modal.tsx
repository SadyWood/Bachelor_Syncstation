// src/components/UI/Modal.tsx
import { X } from 'lucide-react';
import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { ModalProps, ModalAction } from '../../types';

const toneClass = (tone: ModalAction['tone']) => {
  switch (tone) {
    case 'danger':  return 'ws-danger';
    case 'success': return 'ws-success';
    case 'info':    return 'ws-info';
    default:        return '';
  }
};

const appearanceClass = (appearance: ModalAction['appearance']) => {
  switch (appearance) {
    case 'outline': return 'ws-btn-outline';
    case 'soft':    return 'ws-btn-soft';
    default:        return 'ws-btn-solid';
  }
};

const sizeMaxWidth = (size: ModalProps['size']) => {
  switch (size) {
    case 'sm': return 'max-w-sm';
    case 'md': return 'max-w-md';
    case 'lg': return 'max-w-lg';
    case 'xl':
    default:   return 'max-w-4xl'; // a touch wider by default for editors
  }
};

export default function Modal({
  open,
  title,
  children,
  actions = [],
  onClose,
  size = 'xl',
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title ?? 'Dialog'}
      className="fixed inset-0 z-[1000] ws-fade-in"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      <div className="absolute inset-0 bg-black/40" />
      <div className="absolute inset-0 flex items-start md:items-center justify-center p-2 md:p-6">
        <div
          ref={dialogRef}
          className={`ws-card ws-card-elevated w-full ${sizeMaxWidth(size)} ws-slide-up`}
          style={{ borderRadius: 'var(--ws-radius-xl)' }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="ws-card-header">
            <div className="text-sm font-semibold">{title ?? 'Dialog'}</div>
            <button className="ws-btn ws-btn-icon ws-btn-soft" aria-label="Close" onClick={onClose}>
              <X size={16} />
            </button>
          </div>

          <div className="ws-card-body">{children}</div>

          {actions.length > 0 && (
            <div className="px-4 pb-4 flex justify-end gap-2">
              {actions.map((a) => (
                <button
                  key={a.label}
                  className={`ws-btn ws-btn-sm ${appearanceClass(a.appearance)} ${toneClass(a.tone)}`}
                  disabled={a.disabled}
                  onClick={a.onClick}
                >
                  {a.label}
                </button>
              ))}
              {!actions.some(a => /cancel/i.test(a.label)) && (
                <button className="ws-btn ws-btn-sm ws-btn-soft" onClick={onClose}>
                  Cancel
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
