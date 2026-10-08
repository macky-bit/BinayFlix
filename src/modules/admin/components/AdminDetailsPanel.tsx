import {
  useEffect,
  useId,
  useLayoutEffect,
  useState,
  type ReactNode,
} from "react"

type AdminDetailsPanelProps = {
  title: string

  onClose: () => void

  children: ReactNode

  footer: ReactNode

  ariaLabel?: string

  closeOnBackdrop?: boolean

  closeOnEscape?: boolean
}

export default function AdminDetailsPanel({
  title,

  onClose,

  children,

  footer,

  ariaLabel = title,

  closeOnBackdrop = true,

  closeOnEscape = true,
}: AdminDetailsPanelProps) {
  const titleId = useId()

  const [drawerBounds, setDrawerBounds] = useState<{
    top: number

    height: number
  } | null>(null)

  useLayoutEffect(() => {
    const updateDrawerBounds = () => {
      const navbar =
        document.querySelector<HTMLElement>(
          ".manager-module .admin-utility-header",
        ) ?? document.querySelector<HTMLElement>(".manager-module > header")
      if (!navbar) return

      const navbarRect = navbar.getBoundingClientRect()

      const layoutHeight = navbar.offsetHeight

      const pageScale = layoutHeight > 0 ? navbarRect.height / layoutHeight : 1

      const normalizedScale =
        Number.isFinite(pageScale) && pageScale > 0 ? pageScale : 1

      setDrawerBounds({
        top: navbarRect.bottom / normalizedScale,

        height: Math.max(
          0,

          Math.floor(
            (window.innerHeight - navbarRect.bottom) / normalizedScale,
          ),
        ),
      })
    }

    updateDrawerBounds()

    window.addEventListener("resize", updateDrawerBounds)

    window.visualViewport?.addEventListener("resize", updateDrawerBounds)

    return () => {
      window.removeEventListener("resize", updateDrawerBounds)

      window.visualViewport?.removeEventListener("resize", updateDrawerBounds)
    }
  }, [])

  useEffect(() => {
    const previousOverflow = document.body.style.overflow

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && closeOnEscape) onClose()
    }

    document.body.style.overflow = "hidden"

    window.addEventListener("keydown", handleKey)

    return () => {
      document.body.style.overflow = previousOverflow

      window.removeEventListener("keydown", handleKey)
    }
  }, [closeOnEscape, onClose])

  if (!drawerBounds) return null

  return (
    <div
      className="admin-details-backdrop fixed inset-x-0 z-40 flex justify-end overflow-hidden"
      style={{ top: drawerBounds.top, height: drawerBounds.height }}
      onClick={(event) => {
        if (closeOnBackdrop && event.target === event.currentTarget) onClose()
      }}
    >
      <aside
        className="admin-details-shell flex h-full w-full max-w-lg flex-col overflow-hidden shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="admin-details-header flex shrink-0 items-center justify-between px-6 py-4">
          <h2 id={titleId} className="text-lg font-semibold text-white">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="admin-details-close grid h-8 w-8 shrink-0 place-items-center rounded-lg"
            aria-label={`Close ${title}`}
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18 18 6M6 6l12 12"
              />
            </svg>
          </button>
        </header>

        <div className="admin-details-body scrollbar-thin min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain p-6">
          {children}
        </div>

        <footer className="admin-details-footer shrink-0 px-6 py-4">
          {footer}
        </footer>
      </aside>
    </div>
  )
}

export function AdminDetailsSection({
  title,

  children,
}: {
  title: string

  children: ReactNode
}) {
  return (
    <section className="admin-details-section">
      <h3 className="admin-details-section-title">{title}</h3>
      <div className="admin-details-section-content">{children}</div>
    </section>
  )
}

export function AdminDetailField({
  label,

  value,

  children,

  mono = false,
}: {
  label: string

  value?: ReactNode

  children?: ReactNode

  mono?: boolean
}) {
  const content = children ?? value

  const missing = content === "" || content === null || content === undefined

  return (
    <div className="admin-detail-field">
      <div className="admin-detail-label">{label}</div>
      <div
        className={`admin-detail-value ${
          mono ? "font-mono break-all" : "break-words"
        }`}
      >
        {missing ? (
          <span className="admin-detail-missing">Not provided</span>
        ) : (
          content
        )}
      </div>
    </div>
  )
}

export function AdminDetailGrid({ children }: { children: ReactNode }) {
  return <div className="admin-detail-grid">{children}</div>
}
