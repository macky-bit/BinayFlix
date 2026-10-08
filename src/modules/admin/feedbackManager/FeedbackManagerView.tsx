import { useState, useEffect, useCallback, useMemo } from "react";
import { useAdminCollection, useAdminRepository } from "../data";
import { AdminPageHeader, AdminStatCard, AdminStats } from "../components/AdminUI";
import AdminDetailsPanel, {
  AdminDetailField,
  AdminDetailsSection,
} from "../components/AdminDetailsPanel";
// ─── Types ────────────────────────────────────────────────────────────────────

type FeedbackType = "Bug Report" | "Feature Request" | "Suggestion" | "Support Request";
type FeedbackStatus = "Open" | "In Progress" | "Closed";

interface FeedbackItem {
  id: string;
  subscriberId: string;
  type: FeedbackType;
  subject: string;
  description: string;
  date: string;
  status: FeedbackStatus;
  screenshot?: string;
}


// ─── Utility Helpers ──────────────────────────────────────────────────────────

function getTypeBadgeClass(type: FeedbackType) {
  if (type === "Bug Report") return "badge-bug";
  if (type === "Feature Request") return "badge-feature";
  return "badge-suggestion";
}

function getStatusBadgeClass(status: FeedbackStatus) {
  if (status === "Open") return "badge-open";
  if (status === "In Progress") return "badge-inprogress";
  return "badge-closed";
}

function StatusDot({ status }: { status: FeedbackStatus }) {
  const color =
    status === "Open" ? "#86EFAC" : status === "In Progress" ? "#FCD34D" : "#9CA3AF";
  return (
    <span
      style={{ background: color, width: 7, height: 7, borderRadius: "50%", display: "inline-block", marginRight: 5 }}
    />
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Spinner({ size = 20 }: { size?: number }) {
  return (
    <span
      className="spinner"
      style={{ width: size, height: size, display: "inline-block" }}
      aria-label="Loading"
    />
  );
}

function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div
      className="toast-in"
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        background: "rgba(21,13,42,0.97)",
        border: "1px solid #7C3AED",
        borderRadius: 8,
        padding: "12px 18px",
        color: "#fff",
        fontSize: 14,
        display: "flex",
        alignItems: "center",
        gap: 10,
        zIndex: 9999,
        boxShadow: "0 4px 24px rgba(0,0,0,0.5), 0 0 12px rgba(124,58,237,0.3)",
      }}
    >
      <span style={{ color: "#86EFAC", fontSize: 16 }}>✓</span>
      {message}
    </div>
  );
}

function ScreenshotModal({ src, onClose }: { src: string; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.85)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Full-size screenshot"
    >
      <div
        style={{ position: "relative", maxWidth: "90vw", maxHeight: "90vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={src}
          alt="Full-size screenshot"
          style={{ maxWidth: "90vw", maxHeight: "85vh", borderRadius: 8, objectFit: "contain", display: "block" }}
        />
        <button
          onClick={onClose}
          className="focus-ring"
          style={{
            position: "absolute", top: -16, right: -16,
            background: "var(--color-ink-soft)",
            border: "1px solid var(--color-wine)",
            color: "#fff",
            borderRadius: "50%",
            width: 32, height: 32,
            cursor: "pointer",
            fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center",
          }}
          aria-label="Close screenshot"
        >
          ×
        </button>
      </div>
    </div>
  );
}

function DiscardDialog({
  onContinue,
  onDiscard,
}: {
  onContinue: () => void;
  onDiscard: () => void;
}) {
  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 800,
        background: "rgba(0,0,0,0.7)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      <div
        className="fade-in"
        style={{
          background: "var(--color-ink-soft)",
          border: "1px solid var(--color-wine)",
          borderRadius: 12,
          padding: 28,
          maxWidth: 360,
          width: "90%",
          boxShadow: "0 8px 40px rgba(0,0,0,0.6)",
        }}
        role="alertdialog"
        aria-labelledby="discard-title"
        aria-describedby="discard-desc"
      >
        <h3 id="discard-title" style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>
          Discard status change?
        </h3>
        <p id="discard-desc" style={{ color: "var(--color-taupe)", fontSize: 14, marginBottom: 24, lineHeight: 1.5 }}>
          Your selected status has not been saved.
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            className="btn-violet focus-ring"
            style={{ borderRadius: 7, padding: "8px 16px", fontSize: 14 }}
            onClick={onContinue}
          >
            Continue Editing
          </button>
          <button
            className="btn-gold focus-ring"
            style={{ borderRadius: 7, padding: "8px 16px", fontSize: 14 }}
            onClick={onDiscard}
          >
            Discard Changes
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Feedback Details Panel ───────────────────────────────────────────────────

function FeedbackDetailsPanel({
  item,
  onClose,
  onStatusSaved,
}: {
  item: FeedbackItem;
  onClose: () => void;
  onStatusSaved: (id: string, status: FeedbackStatus) => void;
}) {
  const [selectedStatus, setSelectedStatus] = useState<FeedbackStatus>(item.status);
  const [saving, setSaving] = useState(false);
  const [showScreenshot, setShowScreenshot] = useState(false);
  const [imgLoading, setImgLoading] = useState(true);
  const [imgError, setImgError] = useState(false);
  const [showDiscard, setShowDiscard] = useState(false);
  const originalStatus = item.status;
  const hasUnsaved = selectedStatus !== originalStatus;

  useEffect(() => {
    setSelectedStatus(item.status);
    setImgLoading(true);
    setImgError(false);
  }, [item.id, item.status]);

  const handleClose = () => {
    if (hasUnsaved) {
      setShowDiscard(true);
    } else {
      onClose();
    }
  };

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 700));
    onStatusSaved(item.id, selectedStatus);
    setSaving(false);
  };

  return (
    <>
      {showDiscard && (
        <DiscardDialog
          onContinue={() => setShowDiscard(false)}
          onDiscard={() => { setShowDiscard(false); onClose(); }}
        />
      )}
      {showScreenshot && item.screenshot && (
        <ScreenshotModal src={item.screenshot} onClose={() => setShowScreenshot(false)} />
      )}

      <AdminDetailsPanel
        title="Feedback Details"
        onClose={handleClose}
        footer={(
          <div className="admin-details-actions">
            <button onClick={handleClose} className="admin-details-button admin-details-button--secondary">Close</button>
            <button onClick={handleSave} disabled={!hasUnsaved || saving} className="admin-details-button admin-details-button--primary">
              {saving && <Spinner size={14} />} Save Status
            </button>
          </div>
        )}
      >

      <AdminDetailsSection title="Feedback Information">
        {[
          { label: "Feedback ID", value: <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>{item.id}</span> },
          { label: "Subscriber ID", value: <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>{item.subscriberId}</span> },
          {
            label: "Feedback Type",
            value: (
              <span className={`${getTypeBadgeClass(item.type)}`} style={{ borderRadius: 6, padding: "2px 10px", fontSize: 12, fontWeight: 500 }}>
                {item.type}
              </span>
            ),
          },
          { label: "Subject", value: <span style={{ fontSize: 14, fontWeight: 500 }}>{item.subject}</span> },
          {
            label: "Description",
            value: (
              <p style={{ fontSize: 13, lineHeight: 1.6, color: "var(--color-taupe)", margin: 0 }}>
                {item.description}
              </p>
            ),
          },
        ].map(({ label, value }) => (
          <AdminDetailField key={label} label={label}>{value}</AdminDetailField>
        ))}

        {/* Screenshot */}
        <AdminDetailField label="Screenshot">
          <div>
            {item.screenshot ? (
              <div>
                <div
                  style={{
                    border: "1px solid var(--color-stone)",
                    borderRadius: 8,
                    overflow: "hidden",
                    position: "relative",
                    background: "#1a1030",
                    minHeight: 120,
                  }}
                >
                  {imgLoading && !imgError && (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 120 }}>
                      <Spinner />
                    </div>
                  )}
                  {imgError ? (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 120, fontSize: 13, color: "var(--color-taupe)" }}>
                      Failed to load screenshot.
                    </div>
                  ) : (
                    <img
                      src={item.screenshot}
                      alt={`Screenshot for feedback ${item.id}`}
                      style={{ width: "100%", display: imgLoading ? "none" : "block", objectFit: "cover" }}
                      onLoad={() => setImgLoading(false)}
                      onError={() => { setImgLoading(false); setImgError(true); }}
                    />
                  )}
                </div>
                {!imgError && (
                  <button
                    className="btn-violet focus-ring"
                    style={{ marginTop: 8, borderRadius: 6, padding: "6px 14px", fontSize: 12, width: "100%" }}
                    onClick={() => setShowScreenshot(true)}
                  >
                    View Full Image
                  </button>
                )}
              </div>
            ) : (
              <span style={{ fontSize: 13, color: "var(--color-taupe)" }}>No screenshot was included.</span>
            )}
          </div>
        </AdminDetailField>

        <AdminDetailField label="Submission Date" value={item.date} />
      </AdminDetailsSection>

      <AdminDetailsSection title="Status">
        <AdminDetailField label="Status">
          <div style={{ position: "relative" }}>
            <select
              className="select-dark focus-ring"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as FeedbackStatus)}
              style={{ borderRadius: 8, padding: "8px 32px 8px 12px", fontSize: 13, width: "100%", display: "flex", alignItems: "center" }}
              aria-label="Update feedback status"
            >
              {(["Open", "In Progress", "Closed"] as FeedbackStatus[]).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--color-taupe)", fontSize: 11 }}>▼</span>
          </div>
        </AdminDetailField>
      </AdminDetailsSection>

      </AdminDetailsPanel>
    </>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function FeedbackManagerView() {
  const feedbackState = useAdminCollection(
    useAdminRepository<FeedbackItem>("feedback"),
  );
  const feedback = feedbackState.items;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All Feedback Types");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [dateFilter, setDateFilter] = useState("All Dates");
  const [sort, setSort] = useState("Newest First");
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<string | null>(null);
  const [customDateOpen, setCustomDateOpen] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [appliedStart, setAppliedStart] = useState("");
  const [appliedEnd, setAppliedEnd] = useState("");

  // Simulate loading
  const triggerLoad = useCallback(() => {
    setLoading(true);
    setTimeout(() => setLoading(false), 500);
  }, []);

  useEffect(() => { triggerLoad(); }, [search, typeFilter, statusFilter, dateFilter, sort]);

  // Filtering & sorting
  const filtered = useMemo(() => {
    let list = [...feedback];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (f) =>
          f.id.toLowerCase().includes(q) ||
          f.subscriberId.toLowerCase().includes(q) ||
          f.subject.toLowerCase().includes(q) ||
          f.description.toLowerCase().includes(q)
      );
    }
    if (typeFilter !== "All Feedback Types") {
      list = list.filter((f) => f.type === typeFilter);
    }
    if (statusFilter !== "All Statuses") {
      list = list.filter((f) => f.status === statusFilter);
    }

    if (sort === "Newest First") {
      list = list.sort((a, b) => b.id.localeCompare(a.id));
    } else if (sort === "Oldest First") {
      list = list.sort((a, b) => a.id.localeCompare(b.id));
    } else if (sort === "Subject A–Z") {
      list = list.sort((a, b) => a.subject.localeCompare(b.subject));
    } else if (sort === "Subject Z–A") {
      list = list.sort((a, b) => b.subject.localeCompare(a.subject));
    }

    return list;
  }, [feedback, search, typeFilter, statusFilter, dateFilter, sort, appliedStart, appliedEnd]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const paginated = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);
  const selectedItem = feedback.find((f) => f.id === selectedId) ?? null;

  const resetFilters = () => {
    setSearch("");
    setTypeFilter("All Feedback Types");
    setStatusFilter("All Statuses");
    setDateFilter("All Dates");
    setSort("Newest First");
    setPage(1);
    setAppliedStart("");
    setAppliedEnd("");
    setStartDate("");
    setEndDate("");
  };

  const handleStatusSaved = (id: string, status: FeedbackStatus) => {
    void feedbackState
      .update(id, { status })
      .then(() => setToast("Feedback status updated successfully."))
      .catch((error: Error) => setToast(error.message));
  };

  const toggleCheck = (id: string) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (checkedIds.size === paginated.length) {
      setCheckedIds(new Set());
    } else {
      setCheckedIds(new Set(paginated.map((f) => f.id)));
    }
  };

  const handleDateFilterChange = (val: string) => {
    setDateFilter(val);
    setCustomDateOpen(val === "Custom Date");
    if (val !== "Custom Date") {
      setAppliedStart("");
      setAppliedEnd("");
    }
    setPage(1);
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-ink)", color: "#fff", fontFamily: "Inter, sans-serif" }}>

      {/* Toast */}
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}

      {/* ── Navbar ─────────────────────────────────────────────────────────── */}
      {/* ── Page content ───────────────────────────────────────────────────── */}
      <main className="admin-page-shell">

        {/* Header */}
        <AdminPageHeader
          eyebrow="Member voice"
          title="Feedback Management"
          description="Review member reports and suggestions, inspect supporting details, and keep resolution status current."
        />

        <AdminStats>
          <AdminStatCard label="Total feedback" value={feedback.length} hint="Loaded submissions" tone="purple" />
          <AdminStatCard label="Open" value={feedback.filter((item) => item.status === "Open").length} hint="Awaiting review" tone="blue" />
          <AdminStatCard label="In progress" value={feedback.filter((item) => item.status === "In Progress").length} hint="Currently being handled" tone="gold" />
          <AdminStatCard label="Closed" value={feedback.filter((item) => item.status === "Closed").length} hint="Completed submissions" tone="green" />
        </AdminStats>

        {/* ── Filter row ─────────────────────────────────────────────────── */}
        <div
          style={{
            display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 20, alignItems: "center",
          }}
          role="search"
          className="admin-filter-row"
          aria-label="Filter and search feedback"
        >
          {/* Search */}
          <div style={{ position: "relative", flex: "1 1 220px", minWidth: 180 }}>
            <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--color-taupe)", fontSize: 15, pointerEvents: "none" }}>⌕</span>
            <input
              type="search"
              maxLength={100}
              placeholder="Search by subject or user..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              aria-label="Search feedback"
              className="focus-ring"
              style={{
                background: "rgba(26,16,48,0.8)",
                border: "1px solid var(--color-stone)",
                borderRadius: 8,
                color: "#fff",
                padding: "9px 12px 9px 32px",
                fontSize: 14,
                width: "100%",
                outline: "none",
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "var(--color-wine)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "var(--color-stone)"; }}
            />
          </div>

          {/* Type filter */}
          <div style={{ position: "relative" }}>
            <select
              className="select-dark focus-ring"
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
              style={{ borderRadius: 8, padding: "9px 32px 9px 12px", fontSize: 14 }}
              aria-label="Filter by feedback type"
            >
              {["All Feedback Types", "Bug Report", "Feature Request", "Suggestion", "Support Request"].map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
            <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--color-taupe)", fontSize: 11 }}>▼</span>
          </div>

          {/* Status filter */}
          <div style={{ position: "relative" }}>
            <select
              className="select-dark focus-ring"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              style={{ borderRadius: 8, padding: "9px 32px 9px 12px", fontSize: 14 }}
              aria-label="Filter by status"
            >
              {["All Statuses", "Open", "In Progress", "Closed"].map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
            <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--color-taupe)", fontSize: 11 }}>▼</span>
          </div>

          {/* Date filter */}
          <div style={{ position: "relative" }}>
            <select
              className="select-dark focus-ring"
              value={dateFilter}
              onChange={(e) => handleDateFilterChange(e.target.value)}
              style={{ borderRadius: 8, padding: "9px 32px 9px 12px", fontSize: 14 }}
              aria-label="Filter by date"
            >
              {["All Dates", "Today", "This Week", "This Month", "Custom Date"].map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
            <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--color-taupe)", fontSize: 11 }}>▼</span>
          </div>

          {/* Reset */}
          <button
            className="btn-violet focus-ring"
            style={{ borderRadius: 8, padding: "9px 18px", fontSize: 14, fontWeight: 500, whiteSpace: "nowrap" }}
            onClick={resetFilters}
          >
            Reset Filters
          </button>

          {/* Sort */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}>
            <span style={{ fontSize: 14, color: "var(--color-taupe)", whiteSpace: "nowrap" }}>Sort:</span>
            <div style={{ position: "relative" }}>
              <select
                className="select-dark focus-ring"
                value={sort}
                onChange={(e) => { setSort(e.target.value); setPage(1); }}
                style={{ borderRadius: 8, padding: "9px 32px 9px 12px", fontSize: 14 }}
                aria-label="Sort feedback"
              >
                {["Newest First", "Oldest First", "Subject A–Z", "Subject Z–A"].map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
              <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--color-taupe)", fontSize: 11 }}>▼</span>
            </div>
          </div>
        </div>

        {/* Custom date row */}
        {customDateOpen && (
          <div className="fade-in" style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: 12, color: "var(--color-taupe)" }}>Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="select-dark focus-ring"
                style={{ borderRadius: 8, padding: "7px 12px", fontSize: 13, colorScheme: "dark" }}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: 12, color: "var(--color-taupe)" }}>End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="select-dark focus-ring"
                style={{ borderRadius: 8, padding: "7px 12px", fontSize: 13, colorScheme: "dark" }}
              />
            </div>
            <button
              className="btn-gold focus-ring"
              style={{ borderRadius: 8, padding: "8px 18px", fontSize: 13, marginTop: 18 }}
              onClick={() => { setAppliedStart(startDate); setAppliedEnd(endDate); setPage(1); }}
            >
              Apply
            </button>
            <button
              className="btn-violet focus-ring"
              style={{ borderRadius: 8, padding: "8px 14px", fontSize: 13, marginTop: 18 }}
              onClick={() => { setCustomDateOpen(false); setDateFilter("All Dates"); setAppliedStart(""); setAppliedEnd(""); }}
            >
              Cancel
            </button>
          </div>
        )}

        {/* ── Two-column workspace ────────────────────────────────────────── */}
        <div
          className="admin-feedback-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: 16,
            alignItems: "start",
          }}
        >
          {/* ── Table column ──────────────────────────────────────────────── */}
          <div>
            <div
              className="panel-surface"
              style={{ borderRadius: 12, overflow: "hidden" }}
            >
              {loading ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 60, gap: 12, color: "var(--color-taupe)" }}>
                  <Spinner size={22} />
                  <span style={{ fontSize: 14 }}>Loading feedback...</span>
                </div>
              ) : filtered.length === 0 ? (
                <div style={{ padding: 60, textAlign: "center" }}>
                  <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.3 }}>📋</div>
                  <p style={{ color: "var(--color-taupe)", fontSize: 14, margin: "0 0 16px" }}>
                    {search || typeFilter !== "All Feedback Types" || statusFilter !== "All Statuses" || dateFilter !== "All Dates"
                      ? "No feedback matches your search or selected filters."
                      : "No feedback has been submitted yet."}
                  </p>
                  {(search || typeFilter !== "All Feedback Types" || statusFilter !== "All Statuses" || dateFilter !== "All Dates") && (
                    <button className="btn-violet focus-ring" style={{ borderRadius: 8, padding: "8px 18px", fontSize: 13 }} onClick={resetFilters}>
                      Reset Filters
                    </button>
                  )}
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }} role="grid" aria-label="Feedback table">
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--color-stone)", background: "rgba(18,11,34,0.6)" }}>
                        <th style={{ padding: "12px 14px", width: 36 }}>
                          <input
                            type="checkbox"
                            aria-label="Select all visible rows"
                            checked={paginated.length > 0 && checkedIds.size === paginated.length}
                            onChange={toggleAll}
                            style={{ accentColor: "var(--color-wine)", cursor: "pointer" }}
                          />
                        </th>
                        {["Feedback ID", "Subscriber ID", "Feedback Type", "Subject", "Submission Date", "Status", "Actions"].map((col) => (
                          <th
                            key={col}
                            style={{
                              padding: "12px 12px", textAlign: "left", fontSize: 13, fontWeight: 600,
                              color: "var(--color-taupe)", whiteSpace: "nowrap",
                              cursor: ["Feedback ID", "Subject", "Submission Date"].includes(col) ? "pointer" : "default",
                            }}
                            onClick={() => {
                              if (col === "Subject") setSort(sort === "Subject A–Z" ? "Subject Z–A" : "Subject A–Z");
                              if (col === "Submission Date") setSort(sort === "Newest First" ? "Oldest First" : "Newest First");
                            }}
                            aria-sort={
                              col === "Subject"
                                ? sort === "Subject A–Z" ? "ascending" : sort === "Subject Z–A" ? "descending" : "none"
                                : col === "Submission Date"
                                ? sort === "Oldest First" ? "ascending" : sort === "Newest First" ? "descending" : "none"
                                : undefined
                            }
                          >
                            {col}
                            {col === "Subject" && (sort === "Subject A–Z" ? " ↑" : sort === "Subject Z–A" ? " ↓" : "")}
                            {col === "Submission Date" && (sort === "Oldest First" ? " ↑" : sort === "Newest First" ? " ↓" : "")}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {paginated.map((item) => {
                        const isSelected = selectedId === item.id;
                        return (
                          <tr
                            key={item.id}
                            className={`table-row-hover ${isSelected ? "table-row-selected" : ""}`}
                            style={{
                              borderBottom: "1px solid rgba(55,65,81,0.5)",
                              cursor: "pointer",
                              transition: "background 0.15s",
                            }}
                            onClick={() => setSelectedId(item.id)}
                            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelectedId(item.id); } }}
                            tabIndex={0}
                            role="row"
                            aria-selected={isSelected}
                          >
                            <td style={{ padding: "12px 14px" }} onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={checkedIds.has(item.id)}
                                onChange={() => toggleCheck(item.id)}
                                aria-label={`Select feedback ${item.id}`}
                                style={{ accentColor: "var(--color-wine)", cursor: "pointer" }}
                              />
                            </td>
                            <td style={{ padding: "12px 12px", fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#C4B5FD", whiteSpace: "nowrap" }}>
                              {item.id}
                            </td>
                            <td style={{ padding: "12px 12px", fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "var(--color-taupe)", whiteSpace: "nowrap" }}>
                              {item.subscriberId}
                            </td>
                            <td style={{ padding: "12px 12px" }}>
                              <span
                                className={getTypeBadgeClass(item.type)}
                                style={{ borderRadius: 6, padding: "3px 10px", fontSize: 12, fontWeight: 500, whiteSpace: "nowrap" }}
                              >
                                {item.type}
                              </span>
                            </td>
                            <td style={{ padding: "12px 12px", fontSize: 13, maxWidth: 200 }}>
                              <span
                                style={{
                                  display: "-webkit-box",
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: "vertical",
                                  overflow: "hidden",
                                }}
                              >
                                {item.subject}
                              </span>
                            </td>
                            <td style={{ padding: "12px 12px", fontSize: 12, color: "var(--color-taupe)", whiteSpace: "nowrap" }}>
                              {item.date}
                            </td>
                            <td style={{ padding: "12px 12px" }}>
                              <span
                                className={getStatusBadgeClass(item.status)}
                                style={{ borderRadius: 6, padding: "3px 10px", fontSize: 12, fontWeight: 500, display: "inline-flex", alignItems: "center", whiteSpace: "nowrap" }}
                              >
                                <StatusDot status={item.status} />
                                {item.status}
                              </span>
                            </td>
                            <td style={{ padding: "12px 12px" }} onClick={(e) => e.stopPropagation()}>
                              <button
                                className="btn-violet focus-ring"
                                style={{ borderRadius: 6, padding: "5px 14px", fontSize: 12, fontWeight: 500 }}
                                onClick={() => setSelectedId(item.id)}
                                aria-label={`View feedback ${item.id}`}
                              >
                                View
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* ── Pagination ──────────────────────────────────────────────── */}
            {!loading && filtered.length > 0 && (
              <div
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  flexWrap: "wrap", gap: 10,
                  padding: "14px 4px",
                  fontSize: 13, color: "var(--color-taupe)",
                }}
                aria-label="Pagination"
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span>{checkedIds.size} selected</span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ marginRight: 8 }}>
                    Showing {(page - 1) * rowsPerPage + 1}–{Math.min(page * rowsPerPage, filtered.length)} of {filtered.length} feedback items
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="focus-ring"
                    aria-label="Previous page"
                    style={{
                      background: "rgba(26,16,48,0.6)", border: "1px solid var(--color-stone)",
                      color: page === 1 ? "var(--color-stone)" : "#fff",
                      borderRadius: 6, width: 30, height: 30, cursor: page === 1 ? "not-allowed" : "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14,
                    }}
                  >
                    ‹
                  </button>

                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let p: number;
                    if (totalPages <= 5) p = i + 1;
                    else if (page <= 3) p = i + 1;
                    else if (page >= totalPages - 2) p = totalPages - 4 + i;
                    else p = page - 2 + i;
                    return p;
                  }).map((p, idx, arr) => {
                    const showEllipsis = idx === arr.length - 1 && p < totalPages - 1;
                    return (
                      <span key={p} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <button
                          onClick={() => setPage(p)}
                          className="focus-ring"
                          aria-label={`Page ${p}`}
                          aria-current={page === p ? "page" : undefined}
                          style={{
                            width: 30, height: 30, borderRadius: 6, border: "1px solid",
                            borderColor: page === p ? "var(--color-wine)" : "var(--color-stone)",
                            background: page === p ? "var(--color-wine)" : "rgba(26,16,48,0.6)",
                            color: "#fff",
                            cursor: "pointer",
                            fontSize: 13, fontWeight: page === p ? 700 : 400,
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}
                        >
                          {p}
                        </button>
                        {showEllipsis && <span style={{ color: "var(--color-taupe)" }}>…</span>}
                      </span>
                    );
                  })}

                  {totalPages > 5 && (
                    <button
                      onClick={() => setPage(totalPages)}
                      className="focus-ring"
                      aria-label={`Page ${totalPages}`}
                      style={{
                        width: 30, height: 30, borderRadius: 6, border: "1px solid",
                        borderColor: page === totalPages ? "var(--color-wine)" : "var(--color-stone)",
                        background: page === totalPages ? "var(--color-wine)" : "rgba(26,16,48,0.6)",
                        color: "#fff",
                        cursor: "pointer",
                        fontSize: 13, fontWeight: page === totalPages ? 700 : 400,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}
                    >
                      {totalPages}
                    </button>
                  )}

                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="focus-ring"
                    aria-label="Next page"
                    style={{
                      background: "rgba(26,16,48,0.6)", border: "1px solid var(--color-stone)",
                      color: page === totalPages ? "var(--color-stone)" : "#fff",
                      borderRadius: 6, width: 30, height: 30, cursor: page === totalPages ? "not-allowed" : "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14,
                    }}
                  >
                    ›
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── Details panel ─────────────────────────────────────────────── */}
          {selectedItem && (
            <FeedbackDetailsPanel
              key={selectedItem.id}
              item={selectedItem}
              onClose={() => setSelectedId(null)}
              onStatusSaved={handleStatusSaved}
            />
          )}
        </div>
      </main>
    </div>
  );
}
