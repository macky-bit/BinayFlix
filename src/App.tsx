import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"

import type { Show } from "./modules/movie/types"

import type { Plan } from "./modules/subscription/SubscriptionPage"

import LoginPage from "./modules/login/LoginPage"

import RegisterPage from "./modules/register/RegisterPage"

import SubscriptionPage from "./modules/subscription/SubscriptionPage"

import ProfileSelectPage from "./modules/profileSelect/ProfileSelectPage"

import type { Profile } from "./modules/profileSelect/ProfileSelectPage"

import Dashboard from "./modules/dashboard/Dashboard"

import type { DashboardView } from "./modules/dashboard/components"

import WatchScreen from "./modules/movie/fixedscreen/movie"

import AccountPage from "./modules/account/AccountPage"

import ProfilePage from "./modules/profile/ProfilePage"

import HelpPage from "./modules/help/HelpPage"

import SettingsPage from "./modules/settings/SettingsPage"

import PreviewModal from "./modules/movie/PreviewModal"

import { addOrUpdateContinue } from "./modules/dashboard/continueWatchingStore"

import AdminPage from "./modules/admin/AdminPage"

import { supabase } from "./lib/supabase"

import {
  getSignedInDestination,
  getSignedInMemberDestination,
} from "./lib/auth"

import ResetPasswordPage from "./modules/auth/ResetPasswordPage"

import { LOGO_SVG } from "./modules/auth/AuthUI"

import OpeningVideo from "./modules/auth/OpeningVideo"

type Page = "loading" | "login" | "opening" | "register" | "resetPassword" | "subscription" | "profileSelect" | "dashboard" | "watch" | "account" | "profile" | "help" | "settings" | "admin"

const protectedMemberPages = new Set<Page>([
  "opening",

  "profileSelect",

  "dashboard",

  "watch",

  "account",

  "profile",

  "help",

  "settings",
])

export default function App() {
  const [page, setPage] = useState<Page>("loading")

  const initialBillingReturn = new URLSearchParams(window.location.search).get(
    "billing",
  )

  const cancellationReturnRef = useRef(initialBillingReturn === "cancelled")

  const [cancellationStatus, setCancellationStatus] =
    useState<"none" | "pending" | "failed">(
      initialBillingReturn === "cancelled" ? "pending" : "none",
    )

  const [cancellationAttempt, setCancellationAttempt] = useState(0)

  const [plan, setPlan] = useState<Plan | null>(null)

  const [watchShow, setWatchShow] = useState<Show | null>(null)

  const [dashboardView, setDashboardView] = useState<DashboardView>("home")

  useLayoutEffect(() => {
    window.scrollTo(0, 0)
  }, [page, dashboardView])

  const [previewShow, setPreviewShow] = useState<Show | null>(null)

  const [activeProfileId, setActiveProfileId] = useState<number | null>(null)

  const [activeProfile, setActiveProfile] = useState<Profile | null>(null)

  const activeProfileIdRef = useRef<number | null>(null)

  const activeAuthUserIdRef = useRef<string | null>(null)

  const openingStartedRef = useRef(false)

  const resetViewerState = useCallback(() => {
    setPlan(null)

    setWatchShow(null)

    setPreviewShow(null)

    setDashboardView("home")

    activeAuthUserIdRef.current = null

    activeProfileIdRef.current = null

    setActiveProfileId(null)

    setActiveProfile(null)

    openingStartedRef.current = false
  }, [])

  const clearBillingReturn = useCallback(() => {
    const url = new URL(window.location.href)

    url.searchParams.delete("billing")

    window.history.replaceState(
      {},
      "",
      `${url.pathname}${url.search}${url.hash}`,
    )
  }, [])

  const signOutSession = useCallback(async () => {
    const { error: globalError } = await supabase.auth.signOut({
      scope: "global",
    })

    if (globalError) {
      const { error: localError } = await supabase.auth.signOut({
        scope: "local",
      })

      if (localError)
        throw new Error(
          "Your subscription was cancelled, but this device could not be signed out. Check your connection and try again.",
        )
    }

    resetViewerState()

    setPage("login")
  }, [resetViewerState])

  const beginOpening = useCallback(() => {
    if (openingStartedRef.current) return

    openingStartedRef.current = true

    setPage("opening")
  }, [])

  const finishOpening = useCallback(() => {
    openingStartedRef.current = false

    setPage(activeProfileIdRef.current === null ? "profileSelect" : "dashboard")
  }, [])

  useEffect(() => {
    if (initialBillingReturn === "cancel-abandoned") clearBillingReturn()
  }, [clearBillingReturn, initialBillingReturn])

  useEffect(() => {
    let mounted = true

    const routeSession = async (userId: string) => {
      try {
        if (activeAuthUserIdRef.current !== userId) {
          activeAuthUserIdRef.current = userId

          activeProfileIdRef.current = null

          if (mounted) setActiveProfileId(null)

          if (mounted) setActiveProfile(null)
        }

        const destination = await getSignedInDestination()

        if (!mounted) return

        if (!openingStartedRef.current) setPage(destination)
      } catch {
        if (mounted) setPage("login")
      }
    }

    void supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return

      if (cancellationReturnRef.current) return

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
            resetViewerState()

            setPage("login")
          } else if (event === "SIGNED_IN" && session) {
            if (cancellationReturnRef.current) return

            if (
              activeAuthUserIdRef.current !== session.user.id ||
              activeProfileIdRef.current === null
            ) {
              void routeSession(session.user.id)
            }
          }
        }, 0)
      },
    )

    return () => {
      mounted = false

      subscription.subscription.unsubscribe()
    }
  }, [resetViewerState])

  useEffect(() => {
    if (!cancellationReturnRef.current) return

    let active = true

    const confirmCancellation = async () => {
      setCancellationStatus("pending")
      setPage("loading")

      const { data } = await supabase.auth.getSession()

      if (!active) return

      if (!data.session) {
        cancellationReturnRef.current = false
        clearBillingReturn()
        resetViewerState()
        setCancellationStatus("none")
        setPage("login")
        return
      }

      for (let attempt = 0; attempt < 15; attempt += 1) {
        try {
          const destination = await getSignedInMemberDestination()

          if (!active) return

          if (destination === "subscription") {
            cancellationReturnRef.current = false
            clearBillingReturn()
            setCancellationStatus("none")
            await signOutSession()
            return
          }
        } catch {
          // The webhook or network may still be catching up. Retry below.
        }

        await new Promise((resolve) => window.setTimeout(resolve, 1000))

        if (!active) return
      }

      setCancellationStatus("failed")
    }

    void confirmCancellation().catch(() => {
      if (active) setCancellationStatus("failed")
    })

    return () => {
      active = false
    }
  }, [
    cancellationAttempt,
    clearBillingReturn,
    resetViewerState,
    signOutSession,
  ])

  useEffect(() => {
    if (!protectedMemberPages.has(page)) return

    let active = true

    const enforceSubscription = async () => {
      try {
        const destination = await getSignedInMemberDestination()

        if (!active || destination === "profileSelect") return

        resetViewerState()

        setPage("subscription")
      } catch {
        // Keep the current screen during transient network failures. Supabase
        // policies remain the authority for protected data access.
      }
    }

    const enforceWhenVisible = () => {
      if (document.visibilityState === "visible") void enforceSubscription()
    }

    void enforceSubscription()

    const interval = window.setInterval(() => void enforceSubscription(), 15000)

    window.addEventListener("focus", enforceWhenVisible)

    document.addEventListener("visibilitychange", enforceWhenVisible)

    return () => {
      active = false

      window.clearInterval(interval)

      window.removeEventListener("focus", enforceWhenVisible)

      document.removeEventListener("visibilitychange", enforceWhenVisible)
    }
  }, [page, resetViewerState])

  useEffect(() => {
    if (page === "dashboard" && activeProfile === null) {
      setPage("profileSelect")
    }
  }, [activeProfile, page])

  useEffect(() => {
    const handleProfileUpdated = (event: Event) => {
      const { profileId, name, avatarPath, avatar } = (event as CustomEvent<{
        profileId: number | string

        name: string

        avatarPath: string

        avatar: string
      }>).detail

      setActiveProfile((current) =>
        current && String(current.id) === String(profileId)
          ? { ...current, name, avatarPath, avatar }
          : current,
      )
    }

    window.addEventListener("streamflix:profile-updated", handleProfileUpdated)

    return () =>
      window.removeEventListener(
        "streamflix:profile-updated",

        handleProfileUpdated,
      )
  }, [])

  const handleWatch = (show: Show) => {
    addOrUpdateContinue(show, 1, undefined, activeProfileId)

    setWatchShow(show)

    setPreviewShow(null)

    setPage("watch")
  }

  const handleInfo = (show: Show) => {
    setPreviewShow(show)
  }

  const handleSignOut = () => {
    void signOutSession().catch((error: unknown) => {
      console.error("sign-out", error)
    })
  }

  return (
    <>
      {page === "loading" && (
        <div className="app-loading" role="status" aria-live="polite">
          <div className="app-loading__content">
            <div className="app-loading__logo">{LOGO_SVG}</div>
            <div className="app-loading__spinner" aria-hidden="true" />
            <p className="app-loading__text">
              {cancellationStatus === "pending"
                ? "Confirming your Stripe cancellation…"
                : cancellationStatus === "failed"
                  ? "Stripe is still processing your cancellation."
                  : "Loading StreamFlix…"}
            </p>
            {cancellationStatus === "failed" && (
              <button
                type="button"
                className="mt-4 rounded border border-white/40 px-4 py-2 text-sm text-white"
                onClick={() => setCancellationAttempt((attempt) => attempt + 1)}
              >
                Try again
              </button>
            )}
          </div>
        </div>
      )}

      {page === "login" && <LoginPage onNavigate={(p) => setPage(p)} />}

      {page === "opening" && <OpeningVideo onComplete={finishOpening} />}

      {page === "resetPassword" && (
        <ResetPasswordPage onComplete={() => setPage("login")} />
      )}

      {page === "admin" && (
        <AdminPage
          onBack={() => setPage(activeProfile ? "dashboard" : "profileSelect")}
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
            void getSignedInMemberDestination()

              .then((destination) => {
                if (destination !== "profileSelect") {
                  activeProfileIdRef.current = null

                  setActiveProfileId(null)

                  setActiveProfile(null)

                  setPage(destination)

                  return
                }

                activeProfileIdRef.current = profile.id

                setDashboardView("home")

                setActiveProfileId(profile.id)

                setActiveProfile(profile)

                beginOpening()
              })

              .catch(handleSignOut)
          }}
        />
      )}

      {page === "dashboard" && activeProfile && (
        <>
          <Dashboard
            activeProfile={activeProfile}
            view={dashboardView}
            onViewChange={setDashboardView}
            onSignOut={handleSignOut}
            onWatch={handleWatch}
            onInfo={handleInfo}
            onNavigate={(p) => {
              if (p === "profileSelect") {
                activeProfileIdRef.current = null

                setActiveProfileId(null)

                setActiveProfile(null)
              }

              setPage(p)
            }}
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
          contentId={watchShow.contentId}
          tmdbId={watchShow.tmdbId}
          videoPath={watchShow.videoPath}
          title={watchShow.title}
          year={watchShow.year}
          rating={watchShow.rating}
          match={watchShow.match ?? 0}
          backgroundImage={watchShow.hero ?? watchShow.image}
          isSeries={watchShow.mediaType === "tv"}
          activeProfile={activeProfile}
          onProgress={(progress) =>
            addOrUpdateContinue(
              watchShow,

              progress,

              undefined,

              activeProfileId,
            )
          }
          onBack={() => setPage("dashboard")}
        />
      )}

      {page === "account" && (
        <AccountPage
          onBack={() => setPage("dashboard")}
          plan={plan}
          onPlanChange={(p) => {
            setPlan(p)

            activeProfileIdRef.current = null

            setActiveProfileId(null)

            setActiveProfile(null)

            setPage("profileSelect")
          }}
        />
      )}

      {page === "profile" && (
        <ProfilePage
          onBack={() => setPage("dashboard")}
          activeProfileId={activeProfileId}
          onProfileDeleted={() => {
            activeProfileIdRef.current = null

            setActiveProfileId(null)

            setActiveProfile(null)

            setPage("profileSelect")
          }}
        />
      )}

      {page === "help" && <HelpPage onBack={() => setPage("dashboard")} />}

      {page === "settings" && (
        <SettingsPage
          activeProfileId={activeProfileId ?? 0}
          onBack={() => setPage("dashboard")}
        />
      )}
    </>
  )
}
