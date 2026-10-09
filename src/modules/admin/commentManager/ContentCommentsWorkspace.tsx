import { useMemo, useState } from "react"
import AdminDetailsPanel from "../components/AdminDetailsPanel"
import {
  AdminStatCard,
  AdminStats,
  AdminTablePagination,
} from "../components/AdminUI"
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

export default function ContentCommentsWorkspace({
  toast,
}: {
  toast: (message: string) => void
}) {
  const commentsState = useAdminCollection(
    useAdminRepository<ContentCommentRecord>("content-comments"),
  )
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("All statuses")
  const [selected, setSelected] = useState<CommentGroup | null>(null)
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)

  const groups = useMemo(() => {
    const query = search.trim().toLowerCase()
    const grouped = new Map<string, CommentGroup>()
    for (const comment of commentsState.items) {
      const matchesStatus =
        statusFilter === "All statuses" ||
        comment.status.toLowerCase() === statusFilter.toLowerCase()
      const matchesQuery =
        !query ||
        comment.contentTitle.toLowerCase().includes(query) ||
        comment.contentId.toLowerCase().includes(query) ||
        comment.authorName.toLowerCase().includes(query) ||
        comment.text.toLowerCase().includes(query)
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
    return [...grouped.values()].sort(
      (a, b) => b.comments.length - a.comments.length,
    )
  }, [commentsState.items, search, statusFilter])

  const syncSelected = (id: string, update?: ContentCommentRecord) => {
    setSelected((current) =>
      current
        ? {
            ...current,
            comments: update
              ? current.comments.map((item) => (item.id === id ? update : item))
              : current.comments.filter((item) => item.id !== id),
          }
        : null,
    )
  }

  const changeStatus = async (comment: ContentCommentRecord) => {
    const nextStatus =
      comment.status.toLowerCase() === "active" ? "Hidden" : "Active"
    try {
      const updated = await commentsState.update(comment.id, {
        status: nextStatus,
      })
      syncSelected(comment.id, updated)
      toast(
        `${nextStatus === "Active" ? "Restored" : "Hidden"} content comment.`,
      )
    } catch (error) {
      toast(
        error instanceof Error ? error.message : "Moderation update failed.",
      )
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

  const activeCount = commentsState.items.filter(
    (item) => item.status.toLowerCase() === "active",
  ).length
  const hiddenCount = commentsState.items.length - activeCount
  const totalPages = Math.max(1, Math.ceil(groups.length / perPage))
  const safePage = Math.min(page, totalPages)
  const pagedGroups = groups.slice((safePage - 1) * perPage, safePage * perPage)

  return (
    <div>
      <AdminStats>
        <AdminStatCard
          label="Content comments"
          value={commentsState.items.length.toLocaleString()}
          hint="Individual responses"
          tone="purple"
          active={statusFilter === "All statuses"}
          onClick={() => {
            setStatusFilter("All statuses")
            setPage(1)
          }}
          actionLabel="Show all content comments"
        />
        <AdminStatCard
          label="Visible"
          value={activeCount.toLocaleString()}
          hint="Shown on WatchScreen"
          tone="green"
          active={statusFilter === "Active"}
          onClick={() => {
            setStatusFilter("Active")
            setPage(1)
          }}
          actionLabel="Filter to visible comments"
        />
        <AdminStatCard
          label="Hidden"
          value={hiddenCount.toLocaleString()}
          hint="Moderator-hidden"
          tone="gold"
          active={statusFilter === "Hidden"}
          onClick={() => {
            setStatusFilter("Hidden")
            setPage(1)
          }}
          actionLabel="Filter to hidden comments"
        />
      </AdminStats>

      <div className="admin-filter-row mb-4 flex flex-wrap gap-3">
        <input
          value={search}
          onChange={(event) => {
            setSearch(event.target.value)
            setPage(1)
          }}
          placeholder="Search content ID, title, author, or comment…"
          aria-label="Search content comments"
          className="min-w-0 flex-1 rounded-lg px-3 py-2 text-sm outline-none placeholder-[#4B5563]"
          style={{
            background: "#1A1030",
            border: "1px solid #374151",
            color: "#fff",
          }}
        />
        <select
          value={statusFilter}
          onChange={(event) => {
            setStatusFilter(event.target.value)
            setPage(1)
          }}
          aria-label="Filter comments by status"
          className="rounded-lg px-3 py-2 text-sm outline-none"
          style={{
            background: "#1A1030",
            border: "1px solid #374151",
            color: "#fff",
          }}
        >
          <option>All statuses</option>
          <option>Active</option>
          <option>Hidden</option>
        </select>
      </div>

      {commentsState.error && (
        <p className="mb-4 text-sm text-red-300" role="alert">
          {commentsState.error.message}
        </p>
      )}
      <div
        className="overflow-hidden rounded-xl"
        style={{ background: "#150D2A", border: "1px solid #374151" }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid #374151" }}>
                {[
                  "Content",
                  "Content ID",
                  "Comments",
                  "Commenters",
                  "Status",
                  "Actions",
                ].map((column) => (
                  <th
                    key={column}
                    className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                    style={{ color: "#9CA3AF" }}
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(commentsState.loading || groups.length === 0) && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-14 text-center"
                    style={{ color: "#9CA3AF" }}
                  >
                    {commentsState.loading
                      ? "Loading content comments…"
                      : "No content comments match these filters."}
                  </td>
                </tr>
              )}
              {pagedGroups.map((group) => {
                const active = group.comments.filter(
                  (item) => item.status.toLowerCase() === "active",
                ).length
                return (
                  <tr
                    key={group.contentId}
                    style={{ borderBottom: "1px solid rgba(55,65,81,0.5)" }}
                  >
                    <td className="px-4 py-3">
                      <div className="flex min-w-0 items-center gap-3">
                        {group.thumbnail ? (
                          <img
                            src={group.thumbnail}
                            alt=""
                            className="h-16 w-12 shrink-0 rounded bg-gray-900 object-cover"
                          />
                        ) : (
                          <div className="flex h-16 w-12 shrink-0 items-center justify-center rounded bg-gray-900 text-gray-500">
                            SF
                          </div>
                        )}
                        <strong className="break-words text-white">
                          {group.title}
                        </strong>
                      </div>
                    </td>
                    <td
                      className="break-all px-4 py-3 font-mono"
                      style={{ color: "#A78BFA" }}
                    >
                      {group.contentId}
                    </td>
                    <td className="px-4 py-3 text-white">
                      {group.comments.length}
                    </td>
                    <td className="px-4 py-3" style={{ color: "#D1D5DB" }}>
                      {
                        new Set(group.comments.map((item) => item.subscriberId))
                          .size
                      }
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-green-300">{active} visible</span>
                      {active < group.comments.length && (
                        <span className="ml-2 text-yellow-300">
                          {group.comments.length - active} hidden
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => setSelected(group)}
                        className="min-h-9 rounded px-3 py-1.5 text-xs"
                        style={{
                          border: "1px solid #7C3AED",
                          color: "#C4B5FD",
                        }}
                      >
                        View comments
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
      <AdminTablePagination
        page={safePage}
        total={groups.length}
        perPage={perPage}
        onPage={setPage}
        onPerPage={(amount) => {
          setPerPage(amount)
          setPage(1)
        }}
        label="comment groups"
      />

      {selected && (
        <AdminDetailsPanel
          title="Content comments"
          ariaLabel={`${selected.title} comments`}
          onClose={() => setSelected(null)}
          maxWidth="42rem"
          footer={
            <div className="admin-details-actions">
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="admin-details-button admin-details-button--secondary"
              >
                Close
              </button>
            </div>
          }
        >
          <div className="flex min-w-0 gap-3">
            {selected.thumbnail && (
              <img
                src={selected.thumbnail}
                alt=""
                className="h-24 w-16 shrink-0 rounded object-cover"
              />
            )}
            <div className="min-w-0">
              <p
                className="break-all text-xs uppercase tracking-wider"
                style={{ color: "#A78BFA" }}
              >
                Content ID {selected.contentId}
              </p>
              <h3 className="break-words text-xl font-semibold text-white">
                {selected.title}
              </h3>
              <p className="mt-1 text-sm" style={{ color: "#9CA3AF" }}>
                {selected.comments.length} comment(s)
              </p>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {selected.comments.length === 0 && (
              <p style={{ color: "#9CA3AF" }}>
                No comments remain for this content.
              </p>
            )}
            {selected.comments.map((comment) => (
              <article
                key={comment.id}
                className="min-w-0 rounded-lg p-4"
                style={{ background: "#1A1030", border: "1px solid #374151" }}
              >
                <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <strong className="break-words text-white">
                      {comment.authorName || "Unknown member"}
                    </strong>
                    <p
                      className="mt-1 break-all text-xs"
                      style={{ color: "#716a7d" }}
                    >
                      {comment.subscriberId} · {comment.dateCommented}
                    </p>
                  </div>
                  <span
                    className={
                      comment.status.toLowerCase() === "active"
                        ? "text-green-300 text-xs"
                        : "text-yellow-300 text-xs"
                    }
                  >
                    {comment.status}
                  </span>
                </div>
                <p
                  className="mt-3 break-words leading-relaxed"
                  style={{
                    color: "#D1D5DB",
                    whiteSpace: "pre-wrap",
                    overflowWrap: "anywhere",
                  }}
                >
                  {comment.text}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    disabled={commentsState.mutating}
                    onClick={() => void changeStatus(comment)}
                    className="min-h-9 rounded px-3 py-1 text-xs disabled:opacity-40"
                    style={{ border: "1px solid #7C3AED", color: "#C4B5FD" }}
                  >
                    {comment.status.toLowerCase() === "active"
                      ? "Hide"
                      : "Restore"}
                  </button>
                  <button
                    disabled={commentsState.mutating}
                    onClick={() => void remove(comment)}
                    className="min-h-9 rounded px-3 py-1 text-xs disabled:opacity-40"
                    style={{
                      border: "1px solid rgba(153,27,27,0.5)",
                      color: "#FCA5A5",
                    }}
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        </AdminDetailsPanel>
      )}
    </div>
  )
}
