import { createClient } from "@supabase/supabase-js"

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL ?? "").trim()
const supabasePublishableKey = (
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? ""
).trim()

const rememberSessionKey = "streamflix.remember-session"

export function setRememberSession(remember: boolean) {
  if (remember) localStorage.setItem(rememberSessionKey, "true")
  else localStorage.removeItem(rememberSessionKey)
}

const authStorage = {
  getItem(key: string) {
    return localStorage.getItem(key) ?? sessionStorage.getItem(key)
  },
  setItem(key: string, value: string) {
    if (localStorage.getItem(rememberSessionKey) === "true") {
      localStorage.setItem(key, value)
      sessionStorage.removeItem(key)
    } else {
      sessionStorage.setItem(key, value)
      localStorage.removeItem(key)
    }
  },
  removeItem(key: string) {
    localStorage.removeItem(key)
    sessionStorage.removeItem(key)
  },
}

export const isSupabaseConfigured = Boolean(
  supabaseUrl && supabasePublishableKey,
)

if (!isSupabaseConfigured) {
  console.warn(
    "Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.",
  )
}

export const supabase = createClient(
  supabaseUrl || "https://invalid.supabase.co",
  supabasePublishableKey || "missing-publishable-key",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: authStorage,
    },
  },
)
