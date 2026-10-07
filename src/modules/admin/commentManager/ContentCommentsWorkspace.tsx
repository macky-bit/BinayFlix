import { useMemo, useState } from "react"
import { AdminStatCard, AdminStats } from "../components/AdminUI"
import { useAdminCollection, useAdminRepository } from "../data"

interface ContentCommentRecord {
  id: string
  contentId: string
  contentTitle: string
  contentThumb: string
  subscriberId: string
  authorName: string
  text: string
  dateCommented: string
  date: string
  status: string
}

interface CommentGroup {
  contentId: string
  title: string
  thumbnail: string
  comments: ContentCommentRecord[]
}

export default function ContentCommentsWorkspace({ toast }: { toast: (message: string) => void }) {
  const commentsState = useAdminCollection(useAdminRepository<ContentCommentRecord>("content-comments"))
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("All statuses")
  const [selected, setSelected] = useState<CommentGroup | null>(null)

  const groups = useMemo(() => {
    const query = search.trim().toLowerCase()
    const grouped = new Map<string, CommentGroup>()
    for (const comment of commentsState.items) {
      const matchesStatus = statusFilter === "All statuses" || comment.status === statusFilter
      const matchesQuery = !query || comment.contentTitle.toLowerCase().includes(query) || comment.contentId.includes(query) || comment.authorName.toLowerCase().includes(query) || comment.text.toLowerCase().includes(query)
      if (!matchesStatus || !matchesQuery) continue
      const group = grouped.get(comment.contentId) ?? {
        contentId: comment.contentId,
        title: comment.contentTitle || `Content ${comment.contentId}`,
        thumbnail: comment.contentThumb,
        comments: [],
      }
      group.comments.push(comment)
      grouped.set(comment.contentId, group)
    }
    return [...grouped.values()].sort((a, b) => b.comments.length - a.comments.length)
  }, [commentsState.items, search, statusFilter])

  const syncSelected = (id: string, update?: ContentCommentRecord) => {
    setSelected((current) => current ? {
      ...current,
      comments: update
        ? current.comments.map((item) => item.id === id ? update : item)
        : current.comments.filter((item) => item.id !== id),
    } : null)
  }

  const changeStatus = async (comment: ContentCommentRecord) => {
    const nextStatus = comment.status.toLowerCase() === "active" ? "Hidden" : "Active"
    try {
      const updated = await commentsState.update(comment.id, { status: nextStatus })
      syncSelected(comment.id, updated)
      toast(`${nextStatus === "Active" ? "Restored" : "Hidden"} content comment.`)
    } catch (error) {
      toast(error instanceof Error ? error.message : "Moderation update failed.")
    }
  }

  const remove = async (comment: ContentCommentRecord) => {
    if (!window.confirm("Permanently delete this content comment?")) return
    try {
      await commentsState.remove(comment.id)
      syncSelected(comment.id)
      toast("Content comment deleted.")
    } catch (error) {
      toast(error instanceof Error ? error.message : "Delete failed.")
    }
  }

  const activeCount = commentsState.items.filter((item) => item.status.toLowerCase() === "active").length
  return <div>
    <AdminStats>
      <AdminStatCard label="Content comments" value={commentsState.items.length.toLocaleString()} hint="Individual responses" tone="purple" />
      <AdminStatCard label="Content IDs" value={new Set(commentsState.items.map((item) => item.contentId)).size.toLocaleString()} hint="Titles with comments" tone="blue" />
      <AdminStatCard label="Visible" value={activeCount.toLocaleString()} hint="Shown on WatchScreen" tone="green" />
      <AdminStatCard label="Hidden" value={(commentsState.items.length - activeCount).toLocaleString()} hint="Moderator-hidden" tone="gold" />
    </AdminStats>
    <div className="admin-filter-row flex flex-wrap gap-3 mb-4">
      <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search content ID, title, author, or comment…" aria-label="Search content comments" className="flex-1 min-w-[240px] px-3 py-2 text-sm rounded-lg outline-none placeholder-[#4B5563]" style={{ background: "#1A1030", border: "1px solid #374151", color: "#fff" }} />
      <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filter comments by status" className="px-3 py-2 text-sm rounded-lg outline-none" style={{ background: "#1A1030", border: "1px solid #374151", color: "#fff" }}><option>All statuses</option><option>Active</option><option>Hidden</option></select>
    </div>
    {commentsState.error && <p className="mb-4 text-sm text-red-300" role="alert">{commentsState.error.message}</p>}
    <div className="rounded-xl overflow-hidden" style={{ background: "#150D2A", border: "1px solid #374151" }}><div className="overflow-x-auto"><table className="w-full text-sm">
      <thead><tr style={{ borderBottom: "1px solid #374151" }}>{["Content", "Content ID", "Comments", "Commenters", "Status", "Actions"].map((column) => <th key={column} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap" style={{ color: "#9CA3AF" }}>{column}</th>)}</tr></thead>
      <tbody>
        {(commentsState.loading || groups.length === 0) && <tr><td colSpan={6} className="px-4 py-14 text-center" style={{ color: "#9CA3AF" }}>{commentsState.loading ? "Loading content comments…" : "No content comments match these filters."}</td></tr>}
        {groups.map((group) => { const active = group.comments.filter((item) => item.status.toLowerCase() === "active").length; return <tr key={group.contentId} className="cursor-pointer" style={{ borderBottom: "1px solid rgba(55,65,81,0.5)" }} onClick={() => setSelected(group)}>
          <td className="px-4 py-3"><div className="flex items-center gap-3">{group.thumbnail ? <img src={group.thumbnail} alt="" className="w-12 h-16 rounded object-cover bg-gray-900" /> : <div className="w-12 h-16 rounded bg-gray-900 flex items-center justify-center text-gray-500">SF</div>}<strong className="text-white">{group.title}</strong></div></td>
          <td className="px-4 py-3 font-mono" style={{ color: "#A78BFA" }}>{group.contentId}</td>
          <td className="px-4 py-3 text-white">{group.comments.length}</td>
          <td className="px-4 py-3" style={{ color: "#D1D5DB" }}>{new Set(group.comments.map((item) => item.subscriberId)).size}</td>
          <td className="px-4 py-3"><span className="text-green-300">{active} visible</span>{active < group.comments.length && <span className="ml-2 text-yellow-300">{group.comments.length - active} hidden</span>}</td>
          <td className="px-4 py-3"><button type="button" onClick={(event) => { event.stopPropagation(); setSelected(group) }} className="px-3 py-1.5 text-xs rounded" style={{ border: "1px solid #7C3AED", color: "#C4B5FD" }}>View comments</button></td>
        </tr> })}
      </tbody>
    </table></div></div>
    {selected && <div className="fixed inset-0 z-40 flex" style={{ background: "rgba(0,0,0,0.55)" }} onClick={() => setSelected(null)}><aside className="ml-auto h-full w-full max-w-2xl overflow-y-auto p-6 shadow-2xl" style={{ background: "#150D2A", borderLeft: "1px solid #7C3AED" }} onClick={(event) => event.stopPropagation()} aria-label={`${selected.title} comments`}>
      <header className="flex items-start justify-between gap-4 mb-6"><div className="flex gap-3">{selected.thumbnail && <img src={selected.thumbnail} alt="" className="w-16 h-24 rounded object-cover" />}<div><p className="text-xs uppercase tracking-wider" style={{ color: "#A78BFA" }}>Content ID {selected.contentId}</p><h2 className="text-xl font-semibold text-white">{selected.title}</h2><p className="mt-1 text-sm" style={{ color: "#9CA3AF" }}>{selected.comments.length} comment(s)</p></div></div><button type="button" onClick={() => setSelected(null)} aria-label="Close comment details" className="text-xl" style={{ color: "#9CA3AF" }}>×</button></header>
      <div className="space-y-3">{selected.comments.length === 0 && <p style={{ color: "#9CA3AF" }}>No comments remain for this content.</p>}{selected.comments.map((comment) => <article key={comment.id} className="rounded-lg p-4" style={{ background: "#1A1030", border: "1px solid #374151" }}><div className="flex items-start justify-between gap-3"><div><strong className="text-white">{comment.authorName || "Unknown member"}</strong><p className="text-xs mt-1" style={{ color: "#716a7d" }}>{comment.subscriberId} · {comment.dateCommented}</p></div><span className={comment.status.toLowerCase() === "active" ? "text-green-300 text-xs" : "text-yellow-300 text-xs"}>{comment.status}</span></div><p className="mt-3 leading-relaxed" style={{ color: "#D1D5DB", whiteSpace: "pre-wrap" }}>{comment.text}</p><div className="flex gap-2 mt-4"><button disabled={commentsState.mutating} onClick={() => void changeStatus(comment)} className="px-3 py-1 text-xs rounded disabled:opacity-40" style={{ border: "1px solid #7C3AED", color: "#C4B5FD" }}>{comment.status.toLowerCase() === "active" ? "Hide" : "Restore"}</button><button disabled={commentsState.mutating} onClick={() => void remove(comment)} className="px-3 py-1 text-xs rounded disabled:opacity-40" style={{ border: "1px solid rgba(153,27,27,0.5)", color: "#FCA5A5" }}>Delete</button></div></article>)}</div>
    </aside></div>}
  </div>
}
