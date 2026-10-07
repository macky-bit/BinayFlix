import { useState, useMemo } from "react"

import { useAdminCollection, useAdminRepository } from "../../data"

import {
  StatusBadge,
  statusVariantFor,
  SearchInput,
  Select,
  Pagination,
  EmptyRow,
  Drawer,
  DetailRow,
  SectionTitle,
} from "./shared"

interface LogEntry {
  id: string

  dateTime: string

  eventType: string

  userSource: string

  description: string

  ip: string

  severity: string

  status: string
}

const EVENT_TYPE_OPTIONS = [
  { value: "all", label: "All Event Types" },

  { value: "Login", label: "Login" },

  { value: "Backup", label: "Backup" },

  { value: "Database", label: "Database" },

  { value: "Security", label: "Security" },

  { value: "Server", label: "Server" },

  { value: "System Update", label: "System Update" },
]

const SEVERITY_OPTIONS = [
  { value: "all", label: "All Severities" },

  { value: "Info", label: "Info" },

  { value: "Warning", label: "Warning" },

  { value: "Critical", label: "Critical" },
]

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },

  { value: "Completed", label: "Completed" },

  { value: "Monitoring", label: "Monitoring" },

  { value: "Resolved", label: "Resolved" },

  { value: "Failed", label: "Failed" },
]

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },

  { value: "oldest", label: "Oldest First" },

  { value: "sev-high", label: "Severity: High to Low" },

  { value: "sev-low", label: "Severity: Low to High" },
]

const SEV_ORDER: Record<string, number> = { Critical: 3, Warning: 2, Info: 1 }

export default function SystemLogsTab() {
  const logs = useAdminCollection(
    useAdminRepository<LogEntry>("system-logs"),
  ).items

  const [search, setSearch] = useState("")

  const [filterType, setFilterType] = useState("all")

  const [filterSev, setFilterSev] = useState("all")

  const [filterStatus, setFilterStatus] = useState("all")

  const [sort, setSort] = useState("newest")

  const [page, setPage] = useState(1)

  const [perPage, setPerPage] = useState(10)

  const [selected, setSelected] = useState<Set<string>>(new Set())

  const [viewLog, setViewLog] = useState<LogEntry | null>(null)

  const [markedReviewed, setMarkedReviewed] = useState<Set<string>>(new Set())

  const filtered = useMemo(() => {
    let result = logs.filter((l) => {
      const q = search.toLowerCase()

      const matchQ =
        !q ||
        l.id.toLowerCase().includes(q) ||
        l.description.toLowerCase().includes(q) ||
        l.eventType.toLowerCase().includes(q) ||
        l.userSource.toLowerCase().includes(q)

      const matchType = filterType === "all" || l.eventType === filterType

      const matchSev = filterSev === "all" || l.severity === filterSev

      const matchStatus = filterStatus === "all" || l.status === filterStatus

      return matchQ && matchType && matchSev && matchStatus
    })

    if (sort === "oldest") result = [...result].reverse()
    else if (sort === "sev-high")
      result = [...result].sort(
        (a, b) => (SEV_ORDER[b.severity] || 0) - (SEV_ORDER[a.severity] || 0),
      )
    else if (sort === "sev-low")
      result = [...result].sort(
        (a, b) => (SEV_ORDER[a.severity] || 0) - (SEV_ORDER[b.severity] || 0),
      )

    return result
  }, [logs, search, filterType, filterSev, filterStatus, sort])

  const pageRows = filtered.slice((page - 1) * perPage, page * perPage)

  const allPageSelected =
    pageRows.length > 0 && pageRows.every((r) => selected.has(r.id))

  function resetFilters() {
    setSearch("")

    setFilterType("all")

    setFilterSev("all")

    setFilterStatus("all")

    setSort("newest")

    setPage(1)
  }

  function toggleSelectAll() {
    if (allPageSelected) {
      setSelected((s) => {
        const n = new Set(s)
        pageRows.forEach((r) => n.delete(r.id))
        return n
      })
    } else {
      setSelected((s) => {
        const n = new Set(s)
        pageRows.forEach((r) => n.add(r.id))
        return n
      })
    }
  }

  function toggleSelect(id: string) {
    setSelected((s) => {
      const n = new Set(s)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }

  return (
    <div>
      <SectionTitle
        title="System Logs"
        description="Review recorded activities, warnings, and system events."
      />

      {/* Controls */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-3 mb-4">
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v)
            setPage(1)
          }}
          placeholder="Search system logs..."
          className="w-full sm:w-64"
        />
        <Select
          value={filterType}
          onChange={(v) => {
            setFilterType(v)
            setPage(1)
          }}
          options={EVENT_TYPE_OPTIONS}
          className="w-full sm:w-40"
        />
        <Select
          value={filterSev}
          onChange={(v) => {
            setFilterSev(v)
            setPage(1)
          }}
          options={SEVERITY_OPTIONS}
          className="w-full sm:w-36"
        />
        <Select
          value={filterStatus}
          onChange={(v) => {
            setFilterStatus(v)
            setPage(1)
          }}
          options={STATUS_OPTIONS}
          className="w-full sm:w-36"
        />
        <Select
          value={sort}
          onChange={(v) => {
            setSort(v)
            setPage(1)
          }}
          options={SORT_OPTIONS}
          className="w-full sm:w-44"
        />
        <button
          onClick={resetFilters}
          className="btn-ghost px-4 py-2 text-sm whitespace-nowrap"
        >
          Reset Filters
        </button>
      </div>

      <div className="table-surface system-table-surface">
        <div className="system-table-frame">
          <table
            className="system-data-table system-logs-table text-sm"
            aria-label="System Logs"
          >
            <colgroup>
              <col className="col-select" />
              <col className="col-id" />
              <col className="col-date" />
              <col className="col-event" />
              <col className="col-source" />
              <col className="col-description" />
              <col className="col-ip" />
              <col className="col-severity" />
              <col className="col-status" />
              <col className="col-actions" />
            </colgroup>
            <thead>
              <tr className="border-b border-stone-700/60">
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={allPageSelected}
                    onChange={toggleSelectAll}
                    className="accent-[#7C3AED] w-4 h-4"
                    aria-label="Select all on page"
                  />
                </th>
                {[
                  "Log ID",
                  "Date & Time",
                  "Event Type",
                  "User / Source",
                  "Description",
                  "IP Address",
                  "Severity",
                  "Status",
                  "Actions",
                ].map((h) => (
                  <th
                    key={h}
                    className="text-left text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider"
                    scope="col"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <EmptyRow
                  cols={10}
                  message="No records match your search or selected filters."
                />
              ) : (
                pageRows.map((log) => (
                  <tr
                    key={log.id}
                    className={`border-b border-stone-700/30 last:border-0 ${
                      selected.has(log.id) ? "tr-selected" : "tr-hover"
                    }`}
                  >
                    <td>
                      <input
                        type="checkbox"
                        checked={selected.has(log.id)}
                        onChange={() => toggleSelect(log.id)}
                        className="accent-[#7C3AED] w-4 h-4"
                        aria-label={`Select ${log.id}`}
                      />
                    </td>
                    <td className="text-[#9CA3AF] font-mono text-xs">
                      <span className="system-cell-ellipsis" title={log.id}>
                        {log.id}
                      </span>
                    </td>
                    <td className="text-[#9CA3AF] text-xs">
                      <span
                        className="system-cell-ellipsis"
                        title={log.dateTime}
                      >
                        {log.dateTime}
                      </span>
                    </td>
                    <td className="text-white">
                      <span
                        className="system-cell-ellipsis"
                        title={log.eventType}
                      >
                        {log.eventType}
                      </span>
                    </td>
                    <td className="text-[#9CA3AF] text-xs">
                      <span
                        className="system-cell-ellipsis"
                        title={log.userSource}
                      >
                        {log.userSource}
                      </span>
                    </td>
                    <td className="text-[#9CA3AF] text-xs">
                      <span
                        className="system-cell-ellipsis"
                        title={log.description}
                      >
                        {log.description}
                      </span>
                    </td>
                    <td className="text-[#9CA3AF] font-mono text-xs">
                      <span
                        className="system-cell-ellipsis"
                        title={log.ip || undefined}
                      >
                        {log.ip || "—"}
                      </span>
                    </td>
                    <td>
                      <StatusBadge
                        label={log.severity}
                        variant={statusVariantFor(log.severity)}
                      />
                    </td>
                    <td>
                      {markedReviewed.has(log.id) ? (
                        <StatusBadge label="Reviewed" variant="positive" />
                      ) : (
                        <StatusBadge
                          label={log.status}
                          variant={statusVariantFor(log.status)}
                        />
                      )}
                    </td>
                    <td>
                      <button
                        onClick={() => setViewLog(log)}
                        className="btn-outline system-table-action text-xs"
                      >
                        View
                      </button>
                    </td>
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
          onPerPage={(n) => {
            setPerPage(n)
            setPage(1)
          }}
          label="system logs"
        />
      </div>

      {/* Log detail drawer */}
      <Drawer
        open={!!viewLog}
        onClose={() => setViewLog(null)}
        title="System Log Details"
        footer={
          <>
            <button
              onClick={() => setViewLog(null)}
              className="admin-details-button admin-details-button--secondary"
            >
              Close
            </button>
            <button
              onClick={() => {
                if (viewLog)
                  setMarkedReviewed((s) => new Set([...s, viewLog.id]))

                setViewLog(null)
              }}
              className="admin-details-button admin-details-button--purple"
            >
              Mark as Reviewed
            </button>
          </>
        }
      >
        {viewLog && (
          <div className="space-y-4">
            <DetailRow
              label="Log ID"
              value={<span className="font-mono">{viewLog.id}</span>}
            />
            <DetailRow label="Date & Time" value={viewLog.dateTime} />
            <DetailRow label="Event Type" value={viewLog.eventType} />
            <DetailRow label="User / Source" value={viewLog.userSource} />
            <DetailRow label="Description" value={viewLog.description} />
            <DetailRow
              label="IP Address"
              value={<span className="font-mono">{viewLog.ip}</span>}
            />
            <DetailRow
              label="Severity"
              value={
                <StatusBadge
                  label={viewLog.severity}
                  variant={statusVariantFor(viewLog.severity)}
                />
              }
            />
            <DetailRow
              label="Status"
              value={
                markedReviewed.has(viewLog.id) ? (
                  <StatusBadge label="Reviewed" variant="positive" />
                ) : (
                  <StatusBadge
                    label={viewLog.status}
                    variant={statusVariantFor(viewLog.status)}
                  />
                )
              }
            />
          </div>
        )}
      </Drawer>
    </div>
  )
}
