import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"
import type { Show } from "../movie/types"
import { Navbar, type DashboardView } from "./components"
import CatalogPage from "./CatalogPage"
import { MyListView } from "./myList/components"
import SearchResultsPage from "./SearchResultsPage"

interface Props {
  onSignOut: () => void

  onWatch: (show: Show) => void

  onInfo: (show: Show) => void

  onNavigate: (
    page: "account" | "profile" | "help" | "settings" | "admin",
  ) => void
}

export default function Dashboard({
  onSignOut,
  onWatch,
  onInfo,
  onNavigate,
}: Props) {
  const [searchOpen, setSearchOpen] = useState(false)

  const [searchQuery, setSearchQuery] = useState("")

  const [view, setView] = useState<DashboardView>("home")

  const [showAdminLink, setShowAdminLink] = useState(false)

  useEffect(() => {
    let active = true
    void supabase.rpc("get_my_admin_access").then(({ data, error }) => {
      if (!active) return
      const status =
        data && typeof data === "object"
          ? String((data as { status?: unknown }).status).toLowerCase()
          : ""
      setShowAdminLink(!error && status === "active")
    })
    return () => {
      active = false
    }
  }, [])

  return (
    <div className="min-h-screen" style={{ background: "var(--color-ink)" }}>
      <Navbar
        activeView={view}
        onSignOut={onSignOut}
        searchOpen={searchOpen}
        setSearchOpen={setSearchOpen}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        onNavigatePage={onNavigate}
        onNavigateView={(nextView) => {
          setSearchQuery("")
          setSearchOpen(false)
          setView(nextView)
        }}
        showAdminLink={showAdminLink}
      />

      {searchQuery.trim() && (
        <SearchResultsPage
          query={searchQuery}
          onWatch={onWatch}
          onInfo={onInfo}
        />
      )}
      {!searchQuery.trim() && view !== "myList" && (
        <CatalogPage kind={view} onWatch={onWatch} onInfo={onInfo} />
      )}
      {!searchQuery.trim() && view === "myList" && (
        <MyListView onBrowse={() => setView("home")} onInfo={onInfo} />
      )}
    </div>
  )
}
