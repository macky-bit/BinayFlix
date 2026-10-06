import { useEffect, useState } from "react"

import type { Show } from "./modules/movie/types"

import type { Plan } from "./modules/subscription/SubscriptionPage"

import LoginPage from "./modules/login/LoginPage"

import RegisterPage from "./modules/register/RegisterPage"
import SubscriptionPage from "./modules/subscription/SubscriptionPage"
import ProfileSelectPage from "./modules/profileSelect/ProfileSelectPage"
import type { Profile } from "./modules/profileSelect/ProfileSelectPage"
import Dashboard from "./modules/dashboard/Dashboard"

import WatchScreen from "./modules/movie/fixedscreen/movie"

import AccountPage from "./modules/account/AccountPage"

import ProfilePage from "./modules/profile/ProfilePage"

import HelpPage from "./modules/help/HelpPage"

import SettingsPage from "./modules/settings/SettingsPage"

import PreviewModal from "./modules/movie/PreviewModal"
import { addOrUpdateContinue } from "./modules/dashboard/continueWatchingStore"
import AdminPage from "./modules/admin/AdminPage"
import { supabase } from "./lib/supabase"
import { getSignedInDestination } from "./lib/auth"
import ResetPasswordPage from "./modules/auth/ResetPasswordPage"

type Page = "loading" | "login" | "register" | "resetPassword" | "subscription" | "profileSelect" | "dashboard" | "watch" | "account" | "profile" | "help" | "settings" | "admin"

export default function App() {
  const [page, setPage] = useState<Page>("loading")

  const [plan, setPlan] = useState<Plan | null>(null)

  const [watchShow, setWatchShow] = useState<Show | null>(null)

  const [previewShow, setPreviewShow] = useState<Show | null>(null)

  const [activeProfileId, setActiveProfileId] = useState<number | null>(null)

  useEffect(() => {
    let mounted = true

    const routeSession = async (userId: string) => {
      try {
        const destination = await getSignedInDestination(userId)
        if (mounted) setPage(destination)
      } catch {
        if (mounted) setPage("login")
      }
    }

    void supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      if (data.session) void routeSession(data.session.user.id)
      else setPage("login")
    })

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (event, session) => {
        window.setTimeout(() => {
          if (!mounted) return
          if (event === "PASSWORD_RECOVERY") {
            setPage("resetPassword")
          } else if (event === "SIGNED_OUT") {
            setPage("login")
          } else if (event === "SIGNED_IN" && session) {
            void routeSession(session.user.id)
          }
        }, 0)
      },
    )

    return () => {
      mounted = false
      subscription.subscription.unsubscribe()
    }
  }, [])

  const handleWatch = (show: Show) => {
    addOrUpdateContinue(show, 1)
    setWatchShow(show)
    setPreviewShow(null)

    setPage("watch")
  }

  const handleInfo = (show: Show) => {
    setPreviewShow(show)
  }

  const handleSignOut = () => {
    void supabase.auth.signOut().finally(() => setPage("login"))
  }

  return (
    <>
      {page === "loading" && (
        <div className="module-loading min-h-screen">Loading StreamFlix…</div>
      )}

      {page === "login" && <LoginPage onNavigate={(p) => setPage(p)} />}

      {page === "resetPassword" && (
        <ResetPasswordPage onComplete={() => setPage("login")} />
      )}

      {page === "admin" && (
        <AdminPage
          onBack={() => setPage("dashboard")}
          onSignOut={handleSignOut}
          onNavigate={(p) => setPage(p)}
        />
      )}

      {page === "register" && <RegisterPage onNavigate={(p) => setPage(p)} />}

      {page === "subscription" && (
        <SubscriptionPage
          onComplete={() => setPage("profileSelect")}
          onBack={() => setPage("login")}
          onSubscribe={(p) => setPlan(p)}
        />
      )}

      {page === "profileSelect" && (
        <ProfileSelectPage
          maxProfiles={plan?.MaxUser ?? 1}
          onSelect={(profile: Profile) => {
            setActiveProfileId(profile.id)
            setPage("dashboard")
          }}
        />
      )}

      {page === "dashboard" && (
        <>
          <Dashboard
            onSignOut={handleSignOut}
            onWatch={handleWatch}
            onInfo={handleInfo}
            onNavigate={(p) => setPage(p)}
          />
          {previewShow && (
            <PreviewModal
              show={previewShow}
              onClose={() => setPreviewShow(null)}
              onSelect={setPreviewShow}
              onPlay={(show) => {
                setPreviewShow(null)

                handleWatch(show)
              }}
            />
          )}
        </>
      )}

      {page === "watch" && watchShow && (
        <WatchScreen
          id={watchShow.id}
          title={watchShow.title}
          year={watchShow.year}
          rating={watchShow.rating}
          match={watchShow.match ?? 0}
          backgroundImage={watchShow.hero ?? watchShow.image}
          isSeries={watchShow.mediaType === "tv"}
          onBack={() => setPage("dashboard")}
        />
      )}

      {page === "account" && (
        <AccountPage
          onBack={() => setPage("dashboard")}
          plan={plan}
          onPlanChange={(p) => setPlan(p)}
        />
      )}

      {page === "profile" && (
        <ProfilePage
          onBack={() => setPage("dashboard")}
          activeProfileId={activeProfileId}
        />
      )}

      {page === "help" && <HelpPage onBack={() => setPage("dashboard")} />}

      {page === "settings" && (
        <SettingsPage onBack={() => setPage("dashboard")} />
      )}
    </>
  )
}
