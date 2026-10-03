import { useState } from "react"
import OverviewTab from "./components/OverviewTab"
import SystemLogsTab from "./components/SystemLogsTab"
import BackupsTab from "./components/BackupsTab"
import SecurityTab from "./components/SecurityTab"
import PerformanceTab from "./components/PerformanceTab"

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
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "var(--color-ink)" }}
    >
      {/* Navbar */}
      <header
        className="sticky top-0 z-30 flex items-center justify-between px-5 py-0 border-b"
        style={{
          background: "var(--color-ink)",
          borderColor: "#374151",
          height: 56,
        }}
        role="banner"
      >
        {/* Left */}
        <div className="flex items-center gap-3 min-w-0">
          <nav aria-label="Main navigation">
            <button
              className="tab-btn active text-sm font-medium"
              aria-current="page"
              style={{ paddingLeft: 0, paddingRight: 0 }}
            >
              System Management
            </button>
          </nav>
        </div>
      </header>

      {/* Page header */}
      <div
        className="px-6 pt-6 pb-4 border-b"
        style={{ borderColor: "#374151" }}
      >
        <h1 className="text-2xl font-bold text-white">System Management</h1>
        <p className="text-sm text-[#9CA3AF] mt-1">
          Monitor STREAMFLIX security, backups, logs, and system performance.
        </p>
      </div>

      {/* Tab bar */}
      <div
        className="border-b overflow-x-auto"
        style={{ borderColor: "#374151", background: "var(--color-ink)" }}
        role="tablist"
        aria-label="System Management sections"
      >
        <div className="flex px-6 gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              className={`tab-btn ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <main className="flex-1 px-4 sm:px-6 py-6" role="tabpanel">
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
