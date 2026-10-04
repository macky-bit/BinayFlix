import { useMemo, useState } from "react"

import { useAdminCollection, useAdminRepository } from "../../data"
import { AdminStatCard, AdminStats } from "../../components/AdminUI"
import {
  DetailRow,
  Drawer,
  EmptyRow,
  Pagination,
  SearchInput,
  Select,
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
  const perPage = 10

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

  const rows = filtered.slice((page - 1) * perPage, page * perPage)

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

      <section className="table-surface">
        <div
          className="admin-filter-row flex flex-wrap gap-3 p-4 border-b border-stone-700/60"
          role="search"
        >
          <SearchInput
            value={search}
            onChange={(value) => {
              setSearch(value)
              setPage(1)
            }}
            placeholder="Search system logs..."
          />
          <Select
            value={severity}
            onChange={(value) => {
              setSeverity(value)
              setPage(1)
            }}
            options={[
              { value: "all", label: "All severities" },
              { value: "Info", label: "Info" },
              { value: "Warning", label: "Warning" },
              { value: "Critical", label: "Critical" },
            ]}
          />
          <button className="btn-ghost ml-auto" onClick={onViewAllLogs}>
            View all logs
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                {[
                  "ID",
                  "Date",
                  "Event",
                  "Description",
                  "Severity",
                  "Status",
                ].map((heading) => (
                  <th key={heading} className="text-left p-3 text-[#9CA3AF]">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <EmptyRow cols={6} message="No system logs are available." />
              ) : (
                rows.map((log) => (
                  <tr
                    key={log.id}
                    className="border-t border-stone-700/40 cursor-pointer"
                    onClick={() => setSelectedLog(log)}
                  >
                    <td className="p-3 font-mono text-xs">{log.id}</td>
                    <td className="p-3 text-[#9CA3AF]">{log.dateTime}</td>
                    <td className="p-3">{log.eventType}</td>
                    <td className="p-3">{log.description}</td>
                    <td className="p-3">{log.severity}</td>
                    <td className="p-3">{log.status}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          page={page}
          total={filtered.length}
          perPage={perPage}
          onPage={setPage}
          onPerPage={() => undefined}
          label="logs"
        />
      </section>

      <div className="flex flex-wrap gap-3">
        <button className="btn-primary" onClick={onRunBackup}>
          Record backup job
        </button>
        <button className="btn-ghost" onClick={onViewSecurity}>
          Review security
        </button>
      </div>

      {selectedLog && (
        <Drawer
          open={Boolean(selectedLog)}
          title="System log"
          onClose={() => setSelectedLog(null)}
        >
          <DetailRow label="ID" value={selectedLog.id} />
          <DetailRow label="Date" value={selectedLog.dateTime} />
          <DetailRow label="Event" value={selectedLog.eventType} />
          <DetailRow label="Severity" value={selectedLog.severity} />
          <DetailRow label="Status" value={selectedLog.status} />
          <DetailRow label="Description" value={selectedLog.description} />
        </Drawer>
      )}
    </div>
  )
}
