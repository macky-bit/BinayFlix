import { useMemo, useState } from "react"

import { supabase } from "../../../../lib/supabase"
import { useAdminCollection, useAdminRepository } from "../../data"
import { AdminRowAction, AdminStatCard, AdminStats } from "../../components/AdminUI"
import {
  DetailRow,
  AdminDetailGrid,
  AdminDetailsSection,
  Drawer,
  EmptyRow,
  Modal,
  Pagination,
  SearchInput,
  SectionTitle,
  Select,
  Spinner,
  StatusBadge,
  statusVariantFor,
} from "./shared"

interface BackupEntry {
  id: string
  type: string
  datasetKey: string
  description: string
  started: string
  completed: string
  size: string
  createdBy: string
  status: string
  storagePath: string
  tableNames: string[]
  fileCount: number
  errorMessage: string
}

interface DownloadFile {
  path: string
  signedUrl: string
}

const DATASETS = [
  {
    value: "full",
    label: "Full Database",
    tables: ["All supported public tables"],
  },
  {
    value: "catalog",
    label: "Content Catalog",
    tables: ["category", "genre", "content", "content_genre", "soundtrack", "previous_film_refresher"],
  },
  {
    value: "community",
    label: "Community Data",
    tables: ["content_review", "reaction", "content_comment", "community_post", "community_comment", "platform_feedback"],
  },
  {
    value: "accounts",
    label: "Accounts & Subscriptions",
    tables: ["user", "subscriber", "member_profile", "watch_history", "subscription", "user_subscription", "payment_transaction"],
  },
  {
    value: "system",
    label: "System Configuration",
    tables: ["admin", "master_admin", "system_log", "backup_job"],
  },
] as const

const datasetOptions = DATASETS.map(({ value, label }) => ({ value, label }))
const datasetKeyForType = (type: string) =>
  DATASETS.find((dataset) => dataset.label === type)?.value ?? "full"

async function functionErrorMessage(error: unknown): Promise<string> {
  if (error && typeof error === "object" && "context" in error) {
    const context = (error as { context?: Response }).context
    if (context) {
      try {
        const body = await context.clone().json() as { error?: string }
        if (body.error) return body.error
      } catch {
        // Fall through to the SDK message.
      }
    }
  }
  return error instanceof Error ? error.message : "The backup request failed."
}

function durationLabel(started: string, completed: string, status: string) {
  if (status === "In Progress") return "Running…"
  const start = new Date(started).getTime()
  const end = new Date(completed).getTime()
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return "—"
  const seconds = Math.max(1, Math.round((end - start) / 1000))
  return seconds < 60 ? `${seconds} sec` : `${Math.ceil(seconds / 60)} min`
}

export default function BackupsTab() {
  const backupState = useAdminCollection(
    useAdminRepository<BackupEntry>("backups"),
  )
  const backups = backupState.items
  const [search, setSearch] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [viewBackup, setViewBackup] = useState<BackupEntry | null>(null)
  const [showRunForm, setShowRunForm] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [retryBackup, setRetryBackup] = useState<BackupEntry | null>(null)
  const [runData, setRunData] = useState({ dataset: "full", description: "" })
  const [running, setRunning] = useState(false)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [notice, setNotice] = useState<{ tone: "success" | "error"; message: string } | null>(null)

  const typeOptions = useMemo(() => [
    { value: "all", label: "All Datasets" },
    ...DATASETS.filter((dataset) => backups.some((backup) => backup.type === dataset.label))
      .map(({ label }) => ({ value: label, label })),
  ], [backups])

  const statusOptions = useMemo(() => {
    const preferredOrder = ["In Progress", "Successful", "Failed", "Cancelled"]
    const statuses = [...new Set(backups.map((backup) => backup.status).filter(Boolean))]
      .sort((a, b) => preferredOrder.indexOf(a) - preferredOrder.indexOf(b))
    return [{ value: "all", label: "All Statuses" }, ...statuses.map((status) => ({ value: status, label: status }))]
  }, [backups])

  const filtered = useMemo(() => backups.filter((backup) => {
    const query = search.toLowerCase()
    const matchesQuery = !query ||
      `${backup.id} ${backup.type} ${backup.createdBy} ${backup.tableNames.join(" ")}`
        .toLowerCase().includes(query)
    return matchesQuery &&
      (filterType === "all" || backup.type === filterType) &&
      (filterStatus === "all" || backup.status === filterStatus)
  }), [backups, search, filterType, filterStatus])

  const selectedDataset = DATASETS.find((dataset) => dataset.value === runData.dataset) ?? DATASETS[0]
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const safePage = Math.min(page, totalPages)
  const pageRows = filtered.slice((safePage - 1) * perPage, safePage * perPage)
  const successfulCount = backups.filter((backup) => backup.status === "Successful").length
  const failedCount = backups.filter((backup) => backup.status === "Failed").length
  const latestBackup = backups[0]

  function resetFilters() {
    setSearch("")
    setFilterType("all")
    setFilterStatus("all")
    setPage(1)
  }

  async function runBackup(dataset = runData.dataset, description = runData.description) {
    setShowConfirm(false)
    setShowRunForm(false)
    setRetryBackup(null)
    setRunning(true)
    setNotice(null)
    const { data, error } = await supabase.functions.invoke("database-backup", {
      body: { dataset, description },
    })
    if (error) {
      setNotice({ tone: "error", message: await functionErrorMessage(error) })
    } else {
      const result = data as { fileCount?: number }
      setNotice({
        tone: "success",
        message: `Backup completed with ${result.fileCount ?? 0} CSV file${result.fileCount === 1 ? "" : "s"}.`,
      })
    }
    setRunning(false)
    await backupState.reload()
  }

  async function downloadBackup(backup: BackupEntry) {
    setDownloadingId(backup.id)
    setNotice(null)
    const { data, error } = await supabase.functions.invoke("database-backup", {
      body: { action: "download", jobId: backup.id },
    })
    if (error) {
      setNotice({ tone: "error", message: await functionErrorMessage(error) })
      setDownloadingId(null)
      return
    }

    const files = ((data as { files?: DownloadFile[] }).files ?? [])
      .filter((file) => file.signedUrl)
    for (const file of files) {
      const anchor = document.createElement("a")
      anchor.href = file.signedUrl
      anchor.download = file.path.split("/").pop() ?? "backup.csv"
      anchor.rel = "noopener"
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
    }
    setNotice({
      tone: "success",
      message: `${files.length} CSV file${files.length === 1 ? "" : "s"} prepared for download.`,
    })
    setDownloadingId(null)
  }

  return (
    <div>
      <SectionTitle
        title="Database Backups"
        description="Export selected StreamFlix database datasets as CSV files to private Supabase Storage."
      />

      <AdminStats>
        <AdminStatCard label="Total backups" value={backups.length} hint="All recorded jobs" tone="purple" active={filterStatus === "all"} onClick={() => { setFilterStatus("all"); setPage(1) }} actionLabel="Show all backups" />
        <AdminStatCard label="Successful" value={successfulCount} hint="Completed exports" tone="green" active={filterStatus === "Successful"} onClick={() => { setFilterStatus("Successful"); setPage(1) }} actionLabel="Filter to successful backups" />
        <AdminStatCard label="Failed" value={failedCount} hint="Jobs needing review" tone="red" active={filterStatus === "Failed"} onClick={() => { setFilterStatus("Failed"); setPage(1) }} actionLabel="Filter to failed backups" />
        <AdminStatCard label="Latest backup" value={latestBackup?.completed || latestBackup?.started || "No record"} hint={latestBackup?.type || "No backup jobs"} tone="blue" />
      </AdminStats>

      {notice && (
        <div
          role={notice.tone === "error" ? "alert" : "status"}
          className={`mb-4 rounded-md border px-4 py-3 text-sm ${notice.tone === "error" ? "border-red-800 bg-red-950/40 text-red-300" : "border-emerald-800 bg-emerald-950/40 text-emerald-300"}`}
        >
          {notice.message}
        </div>
      )}

      {running && (
        <div className="mb-4 card-surface p-4 flex items-center gap-3" role="status">
          <Spinner size={18} />
          <div>
            <p className="text-sm font-medium text-white">Creating CSV backup…</p>
            <p className="text-xs text-[#9CA3AF]">The export is being saved to the private database-backups bucket.</p>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row flex-wrap gap-3 mb-4">
        <SearchInput value={search} onChange={(value) => { setSearch(value); setPage(1) }} placeholder="Search backups or tables..." className="w-full sm:w-64" />
        <Select value={filterType} onChange={(value) => { setFilterType(value); setPage(1) }} options={typeOptions} className="w-full sm:w-52" />
        <Select value={filterStatus} onChange={(value) => { setFilterStatus(value); setPage(1) }} options={statusOptions} className="w-full sm:w-40" />
        <button onClick={resetFilters} className="btn-violet focus-ring admin-reset-filters">Reset Filters</button>
        <div className="sm:ml-auto">
          <button type="button" onClick={() => setShowRunForm(true)} disabled={running} aria-busy={running} className="btn-primary flex items-center gap-2 px-5 py-2.5">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            Run CSV Backup
          </button>
        </div>
      </div>

      <div className="table-surface">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" aria-label="Database backups">
            <thead>
              <tr className="border-b border-stone-700/60">
                {["Backup ID", "Dataset", "Tables", "Started", "Completed", "Size", "Status", "Actions"].map((heading) => (
                  <th key={heading} className="text-left text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider px-4 py-3 whitespace-nowrap" scope="col">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <EmptyRow cols={8} message={backupState.loading ? "Loading backup records…" : "No backup records match the selected dataset and status."} />
              ) : pageRows.map((backup) => (
                <tr key={backup.id} className="tr-hover border-b border-stone-700/30 last:border-0">
                  <td className="px-4 py-3 font-mono text-xs text-[#9CA3AF] whitespace-nowrap">{backup.id}</td>
                  <td className="px-4 py-3 text-white whitespace-nowrap">{backup.type}</td>
                  <td className="px-4 py-3 text-[#9CA3AF] text-xs whitespace-nowrap">{backup.fileCount || backup.tableNames.length}</td>
                  <td className="px-4 py-3 text-[#9CA3AF] text-xs whitespace-nowrap">{backup.started}</td>
                  <td className="px-4 py-3 text-[#9CA3AF] text-xs whitespace-nowrap">{backup.completed || "—"}</td>
                  <td className="px-4 py-3 text-white whitespace-nowrap">{backup.size}</td>
                  <td className="px-4 py-3 whitespace-nowrap"><StatusBadge label={backup.status} variant={statusVariantFor(backup.status)} /></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 flex-wrap">
                      <AdminRowAction action="view" name={`backup ${backup.id}`} onClick={() => setViewBackup(backup)} />
                      {backup.status === "Successful" && backup.storagePath && (
                        <button onClick={() => void downloadBackup(backup)} disabled={downloadingId === backup.id} className="btn-ghost px-3 py-1 text-xs whitespace-nowrap">
                          {downloadingId === backup.id ? "Preparing…" : "Download CSVs"}
                        </button>
                      )}
                      {backup.status === "Failed" && (
                        <button onClick={() => setRetryBackup(backup)} className="btn-outline px-3 py-1 text-xs text-amber-400 border-amber-700 hover:bg-amber-900/20">Retry</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination page={safePage} total={filtered.length} perPage={perPage} onPage={setPage} onPerPage={(amount) => { setPerPage(amount); setPage(1) }} label="backups" />
      </div>

      <Drawer
        open={Boolean(viewBackup)}
        onClose={() => setViewBackup(null)}
        title="Backup Details"
        footer={viewBackup && (
          <>
            <button onClick={() => setViewBackup(null)} className="admin-details-button admin-details-button--secondary">Close</button>
            {viewBackup.status === "Successful" && viewBackup.storagePath && (
              <button onClick={() => void downloadBackup(viewBackup)} className="admin-details-button admin-details-button--primary">Download CSVs</button>
            )}
          </>
        )}
      >
        {viewBackup && (
          <>
            <AdminDetailsSection title="Backup Information">
              <AdminDetailGrid>
                <DetailRow label="Backup ID" value={<span className="font-mono">{viewBackup.id}</span>} />
                <DetailRow label="Dataset" value={viewBackup.type} />
                <DetailRow label="Started" value={viewBackup.started} />
                <DetailRow label="Completed" value={viewBackup.completed} />
                <DetailRow label="Duration" value={durationLabel(viewBackup.started, viewBackup.completed, viewBackup.status)} />
                <DetailRow label="File Size" value={viewBackup.size} />
                <DetailRow label="CSV Files" value={String(viewBackup.fileCount)} />
                <DetailRow label="Status" value={<StatusBadge label={viewBackup.status} variant={statusVariantFor(viewBackup.status)} />} />
              </AdminDetailGrid>
              <DetailRow label="Created By" value={<span className="font-mono break-all">{viewBackup.createdBy}</span>} />
              <DetailRow label="Description" value={viewBackup.description} />
            </AdminDetailsSection>
            <AdminDetailsSection title="Exported Tables">
              <div className="flex flex-wrap gap-2">
                {viewBackup.tableNames.length === 0 ? <span className="text-sm text-[#9CA3AF]">No table metadata recorded.</span> : viewBackup.tableNames.map((table) => (
                  <span key={table} className="admin-details-tag">{table}</span>
                ))}
              </div>
            </AdminDetailsSection>
            {viewBackup.errorMessage && (
              <AdminDetailsSection title="Backup Error">
                <DetailRow label="Error" value={<span className="text-red-400">{viewBackup.errorMessage}</span>} />
              </AdminDetailsSection>
            )}
          </>
        )}
      </Drawer>

      <Modal
        open={showRunForm}
        onClose={() => setShowRunForm(false)}
        title="Run CSV Database Backup"
        footer={
          <>
            <button onClick={() => setShowRunForm(false)} className="btn-ghost px-4 py-2 text-sm">Cancel</button>
            <button onClick={() => { setShowRunForm(false); setShowConfirm(true) }} className="btn-primary px-4 py-2 text-sm">Review Backup</button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs text-[#9CA3AF] uppercase tracking-wider block mb-1.5">Data to back up</label>
            <Select value={runData.dataset} onChange={(dataset) => setRunData((current) => ({ ...current, dataset }))} options={datasetOptions} className="w-full" />
          </div>
          <div className="rounded-md border border-stone-700 bg-[rgba(26,16,48,0.35)] p-3">
            <p className="text-xs uppercase tracking-wider text-[#9CA3AF]">CSV files included</p>
            <p className="mt-1 text-sm text-white">{selectedDataset.tables.join(", ")}</p>
            <p className="mt-2 text-xs text-[#9CA3AF]">Sensitive credential fields such as passwords, tokens, secrets, and PIN hashes are excluded.</p>
          </div>
          <div>
            <label className="text-xs text-[#9CA3AF] uppercase tracking-wider block mb-1.5">Description (optional)</label>
            <textarea value={runData.description} onChange={(event) => setRunData((current) => ({ ...current, description: event.target.value }))} placeholder="Reason for this backup…" rows={3} className="w-full bg-[rgba(26,16,48,0.5)] border border-stone-700 rounded-md px-3 py-2 text-sm text-white placeholder-[#9CA3AF] focus:outline-none focus:border-[#7C3AED] resize-none" />
          </div>
        </div>
      </Modal>

      <Modal
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        title="Start CSV backup?"
        footer={
          <>
            <button onClick={() => setShowConfirm(false)} className="btn-ghost px-4 py-2 text-sm">Cancel</button>
            <button onClick={() => void runBackup()} className="btn-primary px-4 py-2 text-sm">Create Backup</button>
          </>
        }
      >
        <p className="text-sm text-[#9CA3AF] leading-relaxed">
          <strong className="text-white">{selectedDataset.label}</strong> will be exported as {selectedDataset.value === "full" ? "one CSV file per supported table" : `${selectedDataset.tables.length} CSV files`} and saved in the private database-backups bucket.
        </p>
      </Modal>

      <Modal
        open={Boolean(retryBackup)}
        onClose={() => setRetryBackup(null)}
        title="Retry CSV backup?"
        footer={
          <>
            <button onClick={() => setRetryBackup(null)} className="btn-ghost px-4 py-2 text-sm">Cancel</button>
            <button onClick={() => retryBackup && void runBackup(retryBackup.datasetKey || datasetKeyForType(retryBackup.type), retryBackup.description)} disabled={running} className="btn-primary px-4 py-2 text-sm">Retry Backup</button>
          </>
        }
      >
        <p className="text-sm text-[#9CA3AF] leading-relaxed">A new backup job will export the same dataset as backup <strong className="text-white font-mono">{retryBackup?.id}</strong>.</p>
      </Modal>
    </div>
  )
}
