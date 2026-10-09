import { useAdminCollection, useAdminRepository } from "../../data"
import { AdminStatCard, AdminStats } from "../../components/AdminUI"
import { SectionTitle } from "./shared"

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
  const tones = ["purple", "green", "gold", "blue"] as const
  const errors = resources.filter(({ state }) => state.error)

  return (
    <div>
      <SectionTitle
        title="Database Health"
        description="Live connectivity and record counts from Supabase. Infrastructure CPU, memory, and storage metrics belong in Supabase observability and are not fabricated here."
      />
      <AdminStats>
        {resources.map(({ label, state }, index) => (
          <AdminStatCard
            key={label}
            label={label}
            value={state.loading ? "—" : state.total}
            hint={state.loading ? "Connecting to Supabase" : state.error ? "Connection unavailable" : "Connected to Supabase"}
            tone={tones[index]}
          />
        ))}
      </AdminStats>
      {errors.length > 0 && (
        <div className="mt-4 rounded-lg border border-red-800/50 bg-red-950/20 px-4 py-3 text-sm text-red-300" role="alert">
          {errors.map(({ label, state }) => (
            <p key={label}>{label}: {state.error?.message}</p>
          ))}
        </div>
      )}
    </div>
  )
}
