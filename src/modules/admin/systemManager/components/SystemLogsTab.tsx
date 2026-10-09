import { useState, useMemo } from "react";
import {
  useAdminCollection,
  useAdminRepository,
} from "../../data";
import { AdminRowAction, AdminStatCard, AdminStats } from "../../components/AdminUI";
import {
  StatusBadge,
  statusVariantFor,
  SearchInput,
  Select,
  Pagination,
  EmptyRow,
  Drawer,
  DetailRow,
  AdminDetailGrid,
  AdminDetailsSection,
  SectionTitle,
} from "./shared";

interface LogEntry {
  id: string;
  dateTime: string;
  eventType: string;
  userSource: string;
  description: string;
  ip: string;
  severity: string;
  status: string;
}


const EVENT_TYPE_OPTIONS = [
  { value: "all", label: "All Event Types" },
  { value: "Login", label: "Login" },
  { value: "Backup", label: "Backup" },
  { value: "Database", label: "Database" },
  { value: "Security", label: "Security" },
  { value: "Server", label: "Server" },
  { value: "System Update", label: "System Update" },
];

const SEVERITY_OPTIONS = [
  { value: "all", label: "All Severities" },
  { value: "Info", label: "Info" },
  { value: "Warning", label: "Warning" },
  { value: "Critical", label: "Critical" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "Completed", label: "Completed" },
  { value: "Monitoring", label: "Monitoring" },
  { value: "Resolved", label: "Resolved" },
  { value: "Failed", label: "Failed" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "sev-high", label: "Severity: High to Low" },
  { value: "sev-low", label: "Severity: Low to High" },
];

const SEV_ORDER: Record<string, number> = { Critical: 3, Warning: 2, Info: 1 };

export default function SystemLogsTab() {
  const logState = useAdminCollection(
    useAdminRepository<LogEntry>("system-logs"),
  );
  const logs = logState.items;
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterSev, setFilterSev] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [viewLog, setViewLog] = useState<LogEntry | null>(null);
  const [markedReviewed, setMarkedReviewed] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    let result = logs.filter((l) => {
      const q = search.toLowerCase();
      const matchQ = !q || l.id.toLowerCase().includes(q) || l.description.toLowerCase().includes(q) || l.eventType.toLowerCase().includes(q) || l.userSource.toLowerCase().includes(q);
      const matchType = filterType === "all" || l.eventType === filterType;
      const matchSev = filterSev === "all" || l.severity === filterSev;
      const matchStatus = filterStatus === "all" || l.status === filterStatus;
      return matchQ && matchType && matchSev && matchStatus;
    });
    if (sort === "oldest") result = [...result].reverse();
    else if (sort === "sev-high") result = [...result].sort((a, b) => (SEV_ORDER[b.severity] || 0) - (SEV_ORDER[a.severity] || 0));
    else if (sort === "sev-low") result = [...result].sort((a, b) => (SEV_ORDER[a.severity] || 0) - (SEV_ORDER[b.severity] || 0));
    return result;
  }, [logs, search, filterType, filterSev, filterStatus, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * perPage, safePage * perPage);
  const warningCount = logs.filter((log) => log.severity === "Warning").length;
  const criticalCount = logs.filter((log) => log.severity === "Critical").length;
  const failedCount = logs.filter((log) => log.status === "Failed").length;

  function resetFilters() {
    setSearch("");
    setFilterType("all");
    setFilterSev("all");
    setFilterStatus("all");
    setSort("newest");
    setPage(1);
  }

  return (
    <div>
      <SectionTitle
        title="System Logs"
        description="Review recorded activities, warnings, and system events."
      />

      <AdminStats>
        <AdminStatCard label="Total events" value={logs.length} hint="All recorded logs" tone="purple" active={filterSev === "all" && filterStatus === "all"} onClick={() => { setFilterSev("all"); setFilterStatus("all"); setPage(1); }} actionLabel="Show all system logs" />
        <AdminStatCard label="Warnings" value={warningCount} hint="Warning severity" tone="gold" active={filterSev === "Warning"} onClick={() => { setFilterSev("Warning"); setFilterStatus("all"); setPage(1); }} actionLabel="Filter to warnings" />
        <AdminStatCard label="Critical events" value={criticalCount} hint="Critical severity" tone="red" active={filterSev === "Critical"} onClick={() => { setFilterSev("Critical"); setFilterStatus("all"); setPage(1); }} actionLabel="Filter to critical events" />
        <AdminStatCard label="Failed events" value={failedCount} hint="Failed status" tone="blue" active={filterStatus === "Failed"} onClick={() => { setFilterSev("all"); setFilterStatus("Failed"); setPage(1); }} actionLabel="Filter to failed events" />
      </AdminStats>

      <section className="table-surface system-logs-panel">
        <div className="admin-filter-row system-logs-toolbar" role="search" aria-label="Search and filter system logs">
          <SearchInput
            value={search}
            onChange={(v) => { setSearch(v); setPage(1); }}
            placeholder="Search logs, sources, IP addresses..."
            className="system-logs-toolbar__search"
          />
          <Select value={filterType} onChange={(v) => { setFilterType(v); setPage(1); }} options={EVENT_TYPE_OPTIONS} className="system-logs-toolbar__select" />
          <Select value={filterSev} onChange={(v) => { setFilterSev(v); setPage(1); }} options={SEVERITY_OPTIONS} className="system-logs-toolbar__select" />
          <Select value={filterStatus} onChange={(v) => { setFilterStatus(v); setPage(1); }} options={STATUS_OPTIONS} className="system-logs-toolbar__select" />
          <Select value={sort} onChange={(v) => { setSort(v); setPage(1); }} options={SORT_OPTIONS} className="system-logs-toolbar__sort" />
          <button type="button" onClick={resetFilters} className="btn-violet focus-ring admin-reset-filters system-logs-toolbar__reset">Reset Filters</button>
        </div>

        <div className="system-table-scroll">
          <table className="system-logs-table w-full text-sm" aria-label="System Logs">
            <colgroup>
              <col className="system-log-col-id" />
              <col className="system-log-col-date" />
              <col className="system-log-col-event" />
              <col className="system-log-col-source" />
              <col className="system-log-col-description" />
              <col className="system-log-col-ip" />
              <col className="system-log-col-severity" />
              <col className="system-log-col-status" />
              <col className="system-log-col-actions" />
            </colgroup>
            <thead>
              <tr className="border-b border-stone-700/60">
                {["Log ID", "Date & Time", "Event Type", "User / Source", "Description", "IP Address", "Severity", "Status", "Actions"].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider px-2 py-3" scope="col">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <EmptyRow cols={9} message={logState.loading ? "Loading system logs…" : logState.error ? logState.error.message : "No records match your search or selected filters."} />
              ) : (
                pageRows.map((log) => (
                  <tr
                    key={log.id}
                    className="border-b border-stone-700/30 last:border-0 tr-hover"
                  >
                    <td className="system-log-id font-mono text-xs" title={log.id}>{log.id}</td>
                    <td className="system-log-date text-xs">{log.dateTime}</td>
                    <td className="system-log-event text-xs">{log.eventType}</td>
                    <td className="system-log-source text-xs" title={log.userSource}>{log.userSource}</td>
                    <td className="system-log-description text-xs" title={log.description}><span>{log.description}</span></td>
                    <td className="system-log-ip font-mono text-xs" title={log.ip}>{log.ip}</td>
                    <td className="px-2 py-3">
                      <StatusBadge label={log.severity} variant={statusVariantFor(log.severity)} />
                    </td>
                    <td className="px-2 py-3">
                      {markedReviewed.has(log.id) ? (
                        <StatusBadge label="Reviewed" variant="positive" />
                      ) : (
                        <StatusBadge label={log.status} variant={statusVariantFor(log.status)} />
                      )}
                    </td>
                    <td className="system-log-action-cell">
                      <AdminRowAction action="view" name={`system log ${log.id}`} onClick={() => setViewLog(log)} />
                    </td>
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
          onPerPage={(n) => { setPerPage(n); setPage(1); }}
          label="system logs"
        />
      </section>

      {/* Log detail drawer */}
      <Drawer
        open={!!viewLog}
        onClose={() => setViewLog(null)}
        title="Log Details"
        footer={
          <>
            <button onClick={() => setViewLog(null)} className="admin-details-button admin-details-button--secondary">Close</button>
            <button
              onClick={() => {
                if (viewLog) setMarkedReviewed((s) => new Set([...s, viewLog.id]));
                setViewLog(null);
              }}
              className="admin-details-button admin-details-button--primary"
            >
              Mark as Reviewed
            </button>
          </>
        }
      >
        {viewLog && (
          <>
            <AdminDetailsSection title="Event Information">
              <AdminDetailGrid>
                <DetailRow label="Log ID" value={<span className="font-mono">{viewLog.id}</span>} />
                <DetailRow label="Date & Time" value={viewLog.dateTime} />
                <DetailRow label="Event Type" value={viewLog.eventType} />
                <DetailRow label="User / Source" value={viewLog.userSource} />
                <DetailRow label="IP Address" value={<span className="font-mono">{viewLog.ip}</span>} />
                <DetailRow label="Severity" value={<StatusBadge label={viewLog.severity} variant={statusVariantFor(viewLog.severity)} />} />
                <DetailRow label="Status" value={
                  markedReviewed.has(viewLog.id)
                    ? <StatusBadge label="Reviewed" variant="positive" />
                    : <StatusBadge label={viewLog.status} variant={statusVariantFor(viewLog.status)} />
                } />
              </AdminDetailGrid>
              <DetailRow label="Description" value={viewLog.description} />
            </AdminDetailsSection>
            <AdminDetailsSection title="Technical Details">
              <pre className="admin-details-code-block">
                {`event_id: ${viewLog.id}
timestamp: ${viewLog.dateTime}
source: ${viewLog.userSource}
event_type: ${viewLog.eventType}
severity: ${viewLog.severity}
status: ${viewLog.status}
ip_address: ${viewLog.ip}
`}
              </pre>
            </AdminDetailsSection>
          </>
        )}
      </Drawer>
    </div>
  );
}
