import { useState, useEffect, useCallback } from "react";
import {
  useAdminCollection,
  useAdminRepository,
} from "../data";
import { AdminPageHeader, AdminRowAction, AdminStatCard, AdminStats, AdminWorkspaceTabs } from "../components/AdminUI";
import AdminDetailsPanel from "../components/AdminDetailsPanel";
import { REACTION_DEFINITIONS } from "../../../shared/reactions";
import ContentCommentsWorkspace from "./ContentCommentsWorkspace";
import ReactionsWorkspace from "./ReactionsWorkspace";
// ── Types ──────────────────────────────────────────────────────────────────

type MainTab = "reactions" | "content-comments";
type PostStatus = "Active" | "Hidden" | "Deleted";

interface Reaction {
  id: string;
  subscriberId: string;
  emoji: string;
  label: string;
  date: string;
}

interface Review {
  id: string;
  subscriberId: string;
  contentTitle: string;
  contentCategory: string;
  contentYear: number;
  contentThumb: string;
  rating: number;
  text: string;
  date: string;
  reactions: Reaction[];
}

interface Post {
  id: string;
  subscriberId: string;
  title: string;
  content: string;
  datePosted: string;
  status: PostStatus;
  commentCount: number;
}

interface Comment {
  id: string;
  postId: string;
  postTitle: string;
  subscriberId: string;
  text: string;
  dateCommented: string;
}

function shortId(id: string) {
  if (id.length <= 12) return id;
  return `${id.slice(0, 6)}…${id.slice(-4)}`;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function StarRating({ rating, max = 5 }: { rating: number; max?: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of ${max} stars`}>
      {Array.from({ length: max }).map((_, i) => (
        <svg key={i} className="w-3.5 h-3.5" viewBox="0 0 20 20" fill={i < rating ? "#F5A800" : "none"} stroke={i < rating ? "#F5A800" : "#4B5563"} strokeWidth="1.5">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="ml-1 text-xs" style={{ color: "#9CA3AF" }}>{rating}.0</span>
    </div>
  );
}

function StatusBadge({ status }: { status: PostStatus }) {
  const styles: Record<PostStatus, string> = {
    Active: "bg-green-900/40 text-green-400 border border-green-700/50",
    Hidden: "bg-yellow-900/40 text-yellow-400 border border-yellow-700/50",
    Deleted: "bg-red-900/40 text-red-400 border border-red-700/50",
  };
  const dots: Record<PostStatus, string> = {
    Active: "bg-green-400",
    Hidden: "bg-yellow-400",
    Deleted: "bg-red-400",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dots[status]}`} />
      {status}
    </span>
  );
}

function ReactionSummary({ reactions }: { reactions: Reaction[] }) {
  const counts: Record<string, number> = {};
  reactions.forEach(r => { counts[r.emoji] = (counts[r.emoji] || 0) + 1; });
  const hasAny = reactions.length > 0;
  return (
    <div className="flex flex-wrap gap-2">
      {REACTION_DEFINITIONS.map(({ emoji, label }) => {
        const count = counts[emoji] || 0;
        if (!hasAny && count === 0) return null;
        return (
          <span key={emoji} className="flex flex-col items-center gap-0.5" aria-label={`${label}: ${count}`}>
            <span className="text-base leading-none">{emoji}</span>
            <span className="text-xs" style={{ color: count > 0 ? "#9CA3AF" : "#374151" }}>{count}</span>
          </span>
        );
      })}
      {!hasAny && <span style={{ color: "#4B5563" }} className="text-xs">—</span>}
    </div>
  );
}

function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium text-white shadow-lg"
      style={{ background: "linear-gradient(135deg,#7C3AED,#4C1D95)", border: "1px solid #7C3AED" }}>
      <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
      {message}
    </div>
  );
}

function ConfirmDialog({ title, message, confirmLabel, onConfirm, onCancel }: { title: string; message: string; confirmLabel: string; onConfirm: () => void; onCancel: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onCancel]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }}>
      <div className="rounded-xl p-6 w-full max-w-md shadow-2xl" style={{ background: "#150D2A", border: "1px solid #7C3AED" }}>
        <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
        <p className="text-sm mb-6" style={{ color: "#9CA3AF" }}>{message}</p>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 rounded-lg text-sm font-medium transition-fast" style={{ background: "rgba(55,65,81,0.5)", color: "#9CA3AF", border: "1px solid #374151" }}
            onMouseEnter={e => { (e.target as HTMLElement).style.color = "#fff"; }}
            onMouseLeave={e => { (e.target as HTMLElement).style.color = "#9CA3AF"; }}>
            Cancel
          </button>
          <button onClick={onConfirm} className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-fast"
            style={{ background: "rgba(185,28,28,0.15)", border: "1px solid #991B1B", color: "#FCA5A5" }}
            onMouseEnter={e => { (e.target as HTMLElement).style.background = "rgba(185,28,28,0.3)"; }}
            onMouseLeave={e => { (e.target as HTMLElement).style.background = "rgba(185,28,28,0.15)"; }}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function ReviewsTab({ toast }: { toast: (msg: string) => void }) {
  const [search, setSearch] = useState("");
  const [filterContent, setFilterContent] = useState("All Content");
  const [filterRating, setFilterRating] = useState("All Ratings");
  const [filterDate, setFilterDate] = useState("All Dates");
  const [sort, setSort] = useState("Newest First");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);
  const [drawerReview, setDrawerReview] = useState<Review | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ type: "review" | "reaction" | "bulk"; id?: string; reviewId?: string } | null>(null);
  const reviewsState = useAdminCollection(
    useAdminRepository<Review>("reviews"),
  );
  const reactionsState = useAdminCollection(
    useAdminRepository<Reaction>("reactions"),
  );
  const reviews = reviewsState.items;
  const [loading, setLoading] = useState(false);

  const categories = ["All Content", ...Array.from(new Set(reviews.map(r => r.contentCategory)))];
  const ratingOptions = ["All Ratings", "5 Stars", "4 Stars", "3 Stars", "2 Stars", "1 Star"];
  const dateOptions = ["All Dates", "Today", "This Week", "This Month"];
  const sortOptions = ["Newest First", "Oldest First", "Highest Rating", "Lowest Rating", "Most Reactions"];

  const filtered = reviews.filter(r => {
    const q = search.toLowerCase();
    const matchSearch = !q || r.id.toLowerCase().includes(q) || r.subscriberId.toLowerCase().includes(q) || r.contentTitle.toLowerCase().includes(q) || r.text.toLowerCase().includes(q);
    const matchContent = filterContent === "All Content" || r.contentCategory === filterContent;
    const matchRating = filterRating === "All Ratings" || r.rating === parseInt(filterRating);
    return matchSearch && matchContent && matchRating;
  }).sort((a, b) => {
    if (sort === "Highest Rating") return b.rating - a.rating;
    if (sort === "Lowest Rating") return a.rating - b.rating;
    if (sort === "Most Reactions") return b.reactions.length - a.reactions.length;
    if (sort === "Oldest First") return a.id.localeCompare(b.id);
    return b.id.localeCompare(a.id);
  });

  const paged = filtered.slice((page - 1) * perPage, page * perPage);
  const allSelected = paged.length > 0 && paged.every(r => selected.has(r.id));

  const reset = () => { setSearch(""); setFilterContent("All Content"); setFilterRating("All Ratings"); setFilterDate("All Dates"); setSort("Newest First"); setPage(1); setSelected(new Set()); };

  const doDeleteReview = (id: string) => {
    setLoading(true);
    void reviewsState.remove(id).then(() => {
      if (drawerReview?.id === id) setDrawerReview(null);
      setSelected(prev => { const n = new Set(prev); n.delete(id); return n; });
      setLoading(false);
      toast("Review deleted successfully.");
    }).catch((error: Error) => { setLoading(false); toast(error.message); });
  };

  const doDeleteReaction = (reviewId: string, reactionId: string) => {
    void reactionsState.remove(reactionId).then(() => {
      if (drawerReview?.id === reviewId) {
        setDrawerReview(prev => prev ? { ...prev, reactions: prev.reactions.filter(rx => rx.id !== reactionId) } : null);
      }
      toast("Reaction deleted.");
    }).catch((error: Error) => toast(error.message));
  };

  const doBulkDelete = () => {
    setLoading(true);
    void Promise.all([...selected].map((id) => reviewsState.remove(id))).then(() => {
      setSelected(new Set());
      setLoading(false);
      toast(`${selected.size} review(s) deleted.`);
    }).catch((error: Error) => { setLoading(false); toast(error.message); });
  };

  const toggleRow = (id: string) => setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () => {
    if (allSelected) setSelected(prev => { const n = new Set(prev); paged.forEach(r => n.delete(r.id)); return n; });
    else setSelected(prev => { const n = new Set(prev); paged.forEach(r => n.add(r.id)); return n; });
  };

  const selCount = selected.size;
  const averageRating = reviews.length
    ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)
    : "0.0";

  return (
    <div>
      <AdminStats>
        <AdminStatCard label="Reviews" value={reviews.length.toLocaleString()} hint="Published responses" tone="purple" />
        <AdminStatCard label="Average rating" value={`${averageRating} / 5`} hint="Across loaded reviews" tone="gold" />
        <AdminStatCard label="Reactions" value={reactionsState.items.length.toLocaleString()} hint="Community engagement" tone="green" />
        <AdminStatCard label="Filtered results" value={filtered.length.toLocaleString()} hint="Current moderation view" tone="blue" />
      </AdminStats>
      {/* Filters */}
      <div className="admin-filter-row flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[180px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#6B7280" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="m21 21-4.35-4.35" /></svg>
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search reviews..." aria-label="Search reviews"
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg outline-none placeholder-[#4B5563]"
            style={{ background: "#1A1030", border: "1px solid #374151", color: "#fff" }} />
        </div>
        {[{ val: filterContent, set: setFilterContent, opts: categories, label: "Content" },
          { val: filterRating, set: setFilterRating, opts: ratingOptions, label: "Ratings" },
          { val: filterDate, set: setFilterDate, opts: dateOptions, label: "Dates" },
        ].map(({ val, set, opts }) => (
          <select key={opts[0]} value={val} onChange={e => { set(e.target.value); setPage(1); }}
            className="px-3 py-2 text-sm rounded-lg outline-none"
            style={{ background: "#1A1030", border: "1px solid #374151", color: "#fff" }}>
            {opts.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        ))}
        <button onClick={reset} className="px-3 py-2 text-sm rounded-lg font-medium transition-fast"
          style={{ background: "transparent", border: "1px solid #7C3AED", color: "#8B5CF6" }}
          onMouseEnter={e => { (e.target as HTMLElement).style.background = "rgba(124,58,237,0.15)"; }}
          onMouseLeave={e => { (e.target as HTMLElement).style.background = "transparent"; }}>
          Reset Filters
        </button>
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-sm" style={{ color: "#9CA3AF" }}>Sort:</span>
          <select value={sort} onChange={e => { setSort(e.target.value); setPage(1); }}
            className="px-3 py-2 text-sm rounded-lg outline-none"
            style={{ background: "#1A1030", border: "1px solid #374151", color: "#fff" }}>
            {sortOptions.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ background: "#150D2A", border: "1px solid #374151" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid #374151" }}>
                <th className="w-10 px-4 py-3">
                  <input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Select all"
                    className="w-4 h-4 rounded accent-violet-600" />
                </th>
                {["Reviewer", "Content", "Rating", "Review", "Date", "Reactions", "Actions"].map(col => (
                  <th key={col} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap" style={{ color: "#9CA3AF" }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={8} className="text-center py-12">
                  <div className="flex items-center justify-center gap-2" style={{ color: "#7C3AED" }}>
                    <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                    Loading…
                  </div>
                </td></tr>
              )}
              {!loading && paged.length === 0 && (
                <tr><td colSpan={8} className="text-center py-16">
                  <p style={{ color: "#9CA3AF" }}>No records match your search or selected filters.</p>
                  <button onClick={reset} className="mt-3 text-sm px-4 py-1.5 rounded-lg" style={{ color: "#8B5CF6", border: "1px solid #7C3AED" }}>Reset Filters</button>
                </td></tr>
              )}
              {!loading && paged.map((review, idx) => (
                <tr key={review.id}
                  className="group cursor-pointer transition-fast"
                  style={{ borderBottom: idx < paged.length - 1 ? "1px solid rgba(55,65,81,0.5)" : "none", background: selected.has(review.id) ? "rgba(124,58,237,0.08)" : "transparent" }}
                  onMouseEnter={e => { if (!selected.has(review.id)) (e.currentTarget as HTMLElement).style.background = "rgba(124,58,237,0.05)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = selected.has(review.id) ? "rgba(124,58,237,0.08)" : "transparent"; }}>
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={selected.has(review.id)} onChange={() => toggleRow(review.id)} aria-label={`Select ${review.id}`}
                      onClick={e => e.stopPropagation()} className="w-4 h-4 rounded accent-violet-600" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-white">{shortId(review.subscriberId)}</div>
                    <div className="text-xs mt-1" style={{ color: "#716a7d" }}>Review {shortId(review.id)}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <img src={review.contentThumb} alt={review.contentTitle} className="w-8 h-8 rounded object-cover flex-shrink-0" />
                      <div>
                        <div className="text-sm font-medium text-white whitespace-nowrap">{review.contentTitle}</div>
                        <div className="text-xs" style={{ color: "#9CA3AF" }}>{review.contentCategory} · {review.contentYear}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><StarRating rating={review.rating} /></td>
                  <td className="px-4 py-3 max-w-[200px]">
                    <p className="text-xs line-clamp-2" style={{ color: "#D1D5DB" }}>{review.text}</p>
                  </td>
                  <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: "#9CA3AF" }}>{review.date}</td>
                  <td className="px-4 py-3"><ReactionSummary reactions={review.reactions} /></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => setDrawerReview(review)} className="px-3 py-1 text-xs rounded font-medium transition-fast"
                        style={{ border: "1px solid #374151", color: "#9CA3AF" }}
                        onMouseEnter={e => { (e.target as HTMLElement).style.borderColor = "#7C3AED"; (e.target as HTMLElement).style.color = "#A78BFA"; }}
                        onMouseLeave={e => { (e.target as HTMLElement).style.borderColor = "#374151"; (e.target as HTMLElement).style.color = "#9CA3AF"; }}>
                        View
                      </button>
                      <button onClick={() => setConfirmDelete({ type: "review", id: review.id })}
                        className="px-3 py-1 text-xs rounded font-medium transition-fast"
                        style={{ border: "1px solid rgba(153,27,27,0.5)", color: "#FCA5A5", background: "rgba(153,27,27,0.1)" }}
                        onMouseEnter={e => { (e.target as HTMLElement).style.background = "rgba(153,27,27,0.25)"; }}
                        onMouseLeave={e => { (e.target as HTMLElement).style.background = "rgba(153,27,27,0.1)"; }}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Bulk + Pagination */}
        <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-3" style={{ borderTop: "1px solid #374151" }}>
          <div className="flex items-center gap-3">
            <span className="text-sm" style={{ color: "#9CA3AF" }}>{selCount} selected</span>
            <button disabled={selCount === 0} onClick={() => setConfirmDelete({ type: "bulk" })}
              className="px-3 py-1.5 text-xs rounded font-medium disabled:opacity-30 transition-fast"
              style={{ border: "1px solid rgba(153,27,27,0.5)", color: "#FCA5A5", background: "rgba(153,27,27,0.1)" }}>
              Delete Selected
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm" style={{ color: "#9CA3AF" }}>Showing {Math.min((page - 1) * perPage + 1, filtered.length)}–{Math.min(page * perPage, filtered.length)} of {filtered.length.toLocaleString()} reviews</span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="w-8 h-8 rounded text-xs disabled:opacity-30 flex items-center justify-center" style={{ border: "1px solid #374151", color: "#9CA3AF" }}>‹</button>
              {Array.from({ length: Math.min(5, Math.ceil(filtered.length / perPage)) }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)} className="w-8 h-8 rounded text-xs flex items-center justify-center"
                  style={p === page ? { background: "#7C3AED", color: "#fff", border: "1px solid #7C3AED" } : { border: "1px solid #374151", color: "#9CA3AF" }}>
                  {p}
                </button>
              ))}
              {Math.ceil(filtered.length / perPage) > 5 && <span style={{ color: "#4B5563" }}>…</span>}
              {Math.ceil(filtered.length / perPage) > 5 && (
                <button onClick={() => setPage(Math.ceil(filtered.length / perPage))} className="w-8 h-8 rounded text-xs flex items-center justify-center" style={{ border: "1px solid #374151", color: "#9CA3AF" }}>
                  {Math.ceil(filtered.length / perPage)}
                </button>
              )}
              <button onClick={() => setPage(p => Math.min(Math.ceil(filtered.length / perPage), p + 1))} disabled={page >= Math.ceil(filtered.length / perPage)} className="w-8 h-8 rounded text-xs disabled:opacity-30 flex items-center justify-center" style={{ border: "1px solid #374151", color: "#9CA3AF" }}>›</button>
            </div>
          </div>
        </div>
      </div>

      {/* Review Drawer */}
      {drawerReview && (
        <ReviewDrawer review={drawerReview}
          onClose={() => setDrawerReview(null)}
          onDeleteReview={() => setConfirmDelete({ type: "review", id: drawerReview.id })}
          onDeleteReaction={(rxnId) => setConfirmDelete({ type: "reaction", id: rxnId, reviewId: drawerReview.id })} />
      )}

      {/* Confirm */}
      {confirmDelete && (
        <ConfirmDialog
          title={confirmDelete.type === "reaction" ? "Delete Reaction?" : "Delete Review?"}
          message={
            confirmDelete.type === "bulk"
              ? `Are you sure you want to delete ${selCount} selected review(s)? Reactions connected to these reviews may also be affected.`
              : confirmDelete.type === "reaction"
              ? "Are you sure you want to delete this reaction?"
              : "Are you sure you want to delete this review? Reactions connected to this review may also be affected."
          }
          confirmLabel={confirmDelete.type === "reaction" ? "Delete Reaction" : "Delete Review"}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => {
            if (confirmDelete.type === "bulk") { doBulkDelete(); }
            else if (confirmDelete.type === "reaction" && confirmDelete.id && confirmDelete.reviewId) { doDeleteReaction(confirmDelete.reviewId, confirmDelete.id); }
            else if (confirmDelete.id) { doDeleteReview(confirmDelete.id); }
            setConfirmDelete(null);
          }} />
      )}
    </div>
  );
}

function ReviewDrawer({ review, onClose, onDeleteReview, onDeleteReaction }: {
  review: Review;
  onClose: () => void;
  onDeleteReview: () => void;
  onDeleteReaction: (id: string) => void;
}) {
  return (
    <AdminDetailsPanel
      title="Review Details"
      onClose={onClose}
      footer={(
        <div className="admin-details-actions">
          <button onClick={onClose} className="admin-details-button admin-details-button--secondary">Close</button>
          <button onClick={onDeleteReview} className="admin-details-button admin-details-button--danger">Delete Review</button>
        </div>
      )}
    >
      <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><div className="text-xs mb-1" style={{ color: "#6B7280" }}>Review ID</div><div className="font-mono" style={{ color: "#A78BFA" }}>{review.id}</div></div>
            <div><div className="text-xs mb-1" style={{ color: "#6B7280" }}>Subscriber ID</div><div style={{ color: "#9CA3AF" }}>{review.subscriberId}</div></div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: "rgba(26,16,48,0.6)", border: "1px solid #374151" }}>
            <img src={review.contentThumb} alt={review.contentTitle} className="w-12 h-12 rounded object-cover" />
            <div>
              <div className="font-semibold text-white">{review.contentTitle}</div>
              <div className="text-xs" style={{ color: "#9CA3AF" }}>{review.contentCategory} · {review.contentYear}</div>
            </div>
          </div>
          <div>
            <div className="text-xs mb-2" style={{ color: "#6B7280" }}>Rating</div>
            <StarRating rating={review.rating} />
          </div>
          <div>
            <div className="text-xs mb-2" style={{ color: "#6B7280" }}>Review Text</div>
            <p className="text-sm leading-relaxed" style={{ color: "#D1D5DB" }}>{review.text}</p>
          </div>
          <div>
            <div className="text-xs mb-1" style={{ color: "#6B7280" }}>Review Date</div>
            <div className="text-sm" style={{ color: "#9CA3AF" }}>{review.date}</div>
          </div>

          {/* Reactions */}
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#6B7280" }}>Reactions ({review.reactions.length})</div>
            {review.reactions.length === 0
              ? <p className="text-sm" style={{ color: "#4B5563" }}>No reactions are available for this review.</p>
              : (
                <div className="space-y-2">
                  {review.reactions.map(rxn => (
                    <div key={rxn.id} className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: "rgba(26,16,48,0.6)", border: "1px solid #374151" }}>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="font-mono" style={{ color: "#A78BFA" }}>{rxn.id}</span>
                        <span style={{ color: "#9CA3AF" }}>{rxn.subscriberId}</span>
                        <span className="flex items-center gap-1" aria-label={`${rxn.label} reaction`}>
                          <span className="text-base leading-none">{rxn.emoji}</span>
                          <span style={{ color: "#9CA3AF" }}>{rxn.label}</span>
                        </span>
                        <span style={{ color: "#6B7280" }}>{rxn.date}</span>
                      </div>
                      <button onClick={() => onDeleteReaction(rxn.id)}
                        className="text-xs px-2 py-1 rounded transition-fast"
                        style={{ border: "1px solid rgba(153,27,27,0.5)", color: "#FCA5A5", background: "rgba(153,27,27,0.1)" }}>
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
          </div>
      </div>
    </AdminDetailsPanel>
  );
}

// ── Posts & Comments Tab ────────────────────────────────────────────────────

function PostsWorkspace({ toast }: { toast: (msg: string) => void }) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("Status");
  const [filterDate, setFilterDate] = useState("All Dates");
  const [sort, setSort] = useState("Newest First");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);
  const [drawerPost, setDrawerPost] = useState<Post | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ action: "hide" | "restore" | "delete" | "bulkHide" | "bulkRestore" | "bulkDelete"; post?: Post } | null>(null);
  const postsState = useAdminCollection(
    useAdminRepository<Post>("forum-posts"),
  );
  const posts = postsState.items;

  const statusOptions = ["Status", "Active", "Hidden", "Deleted"];
  const sortOptions = ["Newest First", "Oldest First"];

  const filtered = posts.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !q || p.id.toLowerCase().includes(q) || p.subscriberId.toLowerCase().includes(q) || p.title.toLowerCase().includes(q) || p.content.toLowerCase().includes(q);
    const matchStatus = filterStatus === "Status" || p.status === filterStatus;
    return matchSearch && matchStatus;
  }).sort((a, b) => sort === "Oldest First" ? a.id.localeCompare(b.id) : b.id.localeCompare(a.id));

  const paged = filtered.slice((page - 1) * perPage, page * perPage);
  const allSelected = paged.length > 0 && paged.every(p => selected.has(p.id));
  const selCount = selected.size;
  const activeCount = posts.filter(post => post.status === "Active").length;
  const hiddenCount = posts.filter(post => post.status === "Hidden").length;
  const deletedCount = posts.filter(post => post.status === "Deleted").length;

  const reset = () => { setSearch(""); setFilterStatus("Status"); setFilterDate("All Dates"); setSort("Newest First"); setPage(1); setSelected(new Set()); };

  const changeStatus = (id: string, status: PostStatus) => {
    void postsState.update(id, { status }).catch((error: Error) => toast(error.message));
    if (drawerPost?.id === id) setDrawerPost(prev => prev ? { ...prev, status } : null);
  };

  const deletePost = (id: string) => {
    void postsState.remove(id).catch((error: Error) => toast(error.message));
    if (drawerPost?.id === id) setDrawerPost(null);
    setSelected(prev => { const n = new Set(prev); n.delete(id); return n; });
  };

  const handleConfirm = () => {
    if (!confirmAction) return;
    const { action, post } = confirmAction;
    if (action === "hide" && post) { changeStatus(post.id, "Hidden"); toast("Post hidden."); }
    else if (action === "restore" && post) { changeStatus(post.id, "Active"); toast("Post restored."); }
    else if (action === "delete" && post) { deletePost(post.id); toast("Post deleted."); }
    else if (action === "bulkHide") { selected.forEach(id => changeStatus(id, "Hidden")); toast(`${selCount} post(s) hidden.`); setSelected(new Set()); }
    else if (action === "bulkRestore") { selected.forEach(id => changeStatus(id, "Active")); toast(`${selCount} post(s) restored.`); setSelected(new Set()); }
    else if (action === "bulkDelete") { selected.forEach(id => deletePost(id)); toast(`${selCount} post(s) deleted.`); setSelected(new Set()); }
    setConfirmAction(null);
  };

  const toggleRow = (id: string) => setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () => {
    if (allSelected) setSelected(prev => { const n = new Set(prev); paged.forEach(p => n.delete(p.id)); return n; });
    else setSelected(prev => { const n = new Set(prev); paged.forEach(p => n.add(p.id)); return n; });
  };

  return (
    <div>
      <AdminStats>
        <AdminStatCard label="Posts" value={posts.length.toLocaleString()} hint="Loaded discussions" tone="purple" />
        <AdminStatCard label="Active" value={activeCount.toLocaleString()} hint="Visible to members" tone="green" />
        <AdminStatCard label="Hidden" value={hiddenCount.toLocaleString()} hint="Moderated content" tone="gold" />
        <AdminStatCard label="Deleted" value={deletedCount.toLocaleString()} hint="Removed content" tone="red" />
      </AdminStats>
      <div className="admin-filter-row flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[180px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#6B7280" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="m21 21-4.35-4.35" /></svg>
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search posts..." aria-label="Search posts"
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg outline-none placeholder-[#4B5563]"
            style={{ background: "#1A1030", border: "1px solid #374151", color: "#fff" }} />
        </div>
        <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
          className="w-36 px-3 py-2 text-sm rounded-lg outline-none" style={{ background: "#1A1030", border: "1px solid #374151", color: "#fff" }}>
          {statusOptions.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <select value={filterDate} onChange={e => { setFilterDate(e.target.value); setPage(1); }}
          className="px-3 py-2 text-sm rounded-lg outline-none" style={{ background: "#1A1030", border: "1px solid #374151", color: "#fff" }}>
          {["All Dates", "Today", "This Week", "This Month"].map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <button onClick={reset} className="px-3 py-2 text-sm rounded-lg font-medium transition-fast"
          style={{ background: "transparent", border: "1px solid #7C3AED", color: "#8B5CF6" }}>Reset Filters</button>
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-sm" style={{ color: "#9CA3AF" }}>Sort:</span>
          <select value={sort} onChange={e => { setSort(e.target.value); setPage(1); }}
            className="px-3 py-2 text-sm rounded-lg outline-none" style={{ background: "#1A1030", border: "1px solid #374151", color: "#fff" }}>
            {sortOptions.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ background: "#150D2A", border: "1px solid #374151" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid #374151" }}>
                <th className="w-10 px-4 py-3">
                  <input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Select all" className="w-4 h-4 rounded accent-violet-600" />
                </th>
                {["Author", "Post", "Content", "Date", "Status", "Comments", "Actions"].map(col => (
                  <th key={col} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap" style={{ color: "#9CA3AF" }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 && (
                <tr><td colSpan={8} className="text-center py-16">
                  <p style={{ color: "#9CA3AF" }}>No records match your search or selected filters.</p>
                  <button onClick={reset} className="mt-3 text-sm px-4 py-1.5 rounded-lg" style={{ color: "#8B5CF6", border: "1px solid #7C3AED" }}>Reset Filters</button>
                </td></tr>
              )}
              {paged.map((post, idx) => (
                <tr key={post.id} className="transition-fast"
                  style={{ borderBottom: idx < paged.length - 1 ? "1px solid rgba(55,65,81,0.5)" : "none", background: selected.has(post.id) ? "rgba(124,58,237,0.08)" : "transparent" }}>
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={selected.has(post.id)} onChange={() => toggleRow(post.id)} aria-label={`Select ${post.id}`} className="w-4 h-4 rounded accent-violet-600" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-white">{shortId(post.subscriberId)}</div>
                    <div className="text-xs mt-1" style={{ color: "#716a7d" }}>Post {shortId(post.id)}</div>
                  </td>
                  <td className="px-4 py-3 max-w-[150px]">
                    <div className="text-sm font-medium text-white line-clamp-2">{post.title}</div>
                  </td>
                  <td className="px-4 py-3 max-w-[200px]">
                    <p className="text-xs line-clamp-2" style={{ color: "#D1D5DB" }}>{post.content}</p>
                  </td>
                  <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: "#9CA3AF" }}>{post.datePosted}</td>
                  <td className="px-4 py-3"><StatusBadge status={post.status} /></td>
                  <td className="px-4 py-3 text-xs text-center" style={{ color: "#9CA3AF" }}>{post.commentCount}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5 flex-wrap">
                      <AdminRowAction action="view" name={post.title || `post ${post.id}`} onClick={() => setDrawerPost(post)} />
                      {post.status === "Active" && (
                        <button onClick={() => setConfirmAction({ action: "hide", post })} className="px-2.5 py-1 text-xs rounded font-medium transition-fast"
                          style={{ border: "1px solid rgba(161,98,7,0.5)", color: "#FDE68A", background: "rgba(161,98,7,0.1)" }}>Hide</button>
                      )}
                      {(post.status === "Hidden" || post.status === "Deleted") && (
                        <button onClick={() => setConfirmAction({ action: "restore", post })} className="px-2.5 py-1 text-xs rounded font-medium transition-fast"
                          style={{ border: "1px solid rgba(21,128,61,0.5)", color: "#86EFAC", background: "rgba(21,128,61,0.1)" }}>Restore</button>
                      )}
                      <AdminRowAction action="delete" name={post.title || `post ${post.id}`} onClick={() => setConfirmAction({ action: "delete", post })} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-3" style={{ borderTop: "1px solid #374151" }}>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm" style={{ color: "#9CA3AF" }}>{selCount} selected</span>
            <button disabled={selCount === 0} onClick={() => setConfirmAction({ action: "bulkHide" })}
              className="px-3 py-1.5 text-xs rounded disabled:opacity-30" style={{ border: "1px solid rgba(161,98,7,0.5)", color: "#FDE68A", background: "rgba(161,98,7,0.1)" }}>
              Hide Selected
            </button>
            <button disabled={selCount === 0} onClick={() => setConfirmAction({ action: "bulkRestore" })}
              className="px-3 py-1.5 text-xs rounded disabled:opacity-30" style={{ border: "1px solid rgba(21,128,61,0.5)", color: "#86EFAC", background: "rgba(21,128,61,0.1)" }}>
              Restore Selected
            </button>
            <button disabled={selCount === 0} onClick={() => setConfirmAction({ action: "bulkDelete" })}
              className="px-3 py-1.5 text-xs rounded disabled:opacity-30" style={{ border: "1px solid rgba(153,27,27,0.5)", color: "#FCA5A5", background: "rgba(153,27,27,0.1)" }}>
              Delete Selected
            </button>
          </div>
          <span className="text-sm" style={{ color: "#9CA3AF" }}>Showing {Math.min((page - 1) * perPage + 1, filtered.length)}–{Math.min(page * perPage, filtered.length)} of {filtered.length} posts</span>
        </div>
      </div>

      {drawerPost && (
        <PostDrawer post={drawerPost} onClose={() => setDrawerPost(null)}
          onHide={() => setConfirmAction({ action: "hide", post: drawerPost })}
          onRestore={() => setConfirmAction({ action: "restore", post: drawerPost })}
          onDelete={() => setConfirmAction({ action: "delete", post: drawerPost })} />
      )}

      {confirmAction && (
        <ConfirmDialog
          title={confirmAction.action.includes("Delete") || confirmAction.action === "delete" || confirmAction.action === "bulkDelete" ? "Delete Post?" : confirmAction.action === "hide" || confirmAction.action === "bulkHide" ? "Hide Post?" : "Restore Post?"}
          message={
            confirmAction.action === "bulkHide" ? `Hide ${selCount} selected post(s)?` :
            confirmAction.action === "bulkRestore" ? `Restore ${selCount} selected post(s)?` :
            confirmAction.action === "bulkDelete" ? `Delete ${selCount} selected post(s)?` :
            confirmAction.action === "hide" ? "Are you sure you want to hide this post?" :
            confirmAction.action === "restore" ? "Are you sure you want to restore this post?" :
            "Are you sure you want to delete this post?"
          }
          confirmLabel={
            confirmAction.action === "hide" || confirmAction.action === "bulkHide" ? "Hide Post" :
            confirmAction.action === "restore" || confirmAction.action === "bulkRestore" ? "Restore Post" :
            "Delete Post"
          }
          onCancel={() => setConfirmAction(null)}
          onConfirm={handleConfirm} />
      )}
    </div>
  );
}

function PostDrawer({ post, onClose, onHide, onRestore, onDelete }: { post: Post; onClose: () => void; onHide: () => void; onRestore: () => void; onDelete: () => void }) {
  const relatedComments = useAdminCollection(
    useAdminRepository<Comment>("forum-comments"),
  ).items.filter(c => c.postId === post.id);
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-40 flex" style={{ background: "rgba(0,0,0,0.5)" }} onClick={onClose}>
      <div className="ml-auto w-full max-w-lg h-full overflow-y-auto shadow-2xl"
        style={{ background: "#150D2A", borderLeft: "1px solid #7C3AED" }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid #374151" }}>
          <h2 className="text-lg font-semibold text-white">Post Details</h2>
          <button onClick={onClose} className="w-8 h-8 rounded flex items-center justify-center" style={{ color: "#9CA3AF" }} aria-label="Close">✕</button>
        </div>
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><div className="text-xs mb-1" style={{ color: "#6B7280" }}>Post ID</div><div className="font-mono" style={{ color: "#A78BFA" }}>{post.id}</div></div>
            <div><div className="text-xs mb-1" style={{ color: "#6B7280" }}>Subscriber ID</div><div style={{ color: "#9CA3AF" }}>{post.subscriberId}</div></div>
          </div>
          <div><div className="text-xs mb-1" style={{ color: "#6B7280" }}>Title</div><div className="font-semibold text-white">{post.title}</div></div>
          <div><div className="text-xs mb-2" style={{ color: "#6B7280" }}>Content</div><p className="text-sm leading-relaxed" style={{ color: "#D1D5DB" }}>{post.content}</p></div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><div className="text-xs mb-1" style={{ color: "#6B7280" }}>Date Posted</div><div style={{ color: "#9CA3AF" }}>{post.datePosted}</div></div>
            <div><div className="text-xs mb-1" style={{ color: "#6B7280" }}>Status</div><StatusBadge status={post.status} /></div>
          </div>
          <div><div className="text-xs mb-1" style={{ color: "#6B7280" }}>Comments</div><div className="text-sm" style={{ color: "#9CA3AF" }}>{post.commentCount}</div></div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#6B7280" }}>Related Comments ({relatedComments.length})</div>
            {relatedComments.length === 0
              ? <p className="text-sm" style={{ color: "#4B5563" }}>No comments are available.</p>
              : relatedComments.map(c => (
                <div key={c.id} className="mb-2 p-3 rounded-lg" style={{ background: "rgba(26,16,48,0.6)", border: "1px solid #374151" }}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-mono" style={{ color: "#A78BFA" }}>{c.id}</span>
                    <span style={{ color: "#6B7280" }}>{c.dateCommented}</span>
                  </div>
                  <p className="text-xs" style={{ color: "#D1D5DB" }}>{c.text}</p>
                </div>
              ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 px-6 pb-6">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ border: "1px solid #374151", color: "#9CA3AF" }}>Close</button>
          {post.status === "Active" && <button onClick={() => { onHide(); }} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ border: "1px solid rgba(161,98,7,0.5)", color: "#FDE68A", background: "rgba(161,98,7,0.1)" }}>Hide Post</button>}
          {(post.status === "Hidden" || post.status === "Deleted") && <button onClick={onRestore} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ border: "1px solid rgba(21,128,61,0.5)", color: "#86EFAC", background: "rgba(21,128,61,0.1)" }}>Restore Post</button>}
          <button onClick={onDelete} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ border: "1px solid rgba(153,27,27,0.5)", color: "#FCA5A5", background: "rgba(153,27,27,0.1)" }}>Delete Post</button>
        </div>
      </div>
    </div>
  );
}

function CommentsWorkspace({ toast }: { toast: (msg: string) => void }) {
  const [search, setSearch] = useState("");
  const [filterPost, setFilterPost] = useState("All Posts");
  const [filterDate, setFilterDate] = useState("All Dates");
  const [sort, setSort] = useState("Newest First");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);
  const [drawerComment, setDrawerComment] = useState<Comment | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ type: "single" | "bulk"; id?: string } | null>(null);
  const commentsState = useAdminCollection(
    useAdminRepository<Comment>("forum-comments"),
  );
  const comments = commentsState.items;

  const postTitles = ["All Posts", ...Array.from(new Set(comments.map(c => c.postId)))];

  const filtered = comments.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = !q || c.id.toLowerCase().includes(q) || c.postId.toLowerCase().includes(q) || c.subscriberId.toLowerCase().includes(q) || c.text.toLowerCase().includes(q);
    const matchPost = filterPost === "All Posts" || c.postId === filterPost;
    return matchSearch && matchPost;
  }).sort((a, b) => sort === "Oldest First" ? a.id.localeCompare(b.id) : b.id.localeCompare(a.id));

  const paged = filtered.slice((page - 1) * perPage, page * perPage);
  const allSelected = paged.length > 0 && paged.every(c => selected.has(c.id));
  const selCount = selected.size;
  const uniqueAuthors = new Set(comments.map(comment => comment.subscriberId)).size;
  const uniquePosts = new Set(comments.map(comment => comment.postId)).size;
  const reset = () => { setSearch(""); setFilterPost("All Posts"); setFilterDate("All Dates"); setSort("Newest First"); setPage(1); setSelected(new Set()); };

  const doDelete = (id: string) => {
    void commentsState.remove(id).catch((error: Error) => toast(error.message));
    if (drawerComment?.id === id) setDrawerComment(null);
    setSelected(prev => { const n = new Set(prev); n.delete(id); return n; });
    toast("Comment deleted.");
  };
  const doBulk = () => {
    void Promise.all([...selected].map((id) => commentsState.remove(id)))
      .then(() => toast(`${selCount} comment(s) deleted.`))
      .catch((error: Error) => toast(error.message));
    setSelected(new Set());
  };

  const toggleRow = (id: string) => setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () => {
    if (allSelected) setSelected(prev => { const n = new Set(prev); paged.forEach(c => n.delete(c.id)); return n; });
    else setSelected(prev => { const n = new Set(prev); paged.forEach(c => n.add(c.id)); return n; });
  };

  return (
    <div>
      <AdminStats>
        <AdminStatCard label="Comments" value={comments.length.toLocaleString()} hint="Loaded responses" tone="purple" />
        <AdminStatCard label="Contributors" value={uniqueAuthors.toLocaleString()} hint="Unique subscriber IDs" tone="green" />
        <AdminStatCard label="Discussions" value={uniquePosts.toLocaleString()} hint="Posts with comments" tone="gold" />
        <AdminStatCard label="Filtered results" value={filtered.length.toLocaleString()} hint="Current moderation view" tone="blue" />
      </AdminStats>
      <div className="admin-filter-row flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[180px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#6B7280" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="m21 21-4.35-4.35" /></svg>
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search comments..." aria-label="Search comments"
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg outline-none placeholder-[#4B5563]"
            style={{ background: "#1A1030", border: "1px solid #374151", color: "#fff" }} />
        </div>
        <select value={filterPost} onChange={e => { setFilterPost(e.target.value); setPage(1); }}
          className="w-36 px-3 py-2 text-sm rounded-lg outline-none" style={{ background: "#1A1030", border: "1px solid #374151", color: "#fff" }}>
          {postTitles.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <select value={filterDate} onChange={e => setFilterDate(e.target.value)}
          className="px-3 py-2 text-sm rounded-lg outline-none" style={{ background: "#1A1030", border: "1px solid #374151", color: "#fff" }}>
          {["All Dates", "Today", "This Week", "This Month"].map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <button onClick={reset} className="px-3 py-2 text-sm rounded-lg font-medium transition-fast"
          style={{ background: "transparent", border: "1px solid #7C3AED", color: "#8B5CF6" }}>Reset Filters</button>
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-sm" style={{ color: "#9CA3AF" }}>Sort:</span>
          <select value={sort} onChange={e => setSort(e.target.value)} className="px-3 py-2 text-sm rounded-lg outline-none" style={{ background: "#1A1030", border: "1px solid #374151", color: "#fff" }}>
            {["Newest First", "Oldest First"].map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ background: "#150D2A", border: "1px solid #374151" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid #374151" }}>
                <th className="w-10 px-4 py-3">
                  <input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Select all" className="w-4 h-4 rounded accent-violet-600" />
                </th>
                {["Author", "Discussion", "Comment", "Date", "Actions"].map(col => (
                  <th key={col} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap" style={{ color: "#9CA3AF" }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 && (
                <tr><td colSpan={6} className="text-center py-16">
                  <p style={{ color: "#9CA3AF" }}>No records match your search or selected filters.</p>
                  <button onClick={reset} className="mt-3 text-sm px-4 py-1.5 rounded-lg" style={{ color: "#8B5CF6", border: "1px solid #7C3AED" }}>Reset Filters</button>
                </td></tr>
              )}
              {paged.map((comment, idx) => (
                <tr key={comment.id} className="transition-fast"
                  style={{ borderBottom: idx < paged.length - 1 ? "1px solid rgba(55,65,81,0.5)" : "none", background: selected.has(comment.id) ? "rgba(124,58,237,0.08)" : "transparent" }}>
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={selected.has(comment.id)} onChange={() => toggleRow(comment.id)} aria-label={`Select ${comment.id}`} className="w-4 h-4 rounded accent-violet-600" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-white">{shortId(comment.subscriberId)}</div>
                    <div className="text-xs mt-1" style={{ color: "#716a7d" }}>Comment {shortId(comment.id)}</div>
                  </td>
                  <td className="px-4 py-3 max-w-[180px]">
                    <div className="text-sm font-medium text-white line-clamp-1">{comment.postTitle || shortId(comment.postId)}</div>
                    <div className="text-xs mt-1" style={{ color: "#716a7d" }}>{shortId(comment.postId)}</div>
                  </td>
                  <td className="px-4 py-3 max-w-[360px]">
                    <p className="text-sm leading-relaxed line-clamp-2" style={{ color: "#D1D5DB" }}>{comment.text}</p>
                  </td>
                  <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: "#9CA3AF" }}>{comment.dateCommented}</td>
                  <td className="px-4 py-3">
                    <div className="content-table__actions">
                      <AdminRowAction action="view" name={`comment ${comment.id}`} onClick={() => setDrawerComment(comment)} />
                      <AdminRowAction action="delete" name={`comment ${comment.id}`} onClick={() => setConfirmDelete({ type: "single", id: comment.id })} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-3" style={{ borderTop: "1px solid #374151" }}>
          <div className="flex items-center gap-3">
            <span className="text-sm" style={{ color: "#9CA3AF" }}>{selCount} selected</span>
            <button disabled={selCount === 0} onClick={() => setConfirmDelete({ type: "bulk" })}
              className="px-3 py-1.5 text-xs rounded disabled:opacity-30" style={{ border: "1px solid rgba(153,27,27,0.5)", color: "#FCA5A5", background: "rgba(153,27,27,0.1)" }}>
              Delete Selected
            </button>
          </div>
          <span className="text-sm" style={{ color: "#9CA3AF" }}>Showing {Math.min((page - 1) * perPage + 1, filtered.length)}–{Math.min(page * perPage, filtered.length)} of {filtered.length} comments</span>
        </div>
      </div>

      {drawerComment && (
        <CommentDrawer comment={drawerComment} onClose={() => setDrawerComment(null)}
          onDelete={() => setConfirmDelete({ type: "single", id: drawerComment.id })} />
      )}
      {confirmDelete && (
        <ConfirmDialog
          title="Delete Comment?"
          message={confirmDelete.type === "bulk" ? `Are you sure you want to delete ${selCount} selected comment(s)?` : "Are you sure you want to delete this comment?"}
          confirmLabel="Delete Comment"
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => {
            if (confirmDelete.type === "bulk") doBulk();
            else if (confirmDelete.id) doDelete(confirmDelete.id);
            setConfirmDelete(null);
          }} />
      )}
    </div>
  );
}

function CommentDrawer({ comment, onClose, onDelete }: { comment: Comment; onClose: () => void; onDelete: () => void }) {
  const relatedPost = useAdminCollection(
    useAdminRepository<Post>("forum-posts"),
  ).items.find(p => p.id === comment.postId);
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-40 flex" style={{ background: "rgba(0,0,0,0.5)" }} onClick={onClose}>
      <div className="ml-auto w-full max-w-lg h-full overflow-y-auto shadow-2xl"
        style={{ background: "#150D2A", borderLeft: "1px solid #7C3AED" }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid #374151" }}>
          <h2 className="text-lg font-semibold text-white">Comment Details</h2>
          <button onClick={onClose} className="w-8 h-8 rounded flex items-center justify-center" style={{ color: "#9CA3AF" }} aria-label="Close">✕</button>
        </div>
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><div className="text-xs mb-1" style={{ color: "#6B7280" }}>Comment ID</div><div className="font-mono" style={{ color: "#A78BFA" }}>{comment.id}</div></div>
            <div><div className="text-xs mb-1" style={{ color: "#6B7280" }}>Post ID</div><div className="font-mono" style={{ color: "#C4B5FD" }}>{comment.postId}</div></div>
          </div>
          {relatedPost && (
            <div className="p-3 rounded-lg" style={{ background: "rgba(26,16,48,0.6)", border: "1px solid #374151" }}>
              <div className="text-xs mb-1" style={{ color: "#6B7280" }}>Related Post</div>
              <div className="text-sm font-medium text-white">{relatedPost.title}</div>
            </div>
          )}
          <div><div className="text-xs mb-1" style={{ color: "#6B7280" }}>Subscriber ID</div><div className="text-sm" style={{ color: "#9CA3AF" }}>{comment.subscriberId}</div></div>
          <div><div className="text-xs mb-2" style={{ color: "#6B7280" }}>Comment Text</div><p className="text-sm leading-relaxed" style={{ color: "#D1D5DB" }}>{comment.text}</p></div>
          <div><div className="text-xs mb-1" style={{ color: "#6B7280" }}>Date Commented</div><div className="text-sm" style={{ color: "#9CA3AF" }}>{comment.dateCommented}</div></div>
        </div>
        <div className="flex flex-wrap gap-2 px-6 pb-6">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ border: "1px solid #374151", color: "#9CA3AF" }}>Close</button>
          {relatedPost && (
            <button className="px-4 py-2 rounded-lg text-sm font-medium" style={{ border: "1px solid #7C3AED", color: "#A78BFA", background: "rgba(124,58,237,0.1)" }}>
              View Related Post
            </button>
          )}
          <button onClick={onDelete} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ border: "1px solid rgba(153,27,27,0.5)", color: "#FCA5A5", background: "rgba(153,27,27,0.1)" }}>
            Delete Comment
          </button>
        </div>
      </div>
    </div>
  );
}

// ── App Root ───────────────────────────────────────────────────────────────

export default function CommentManagerView() {
  const [mainTab, setMainTab] = useState<MainTab>("reactions");
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const toast = useCallback((msg: string) => { setToastMsg(msg); }, []);

  return (
    <div className="admin-page-shell community-workspace">
      <main>
        <AdminPageHeader
          eyebrow="Community moderation"
          title="Community Management"
          description="Moderate reactions and comments submitted from title watch pages."
        />

        <AdminWorkspaceTabs
          tabs={[
            { id: "reactions", label: "Reactions" },
            { id: "content-comments", label: "Content Comments" },
          ]}
          active={mainTab}
          onChange={setMainTab}
          label="Community management sections"
        />

        {mainTab === "reactions" && <ReactionsWorkspace toast={toast} />}
        {mainTab === "content-comments" && <ContentCommentsWorkspace toast={toast} />}
      </main>

      {/* Toast */}
      {toastMsg && <Toast message={toastMsg} onDone={() => setToastMsg(null)} />}
    </div>
  );
}
