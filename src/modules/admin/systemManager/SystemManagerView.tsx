import { useState } from "react"
import OverviewTab from "./components/OverviewTab"
import SystemLogsTab from "./components/SystemLogsTab"
import BackupsTab from "./components/BackupsTab"
import SecurityTab from "./components/SecurityTab"
import PerformanceTab from "./components/PerformanceTab"
import { AdminPageHeader, AdminWorkspaceTabs } from "../components/AdminUI"

type Tab = "overview" | "logs" | "backups" | "security" | "performance"

const TABS: {
  id: Tab
  label: string
}[] = [
  { id: "overview", label: "Overview" },
  { id: "logs", label: "System Logs" },
  { id: "backups", label: "Backups" },
  { id: "security", label: "Security" },
  { id: "performance", label: "Performance" },
]

export default function SystemManagerView() {
  const [activeTab, setActiveTab] = useState<Tab>("overview")

  return (
    <div className="admin-page-shell system-workspace">
      <AdminPageHeader
        eyebrow="Platform operations"
        title="System Management"
        description="Review real system records, security activity, database health, and recoverable backups."
      />

      <AdminWorkspaceTabs
        tabs={TABS}
        active={activeTab}
        onChange={setActiveTab}
        label="System Management sections"
      />

      {/* Tab content */}
      <main className="admin-tab-panel" role="tabpanel">
        {activeTab === "overview" && (
          <OverviewTab
            onViewAllLogs={() => setActiveTab("logs")}
            onRunBackup={() => setActiveTab("backups")}
            onViewSecurity={() => setActiveTab("security")}
          />
        )}
        {activeTab === "logs" && <SystemLogsTab />}
        {activeTab === "backups" && <BackupsTab />}
        {activeTab === "security" && <SecurityTab />}
        {activeTab === "performance" && <PerformanceTab />}
      </main>
    </div>
  )
}
