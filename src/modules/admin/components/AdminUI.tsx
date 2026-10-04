import type { ReactNode } from "react"

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
}: {
  label: string
  value: ReactNode
  hint?: string
  tone?: "purple" | "gold" | "green" | "red" | "blue"
}) {
  return (
    <section className={`admin-stat-card admin-stat-${tone}`}>
      <div className="admin-stat-marker" aria-hidden="true" />
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        {hint && <span>{hint}</span>}
      </div>
    </section>
  )
}

export function AdminStats({ children }: { children: ReactNode }) {
  return <div className="admin-stats-grid">{children}</div>
}

export function AdminTablePagination({
  page,
  total,
  perPage,
  onPage,
  label,
}: {
  page: number
  total: number
  perPage: number
  onPage: (page: number) => void
  label: string
}) {
  const totalPages = Math.max(1, Math.ceil(total / perPage))
  const safePage = Math.min(page, totalPages)
  const first = total === 0 ? 0 : (safePage - 1) * perPage + 1
  const last = Math.min(safePage * perPage, total)
  const visiblePages = Array.from(
    { length: Math.min(5, totalPages) },
    (_, index) => {
      const start = Math.min(
        Math.max(1, safePage - 2),
        Math.max(1, totalPages - 4),
      )
      return start + index
    },
  )

  return (
    <div className="admin-table-pagination" aria-label={`${label} pagination`}>
      <p>
        Showing {first}–{last} of {total} {label}
      </p>
      <div className="admin-pagination-controls">
        <button
          type="button"
          onClick={() => onPage(safePage - 1)}
          disabled={safePage === 1}
          aria-label={`Previous ${label} page`}
        >
          ‹
        </button>
        {visiblePages.map((pageNumber) => (
          <button
            type="button"
            key={pageNumber}
            className={safePage === pageNumber ? "is-active" : ""}
            aria-current={safePage === pageNumber ? "page" : undefined}
            onClick={() => onPage(pageNumber)}
          >
            {pageNumber}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onPage(safePage + 1)}
          disabled={safePage === totalPages}
          aria-label={`Next ${label} page`}
        >
          ›
        </button>
      </div>
    </div>
  )
}
