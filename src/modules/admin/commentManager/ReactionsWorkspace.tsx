import { useMemo, useState } from "react"
import { REACTION_DEFINITIONS } from "../../../shared/reactions"
import { AdminStatCard, AdminStats } from "../components/AdminUI"
import { useAdminCollection, useAdminRepository } from "../data"

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

export default function ReactionsWorkspace({ toast }: { toast: (message: string) => void }) {
  const reactionsState = useAdminCollection(useAdminRepository<ReactionRecord>("reactions"))
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<ReactionGroup | null>(null)

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
    return [...grouped.values()].filter((group) => !query || group.title.toLowerCase().includes(query) || group.contentId.includes(query))
  }, [reactionsState.items, search])

  const remove = async (reaction: ReactionRecord) => {
    if (!window.confirm("Permanently delete this reaction?")) return
    try {
      await reactionsState.remove(reaction.id)
      setSelected((current) => current ? { ...current, reactions: current.reactions.filter((item) => item.id !== reaction.id) } : null)
      toast("Reaction deleted.")
    } catch (error) {
      toast(error instanceof Error ? error.message : "Unable to delete reaction.")
    }
  }

  const changeStatus = async (reaction: ReactionRecord) => {
    const nextStatus = reaction.status.toLowerCase() === "active" ? "Hidden" : "Active"
    try {
      const updated = await reactionsState.update(reaction.id, { status: nextStatus })
      setSelected((current) => current ? { ...current, reactions: current.reactions.map((item) => item.id === reaction.id ? updated : item) } : null)
      toast(`${nextStatus === "Active" ? "Restored" : "Hidden"} reaction.`)
    } catch (error) {
      toast(error instanceof Error ? error.message : "Unable to update reaction.")
    }
  }

  return <div>
    <AdminStats>
      <AdminStatCard label="Reactions" value={reactionsState.items.length.toLocaleString()} hint="Individual responses" tone="purple" />
      <AdminStatCard label="Content IDs" value={groups.length.toLocaleString()} hint="Titles with reactions" tone="gold" />
      <AdminStatCard label="Members" value={new Set(reactionsState.items.map((item) => item.subscriberId)).size.toLocaleString()} hint="Unique reactors" tone="green" />
      <AdminStatCard label="Hidden" value={reactionsState.items.filter((item) => item.status.toLowerCase() === "hidden").length.toLocaleString()} hint="Moderator-hidden" tone="blue" />
    </AdminStats>
    <div className="admin-filter-row flex mb-4"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search content title or ID…" aria-label="Search reaction content" className="w-full px-3 py-2 text-sm rounded-lg outline-none placeholder-[#4B5563]" style={{ background: "#1A1030", border: "1px solid #374151", color: "#fff" }} /></div>
    {reactionsState.error && <p className="mb-4 text-sm text-red-300" role="alert">{reactionsState.error.message}</p>}
    <div className="rounded-xl overflow-hidden" style={{ background: "#150D2A", border: "1px solid #374151" }}><div className="overflow-x-auto"><table className="w-full text-sm">
      <thead><tr style={{ borderBottom: "1px solid #374151" }}>{["Content", "Content ID", "Reactions", "Reactors", "Actions"].map((column) => <th key={column} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap" style={{ color: "#9CA3AF" }}>{column}</th>)}</tr></thead>
      <tbody>
        {(reactionsState.loading || groups.length === 0) && <tr><td colSpan={5} className="px-4 py-14 text-center" style={{ color: "#9CA3AF" }}>{reactionsState.loading ? "Loading reactions…" : "No content with reactions found."}</td></tr>}
        {groups.map((group) => <tr key={group.contentId} className="cursor-pointer" style={{ borderBottom: "1px solid rgba(55,65,81,0.5)" }} onClick={() => setSelected(group)}>
          <td className="px-4 py-3"><div className="flex items-center gap-3">{group.thumbnail ? <img src={group.thumbnail} alt="" className="w-12 h-16 rounded object-cover bg-gray-900" /> : <div className="w-12 h-16 rounded bg-gray-900 flex items-center justify-center text-gray-500">SF</div>}<strong className="text-white">{group.title}</strong></div></td>
          <td className="px-4 py-3 font-mono" style={{ color: "#A78BFA" }}>{group.contentId}</td>
          <td className="px-4 py-3"><div className="flex flex-wrap gap-2">{REACTION_DEFINITIONS.map((definition) => { const count = group.reactions.filter((item) => item.emoji === definition.emoji && item.status.toLowerCase() === "active").length; return count ? <span key={definition.key} aria-label={`${definition.label}: ${count}`}>{definition.emoji} {count}</span> : null })}{group.reactions.some((item) => item.status.toLowerCase() === "hidden") && <span className="text-yellow-300">{group.reactions.filter((item) => item.status.toLowerCase() === "hidden").length} hidden</span>}</div></td>
          <td className="px-4 py-3" style={{ color: "#D1D5DB" }}>{new Set(group.reactions.map((item) => item.subscriberId)).size}</td>
          <td className="px-4 py-3"><button type="button" onClick={(event) => { event.stopPropagation(); setSelected(group) }} className="px-3 py-1.5 text-xs rounded" style={{ border: "1px solid #7C3AED", color: "#C4B5FD" }}>View reactors</button></td>
        </tr>)}
      </tbody>
    </table></div></div>
    {selected && <div className="fixed inset-0 z-40 flex" style={{ background: "rgba(0,0,0,0.55)" }} onClick={() => setSelected(null)}><aside className="ml-auto h-full w-full max-w-xl overflow-y-auto p-6 shadow-2xl" style={{ background: "#150D2A", borderLeft: "1px solid #7C3AED" }} onClick={(event) => event.stopPropagation()} aria-label={`${selected.title} reactions`}>
      <header className="flex items-start justify-between gap-4 mb-6"><div className="flex gap-3">{selected.thumbnail && <img src={selected.thumbnail} alt="" className="w-16 h-24 rounded object-cover" />}<div><p className="text-xs uppercase tracking-wider" style={{ color: "#A78BFA" }}>Content ID {selected.contentId}</p><h2 className="text-xl font-semibold text-white">{selected.title}</h2><p className="mt-1 text-sm" style={{ color: "#9CA3AF" }}>{selected.reactions.length} reaction(s)</p></div></div><button type="button" onClick={() => setSelected(null)} aria-label="Close reaction details" className="text-xl" style={{ color: "#9CA3AF" }}>×</button></header>
      <div className="space-y-3">{selected.reactions.length === 0 && <p style={{ color: "#9CA3AF" }}>No reactions remain for this content.</p>}{selected.reactions.map((reaction) => { const definition = REACTION_DEFINITIONS.find((item) => item.emoji === reaction.emoji); return <article key={reaction.id} className="rounded-lg p-4" style={{ background: "#1A1030", border: "1px solid #374151" }}><div className="flex items-start justify-between gap-3"><div><strong className="text-white">{reaction.subscriberName || "Unknown member"}</strong><p className="text-xs mt-1" style={{ color: "#716a7d" }}>{reaction.subscriberId}</p><p className="mt-3 text-sm" style={{ color: "#D1D5DB" }}><span className="text-xl mr-2">{reaction.emoji}</span>{definition?.label || "Reaction"} · {reaction.date}</p><span className={reaction.status.toLowerCase() === "active" ? "text-green-300 text-xs" : "text-yellow-300 text-xs"}>{reaction.status}</span></div><div className="flex gap-2"><button disabled={reactionsState.mutating} onClick={() => void changeStatus(reaction)} className="px-3 py-1 text-xs rounded disabled:opacity-40" style={{ border: "1px solid #7C3AED", color: "#C4B5FD" }}>{reaction.status.toLowerCase() === "active" ? "Hide" : "Restore"}</button><button disabled={reactionsState.mutating} onClick={() => void remove(reaction)} className="px-3 py-1 text-xs rounded disabled:opacity-40" style={{ border: "1px solid rgba(153,27,27,0.5)", color: "#FCA5A5" }}>Delete</button></div></div></article> })}</div>
    </aside></div>}
  </div>
}
