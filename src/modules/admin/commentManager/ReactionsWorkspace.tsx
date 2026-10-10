import { useMemo, useState } from "react"
import { REACTION_DEFINITIONS } from "../../../shared/reactions"
import AdminDetailsPanel from "../components/AdminDetailsPanel"
import {
  AdminRowAction,
  AdminStatCard,
  AdminStats,
  AdminTablePagination,
} from "../components/AdminUI"
import { useAdminCollection, useAdminRepository } from "../data"
import CommunityDeleteDialog from "./CommunityDeleteDialog"

interface ReactionRecord {
  id: string
  subscriberId: string
  subscriberName: string
  contentId: string
  contentTitle: string
  contentThumb: string
  emoji: string
  date: string
  status: string
}

interface ReactionGroup {
  contentId: string
  title: string
  thumbnail: string
  reactions: ReactionRecord[]
}

export default function ReactionsWorkspace({
  toast,
}: {
  toast: (message: string) => void
}) {
  const reactionsState = useAdminCollection(
    useAdminRepository<ReactionRecord>("reactions"),
  )
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("All statuses")
  const [selected, setSelected] = useState<ReactionGroup | null>(null)
  const [pendingDelete, setPendingDelete] = useState<ReactionRecord | null>(null)
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)

  const groups = useMemo(() => {
    const grouped = new Map<string, ReactionGroup>()
    for (const reaction of reactionsState.items) {
      const group = grouped.get(reaction.contentId) ?? {
        contentId: reaction.contentId,
        title: reaction.contentTitle || `Content ${reaction.contentId}`,
        thumbnail: reaction.contentThumb,
        reactions: [],
      }
      group.reactions.push(reaction)
      grouped.set(reaction.contentId, group)
    }
    const query = search.trim().toLowerCase()
    return [...grouped.values()]
      .map((group) => ({
        ...group,
        reactions: group.reactions.filter(
          (reaction) =>
            statusFilter === "All statuses" ||
            reaction.status.toLowerCase() === statusFilter.toLowerCase(),
        ),
      }))
      .filter(
        (group) =>
          group.reactions.length > 0 &&
          (!query ||
            group.title.toLowerCase().includes(query) ||
            group.contentId.toLowerCase().includes(query)),
      )
  }, [reactionsState.items, search, statusFilter])

  const remove = async (reaction: ReactionRecord) => {
    try {
      await reactionsState.remove(reaction.id)
      setSelected((current) =>
        current
          ? {
              ...current,
              reactions: current.reactions.filter(
                (item) => item.id !== reaction.id,
              ),
            }
          : null,
      )
      toast("Reaction deleted.")
    } catch (error) {
      toast(
        error instanceof Error ? error.message : "Unable to delete reaction.",
      )
    } finally {
      setPendingDelete(null)
    }
  }

  const changeStatus = async (reaction: ReactionRecord) => {
    const nextStatus =
      reaction.status.toLowerCase() === "active" ? "Hidden" : "Active"
    try {
      const updated = await reactionsState.update(reaction.id, {
        status: nextStatus,
      })
      setSelected((current) =>
        current
          ? {
              ...current,
              reactions: current.reactions.map((item) =>
                item.id === reaction.id ? updated : item,
              ),
            }
          : null,
      )
      toast(`${nextStatus === "Active" ? "Restored" : "Hidden"} reaction.`)
    } catch (error) {
      toast(
        error instanceof Error ? error.message : "Unable to update reaction.",
      )
    }
  }

  const hiddenCount = reactionsState.items.filter(
    (item) => item.status.toLowerCase() === "hidden",
  ).length
  const totalPages = Math.max(1, Math.ceil(groups.length / perPage))
  const safePage = Math.min(page, totalPages)
  const pagedGroups = groups.slice((safePage - 1) * perPage, safePage * perPage)

  return (
    <div>
      <AdminStats>
        <AdminStatCard
          label="Reactions"
          value={reactionsState.items.length.toLocaleString()}
          hint="Individual responses"
          tone="purple"
          active={statusFilter === "All statuses"}
          onClick={() => {
            setStatusFilter("All statuses")
            setPage(1)
          }}
          actionLabel="Show all reactions"
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
          actionLabel="Filter to hidden reactions"
        />
      </AdminStats>

      <div className="admin-filter-row mb-4 flex flex-wrap gap-3">
        <input
          value={search}
          onChange={(event) => {
            setSearch(event.target.value)
            setPage(1)
          }}
          placeholder="Search content title or ID…"
          aria-label="Search reaction content"
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
          aria-label="Filter reactions by status"
          className="content-command-bar__select"
        >
          <option>All statuses</option>
          <option>Active</option>
          <option>Hidden</option>
        </select>
      </div>

      {reactionsState.error && (
        <p className="mb-4 text-sm text-red-300" role="alert">
          {reactionsState.error.message}
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
                  "Reactions",
                  "Reactors",
                  "Actions",
                ].map((column) => (
                  <th
                    key={column}
                    className={`whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider${["Content ID", "Reactions", "Reactors"].includes(column) ? " admin-table-head--emphasis" : ""}`}
                    style={{ color: "#9CA3AF" }}
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(reactionsState.loading || groups.length === 0) && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-14 text-center"
                    style={{ color: "#9CA3AF" }}
                  >
                    {reactionsState.loading
                      ? "Loading reactions…"
                      : "No content with reactions found."}
                  </td>
                </tr>
              )}
              {pagedGroups.map((group) => (
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
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {REACTION_DEFINITIONS.map((definition) => {
                        const count = group.reactions.filter(
                          (item) =>
                            item.emoji === definition.emoji &&
                            item.status.toLowerCase() === "active",
                        ).length
                        return count ? (
                          <span
                            key={definition.key}
                            aria-label={`${definition.label}: ${count}`}
                          >
                            {definition.emoji} {count}
                          </span>
                        ) : null
                      })}
                      {group.reactions.some(
                        (item) => item.status.toLowerCase() === "hidden",
                      ) && (
                        <span className="text-yellow-300">
                          {
                            group.reactions.filter(
                              (item) => item.status.toLowerCase() === "hidden",
                            ).length
                          }{" "}
                          hidden
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3" style={{ color: "#D1D5DB" }}>
                    {
                      new Set(group.reactions.map((item) => item.subscriberId))
                        .size
                    }
                  </td>
                  <td className="px-4 py-3">
                    <AdminRowAction
                      action="view"
                      name={`reactors for ${group.contentTitle}`}
                      onClick={() => setSelected(group)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
          label="reaction groups"
        />
      </div>

      {selected && (
        <AdminDetailsPanel
          title="Reaction details"
          ariaLabel={`${selected.title} reactions`}
          onClose={() => setSelected(null)}
          maxWidth="36rem"
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
                {selected.reactions.length} reaction(s)
              </p>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {selected.reactions.length === 0 && (
              <p style={{ color: "#9CA3AF" }}>
                No reactions remain for this content.
              </p>
            )}
            {selected.reactions.map((reaction) => {
              const definition = REACTION_DEFINITIONS.find(
                (item) => item.emoji === reaction.emoji,
              )
              return (
                <article
                  key={reaction.id}
                  className="min-w-0 rounded-lg p-4"
                  style={{ background: "#1A1030", border: "1px solid #374151" }}
                >
                  <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <strong className="break-words text-white">
                        {reaction.subscriberName || "Unknown member"}
                      </strong>
                      <p
                        className="mt-1 break-all text-xs"
                        style={{ color: "#716a7d" }}
                      >
                        {reaction.subscriberId}
                      </p>
                      <p
                        className="mt-3 break-words text-sm"
                        style={{ color: "#D1D5DB" }}
                      >
                        <span className="mr-2 text-xl">{reaction.emoji}</span>
                        {definition?.label || "Reaction"} · {reaction.date}
                      </p>
                      <span
                        className={
                          reaction.status.toLowerCase() === "active"
                            ? "text-green-300 text-xs"
                            : "text-yellow-300 text-xs"
                        }
                      >
                        {reaction.status}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        disabled={reactionsState.mutating}
                        onClick={() => void changeStatus(reaction)}
                        className="min-h-9 rounded px-3 py-1 text-xs disabled:opacity-40"
                        style={{
                          border: "1px solid #7C3AED",
                          color: "#C4B5FD",
                        }}
                      >
                        {reaction.status.toLowerCase() === "active"
                          ? "Hide"
                          : "Restore"}
                      </button>
                      <button
                        disabled={reactionsState.mutating}
                        onClick={() => setPendingDelete(reaction)}
                        className="min-h-9 rounded px-3 py-1 text-xs disabled:opacity-40"
                        style={{
                          border: "1px solid rgba(153,27,27,0.5)",
                          color: "#FCA5A5",
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        </AdminDetailsPanel>
      )}
      <CommunityDeleteDialog
        open={Boolean(pendingDelete)}
        itemLabel="reaction"
        detail={
          pendingDelete
            ? `The ${pendingDelete.emoji} reaction from ${pendingDelete.subscriberName || "this member"} will be permanently removed.`
            : ""
        }
        busy={reactionsState.mutating}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) void remove(pendingDelete)
        }}
      />
    </div>
  )
}
