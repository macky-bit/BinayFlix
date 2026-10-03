import { useAdminCollection, useAdminRepository } from "../../data"
import { SectionTitle, StatusBadge } from "./shared"

interface ResourceRecord {
  id: string
}

export default function PerformanceTab() {
  const content = useAdminCollection(
    useAdminRepository<ResourceRecord>("content"),
  )
  const subscribers = useAdminCollection(
    useAdminRepository<ResourceRecord>("subscribers"),
  )
  const logs = useAdminCollection(
    useAdminRepository<ResourceRecord>("system-logs"),
  )
  const backups = useAdminCollection(
    useAdminRepository<ResourceRecord>("backups"),
  )

  const resources = [
    { label: "Catalog records", state: content },
    { label: "Subscriber accounts", state: subscribers },
    { label: "System events", state: logs },
    { label: "Backup jobs", state: backups },
  ]

  return (
    <div>
      <SectionTitle
        title="Database Health"
        description="Live connectivity and record counts from Supabase. Infrastructure CPU, memory, and storage metrics belong in Supabase observability and are not fabricated here."
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {resources.map(({ label, state }) => (
          <section key={label} className="card-surface p-5 space-y-3">
            <h3 className="text-sm font-semibold text-white">{label}</h3>
            <p className="text-3xl font-bold text-[#F5A800]">{state.total}</p>
            <StatusBadge
              label={
                state.loading
                  ? "Loading"
                  : state.error
                    ? "Unavailable"
                    : "Connected"
              }
              variant={state.error ? "critical" : "positive"}
            />
            {state.error && (
              <p className="text-xs text-red-300">{state.error.message}</p>
            )}
          </section>
        ))}
      </div>
    </div>
  )
}
