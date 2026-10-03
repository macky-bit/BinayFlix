import { Suspense, useEffect, useMemo, useState } from "react"

import { supabase } from "../../lib/supabase"
import { Navbar } from "../dashboard/components"
import { AdminDataProvider } from "./data"
import { ADMIN_WORKSPACES, type AdminRoute } from "./routes"
import "./admin.css"

interface Props {
  onBack: () => void
  onSignOut: () => void
  onNavigate: (
    page: "account" | "profile" | "help" | "settings" | "admin",
  ) => void
}

export default function AdminPage({ onBack, onSignOut, onNavigate }: Props) {
  const [route, setRoute] = useState<AdminRoute>("master")
  const [searchOpen, setSearchOpen] = useState(false)
  const [adminRole, setAdminRole] = useState<string | null>(null)
  const [accessState, setAccessState] = useState<"checking" | "allowed" | "inactive" | "denied">("checking")
  const availableWorkspaces = useMemo(() => {
    const normalizedRole = adminRole?.replace(/\s/g, "").toLowerCase()
    if (normalizedRole === "masteradmin") return ADMIN_WORKSPACES

    const routeByRole: Record<string, AdminRoute> = {
      contentmanager: "content",
      commentmanager: "comments",
      feedbackmanager: "feedback",
      usermanager: "users",
      systemmanager: "system",
    }
    const permittedRoute = normalizedRole ? routeByRole[normalizedRole] : undefined
    return permittedRoute
      ? ADMIN_WORKSPACES.filter((candidate) => candidate.id === permittedRoute)
      : []
  }, [adminRole])

  useEffect(() => {
    let active = true
    void (async () => {
      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData.session) {
        if (active) setAccessState("denied")
        return
      }

      const { data: access, error } = await supabase.rpc("get_my_admin_access")
      if (!active) return
      if (error || !access || typeof access !== "object") {
        setAccessState("denied")
        return
      }
      const adminAccess = access as { role?: unknown; status?: unknown }
      if (String(adminAccess.status).toLowerCase() !== "active") {
        setAccessState("inactive")
        return
      }
      if (!adminAccess.role) {
        setAccessState("denied")
        return
      }
      setAdminRole(String(adminAccess.role))
      setAccessState("allowed")
    })()
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (availableWorkspaces.length > 0 && !availableWorkspaces.some((item) => item.id === route)) {
      setRoute(availableWorkspaces[0].id)
    }
  }, [availableWorkspaces, route])

  if (accessState === "checking") {
    return <div className="module-loading min-h-screen">Checking administrator access…</div>
  }

  if (accessState === "inactive") {
    return (
      <main className="min-h-screen bg-[#0f0918] text-white grid place-items-center px-6">
        <section className="max-w-md rounded-xl border border-amber-500/30 bg-[#1a1028] p-8 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-amber-500/10 text-amber-300" aria-hidden="true">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 4.5h.008v.008H12V16.5z" />
            </svg>
          </div>
          <h1 className="mt-4 text-2xl font-semibold">Admin access temporarily unavailable</h1>
          <p className="mt-3 text-sm text-stone-300">A Master Admin has temporarily deactivated your administrator access. Your regular StreamFlix account is still available.</p>
          <button type="button" className="btn-ghost mt-6" onClick={onBack}>Return to StreamFlix</button>
        </section>
      </main>
    )
  }

  if (accessState === "denied" || availableWorkspaces.length === 0) {
    return (
      <main className="min-h-screen bg-[#0f0918] text-white grid place-items-center px-6">
        <section className="max-w-md rounded-xl border border-stone-700 bg-[#1a1028] p-8 text-center">
          <h1 className="text-2xl font-semibold">Administrator access required</h1>
          <p className="mt-3 text-sm text-stone-300">This signed-in account is not linked to an active StreamFlix administrator role.</p>
          <button type="button" className="btn-ghost mt-6" onClick={onBack}>Return to StreamFlix</button>
        </section>
      </main>
    )
  }

  const workspace =
    availableWorkspaces.find((candidate) => candidate.id === route) ??
    availableWorkspaces[0]
  const Workspace = workspace.component

  return (
    <AdminDataProvider>
      <div className="manager-module">
        <Navbar
          activeView="home"
          activePage="admin"
          onSignOut={onSignOut}
          searchOpen={searchOpen}
          setSearchOpen={setSearchOpen}
          onNavigatePage={onNavigate}
          onNavigateView={onBack}
          adminItems={availableWorkspaces}
          activeAdminItem={route}
          onNavigateAdmin={(id) => setRoute(id as AdminRoute)}
          onBackFromAdmin={onBack}
        />
        <div className="admin-workspace-content">
          <Suspense
            fallback={
              <div className="module-loading">Loading manager workspace…</div>
            }
          >
            <Workspace />
          </Suspense>
        </div>
      </div>
    </AdminDataProvider>
  )
}
