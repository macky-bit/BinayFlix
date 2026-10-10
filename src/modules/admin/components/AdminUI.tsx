import { Children, type ReactNode } from "react"

export function AdminPageHeader({
  eyebrow,

  title,

  description,

  actions,
}: {
  eyebrow?: string

  title: string

  description: string

  actions?: ReactNode
}) {
  return (
    <header className="admin-page-header">
      <div className="admin-page-heading">
        <div>
          {eyebrow && <p className="admin-eyebrow">{eyebrow}</p>}
          <h1>{title}</h1>
          <p className="admin-page-description">{description}</p>
        </div>
      </div>
      {actions && <div className="admin-page-actions">{actions}</div>}
    </header>
  )
}

export interface AdminTab<T extends string> {
  id: T

  label: string

  count?: number
}

export function AdminWorkspaceTabs<T extends string>({
  tabs,

  active,

  onChange,

  label,
}: {
  tabs: readonly AdminTab<T>[]

  active: T

  onChange: (tab: T) => void

  label: string
}) {
  return (
    <div className="admin-tabs-shell">
      <div className="admin-workspace-tabs" role="tablist" aria-label={label}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active === tab.id}
            className={active === tab.id ? "is-active" : ""}
            onClick={() => onChange(tab.id)}
          >
            <span>{tab.label}</span>
            {typeof tab.count === "number" && (
              <span className="admin-tab-count">{tab.count}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

export function AdminStatCard({
  label,

  value,

  hint,

  tone = "purple",
  active = false,
  onClick,
  actionLabel,
}: {
  label: string

  value: ReactNode

  hint?: string

  tone?: "purple" | "gold" | "green" | "red" | "blue"
  active?: boolean
  onClick?: () => void
  actionLabel?: string
}) {
  const toneClass =
    tone === "purple" ? "is-purple" : tone === "red" ? "is-red" : `is-${tone}`
  const className = `content-overview__metric admin-kpi-card ${toneClass}${
    onClick ? " is-interactive" : ""
  }${active ? " is-active" : ""}`
  const content = (
    <>
      <span>{label}</span>
      <strong>{value}</strong>
      {hint && <small>{hint}</small>}
    </>
  )
  return onClick ? (
    <button
      type="button"
      className={className}
      onClick={onClick}
      aria-pressed={active}
      aria-label={`${label}: ${String(value)}. ${actionLabel ?? "Show matching records"}`}
    >
      {content}
    </button>
  ) : (
    <section className={className}>{content}</section>
  )
}

export function AdminStats({ children }: { children: ReactNode }) {
  const items = Children.toArray(children)
  const count = items.length

  if (count === 5) {
    return (
      <section
        className="content-overview admin-kpi-overview"
        data-count={count}
        aria-label="Workspace summary"
      >
        <div className="admin-kpi-overview__primary">{items[0]}</div>
        <div className="content-overview__metadata">{items.slice(1)}</div>
      </section>
    )
  }

  return (
    <section
      className="content-overview__metadata admin-kpi-overview__metadata"
      data-count={count}
      aria-label="Workspace summary"
    >
      {items}
    </section>
  )
}

export function AdminRowAction({
  action,
  name,
  onClick,
  disabled = false,
}: {
  action: "view" | "edit" | "delete"
  name: string
  onClick: () => void
  disabled?: boolean
}) {
  const verb = `${action.charAt(0).toUpperCase()}${action.slice(1)}`
  const path =
    action === "view"
      ? "M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z"
      : action === "edit"
        ? "m4 16-.75 4.75L8 20l10.8-10.8a2.12 2.12 0 0 0-3-3L5 17v3h3 M14.5 7.5l3 3"
        : "M4 7h16 M9 7V4h6v3 M7 7l1 13h8l1-13 M10 11v5 M14 11v5"

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={`${verb} ${name}`}
      title={verb}
      className={`content-table__action${
        action === "delete" ? " content-table__action--danger" : ""
      }`}
    >
      <svg
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          d={path}
        />
      </svg>
    </button>
  )
}

export function AdminTablePagination({
  page,

  total,

  perPage,

  onPage,

  label,

  onPerPage,
}: {
  page: number

  total: number

  perPage: number

  onPage: (page: number) => void

  label: string

  onPerPage?: (perPage: number) => void
}) {
  const totalPages = Math.max(1, Math.ceil(total / perPage))

  const safePage = Math.min(page, totalPages)

  const first = total === 0 ? 0 : (safePage - 1) * perPage + 1

  const last = Math.min(safePage * perPage, total)

  const visiblePages: (number | "ellipsis")[] = (() => {
    if (totalPages <= 7)
      return Array.from({ length: totalPages }, (_, index) => index + 1)

    const pages: (number | "ellipsis")[] = [1]
    if (safePage > 3) pages.push("ellipsis")
    for (
      let pageNumber = Math.max(2, safePage - 1);
      pageNumber <= Math.min(totalPages - 1, safePage + 1);
      pageNumber += 1
    ) {
      pages.push(pageNumber)
    }
    if (safePage < totalPages - 2) pages.push("ellipsis")
    pages.push(totalPages)
    return pages
  })()

  return (
    <nav className="admin-table-pagination" aria-label={`${label} pagination`}>
      <div className="admin-pagination-summary">
        <span>
          Showing {first}–{last} of {total} {label}
        </span>
        {onPerPage && (
          <select
            className="admin-select"
            value={perPage}
            onChange={(event) => onPerPage(Number(event.target.value))}
            aria-label={`Rows per page for ${label}`}
          >
            {[10, 25, 50].map((amount) => (
              <option key={amount} value={amount}>
                {amount} per page
              </option>
            ))}
          </select>
        )}
      </div>
      <div className="admin-pagination-controls">
        <button
          type="button"
          onClick={() => onPage(safePage - 1)}
          disabled={safePage === 1}
          aria-label="Previous page"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        {visiblePages.map((pageNumber, index) =>
          pageNumber === "ellipsis" ? (
            <span
              className="admin-pagination-ellipsis"
              aria-hidden="true"
              key={`ellipsis-${index}`}
            >
              …
            </span>
          ) : (
            <button
              type="button"
              key={pageNumber}
              className={safePage === pageNumber ? "is-active" : ""}
              aria-label={`Page ${pageNumber}`}
              aria-current={safePage === pageNumber ? "page" : undefined}
              onClick={() => onPage(pageNumber)}
            >
              {pageNumber}
            </button>
          ),
        )}
        <button
          type="button"
          onClick={() => onPage(safePage + 1)}
          disabled={safePage === totalPages}
          aria-label="Next page"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>
    </nav>
  )
}
