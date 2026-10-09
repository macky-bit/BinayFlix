import { useMemo, useState } from "react"

import { useAdminCollection, useAdminRepository } from "../../data"
import { AdminRowAction, AdminStatCard, AdminStats } from "../../components/AdminUI"
import {
  DetailRow,
  AdminDetailGrid,
  AdminDetailsSection,
  Drawer,
  EmptyRow,
  Pagination,
  StatusBadge,
  statusVariantFor,
} from "./shared"

interface LogEntry {
  id: string
  dateTime: string
  eventType: string
  description: string
  severity: string
  status: string
}

interface BackupEntry {
  id: string
  type: string
  completed: string
  status: string
  size: string
}

interface OverviewTabProps {
  onViewAllLogs: () => void
  onRunBackup: () => void
  onViewSecurity: () => void
}

export default function OverviewTab({
  onViewAllLogs,
  onRunBackup,
  onViewSecurity,
}: OverviewTabProps) {
  const logState = useAdminCollection(
    useAdminRepository<LogEntry>("system-logs"),
  )
  const backupState = useAdminCollection(
    useAdminRepository<BackupEntry>("backups"),
  )
  const [search, setSearch] = useState("")
  const [severity, setSeverity] = useState("all")
  const [page, setPage] = useState(1)
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null)
  const [perPage, setPerPage] = useState(10)

  const filtered = useMemo(() => {
    const query = search.toLowerCase()
    return logState.items.filter(
      (log) =>
        (!query ||
          `${log.id} ${log.eventType} ${log.description}`
            .toLowerCase()
            .includes(query)) &&
        (severity === "all" || log.severity === severity),
    )
  }, [logState.items, search, severity])

  const recentBackup = backupState.items[0]
  const criticalCount = logState.items.filter(
    (log) => log.severity === "Critical",
  ).length
  const statusPanels = [
    {
      title: "Supabase Database",
      status: logState.error ? "Unavailable" : "Connected",
      detail: logState.error?.message ?? "Authenticated database connection",
    },
    {
      title: "System Logs",
      status: logState.loading ? "Loading" : "Available",
      detail: `${logState.total} recorded events`,
    },
    {
      title: "Last Backup",
      status: recentBackup?.status ?? "No records",
      detail: recentBackup
        ? `${recentBackup.type} · ${recentBackup.completed || "Pending"}`
        : "No backup job has been recorded",
    },
    {
      title: "Security Events",
      status: criticalCount > 0 ? "Review required" : "Clear",
      detail: `${criticalCount} critical event${
        criticalCount === 1 ? "" : "s"
      }`,
    },
  ]

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const safePage = Math.min(page, totalPages)
  const rows = filtered.slice((safePage - 1) * perPage, safePage * perPage)

  return (
    <div className="space-y-6">
      <AdminStats>
        {statusPanels.map((panel, index) => (
          <AdminStatCard
            key={panel.title}
            label={panel.title}
            value={panel.status}
            hint={panel.detail}
            tone={
              index === 0
                ? "purple"
                : index === 1
                  ? "blue"
                  : index === 2
                    ? "gold"
                    : criticalCount > 0
                      ? "red"
                      : "green"
            }
          />
        ))}
      </AdminStats>

      <div className="system-overview-log-workspace">
        <section className="content-command-bar" aria-label="System log controls">
          <div className="content-command-bar__search">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: "#9CA3AF" }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="search"
              maxLength={100}
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setPage(1)
              }}
              placeholder="Search system logs…"
              aria-label="Search system logs"
              className="content-command-bar__input"
            />
          </div>
          <select
            className="content-command-bar__select"
            aria-label="Filter logs by severity"
            value={severity}
            onChange={(event) => {
              setSeverity(event.target.value)
              setPage(1)
            }}
          >
            <option value="all">All severities</option>
            <option value="Info">Info</option>
            <option value="Warning">Warning</option>
            <option value="Critical">Critical</option>
          </select>
          <button type="button" className="content-command-bar__button" onClick={onViewAllLogs}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            View all logs
          </button>
          <span className="content-command-bar__count">
            {filtered.length} {filtered.length === 1 ? "log" : "logs"}
          </span>
        </section>

        <div className="content-table-frame system-overview-table-frame">
          <div className="content-table-frame__heading">
            <h2>Recent system logs</h2>
            <span>{filtered.length}</span>
          </div>
          <div className="content-table-scroll scrollbar-thin">
          <table className="content-admin-table system-overview-table">
            <colgroup>
              <col className="system-overview-col-id" />
              <col className="system-overview-col-date" />
              <col className="system-overview-col-event" />
              <col className="system-overview-col-description" />
              <col className="system-overview-col-severity" />
              <col className="system-overview-col-status" />
              <col className="system-overview-col-actions" />
            </colgroup>
            <thead>
              <tr>
                {[
                  "ID",
                  "Date",
                  "Event",
                  "Description",
                  "Severity",
                  "Status",
                  "Actions",
                ].map((heading) => (
                  <th key={heading} className={`content-table__head-cell${heading === "Actions" ? " content-table__head-cell--center" : ""}`} scope="col">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <EmptyRow cols={7} message={logState.loading ? "Loading system logs…" : logState.error ? logState.error.message : "No system logs are available."} />
              ) : (
                rows.map((log) => (
                  <tr key={log.id} className="content-table__row">
                    <td><span className="content-table__id">{log.id}</span></td>
                    <td><span className="content-table__date">{log.dateTime}</span></td>
                    <td><span className="content-table__title" title={log.eventType}>{log.eventType}</span></td>
                    <td><span className="system-overview-table__description" title={log.description}>{log.description}</span></td>
                    <td><StatusBadge label={log.severity} variant={statusVariantFor(log.severity)} /></td>
                    <td><StatusBadge label={log.status} variant={statusVariantFor(log.status)} /></td>
                    <td><div className="content-table__actions"><AdminRowAction action="view" name={`system log ${log.id}`} onClick={() => setSelectedLog(log)} /></div></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>
          <Pagination
            page={safePage}
            total={filtered.length}
            perPage={perPage}
            onPage={setPage}
            onPerPage={(amount) => { setPerPage(amount); setPage(1) }}
            label="logs"
          />
        </div>
      </div>

      <div className="system-overview-actions flex flex-wrap gap-3">
        <button type="button" className="btn-primary flex items-center gap-2 px-5 py-2.5" onClick={onRunBackup}>
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><path d="M12 3v12m0 0 4-4m-4 4-4-4" /><path d="M5 19h14" /></svg>
          Record backup job
        </button>
        <button type="button" className="btn-outline flex items-center gap-2 px-5 py-2.5" onClick={onViewSecurity}>
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /></svg>
          Review security
        </button>
      </div>

      {selectedLog && (
        <Drawer
          open={Boolean(selectedLog)}
          title="System log"
          onClose={() => setSelectedLog(null)}
        >
          <AdminDetailsSection title="Event Information">
            <AdminDetailGrid>
              <DetailRow label="Event ID" value={<span className="font-mono">{selectedLog.id}</span>} />
              <DetailRow label="Date & Time" value={selectedLog.dateTime} />
              <DetailRow label="Event Type" value={selectedLog.eventType} />
              <DetailRow label="Severity" value={<StatusBadge label={selectedLog.severity} variant={statusVariantFor(selectedLog.severity)} />} />
              <DetailRow label="Status" value={<StatusBadge label={selectedLog.status} variant={statusVariantFor(selectedLog.status)} />} />
            </AdminDetailGrid>
            <DetailRow label="Description" value={selectedLog.description} />
          </AdminDetailsSection>
        </Drawer>
      )}
    </div>
  )
}
