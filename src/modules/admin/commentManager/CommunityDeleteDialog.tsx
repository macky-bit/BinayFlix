import { useEffect } from "react"
import { useDeleteConfirmationDelay } from "../components/useDeleteConfirmationDelay"

interface CommunityDeleteDialogProps {
  open: boolean
  itemLabel: string
  detail: string
  busy?: boolean
  onCancel: () => void
  onConfirm: () => void
}

export default function CommunityDeleteDialog({
  open,
  itemLabel,
  detail,
  busy = false,
  onCancel,
  onConfirm,
}: CommunityDeleteDialogProps) {
  const { beginConfirmation, secondsRemaining, waiting } =
    useDeleteConfirmationDelay(onConfirm)

  useEffect(() => {
    if (!open) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) {
        event.preventDefault()
        event.stopPropagation()
        event.stopImmediatePropagation()
        onCancel()
      }
    }
    window.addEventListener("keydown", handleKeyDown, true)
    return () => window.removeEventListener("keydown", handleKeyDown, true)
  }, [busy, onCancel, open])

  if (!open) return null

  return (
    <div
      className="modal-overlay community-delete-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onCancel()
      }}
    >
      <section
        className="modal-panel max-w-md"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="community-delete-title"
        aria-describedby="community-delete-description"
      >
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-red-700/50 bg-red-950/40 text-red-300" aria-hidden="true">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.3 3.8 2.6 17.1A2 2 0 0 0 4.3 20h15.4a2 2 0 0 0 1.7-2.9L13.7 3.8a2 2 0 0 0-3.4 0Z" />
            </svg>
          </span>
          <div className="min-w-0">
            <h2 id="community-delete-title" className="text-lg font-semibold text-white">
              Delete {itemLabel}?
            </h2>
            <p id="community-delete-description" className="mt-1.5 text-sm leading-relaxed text-[#9CA3AF]">
              {detail} This action is permanent and cannot be undone.
            </p>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onCancel} disabled={busy} className="btn-ghost min-h-10 px-4 text-sm disabled:opacity-40">
            Cancel
          </button>
          <button
            type="button"
            onClick={beginConfirmation}
            disabled={busy || waiting}
            className="min-h-10 rounded-lg border border-red-700/60 bg-red-950/30 px-4 text-sm font-semibold text-red-300 transition-colors hover:bg-red-900/40 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy
              ? "Deleting…"
              : waiting
                ? `Delete ${itemLabel} in ${secondsRemaining}s`
                : `Delete ${itemLabel}`}
          </button>
        </div>
      </section>
    </div>
  )
}
