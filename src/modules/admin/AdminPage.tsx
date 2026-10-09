import {
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"

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

interface AdminAccessResponse {
  role?: unknown
  status?: unknown
}

type AvailableWorkspace = typeof ADMIN_WORKSPACES[number]

const MOBILE_SIDEBAR_QUERY = "(max-width: 1100px)"

type SidebarIconName = "administrators" | "content" | "community" | "feedback" | "users" | "system"

const SIDEBAR_ICON_BY_ROUTE: Record<AdminRoute, SidebarIconName> = {
  master: "administrators",
  content: "content",
  comments: "community",
  feedback: "feedback",
  users: "users",
  system: "system",
}

function SidebarIcon({ name }: { name: SidebarIconName }) {
  const paths: Record<SidebarIconName, ReactNode> = {
    administrators: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3.5 19c.5-3.5 2.4-5.3 5.5-5.3s5 1.8 5.5 5.3" />
        <circle cx="17.5" cy="9" r="2.4" />
        <path d="M16 14.2c2.8-.5 4.4 1.1 4.8 4" />
      </>
    ),
    content: (
      <>
        <path d="M6 3h9l4 4v14H6z" />
        <path d="M15 3v5h5M9 12h7M9 16h7" />
      </>
    ),
    community: (
      <>
        <circle cx="8" cy="9" r="3" />
        <circle cx="17" cy="8" r="2.5" />
        <path d="M2.8 20c.4-4 2.2-6 5.2-6s4.8 2 5.2 6M14 14c3.7-.5 6 1.4 6.4 5" />
      </>
    ),
    feedback: <path d="M4 5h16v11H9l-5 4z" />,
    users: (
      <>
        <circle cx="10" cy="8" r="3.2" />
        <path d="M3.5 20c.5-4.2 2.7-6.3 6.5-6.3s6 2.1 6.5 6.3M18 7v6M15 10h6" />
      </>
    ),
    system: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6 1.7 1.7 0 0 0 10 3v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" />
      </>
    ),
  }
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  )
}

export default function AdminPage({ onBack, onSignOut, onNavigate }: Props) {
  const [route, setRoute] = useState<AdminRoute>("master")
  const [searchOpen, setSearchOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [mobileSidebarMode, setMobileSidebarMode] = useState(
    () => window.matchMedia(MOBILE_SIDEBAR_QUERY).matches,
  )
  const [adminRole, setAdminRole] = useState<string | null>(null)
  const [accessState, setAccessState] =
    useState<"checking" | "allowed" | "inactive" | "denied">("checking")
  const sidebarRef = useRef<HTMLElement>(null)
  const menuButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const mediaQuery = window.matchMedia(MOBILE_SIDEBAR_QUERY)
    const updateSidebarMode = () => {
      setMobileSidebarMode(mediaQuery.matches)
      if (!mediaQuery.matches) setMobileSidebarOpen(false)
    }
    updateSidebarMode()
    mediaQuery.addEventListener("change", updateSidebarMode)
    return () => mediaQuery.removeEventListener("change", updateSidebarMode)
  }, [])

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
    const permittedRoute = normalizedRole
      ? routeByRole[normalizedRole]
      : undefined
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
      const adminAccess = access as AdminAccessResponse
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
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (
      availableWorkspaces.length > 0 &&
      !availableWorkspaces.some((item) => item.id === route)
    )
      setRoute(availableWorkspaces[0].id)
  }, [availableWorkspaces, route])

  useEffect(() => {
    if (!mobileSidebarOpen) return
    const sidebar = sidebarRef.current
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    sidebar?.querySelector<HTMLElement>("[data-sidebar-first]")?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileSidebarOpen(false)
        return
      }
      if (event.key !== "Tab" || !sidebar) return
      const focusable = Array.from(
        sidebar.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
        ),
      )
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener("keydown", handleKeyDown)
      menuButtonRef.current?.focus()
    }
  }, [mobileSidebarOpen])

  if (accessState === "checking")
    return (
      <div className="module-loading min-h-screen">
        Checking administrator accessâ€¦
      </div>
    )

  if (accessState === "inactive") {
    return (
      <main className="min-h-screen bg-[#0f0918] text-white grid place-items-center px-6">
        <section className="max-w-md rounded-xl border border-amber-500/30 bg-[#1a1028] p-8 text-center">
          <div
            className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-amber-500/10 text-amber-300"
            aria-hidden="true"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 4.5h.008v.008H12V16.5z"
              />
            </svg>
          </div>
          <h1 className="mt-4 text-2xl font-semibold">
            Admin access temporarily unavailable
          </h1>
          <p className="mt-3 text-sm text-stone-300">
            A Master Admin has temporarily deactivated your administrator
            access. Your regular StreamFlix account is still available.
          </p>
          <button type="button" className="btn-ghost mt-6" onClick={onBack}>
            Return to StreamFlix
          </button>
        </section>
      </main>
    )
  }

  if (accessState === "denied" || availableWorkspaces.length === 0) {
    return (
      <main className="min-h-screen bg-[#0f0918] text-white grid place-items-center px-6">
        <section className="max-w-md rounded-xl border border-stone-700 bg-[#1a1028] p-8 text-center">
          <h1 className="text-2xl font-semibold">
            Administrator access required
          </h1>
          <p className="mt-3 text-sm text-stone-300">
            This signed-in account is not linked to an active StreamFlix
            administrator role.
          </p>
          <button type="button" className="btn-ghost mt-6" onClick={onBack}>
            Return to StreamFlix
          </button>
        </section>
      </main>
    )
  }

  const workspace =
    availableWorkspaces.find((candidate) => candidate.id === route) ??
    availableWorkspaces[0]
  const Workspace = workspace.component
  const navigateSidebar = (nextRoute: AdminRoute) => {
    setRoute(nextRoute)
    setMobileSidebarOpen(false)
  }
  const renderWorkspaceButton = (item: AvailableWorkspace) => (
    <button
      key={item.id}
      type="button"
      className={`admin-sidebar__item${route === item.id ? " is-active" : ""}`}
      aria-current={route === item.id ? "page" : undefined}
      aria-label={sidebarCollapsed ? item.label : undefined}
      title={sidebarCollapsed ? item.label : undefined}
      data-sidebar-first={item.id === availableWorkspaces[0]?.id || undefined}
      onClick={() => navigateSidebar(item.id)}
    >
      <SidebarIcon name={SIDEBAR_ICON_BY_ROUTE[item.id]} />
      <span>{item.label}</span>
    </button>
  )

  return (
    <AdminDataProvider>
      <div
        className="manager-module admin-shell"
        data-sidebar={sidebarCollapsed ? "collapsed" : "expanded"}
        data-mobile-sidebar={mobileSidebarOpen ? "open" : "closed"}
      >
        <aside
          id="admin-sidebar-navigation"
          ref={sidebarRef}
          className="admin-sidebar"
          aria-label="Administrator navigation"
          aria-modal={mobileSidebarOpen || undefined}
        >
          <nav className="admin-sidebar__nav">
            {availableWorkspaces.map(renderWorkspaceButton)}
          </nav>
        </aside>
        <button
          type="button"
          className="admin-sidebar-backdrop"
          onClick={() => setMobileSidebarOpen(false)}
          aria-label="Close admin navigation"
          aria-hidden={!mobileSidebarOpen}
          tabIndex={mobileSidebarOpen ? 0 : -1}
        />
        <div
          className="admin-shell__main"
          inert={mobileSidebarOpen ? true : undefined}
        >
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
            adminPageLabel={
              route === "content" ? "Library / Content" : workspace.label
            }
            onToggleAdminMenu={() => {
              if (mobileSidebarMode) {
                setMobileSidebarOpen((value) => !value)
                return
              }
              setSidebarCollapsed((value) => !value)
            }}
            adminMenuOpen={
              mobileSidebarMode ? mobileSidebarOpen : !sidebarCollapsed
            }
            adminMenuLabel={
              mobileSidebarMode
                ? mobileSidebarOpen
                  ? "Close navigation menu"
                  : "Open navigation menu"
                : sidebarCollapsed
                  ? "Expand sidebar"
                  : "Collapse sidebar"
            }
            adminMenuButtonRef={menuButtonRef}
          />
          <div className="admin-workspace-content">
            <Suspense
              fallback={
                <div className="module-loading">
                  Loading manager workspaceâ€¦
                </div>
              }
            >
              <Workspace />
            </Suspense>
          </div>
        </div>
      </div>
    </AdminDataProvider>
  )
}
