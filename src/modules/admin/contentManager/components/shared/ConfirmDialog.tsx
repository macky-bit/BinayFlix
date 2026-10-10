import { useEffect } from 'react';
import { useDeleteConfirmationDelay } from '../../../components/useDeleteConfirmationDelay';

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
  variant?: 'danger' | 'warning';
}

export default function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  loading = false,
  variant = 'danger',
}: ConfirmDialogProps) {
  const isDeleteAction = /^(delete|remove)\b/i.test(confirmLabel);
  const { beginConfirmation, secondsRemaining, waiting } =
    useDeleteConfirmationDelay(onConfirm, isDeleteAction);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(11, 7, 25, 0.9)', backdropFilter: 'blur(4px)' }}
      role="alertdialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="w-full max-w-md rounded-2xl shadow-2xl"
        style={{
          backgroundColor: '#150D2A',
          border: '1px solid rgba(124, 58, 237, 0.4)',
          boxShadow: '0 0 60px rgba(124, 58, 237, 0.15)',
        }}
      >
        <div className="px-6 pt-6 pb-5">
          <div className="flex items-start gap-4 mb-4">
            <div
              className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: variant === 'danger' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 168, 0, 0.15)' }}
            >
              <svg
                className="w-5 h-5"
                style={{ color: variant === 'danger' ? '#EF4444' : '#F5A800' }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-semibold text-white mb-1">{title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: '#9CA3AF' }}>{message}</p>
            </div>
          </div>
        </div>
        <div
          className="flex items-center justify-end gap-3 px-6 pb-5"
          style={{ borderTop: '1px solid #374151', paddingTop: '1rem' }}
        >
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-150 disabled:opacity-50"
            style={{
              backgroundColor: 'transparent',
              border: '1px solid #374151',
              color: '#9CA3AF',
            }}
            onMouseEnter={(e) => { (e.currentTarget.style.borderColor = '#6B7280'); (e.currentTarget.style.color = '#fff'); }}
            onMouseLeave={(e) => { (e.currentTarget.style.borderColor = '#374151'); (e.currentTarget.style.color = '#9CA3AF'); }}
          >
            {cancelLabel}
          </button>
          <button
            onClick={beginConfirmation}
            disabled={loading || waiting}
            className="px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150 disabled:opacity-50 flex items-center gap-2"
            style={{
              backgroundColor: variant === 'danger' ? '#DC2626' : '#F5A800',
              color: '#fff',
              border: 'none',
            }}
            onMouseEnter={(e) => { (e.currentTarget.style.backgroundColor = variant === 'danger' ? '#B91C1C' : '#D97706'); }}
            onMouseLeave={(e) => { (e.currentTarget.style.backgroundColor = variant === 'danger' ? '#DC2626' : '#F5A800'); }}
          >
            {loading && (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            {waiting ? `${confirmLabel} in ${secondsRemaining}s` : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

