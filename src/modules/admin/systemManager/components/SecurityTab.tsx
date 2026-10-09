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
  Modal,
  DetailRow,
  SectionTitle,
  Spinner,
} from "./shared";

interface SecurityEvent {
  id: string;
  dateTime: string;
  eventType: string;
  userSource: string;
  ip: string;
  description: string;
  severity: string;
  status: string;
}


const TYPE_OPTIONS = [
  { value: "all", label: "All Security Events" },
  { value: "Failed Login", label: "Failed Login" },
  { value: "Suspicious Login", label: "Suspicious Login" },
  { value: "Permission Change", label: "Permission Change" },
  { value: "Unauthorized Access Attempt", label: "Unauthorized Access" },
  { value: "Security Scan", label: "Security Scan" },
  { value: "Configuration Change", label: "Configuration Change" },
];

const SEV_OPTIONS = [
  { value: "all", label: "All Severities" },
  { value: "Info", label: "Info" },
  { value: "Warning", label: "Warning" },
  { value: "Critical", label: "Critical" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "New", label: "New" },
  { value: "Monitoring", label: "Monitoring" },
  { value: "Resolved", label: "Resolved" },
  { value: "False Positive", label: "False Positive" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "sev-high", label: "Highest Severity" },
  { value: "sev-low", label: "Lowest Severity" },
];

const SEV_ORDER: Record<string, number> = { Critical: 3, Warning: 2, Info: 1 };

export default function SecurityTab() {
  const logState = useAdminCollection(
    useAdminRepository<SecurityEvent>("system-logs"),
  );
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterSev, setFilterSev] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const [viewEvent, setViewEvent] = useState<SecurityEvent | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ event: SecurityEvent; action: string } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [showScanConfirm, setShowScanConfirm] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanDone, setScanDone] = useState(false);

  const events = useMemo(
    () =>
      logState.items.filter(
        (event) =>
          event.eventType.toLowerCase().includes("security") ||
          event.eventType.toLowerCase().includes("login") ||
          event.severity === "Critical",
      ),
    [logState.items],
  );

  const filtered = useMemo(() => {
    let list = events.filter((e) => {
      const q = search.toLowerCase();
      const matchQ = !q || e.id.toLowerCase().includes(q) || e.description.toLowerCase().includes(q) || e.eventType.toLowerCase().includes(q) || e.userSource.toLowerCase().includes(q);
      const matchType = filterType === "all" || e.eventType === filterType;
      const matchSev = filterSev === "all" || e.severity === filterSev;
      const matchStatus = filterStatus === "all" || e.status === filterStatus;
      return matchQ && matchType && matchSev && matchStatus;
    });
    if (sort === "oldest") list = [...list].reverse();
    else if (sort === "sev-high") list = [...list].sort((a, b) => (SEV_ORDER[b.severity] || 0) - (SEV_ORDER[a.severity] || 0));
    else if (sort === "sev-low") list = [...list].sort((a, b) => (SEV_ORDER[a.severity] || 0) - (SEV_ORDER[b.severity] || 0));
    return list;
  }, [events, search, filterType, filterSev, filterStatus, sort]);

  function resetFilters() {
    setSearch(""); setFilterType("all"); setFilterSev("all"); setFilterStatus("all"); setSort("newest"); setPage(1);
  }

  function applyAction(event: SecurityEvent, action: string) {
    const newStatus =
      action === "resolve" ? "Resolved"
      : action === "monitor" ? "Monitoring"
      : action === "false-positive" ? "False Positive"
      : event.status;
    // require confirm for critical resolved / false positive
    if ((event.severity === "Critical" && action === "resolve") || action === "false-positive") {
      setConfirmAction({ event, action });
      return;
    }
    void logState.update(event.id, { status: newStatus });
  }

  function confirmApply() {
    if (!confirmAction) return;
    setActionLoading(true);
    void logState.update(confirmAction.event.id, {
      status:
        confirmAction.action === "resolve"
          ? "Resolved"
          : confirmAction.action === "false-positive"
            ? "False Positive"
            : confirmAction.event.status,
    }).then(() => {
      const newStatus =
        confirmAction.action === "resolve" ? "Resolved"
        : confirmAction.action === "false-positive" ? "False Positive"
        : confirmAction.event.status;
      if (viewEvent?.id === confirmAction.event.id) {
        setViewEvent({ ...confirmAction.event, status: newStatus });
      }
      setActionLoading(false);
      setConfirmAction(null);
    }).catch(() => setActionLoading(false));
  }

  function startScan() {
    setShowScanConfirm(false);
    setScanning(true);
    setScanProgress(100);
    setScanDone(true);
    void logState.create({
      dateTime: new Date().toLocaleString(),
      eventType: "Security Scan",
      userSource: "Current administrator",
      ip: "",
      description: "Manual security review recorded from the admin portal",
      severity: "Info",
      status: "Completed",
    }).finally(() => setScanning(false));
  }

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * perPage, safePage * perPage);
  const criticalCount = events.filter((e) => e.severity === "Critical" && e.status === "New").length;
  const failedLogins = events.filter((e) => e.eventType === "Failed Login").length;
  const newAlertCount = events.filter((e) => e.status === "New").length;

  return (
    <div>
      <SectionTitle title="Security Monitoring" description="Review security events, access attempts, and potential threats." />

      <AdminStats>
        <AdminStatCard label="Security events" value={events.length} hint="All monitored events" tone="purple" active={filterSev === "all" && filterStatus === "all"} onClick={() => { setFilterSev("all"); setFilterStatus("all"); setPage(1); }} actionLabel="Show all security events" />
        <AdminStatCard label="Critical open" value={criticalCount} hint="Critical events marked new" tone="red" active={filterSev === "Critical" && filterStatus === "New"} onClick={() => { setFilterSev("Critical"); setFilterStatus("New"); setPage(1); }} actionLabel="Filter to critical open events" />
        <AdminStatCard label="New alerts" value={newAlertCount} hint="Awaiting review" tone="gold" active={filterStatus === "New" && filterSev === "all"} onClick={() => { setFilterSev("all"); setFilterStatus("New"); setPage(1); }} actionLabel="Filter to new alerts" />
        <AdminStatCard label="Latest security scan" value={events.find(event => event.eventType === "Security Scan")?.dateTime ?? "No record"} hint={`${failedLogins} failed login event${failedLogins === 1 ? "" : "s"}`} tone="blue" />
      </AdminStats>

      {/* Scan progress */}
      {scanning && (
        <div className="mb-4 card-surface p-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-white font-medium flex items-center gap-2">
              {!scanDone && <Spinner size={14} />}
              {scanDone ? "Security scan complete — no threats detected." : "Running security scan…"}
            </span>
            <span className="text-[#9CA3AF]">{Math.round(scanProgress)}%</span>
          </div>
          <div className="progress-bar-bg">
            <div className="progress-bar-fill" style={{ width: `${scanProgress}%`, background: scanDone ? "#10b981" : "#7C3AED" }} />
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-3 mb-4">
        <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search security events..." className="w-full sm:w-64" />
        <Select value={filterType} onChange={(v) => { setFilterType(v); setPage(1); }} options={TYPE_OPTIONS} className="w-full sm:w-52" />
        <Select value={filterSev} onChange={(v) => { setFilterSev(v); setPage(1); }} options={SEV_OPTIONS} className="w-full sm:w-36" />
        <Select value={filterStatus} onChange={(v) => { setFilterStatus(v); setPage(1); }} options={STATUS_OPTIONS} className="w-full sm:w-36" />
        <Select value={sort} onChange={(v) => { setSort(v); setPage(1); }} options={SORT_OPTIONS} className="w-full sm:w-44" />
        <button onClick={resetFilters} className="btn-ghost px-4 py-2 text-sm">Reset Filters</button>
        <button onClick={() => setShowScanConfirm(true)} className="btn-outline px-4 py-2 text-sm whitespace-nowrap sm:ml-auto flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          Run Security Scan
        </button>
      </div>

      <div className="table-surface">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" aria-label="Security Events">
            <thead>
              <tr className="border-b border-stone-700/60">
                {["Event ID", "Date & Time", "Event Type", "User / Source", "IP Address", "Description", "Severity", "Status", "Actions"].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider px-4 py-3 whitespace-nowrap" scope="col">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <EmptyRow cols={9} message="No security events are available." />
              ) : (
                pageRows.map((ev) => (
                  <tr key={ev.id} className="tr-hover border-b border-stone-700/30 last:border-0">
                    <td className="px-4 py-3 font-mono text-xs text-[#9CA3AF] whitespace-nowrap">{ev.id}</td>
                    <td className="px-4 py-3 text-[#9CA3AF] text-xs whitespace-nowrap">{ev.dateTime}</td>
                    <td className="px-4 py-3 text-white whitespace-nowrap text-xs">{ev.eventType}</td>
                    <td className="px-4 py-3 text-[#9CA3AF] text-xs whitespace-nowrap">{ev.userSource}</td>
                    <td className="px-4 py-3 font-mono text-xs text-[#9CA3AF] whitespace-nowrap">{ev.ip}</td>
                    <td className="px-4 py-3 text-[#9CA3AF] text-xs max-w-xs truncate" title={ev.description}>{ev.description}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <StatusBadge label={ev.severity} variant={statusVariantFor(ev.severity)} />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <StatusBadge label={ev.status} variant={statusVariantFor(ev.status)} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5 flex-wrap">
                        <AdminRowAction action="view" name={`security event ${ev.id}`} onClick={() => setViewEvent(ev)} />
                        {ev.status !== "Resolved" && ev.status !== "False Positive" && (
                          <button onClick={() => applyAction(ev, "resolve")} className="btn-ghost px-2.5 py-1 text-xs whitespace-nowrap">Resolve</button>
                        )}
                        {ev.status !== "False Positive" && (
                          <button onClick={() => applyAction(ev, "false-positive")} className="btn-ghost px-2.5 py-1 text-xs whitespace-nowrap">False +</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={safePage} total={filtered.length} perPage={perPage} onPage={setPage} onPerPage={(n) => { setPerPage(n); setPage(1); }} label="security events" />
      </div>

      {/* Event detail drawer */}
      <Drawer
        open={!!viewEvent}
        onClose={() => setViewEvent(null)}
        title="Security Event Details"
        footer={
          <>
            <button onClick={() => setViewEvent(null)} className="btn-ghost px-4 py-2 text-sm">Close</button>
            {viewEvent && viewEvent.status !== "Monitoring" && viewEvent.status !== "Resolved" && viewEvent.status !== "False Positive" && (
              <button onClick={() => { applyAction(viewEvent, "monitor"); setViewEvent(null); }} className="btn-outline px-4 py-2 text-sm">Mark Monitoring</button>
            )}
            {viewEvent && viewEvent.status !== "Resolved" && viewEvent.status !== "False Positive" && (
              <button onClick={() => { applyAction(viewEvent, "resolve"); setViewEvent(null); }} className="btn-outline px-4 py-2 text-sm">Mark Resolved</button>
            )}
            {viewEvent && viewEvent.status !== "False Positive" && (
              <button onClick={() => { applyAction(viewEvent, "false-positive"); setViewEvent(null); }} className="btn-ghost px-4 py-2 text-sm">False Positive</button>
            )}
          </>
        }
      >
        {viewEvent && (
          <div className="space-y-4">
            <DetailRow label="Event ID" value={<span className="font-mono">{viewEvent.id}</span>} />
            <DetailRow label="Date & Time" value={viewEvent.dateTime} />
            <DetailRow label="Event Type" value={viewEvent.eventType} />
            <DetailRow label="Source" value={viewEvent.userSource} />
            <DetailRow label="IP Address" value={<span className="font-mono">{viewEvent.ip}</span>} />
            <DetailRow label="Description" value={viewEvent.description} />
            <DetailRow label="Severity" value={<StatusBadge label={viewEvent.severity} variant={statusVariantFor(viewEvent.severity)} />} />
            <DetailRow label="Status" value={<StatusBadge label={viewEvent.status} variant={statusVariantFor(viewEvent.status)} />} />
            <div>
              <span className="text-xs text-[#9CA3AF] uppercase tracking-wider">Technical Details</span>
              <pre className="mt-1.5 text-xs bg-[var(--color-ink)] p-3 rounded border border-stone-700 text-[#9CA3AF] whitespace-pre-wrap font-mono leading-relaxed">
                {`event_id: ${viewEvent.id}
timestamp: ${viewEvent.dateTime}
source: ${viewEvent.userSource}
event_type: ${viewEvent.eventType}
severity: ${viewEvent.severity}
ip_address: ${viewEvent.ip}
user_agent: Mozilla/5.0 (compatible)
geo: Unknown
attempts: ${Math.floor(Math.random() * 10) + 1}`}
              </pre>
            </div>
          </div>
        )}
      </Drawer>

      {/* Confirm action modal */}
      <Modal
        open={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        title={confirmAction?.action === "false-positive" ? "Mark as False Positive?" : "Mark as Resolved?"}
        footer={
          <>
            <button onClick={() => setConfirmAction(null)} className="btn-ghost px-4 py-2 text-sm">Cancel</button>
            <button onClick={confirmApply} disabled={actionLoading} className="btn-primary px-4 py-2 text-sm flex items-center gap-2">
              {actionLoading && <Spinner size={14} />}
              Confirm
            </button>
          </>
        }
      >
        <p className="text-sm text-[#9CA3AF] leading-relaxed">
          {confirmAction?.action === "false-positive"
            ? `Mark security event ${confirmAction?.event.id} as a false positive? This action indicates the event does not represent a real threat.`
            : `Mark critical security event ${confirmAction?.event.id} as resolved? Ensure the underlying issue has been fully addressed before confirming.`}
        </p>
      </Modal>

      {/* Scan confirm */}
      <Modal
        open={showScanConfirm}
        onClose={() => setShowScanConfirm(false)}
        title="Run security scan?"
        footer={
          <>
            <button onClick={() => setShowScanConfirm(false)} className="btn-ghost px-4 py-2 text-sm">Cancel</button>
            <button onClick={startScan} className="btn-primary px-4 py-2 text-sm">Start Scan</button>
          </>
        }
      >
        <p className="text-sm text-[#9CA3AF] leading-relaxed">
          The scan will check system configurations, authentication activity, and potential security threats. This may take a few minutes.
        </p>
      </Modal>
    </div>
  );
}
