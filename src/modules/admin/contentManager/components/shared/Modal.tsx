import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}

export default function Modal({ title, onClose, children, wide = false }: ModalProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    const previousOverflow = document.body.style.overflow;
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-[400] flex items-stretch justify-center p-0 sm:items-center sm:p-4"
      style={{ backgroundColor: 'rgba(11, 7, 25, 0.85)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className={`relative flex h-[100dvh] w-full min-w-0 flex-col overflow-hidden rounded-none shadow-2xl sm:h-[calc(100dvh-2rem)] sm:rounded-2xl ${wide ? 'sm:w-[94vw] sm:max-w-4xl' : 'sm:max-w-xl'}`}
        style={{
          backgroundColor: '#150D2A',
          border: '1px solid rgba(124, 58, 237, 0.4)',
          boxShadow: '0 0 60px rgba(124, 58, 237, 0.15)',
        }}
      >
        {/* Header */}
        <div
          className="flex flex-shrink-0 items-center justify-between px-4 py-3 sm:px-6 sm:py-4"
          style={{ borderBottom: '1px solid #374151' }}
        >
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-150 hover:bg-white/10"
            style={{ color: '#9CA3AF' }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {/* Body */}
        <div
          className="min-h-0 flex-1 touch-pan-y overflow-y-scroll overscroll-contain px-4 py-4 sm:px-6 sm:py-5"
          style={{ scrollbarGutter: 'stable', WebkitOverflowScrolling: 'touch' }}
        >
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
