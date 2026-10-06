import { useCallback, useEffect, useState } from "react"
import StreamFlixSelect from "../../components/StreamFlixSelect"
import styles from "./account.module.css"

import SubscriptionPage from "../subscription/SubscriptionPage"
import { supabase } from "../../lib/supabase"

import type { Plan } from "../subscription/SubscriptionPage"

type AccountSnapshot = {
  email: string | null
  planName: string | null
  monthlyPrice: number | null
  maxUser: number | null
  paymentDate: string | null
  paymentAmount: number | null
  endDate: string | null
  paymentMethod: string | null
  referenceNumber: string | null
  joinedAt: string | null
  accountStatus: string | null
}

type BillingHistoryEntry = {
  id: string
  amount: number
  paymentMethod: string | null
  referenceNumber: string | null
  status: string
  paidAt: string
}

type DeviceSession = {
  id: string
  name: string
  type: "Computer" | "Mobile" | "Tablet"
  location: string
  lastActive: string
}

type AccountMemberProfile = {
  id: number
  name: string
  avatarPath: string
  avatarUrl: string
  isKids: boolean
  displayOrder: number
}

type MemberProfileRow = {
  member_profile_id: number | string
  profile_name: string
  avatar_image: string | null
  is_kids: boolean
  display_order: number
}

type MemberProfileContextRow = {
  max_profiles: number
  can_add_profile: boolean
  allows_kids: boolean
}

type AvatarChoice = {
  path: string
  url: string
}

const isExternalAvatar = (value: string) =>
  /^(https?:|data:|blob:)/i.test(value)

function profileInitials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "SF"
  )
}

async function getSignedAvatarUrls(paths: string[]) {
  const uniquePaths = [
    ...new Set(paths.filter((path) => path && !isExternalAvatar(path))),
  ]
  if (!uniquePaths.length) return new Map<string, string>()

  const { data, error } = await supabase.storage
    .from("avatar")
    .createSignedUrls(uniquePaths, 60 * 60)
  if (error) return new Map<string, string>()

  return new Map(
    (data ?? [])
      .filter((item) => item.signedUrl)
      .map((item) => [item.path, item.signedUrl]),
  )
}

function getCurrentDeviceSession(): DeviceSession {
  const userAgent = navigator.userAgent
  const browser = /Edg\//.test(userAgent)
    ? "Edge"
    : /Firefox\//.test(userAgent)
      ? "Firefox"
      : /Chrome\//.test(userAgent)
        ? "Chrome"
        : /Safari\//.test(userAgent)
          ? "Safari"
          : "Web browser"
  const platform = /iPad/.test(userAgent)
    ? "iPad"
    : /iPhone/.test(userAgent)
      ? "iPhone"
      : /Android/.test(userAgent)
        ? "Android"
        : /Windows/.test(userAgent)
          ? "Windows"
          : /Macintosh|Mac OS X/.test(userAgent)
            ? "macOS"
            : /Linux/.test(userAgent)
              ? "Linux"
              : "Unknown platform"
  const type = /iPad|Tablet/.test(userAgent)
    ? "Tablet"
    : /Mobi|iPhone|Android/.test(userAgent)
      ? "Mobile"
      : "Computer"

  return {
    id: "current-session",
    name: `${browser} on ${platform}`,
    type,
    location: "Location unavailable",
    lastActive: "Active now",
  }
}

function formatCurrency(value: number | null) {
  if (value == null || !Number.isFinite(value)) return "Not available"

  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(value)
}

function formatAccountDate(value: string | null) {
  if (!value) return "Not available"

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Not available"

  return new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date)
}

function formatPaymentMethod(
  method: string | null,
  referenceNumber: string | null,
) {
  if (!method) return "Not available"

  const readableMethod = method
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
  const lastFour = referenceNumber?.match(/(?:^|\D)(\d{4})$/)?.[1]

  return lastFour ? `${readableMethod} •••• ${lastFour}` : readableMethod
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconHome() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 9.75L12 3l9 6.75V21a1 1 0 01-1 1H4a1 1 0 01-1-1V9.75z" />
      <path d="M9 22V12h6v10" />
    </svg>
  )
}

function IconCard() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20" />
    </svg>
  )
}

function IconShield() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  )
}

function IconMonitor() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  )
}

function IconUsers() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="9" cy="7" r="4" />
      <path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" />
      <path d="M16 3.13a4 4 0 010 7.75" />
      <path d="M21 21v-2a4 4 0 00-3-3.87" />
    </svg>
  )
}

function IconLock() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  )
}

function IconChevronRight() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 18l6-6-6-6" />
    </svg>
  )
}

function IconCreditCard() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20" />
    </svg>
  )
}

function IconEye({ open }: { open: boolean }) {
  return open ? (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}

function IconX() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Section = "overview" | "membership" | "security" | "devices" | "profiles" | "privacy"

type Modal = null | "email" | "password" | "phone" | "delete1" | "delete2" | "signout" | "billing" | "cancelMembership" | "updatePayment" | "changePlan"

// ─── Modal Overlay ────────────────────────────────────────────────────────────

function ModalOverlay({
  onClose,
  children,
}: {
  onClose: () => void
  children: React.ReactNode
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }

    window.addEventListener("keydown", handler)

    return () => window.removeEventListener("keydown", handler)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ backgroundColor: "var(--color-ink)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      {children}
    </div>
  )
}

function ModalBox({
  children,
  title,
  onClose,
}: {
  children: React.ReactNode
  title: string
  onClose: () => void
}) {
  return (
    <div
      className="w-full max-w-md rounded-lg p-6 relative"
      style={{
        backgroundColor: "rgba(21,13,42,0.5)",
        border: "1px solid var(--color-stone)",
        boxShadow: "0 20px 60px var(--color-ink)",
      }}
    >
      <div className="flex items-center justify-between mb-5">
        <h2
          className="font-display text-xl font-semibold tracking-wide"
          style={{ color: "var(--color-cream)" }}
        >
          {title}
        </h2>
        <button
          onClick={onClose}
          className="p-1 rounded transition-colors"
          style={{ color: "var(--color-taupe)" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#F5A800")}
          onMouseLeave={(e) =>
            (e.currentTarget.style.color = "var(--color-taupe)")
          }
          aria-label="Close modal"
        >
          <IconX />
        </button>
      </div>
      {children}
    </div>
  )
}

function FormField({
  label,
  type,
  value,
  onChange,
  placeholder,
  error,
  showToggle,
  show,
  onToggle,
}: {
  label: string
  type: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  error?: string
  showToggle?: boolean
  show?: boolean
  onToggle?: () => void
}) {
  return (
    <div className="mb-4">
      <label
        className="block text-xs font-medium mb-1.5 tracking-wide uppercase"
        style={{ color: "var(--color-taupe)" }}
      >
        {label}
      </label>
      <div className="relative">
        <input
          type={showToggle ? (show ? "text" : "password") : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2.5 rounded text-sm outline-none transition-colors"
          style={{
            backgroundColor: "var(--color-ink)",
            border: `1px solid ${
              error ? "var(--color-wine)" : "var(--color-stone)"
            }`,
            color: "var(--color-cream)",
            fontFamily: "Barlow, sans-serif",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "var(--color-wine)"
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = error
              ? "var(--color-wine)"
              : "var(--color-stone)"
          }}
        />
        {showToggle && (
          <button
            type="button"
            onClick={onToggle}
            className="absolute right-3 top-1/2 -translate-y-1/2"
            style={{ color: "var(--color-taupe)" }}
            aria-label={show ? "Hide" : "Show"}
          >
            <IconEye open={!!show} />
          </button>
        )}
      </div>
      {error && (
        <p className="mt-1 text-xs" style={{ color: "var(--color-taupe)" }}>
          {error}
        </p>
      )}
    </div>
  )
}

function ModalActions({
  onCancel,
  onSave,
  saveLabel = "Save",
  loading,
}: {
  onCancel: () => void
  onSave: () => void
  saveLabel?: string
  loading?: boolean
}) {
  return (
    <div className="flex gap-3 mt-6">
      <button
        onClick={onCancel}
        className="flex-1 py-2.5 rounded text-sm font-medium transition-colors"
        style={{
          border: "1px solid var(--color-stone)",
          color: "var(--color-taupe)",
          backgroundColor: "transparent",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "var(--color-taupe)"
          e.currentTarget.style.color = "#F5A800"
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "var(--color-stone)"
          e.currentTarget.style.color = "var(--color-taupe)"
        }}
      >
        Cancel
      </button>
      <button
        onClick={onSave}
        disabled={loading}
        className="flex-1 py-2.5 rounded text-sm font-semibold transition-colors"
        style={{
          background: "linear-gradient(135deg, #F5A800, #FF6B00)",
          color: "#08080F",
        }}
        onMouseEnter={(e) => {
          if (!loading)
            e.currentTarget.style.background = "rgba(245,168,0,0.12)"
        }}
        onMouseLeave={(e) => {
          if (!loading)
            e.currentTarget.style.background =
              "linear-gradient(135deg, #F5A800, #FF6B00)"
        }}
      >
        {loading ? "Saving…" : saveLabel}
      </button>
    </div>
  )
}

// ─── Change Email Modal ───────────────────────────────────────────────────────

function ChangeEmailModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState("")

  const [pass, setPass] = useState("")

  const [showPass, setShowPass] = useState(false)

  const [errors, setErrors] = useState<Record<string, string>>({})

  const [loading, setLoading] = useState(false)

  const [success, setSuccess] = useState(false)

  function validate() {
    const e: Record<string, string> = {}

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      e.email = "Enter a valid email address."

    if (!pass) e.pass = "Enter your current password."

    return e
  }

  function save() {
    const e = validate()

    if (Object.keys(e).length) {
      setErrors(e)
      return
    }

    setLoading(true)

    setTimeout(() => {
      setLoading(false)
      setSuccess(true)
      setTimeout(onClose, 1200)
    }, 1000)
  }

  return (
    <ModalOverlay onClose={onClose}>
      <ModalBox title="Change Email" onClose={onClose}>
        {success ? (
          <p
            className="text-sm py-4 text-center"
            style={{ color: "var(--color-taupe)" }}
          >
            Email updated.
          </p>
        ) : (
          <>
            <FormField
              label="New Email Address"
              type="email"
              value={email}
              onChange={(v) => {
                setEmail(v)
                setErrors((p) => ({ ...p, email: "" }))
              }}
              placeholder="you@example.com"
              error={errors.email}
            />
            <FormField
              label="Current Password"
              type="password"
              value={pass}
              onChange={(v) => {
                setPass(v)
                setErrors((p) => ({ ...p, pass: "" }))
              }}
              showToggle
              show={showPass}
              onToggle={() => setShowPass((x) => !x)}
              error={errors.pass}
            />
            <ModalActions onCancel={onClose} onSave={save} loading={loading} />
          </>
        )}
      </ModalBox>
    </ModalOverlay>
  )
}

// ─── Change Password Modal ────────────────────────────────────────────────────

function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const [cur, setCur] = useState("")

  const [next, setNext] = useState("")

  const [confirm, setConfirm] = useState("")

  const [show, setShow] = useState({ cur: false, next: false, confirm: false })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const [loading, setLoading] = useState(false)

  const [success, setSuccess] = useState(false)

  function validate() {
    const e: Record<string, string> = {}

    if (!cur) e.cur = "Enter your current password."

    if (!next || next.length < 8)
      e.next = "Password must be at least 8 characters."

    if (next !== confirm) e.confirm = "The passwords do not match."

    return e
  }

  function save() {
    const e = validate()

    if (Object.keys(e).length) {
      setErrors(e)
      return
    }

    setLoading(true)

    setTimeout(() => {
      setLoading(false)
      setSuccess(true)
      setTimeout(onClose, 1200)
    }, 1000)
  }

  return (
    <ModalOverlay onClose={onClose}>
      <ModalBox title="Change Password" onClose={onClose}>
        {success ? (
          <p
            className="text-sm py-4 text-center"
            style={{ color: "var(--color-taupe)" }}
          >
            Password changed.
          </p>
        ) : (
          <>
            <FormField
              label="Current Password"
              type="password"
              value={cur}
              onChange={(v) => {
                setCur(v)
                setErrors((p) => ({ ...p, cur: "" }))
              }}
              showToggle
              show={show.cur}
              onToggle={() => setShow((s) => ({ ...s, cur: !s.cur }))}
              error={errors.cur}
            />
            <FormField
              label="New Password"
              type="password"
              value={next}
              onChange={(v) => {
                setNext(v)
                setErrors((p) => ({ ...p, next: "" }))
              }}
              showToggle
              show={show.next}
              onToggle={() => setShow((s) => ({ ...s, next: !s.next }))}
              error={errors.next}
            />
            <FormField
              label="Confirm New Password"
              type="password"
              value={confirm}
              onChange={(v) => {
                setConfirm(v)
                setErrors((p) => ({ ...p, confirm: "" }))
              }}
              showToggle
              show={show.confirm}
              onToggle={() => setShow((s) => ({ ...s, confirm: !s.confirm }))}
              error={errors.confirm}
            />
            <ModalActions onCancel={onClose} onSave={save} loading={loading} />
          </>
        )}
      </ModalBox>
    </ModalOverlay>
  )
}

// ─── Add Phone Modal ──────────────────────────────────────────────────────────

function AddPhoneModal({ onClose }: { onClose: () => void }) {
  const [country, setCountry] = useState("US +1")

  const [phone, setPhone] = useState("")

  const [errors, setErrors] = useState<Record<string, string>>({})

  const [loading, setLoading] = useState(false)

  const [success, setSuccess] = useState(false)

  function save() {
    const e: Record<string, string> = {}

    if (!phone || phone.replace(/\D/g, "").length < 7)
      e.phone = "Enter a valid phone number."

    if (Object.keys(e).length) {
      setErrors(e)
      return
    }

    setLoading(true)

    setTimeout(() => {
      setLoading(false)
      setSuccess(true)
      setTimeout(onClose, 1200)
    }, 1000)
  }

  return (
    <ModalOverlay onClose={onClose}>
      <ModalBox title="Add Phone Number" onClose={onClose}>
        {success ? (
          <p
            className="text-sm py-4 text-center"
            style={{ color: "var(--color-taupe)" }}
          >
            Phone number added.
          </p>
        ) : (
          <>
            <div className="mb-4">
              <label
                className="block text-xs font-medium mb-1.5 tracking-wide uppercase"
                style={{ color: "var(--color-taupe)" }}
              >
                Country or Region
              </label>
              <StreamFlixSelect
                value={country}
                options={["US +1", "UK +44", "CA +1", "AU +61", "DE +49"]}
                onChange={setCountry}
                ariaLabel="Country or region"
                fullWidth
              />
            </div>
            <FormField
              label="Phone Number"
              type="tel"
              value={phone}
              onChange={(v) => {
                setPhone(v)
                setErrors((p) => ({ ...p, phone: "" }))
              }}
              placeholder="(555) 000-0000"
              error={errors.phone}
            />
            <ModalActions
              onCancel={onClose}
              onSave={save}
              loading={loading}
              saveLabel="Add"
            />
          </>
        )}
      </ModalBox>
    </ModalOverlay>
  )
}

// ─── Delete Account Modals ────────────────────────────────────────────────────

function DeleteAccountModal1({
  onClose,
  onContinue,
}: {
  onClose: () => void
  onContinue: () => void
}) {
  return (
    <ModalOverlay onClose={onClose}>
      <ModalBox title="Delete Account?" onClose={onClose}>
        <p
          className="text-sm leading-relaxed mb-6"
          style={{ color: "var(--color-taupe)" }}
        >
          This action will permanently delete your account, profiles, saved
          titles, and viewing information.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded text-sm font-medium transition-colors"
            style={{
              border: "1px solid var(--color-stone)",
              color: "var(--color-taupe)",
              backgroundColor: "transparent",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--color-taupe)"
              e.currentTarget.style.color = "#F5A800"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--color-stone)"
              e.currentTarget.style.color = "var(--color-taupe)"
            }}
          >
            Cancel
          </button>
          <button
            onClick={onContinue}
            className="flex-1 py-2.5 rounded text-sm font-semibold transition-colors"
            style={{
              background: "linear-gradient(135deg, #F5A800, #FF6B00)",
              color: "#08080F",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(245,168,0,0.12)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background =
                "linear-gradient(135deg, #F5A800, #FF6B00)"
            }}
          >
            Continue
          </button>
        </div>
      </ModalBox>
    </ModalOverlay>
  )
}

function DeleteAccountModal2({ onClose }: { onClose: () => void }) {
  const [input, setInput] = useState("")

  const valid = input === "DELETE"

  return (
    <ModalOverlay onClose={onClose}>
      <ModalBox title="Confirm Deletion" onClose={onClose}>
        <p className="text-sm mb-4" style={{ color: "var(--color-taupe)" }}>
          Type{" "}
          <span
            style={{ color: "var(--color-cream)", fontFamily: "monospace" }}
          >
            DELETE
          </span>{" "}
          to permanently remove your account.
        </p>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="DELETE"
          className="w-full px-3 py-2.5 rounded text-sm outline-none mb-6"
          style={{
            backgroundColor: "var(--color-ink)",
            border: "1px solid var(--color-stone)",
            color: "var(--color-cream)",
            fontFamily: "monospace",
            letterSpacing: "0.1em",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "var(--color-wine)"
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "var(--color-stone)"
          }}
        />
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded text-sm font-medium transition-colors"
            style={{
              border: "1px solid var(--color-stone)",
              color: "var(--color-taupe)",
              backgroundColor: "transparent",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--color-taupe)"
              e.currentTarget.style.color = "#F5A800"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--color-stone)"
              e.currentTarget.style.color = "var(--color-taupe)"
            }}
          >
            Cancel
          </button>
          <button
            disabled={!valid}
            className="flex-1 py-2.5 rounded text-sm font-semibold transition-colors"
            style={{
              background: "linear-gradient(135deg, #F5A800, #FF6B00)",
              color: "#08080F",
              cursor: valid ? "pointer" : "not-allowed",
            }}
          >
            Delete Account
          </button>
        </div>
      </ModalBox>
    </ModalOverlay>
  )
}

// ─── Sign Out All Devices Modal ───────────────────────────────────────────────

function SignOutAllModal({ onClose }: { onClose: () => void }) {
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function signOutOtherDevices() {
    setLoading(true)
    setError("")

    const { error: signOutError } = await supabase.auth.signOut({
      scope: "others",
    })
    if (signOutError) {
      setError(signOutError.message)
      setLoading(false)
      return
    }

    setDone(true)
    setLoading(false)
  }

  return (
    <ModalOverlay onClose={onClose}>
      <ModalBox title="Sign Out of Other Devices?" onClose={onClose}>
        {done ? (
          <p
            className="text-sm py-4 text-center"
            style={{ color: "var(--color-taupe)" }}
          >
            Other devices have been signed out. This device remains active.
          </p>
        ) : (
          <>
            <p className="text-sm mb-6" style={{ color: "var(--color-taupe)" }}>
              Every other StreamFlix session will need to sign in again. Your
              current browser will remain signed in.
            </p>
            {error && (
              <p
                role="alert"
                className="text-sm mb-4"
                style={{ color: "#ff8a8a" }}
              >
                {error}
              </p>
            )}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded text-sm font-medium transition-colors"
                style={{
                  border: "1px solid var(--color-stone)",
                  color: "var(--color-taupe)",
                  backgroundColor: "transparent",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--color-taupe)"
                  e.currentTarget.style.color = "#F5A800"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--color-stone)"
                  e.currentTarget.style.color = "var(--color-taupe)"
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => void signOutOtherDevices()}
                disabled={loading}
                className="flex-1 py-2.5 rounded text-sm font-semibold transition-colors"
                style={{
                  background: "linear-gradient(135deg, #F5A800, #FF6B00)",
                  color: "#08080F",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(245,168,0,0.12)"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background =
                    "linear-gradient(135deg, #F5A800, #FF6B00)"
                }}
              >
                {loading ? "Signing out…" : "Sign Out Other Devices"}
              </button>
            </div>
          </>
        )}
      </ModalBox>
    </ModalOverlay>
  )
}

// ─── Billing Details Modal ────────────────────────────────────────────────────

function BillingDetailsModal({
  onClose,
  account,
  billingHistory,
}: {
  onClose: () => void
  account: AccountSnapshot | null
  billingHistory: BillingHistoryEntry[]
}) {
  return (
    <ModalOverlay onClose={onClose}>
      <ModalBox title="Billing Details" onClose={onClose}>
        <div className="space-y-3">
          {[
            {
              label: "Plan",
              value: account?.planName
                ? `StreamFlix ${account.planName}`
                : "No active plan",
            },

            {
              label: "Amount",
              value:
                account?.monthlyPrice != null
                  ? `${formatCurrency(account.monthlyPrice)} / month`
                  : "Not available",
            },

            {
              label: "Payment Method",
              value: formatPaymentMethod(
                account?.paymentMethod ?? null,
                account?.referenceNumber ?? null,
              ),
            },

            {
              label: "Next Billing Date",
              value: formatAccountDate(account?.endDate ?? null),
            },
          ].map((row) => (
            <div
              key={row.label}
              className="flex justify-between py-2"
              style={{ borderBottom: "1px solid var(--color-stone)" }}
            >
              <span className="text-sm" style={{ color: "var(--color-taupe)" }}>
                {row.label}
              </span>
              <span
                className="text-sm font-medium"
                style={{ color: "var(--color-cream)" }}
              >
                {row.value}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-5">
          <p
            className="text-xs font-medium mb-3 tracking-wide uppercase"
            style={{ color: "var(--color-taupe)" }}
          >
            Billing History
          </p>
          {billingHistory.map((entry) => (
            <div
              key={entry.id}
              className="flex justify-between py-2"
              style={{ borderBottom: "1px solid var(--color-stone)" }}
            >
              <span className="text-sm" style={{ color: "var(--color-taupe)" }}>
                {formatAccountDate(entry.paidAt)}
              </span>
              <span className="text-sm" style={{ color: "var(--color-cream)" }}>
                {formatCurrency(entry.amount)}
              </span>
            </div>
          ))}
          {billingHistory.length === 0 && (
            <p className="text-sm py-2" style={{ color: "var(--color-taupe)" }}>
              No billing history is available.
            </p>
          )}
        </div>
        <button
          onClick={onClose}
          className="w-full mt-6 py-2.5 rounded text-sm font-medium transition-colors"
          style={{
            border: "1px solid var(--color-stone)",
            color: "var(--color-taupe)",
            backgroundColor: "transparent",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--color-taupe)"
            e.currentTarget.style.color = "#F5A800"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--color-stone)"
            e.currentTarget.style.color = "var(--color-taupe)"
          }}
        >
          Close
        </button>
      </ModalBox>
    </ModalOverlay>
  )
}

// ─── Divider ──────────────────────────────────────────────────────────────────

function Divider() {
  return <div style={{ borderTop: "1px solid var(--color-stone)" }} />
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="font-display text-base font-semibold tracking-wider uppercase mb-4"
      style={{ color: "var(--color-taupe)" }}
    >
      {children}
    </h2>
  )
}

// ─── Overview Content ─────────────────────────────────────────────────────────

function OverviewContent({
  setSection,
  setModal,
  account,
  loading,
  loadError,
}: {
  setSection: (s: Section) => void
  setModal: (m: Modal) => void
  account: AccountSnapshot | null
  loading: boolean
  loadError: string
}) {
  const membershipStatus = account?.planName
    ? account.accountStatus || "Status unavailable"
    : "No plan"
  const joinedYear = account?.joinedAt
    ? new Date(account.joinedAt).getFullYear()
    : null
  const memberSince =
    joinedYear && Number.isFinite(joinedYear) ? joinedYear : null

  return (
    <div className="space-y-8">
      {loadError && (
        <p
          role="alert"
          className="rounded-lg px-4 py-3 text-sm"
          style={{
            border: "1px solid var(--color-wine)",
            color: "var(--color-cream)",
          }}
        >
          {loadError}
        </p>
      )}
      <div
        className="rounded-lg p-5"
        style={{
          backgroundColor: "rgba(21,13,42,0.5)",
          border: "1px solid var(--color-stone)",
        }}
      >
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-0">
            <p
              className="text-xs font-medium tracking-widest uppercase mb-1"
              style={{ color: "var(--color-taupe)" }}
            >
              Membership
            </p>
            <p
              className="font-display text-2xl font-bold tracking-wide"
              style={{ color: "var(--color-cream)" }}
            >
              {loading
                ? "Loading membership…"
                : account?.planName
                  ? `StreamFlix ${account.planName}`
                  : "No active plan"}
            </p>
          </div>
          <div className="flex flex-col gap-1.5 items-start">
            <span
              className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium"
              style={{
                border: "1px solid var(--color-wine)",
                color: "var(--color-cream)",
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: "rgba(21,13,42,0.5)" }}
              />
              {loading ? "Loading" : membershipStatus}
            </span>
            <span className="text-xs" style={{ color: "var(--color-taupe)" }}>
              {memberSince
                ? `Member since ${memberSince}`
                : "Membership date unavailable"}
            </span>
          </div>
          <button
            onClick={() => setSection("membership")}
            className="px-5 py-2.5 rounded text-sm font-semibold transition-colors whitespace-nowrap"
            style={{
              background: "linear-gradient(135deg, #F5A800, #FF6B00)",
              color: "#08080F",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(245,168,0,0.12)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background =
                "linear-gradient(135deg, #F5A800, #FF6B00)"
            }}
          >
            Manage Membership
          </button>
        </div>
      </div>

      <div>
        <SectionHeading>Account Information</SectionHeading>
        <div className="space-y-0">
          {[
            {
              label: "Email",
              value: loading ? "Loading…" : account?.email || "Not available",
              action: "Change",
              modal: "email" as Modal,
            },

            {
              label: "Password",
              value: "••••••••••",
              action: "Change",
              modal: "password" as Modal,
            },

            {
              label: "Phone",
              value: "Not added",
              action: "Add",
              modal: "phone" as Modal,
              muted: true,
            },
          ].map((row, i, arr) => (
            <div key={row.label}>
              <div className="flex items-center py-4 gap-4">
                <span
                  className="w-24 text-sm font-medium flex-shrink-0"
                  style={{ color: "var(--color-cream)" }}
                >
                  {row.label}
                </span>
                <span
                  className="flex-1 text-sm"
                  style={{
                    color: row.muted
                      ? "var(--color-taupe)"
                      : "var(--color-cream)",
                  }}
                >
                  {row.value}
                </span>
                <button
                  onClick={() => setModal(row.modal)}
                  className="text-sm transition-colors flex-shrink-0"
                  style={{ color: "var(--color-taupe)" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "#F5A800"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "var(--color-taupe)"
                  }}
                >
                  {row.action}
                </button>
              </div>
              {i < arr.length - 1 && <Divider />}
            </div>
          ))}
        </div>
      </div>

      <Divider />

      <div>
        <SectionHeading>Plan &amp; Billing</SectionHeading>
        <div className="flex flex-wrap items-center gap-4 py-1">
          <div className="flex flex-wrap items-center gap-4 flex-1">
            <span
              className="text-sm font-bold"
              style={{ color: "var(--color-cream)" }}
            >
              {loading ? "Loading…" : account?.planName || "No active plan"}
            </span>
            <span
              style={{
                color: "var(--color-stone)",
                fontSize: "1px",
                borderLeft: "1px solid var(--color-stone)",
                height: "16px",
                display: "inline-block",
              }}
            />
            <span className="text-sm" style={{ color: "var(--color-cream)" }}>
              {account?.maxUser
                ? `Up to ${account.maxUser} profile${
                    account.maxUser === 1 ? "" : "s"
                  }`
                : "Plan details unavailable"}
            </span>
            <span
              style={{
                color: "var(--color-stone)",
                fontSize: "1px",
                borderLeft: "1px solid var(--color-stone)",
                height: "16px",
                display: "inline-block",
              }}
            />
            <span
              className="flex items-center gap-1.5 text-sm"
              style={{ color: "var(--color-cream)" }}
            >
              <span style={{ color: "var(--color-taupe)" }}>
                <IconCreditCard />
              </span>
              {formatPaymentMethod(
                account?.paymentMethod ?? null,
                account?.referenceNumber ?? null,
              )}
            </span>
            <span
              style={{
                color: "var(--color-stone)",
                fontSize: "1px",
                borderLeft: "1px solid var(--color-stone)",
                height: "16px",
                display: "inline-block",
              }}
            />
            <span className="text-sm" style={{ color: "var(--color-taupe)" }}>
              Next billing date:{" "}
              <span style={{ color: "var(--color-cream)" }}>
                {formatAccountDate(account?.endDate ?? null)}
              </span>
            </span>
          </div>
          <button
            onClick={() => setModal("billing")}
            className="px-4 py-2 rounded text-sm font-medium transition-colors whitespace-nowrap"
            style={{
              border: "1px solid var(--color-stone)",
              color: "var(--color-taupe)",
              backgroundColor: "transparent",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--color-taupe)"
              e.currentTarget.style.color = "#F5A800"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--color-stone)"
              e.currentTarget.style.color = "var(--color-taupe)"
            }}
          >
            View billing details
          </button>
        </div>
      </div>

      <Divider />

      <div>
        <SectionHeading>Quick Links</SectionHeading>
        <div>
          {[
            {
              label: "Security Settings",
              icon: <IconShield />,
              target: "security" as Section,
            },

            {
              label: "Manage Devices",
              icon: <IconMonitor />,
              target: "devices" as Section,
            },

            {
              label: "Manage Profiles",
              icon: <IconUsers />,
              target: "profiles" as Section,
            },
          ].map((link, i, arr) => (
            <div key={link.label}>
              <button
                onClick={() => setSection(link.target)}
                className="w-full flex items-center gap-3 py-4 transition-colors group"
                style={{ color: "var(--color-cream)" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "var(--color-wine)"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "#F5A800"
                }}
              >
                <span
                  style={{ color: "var(--color-taupe)" }}
                  className="group-hover:text-current transition-colors"
                >
                  {link.icon}
                </span>
                <span className="flex-1 text-sm text-left">{link.label}</span>
                <span style={{ color: "var(--color-taupe)" }}>
                  <IconChevronRight />
                </span>
              </button>
              {i < arr.length - 1 && <Divider />}
            </div>
          ))}
        </div>
      </div>

      <Divider />

      <div className="pb-6">
        <SectionHeading>Account Actions</SectionHeading>
        <button
          onClick={() => setModal("delete1")}
          className="text-sm transition-colors"
          style={{ color: "var(--color-taupe)" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#F5A800"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "var(--color-taupe)"
          }}
        >
          Delete Account
        </button>
      </div>
    </div>
  )
}

// ─── Membership Page ──────────────────────────────────────────────────────────

function MembershipPage({
  setModal,
  account,
  billingHistory,
}: {
  setModal: (m: Modal) => void
  account: AccountSnapshot | null
  billingHistory: BillingHistoryEntry[]
}) {
  const [cancelling, setCancelling] = useState(false)

  return (
    <div className="space-y-8 pb-6">
      <div>
        <SectionHeading>Current Plan</SectionHeading>
        <div
          className="rounded-lg p-5 mb-4"
          style={{
            backgroundColor: "rgba(21,13,42,0.5)",
            border: "1px solid var(--color-stone)",
          }}
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p
                className="font-display text-2xl font-bold tracking-wide mb-1"
                style={{ color: "var(--color-cream)" }}
              >
                {account?.planName
                  ? `StreamFlix ${account.planName}`
                  : "No active plan"}
              </p>
              <div className="flex flex-wrap gap-3 mt-3">
                {account?.maxUser ? (
                  <span
                    className="text-xs px-2.5 py-1 rounded"
                    style={{
                      border: "1px solid var(--color-stone)",
                      color: "var(--color-taupe)",
                    }}
                  >
                    Up to {account.maxUser} profile
                    {account.maxUser === 1 ? "" : "s"}
                  </span>
                ) : null}
              </div>
            </div>
            <div className="text-right">
              <p
                className="font-display text-xl font-bold"
                style={{ color: "var(--color-cream)" }}
              >
                {formatCurrency(account?.monthlyPrice ?? null)}
              </p>
              <p className="text-xs" style={{ color: "var(--color-taupe)" }}>
                per month
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={() => setModal("changePlan")}
          className="text-sm font-medium px-4 py-2 rounded transition-colors"
          style={{
            border: "1px solid var(--color-stone)",
            color: "var(--color-taupe)",
            backgroundColor: "transparent",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--color-taupe)"
            e.currentTarget.style.color = "#F5A800"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--color-stone)"
            e.currentTarget.style.color = "var(--color-taupe)"
          }}
        >
          {account?.planName ? "Change Plan" : "Choose a Plan"}
        </button>
      </div>

      <Divider />

      <div>
        <SectionHeading>Billing</SectionHeading>
        <div className="space-y-0">
          {[
            {
              label: "Payment Method",
              value: formatPaymentMethod(
                account?.paymentMethod ?? null,
                account?.referenceNumber ?? null,
              ),
              action: "Update",
              onClick: () => setModal("updatePayment"),
            },

            {
              label: "Next Billing Date",
              value: formatAccountDate(account?.endDate ?? null),
              action: null,
              onClick: undefined,
            },

            {
              label: "Amount",
              value:
                account?.monthlyPrice != null
                  ? `${formatCurrency(account.monthlyPrice)} / month`
                  : "Not available",
              action: null,
              onClick: undefined,
            },
          ].map((row, i, arr) => (
            <div key={row.label}>
              <div className="flex items-center py-4 gap-4">
                <span
                  className="w-36 text-sm flex-shrink-0"
                  style={{ color: "var(--color-taupe)" }}
                >
                  {row.label}
                </span>
                <span
                  className="flex-1 text-sm"
                  style={{ color: "var(--color-cream)" }}
                >
                  {row.value}
                </span>
                {row.action && (
                  <button
                    onClick={row.onClick}
                    className="text-sm transition-colors flex-shrink-0"
                    style={{ color: "var(--color-taupe)" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "#F5A800"
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "var(--color-taupe)"
                    }}
                  >
                    {row.action}
                  </button>
                )}
              </div>
              {i < arr.length - 1 && <Divider />}
            </div>
          ))}
        </div>
      </div>

      <Divider />

      <div>
        <SectionHeading>Billing History</SectionHeading>
        <div>
          {billingHistory.map((row, i, entries) => (
            <div key={row.id}>
              <div className="flex items-center py-3 gap-4">
                <span
                  className="flex-1 text-sm"
                  style={{ color: "var(--color-taupe)" }}
                >
                  {formatAccountDate(row.paidAt)}
                </span>
                <span
                  className="text-sm"
                  style={{ color: "var(--color-cream)" }}
                >
                  {formatCurrency(row.amount)}
                </span>
                <span
                  className="text-xs px-2 py-0.5 rounded"
                  style={{
                    border: "1px solid var(--color-stone)",
                    color: "var(--color-taupe)",
                  }}
                >
                  {row.status}
                </span>
              </div>
              {i < entries.length - 1 && <Divider />}
            </div>
          ))}
          {billingHistory.length === 0 && (
            <p className="text-sm py-3" style={{ color: "var(--color-taupe)" }}>
              No billing history is available.
            </p>
          )}
        </div>
      </div>

      <Divider />

      <div>
        <p
          className="text-xs font-medium mb-3 tracking-widest uppercase"
          style={{ color: "var(--color-taupe)" }}
        >
          Danger Zone
        </p>
        {!cancelling ? (
          <button
            onClick={() => setCancelling(true)}
            className="text-sm transition-colors"
            style={{ color: "var(--color-taupe)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#F5A800"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--color-taupe)"
            }}
          >
            Cancel Membership
          </button>
        ) : (
          <div
            className="rounded-lg p-4"
            style={{
              border: "1px solid var(--color-wine)",
              backgroundColor: "var(--color-wine)",
            }}
          >
            <p className="text-sm mb-4" style={{ color: "var(--color-taupe)" }}>
              Are you sure you want to cancel? You will lose access at the end
              of your current billing period.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setCancelling(false)}
                className="px-4 py-2 rounded text-sm font-medium transition-colors"
                style={{
                  border: "1px solid var(--color-stone)",
                  color: "var(--color-taupe)",
                  backgroundColor: "transparent",
                }}
              >
                Keep Membership
              </button>
              <button
                className="px-4 py-2 rounded text-sm font-semibold transition-colors"
                style={{
                  background: "linear-gradient(135deg, #F5A800, #FF6B00)",
                  color: "#08080F",
                }}
              >
                Confirm Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Security Page ────────────────────────────────────────────────────────────

function SecurityPage({
  setModal,
  currentDevice,
  deviceLoading,
  deviceError,
}: {
  setModal: (m: Modal) => void
  currentDevice: DeviceSession | null
  deviceLoading: boolean
  deviceError: string
}) {
  const [twoStep, setTwoStep] = useState(false)

  return (
    <div className="space-y-8 pb-6">
      <div>
        <SectionHeading>Security</SectionHeading>
        <div className="space-y-0">
          {[
            {
              label: "Password",
              value: "Last changed 30 days ago",
              action: "Change",
              onClick: () => setModal("password"),
            },

            {
              label: "Phone",
              value: "Not added",
              action: "Add",
              onClick: () => setModal("phone"),
              muted: true,
            },
          ].map((row, i, arr) => (
            <div key={row.label}>
              <div className="flex items-center py-4 gap-4">
                <span
                  className="w-36 text-sm font-medium flex-shrink-0"
                  style={{ color: "var(--color-cream)" }}
                >
                  {row.label}
                </span>
                <span
                  className="flex-1 text-sm"
                  style={{ color: "var(--color-taupe)" }}
                >
                  {row.value}
                </span>
                <button
                  onClick={row.onClick}
                  className="text-sm transition-colors flex-shrink-0"
                  style={{ color: "var(--color-taupe)" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "#F5A800"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "var(--color-taupe)"
                  }}
                >
                  {row.action}
                </button>
              </div>
              {i < arr.length - 1 && <Divider />}
            </div>
          ))}
        </div>
      </div>

      <Divider />

      <div>
        <SectionHeading>Two-Step Verification</SectionHeading>
        <div className="flex items-center justify-between py-2">
          <div>
            <p
              className="text-sm font-medium mb-1"
              style={{ color: "var(--color-cream)" }}
            >
              Two-Step Verification
            </p>
            <p className="text-xs" style={{ color: "var(--color-taupe)" }}>
              {twoStep
                ? "Enabled — your account has extra protection."
                : "Add an extra layer of security to your account."}
            </p>
          </div>
          <button
            onClick={() => setTwoStep((x) => !x)}
            className="relative w-10 h-5 rounded-full transition-colors flex-shrink-0"
            style={{
              backgroundColor: twoStep
                ? "var(--color-wine)"
                : "var(--color-stone)",
            }}
            role="switch"
            aria-checked={twoStep}
            aria-label="Toggle two-step verification"
          >
            <span
              className="absolute top-0.5 w-4 h-4 rounded-full transition-transform"
              style={{
                backgroundColor: "var(--color-cream)",
                transform: twoStep ? "translateX(20px)" : "translateX(2px)",
              }}
            />
          </button>
        </div>
      </div>

      <Divider />

      <div>
        <SectionHeading>Current Account Access</SectionHeading>
        <div>
          {deviceLoading && (
            <p className="text-sm py-3" style={{ color: "var(--color-taupe)" }}>
              Loading account access…
            </p>
          )}
          {deviceError && (
            <p
              role="alert"
              className="text-sm py-3"
              style={{ color: "#ff8a8a" }}
            >
              {deviceError}
            </p>
          )}
          {!deviceLoading && !deviceError && currentDevice && (
            <div>
              <div className="flex items-center py-3 gap-4">
                <div className="flex-1">
                  <p
                    className="text-sm"
                    style={{ color: "var(--color-cream)" }}
                  >
                    {currentDevice.name}
                  </p>
                  <p
                    className="text-xs mt-0.5"
                    style={{ color: "var(--color-taupe)" }}
                  >
                    {currentDevice.type} · Current browser
                  </p>
                </div>
                <span
                  className="text-xs"
                  style={{ color: "var(--color-taupe)" }}
                >
                  {currentDevice.lastActive}
                </span>
              </div>
            </div>
          )}
          {!deviceLoading && !deviceError && !currentDevice && (
            <p className="text-sm py-3" style={{ color: "var(--color-taupe)" }}>
              No active session was found.
            </p>
          )}
        </div>
      </div>

      <Divider />

      <div>
        <button
          onClick={() => setModal("signout")}
          className="text-sm transition-colors"
          style={{ color: "var(--color-taupe)" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#F5A800"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "var(--color-taupe)"
          }}
        >
          Sign Out of Other Devices
        </button>
      </div>
    </div>
  )
}

// ─── Devices Page ─────────────────────────────────────────────────────────────

function DevicesPage({
  currentDevice,
  loading,
  loadError,
}: {
  currentDevice: DeviceSession | null
  loading: boolean
  loadError: string
}) {
  const [signingOut, setSigningOut] = useState(false)
  const [signOutError, setSignOutError] = useState("")

  async function signOutCurrentDevice() {
    setSigningOut(true)
    setSignOutError("")

    const { error } = await supabase.auth.signOut({ scope: "local" })
    if (error) {
      setSignOutError(error.message)
      setSigningOut(false)
    }
  }

  return (
    <div className="space-y-8 pb-6">
      <div>
        <SectionHeading>Current Device</SectionHeading>
        <p className="text-xs mb-2" style={{ color: "var(--color-taupe)" }}>
          Remote device details are not exposed by the authentication provider.
          You can revoke every other session from Security settings.
        </p>
        <div>
          {loading && (
            <p className="text-sm py-4" style={{ color: "var(--color-taupe)" }}>
              Loading signed-in devices…
            </p>
          )}
          {(loadError || signOutError) && (
            <p
              role="alert"
              className="text-sm py-4"
              style={{ color: "#ff8a8a" }}
            >
              {loadError || signOutError}
            </p>
          )}
          {!loading && !loadError && currentDevice && (
            <div key={currentDevice.id}>
              <div className="flex items-center py-4 gap-4">
                <div
                  className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: "var(--color-stone)" }}
                >
                  <span style={{ color: "var(--color-taupe)" }}>
                    <IconMonitor />
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-medium"
                    style={{ color: "var(--color-cream)" }}
                  >
                    {currentDevice.name}
                  </p>
                  <p
                    className="text-xs mt-0.5"
                    style={{ color: "var(--color-taupe)" }}
                  >
                    {currentDevice.type} · {currentDevice.location} ·{" "}
                    {currentDevice.lastActive}
                  </p>
                </div>
                <span
                  className="text-xs px-2 py-0.5 rounded hidden sm:inline"
                  style={{
                    border: "1px solid var(--color-stone)",
                    color: "var(--color-taupe)",
                  }}
                >
                  This device
                </span>
                <button
                  onClick={() => void signOutCurrentDevice()}
                  disabled={signingOut}
                  className="text-xs flex-shrink-0 transition-colors"
                  style={{ color: "var(--color-taupe)" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "#F5A800"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "var(--color-taupe)"
                  }}
                >
                  {signingOut ? "Signing out…" : "Sign Out"}
                </button>
              </div>
            </div>
          )}
          {!loading && !loadError && !currentDevice && (
            <p className="text-sm py-4" style={{ color: "var(--color-taupe)" }}>
              No active session was found.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Profiles Page ────────────────────────────────────────────────────────────

function ProfilesPage() {
  const [profiles, setProfiles] = useState<AccountMemberProfile[]>([])
  const [avatars, setAvatars] = useState<AvatarChoice[]>([])
  const [maxProfiles, setMaxProfiles] = useState<number | null>(null)
  const [canAddProfile, setCanAddProfile] = useState(false)
  const [allowsKidsProfiles, setAllowsKidsProfiles] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState("")
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [newName, setNewName] = useState("")
  const [selectedAvatar, setSelectedAvatar] = useState("")
  const [isKids, setIsKids] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState("")

  const loadProfiles = useCallback(async () => {
    setLoading(true)
    setLoadError("")

    try {
      const [profilesResult, contextResult, avatarListResult] =
        await Promise.all([
          supabase.rpc("get_my_member_profiles"),
          supabase.rpc("get_my_member_profile_context"),
          supabase.storage.from("avatar").list("", {
            limit: 24,
            sortBy: { column: "name", order: "asc" },
          }),
        ])

      if (profilesResult.error) throw profilesResult.error
      if (contextResult.error) throw contextResult.error

      const rows = (profilesResult.data ?? []) as MemberProfileRow[]
      const context = ((contextResult.data ?? [])[0] ??
        null) as MemberProfileContextRow | null
      const avatarFiles = avatarListResult.error
        ? []
        : (avatarListResult.data ?? []).filter((file) => file.id)
      const signedUrls = await getSignedAvatarUrls([
        ...rows.map((row) => row.avatar_image?.trim() ?? ""),
        ...avatarFiles.map((file) => file.name),
      ])

      setProfiles(
        rows.map((row) => {
          const avatarPath = row.avatar_image?.trim() ?? ""
          return {
            id: Number(row.member_profile_id),
            name: row.profile_name,
            avatarPath,
            avatarUrl: isExternalAvatar(avatarPath)
              ? avatarPath
              : (signedUrls.get(avatarPath) ?? ""),
            isKids: row.is_kids,
            displayOrder: row.display_order,
          }
        }),
      )
      setAvatars(
        avatarFiles
          .map((file) => ({
            path: file.name,
            url: signedUrls.get(file.name) ?? "",
          }))
          .filter((avatar) => avatar.url),
      )
      setMaxProfiles(context?.max_profiles ?? null)
      setCanAddProfile(context?.can_add_profile ?? false)
      setAllowsKidsProfiles(context?.allows_kids ?? false)
    } catch (error) {
      console.error("Unable to load account profiles", error)
      setLoadError("We couldn't load your profiles. Please try again.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadProfiles()
  }, [loadProfiles])

  function closeEditor() {
    setAdding(false)
    setEditingId(null)
    setNewName("")
    setSelectedAvatar("")
    setIsKids(false)
    setSaveError("")
  }

  function beginAdd() {
    setAdding(true)
    setEditingId(null)
    setNewName("")
    setSelectedAvatar(avatars[0]?.path ?? "")
    setIsKids(false)
    setSaveError("")
  }

  function beginEdit(profile: AccountMemberProfile) {
    setAdding(false)
    setEditingId(profile.id)
    setNewName(profile.name)
    setSelectedAvatar(
      avatars.some((avatar) => avatar.path === profile.avatarPath)
        ? profile.avatarPath
        : (avatars[0]?.path ?? ""),
    )
    setIsKids(profile.isKids)
    setSaveError("")
  }

  async function saveProfile() {
    const name = newName.trim()
    if (!name) {
      setSaveError("Enter a profile name.")
      return
    }
    if (!selectedAvatar) {
      setSaveError("Choose an avatar before saving.")
      return
    }

    setSaving(true)
    setSaveError("")

    const result = editingId
      ? await supabase.rpc("update_my_member_profile", {
          selected_profile_id: editingId,
          selected_profile_name: name,
          selected_avatar_path: selectedAvatar,
          selected_pin: null,
          remove_pin: false,
        })
      : await supabase.rpc("create_my_member_profile", {
          selected_profile_name: name,
          selected_avatar_path: selectedAvatar,
          selected_is_kids: isKids,
          selected_pin: null,
        })

    if (result.error) {
      setSaveError(result.error.message || "We couldn't save that profile.")
      setSaving(false)
      return
    }

    await loadProfiles()
    setSaving(false)
    closeEditor()
  }

  const editorOpen = adding || editingId != null

  return (
    <div className="space-y-8 pb-6">
      <div>
        <SectionHeading>Profiles</SectionHeading>
        {maxProfiles != null && !loading && (
          <p className="text-xs mb-2" style={{ color: "var(--color-taupe)" }}>
            {profiles.length} of {maxProfiles} profiles used
          </p>
        )}
        {loading && (
          <p className="text-sm py-4" style={{ color: "var(--color-taupe)" }}>
            Loading profiles…
          </p>
        )}
        {loadError && (
          <div role="alert" className="py-4">
            <p className="text-sm mb-3" style={{ color: "#ff8a8a" }}>
              {loadError}
            </p>
            <button
              type="button"
              onClick={() => void loadProfiles()}
              className="text-sm font-medium"
              style={{ color: "var(--color-taupe)" }}
            >
              Try Again
            </button>
          </div>
        )}
        {!loading && !loadError && (
          <div>
            {profiles.map((p, i, arr) => (
              <div key={p.id}>
                <div className="flex items-center py-4 gap-4">
                  <div
                    className="relative w-9 h-9 overflow-hidden rounded font-display font-bold text-sm flex items-center justify-center flex-shrink-0"
                    style={{
                      background: "linear-gradient(135deg, #F5A800, #FF6B00)",
                      color: "#08080F",
                    }}
                  >
                    {profileInitials(p.name)}
                    {p.avatarUrl && (
                      <img
                        src={p.avatarUrl}
                        alt=""
                        className="absolute inset-0 h-full w-full rounded object-cover"
                        onError={(event) => {
                          event.currentTarget.style.display = "none"
                        }}
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-medium"
                      style={{ color: "var(--color-cream)" }}
                    >
                      {p.name}
                    </p>
                    <p
                      className="text-xs mt-0.5"
                      style={{ color: "var(--color-taupe)" }}
                    >
                      {p.isKids ? "Kids profile" : `Profile ${p.displayOrder}`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => beginEdit(p)}
                    className="text-xs transition-colors"
                    style={{ color: "var(--color-taupe)" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "#F5A800"
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "var(--color-taupe)"
                    }}
                  >
                    Edit
                  </button>
                </div>
                {i < arr.length - 1 && <Divider />}
              </div>
            ))}
            {!profiles.length && (
              <p
                className="text-sm py-4"
                style={{ color: "var(--color-taupe)" }}
              >
                No profiles have been created yet.
              </p>
            )}
          </div>
        )}
      </div>
      <div className="mt-4">
        {!editorOpen && !loading && !loadError ? (
          <button
            type="button"
            onClick={beginAdd}
            disabled={!canAddProfile}
            className="text-sm font-medium px-4 py-2 rounded transition-colors"
            style={{
              border: "1px solid var(--color-stone)",
              color: canAddProfile
                ? "var(--color-taupe)"
                : "var(--color-stone)",
              backgroundColor: "transparent",
              cursor: canAddProfile ? "pointer" : "not-allowed",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--color-taupe)"
              e.currentTarget.style.color = "#F5A800"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--color-stone)"
              e.currentTarget.style.color = "var(--color-taupe)"
            }}
          >
            {canAddProfile ? "+ Add Profile" : "Profile limit reached"}
          </button>
        ) : editorOpen ? (
          <form
            onSubmit={(event) => {
              event.preventDefault()
              void saveProfile()
            }}
            className="rounded-lg p-4"
            style={{
              border: "1px solid var(--color-stone)",
              backgroundColor: "rgba(21,13,42,0.5)",
            }}
          >
            <p
              className="text-xs font-medium mb-2 tracking-wide uppercase"
              style={{ color: "var(--color-taupe)" }}
            >
              {editingId ? "Edit Profile" : "Add Profile"}
            </p>
            <label
              htmlFor="account-profile-name"
              className="block text-xs font-medium mb-2 tracking-wide uppercase"
              style={{ color: "var(--color-taupe)" }}
            >
              Profile Name
            </label>
            <input
              id="account-profile-name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="New profile name"
              maxLength={50}
              className="w-full px-3 py-2.5 rounded text-sm outline-none mb-3"
              style={{
                backgroundColor: "var(--color-ink)",
                border: "1px solid var(--color-stone)",
                color: "var(--color-cream)",
                fontFamily: "Barlow, sans-serif",
              }}
            />
            <p
              className="text-xs font-medium mb-2 tracking-wide uppercase"
              style={{ color: "var(--color-taupe)" }}
            >
              Avatar
            </p>
            <div className="flex flex-wrap gap-2 mb-3">
              {avatars.map((avatar, index) => (
                <button
                  key={avatar.path}
                  type="button"
                  onClick={() => setSelectedAvatar(avatar.path)}
                  aria-label={`Choose avatar ${index + 1}`}
                  aria-pressed={selectedAvatar === avatar.path}
                  className="h-11 w-11 overflow-hidden rounded"
                  style={{
                    border:
                      selectedAvatar === avatar.path
                        ? "2px solid #F5A800"
                        : "1px solid var(--color-stone)",
                  }}
                >
                  <img
                    src={avatar.url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
              {!avatars.length && (
                <p className="text-sm" style={{ color: "var(--color-taupe)" }}>
                  No profile avatars are currently available.
                </p>
              )}
            </div>
            {!editingId && allowsKidsProfiles && (
              <label
                className="mb-3 flex items-center gap-2 text-sm"
                style={{ color: "var(--color-taupe)" }}
              >
                <input
                  type="checkbox"
                  checked={isKids}
                  onChange={(event) => setIsKids(event.target.checked)}
                />
                Kids profile
              </label>
            )}
            {saveError && (
              <p
                role="alert"
                className="text-sm mb-3"
                style={{ color: "#ff8a8a" }}
              >
                {saveError}
              </p>
            )}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={closeEditor}
                disabled={saving}
                className="px-4 py-2 rounded text-sm transition-colors"
                style={{
                  border: "1px solid var(--color-stone)",
                  color: "var(--color-taupe)",
                  backgroundColor: "transparent",
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || !newName.trim() || !selectedAvatar}
                className="px-4 py-2 rounded text-sm font-semibold transition-colors"
                style={{
                  background: "linear-gradient(135deg, #F5A800, #FF6B00)",
                  color: "#08080F",
                }}
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        ) : null}
      </div>
    </div>
  )
}

// ─── Privacy Page ─────────────────────────────────────────────────────────────

function PrivacyPage() {
  const [prefs, setPrefs] = useState({
    personalization: true,
    comms: false,
    viewingData: true,
  })

  return (
    <div className="space-y-8 pb-6">
      <div>
        <SectionHeading>Privacy Preferences</SectionHeading>
        <div className="space-y-0">
          {[
            {
              key: "personalization" as const,
              label: "Personalization",
              desc: "Allow StreamFlix to use your viewing history to personalize recommendations.",
            },

            {
              key: "viewingData" as const,
              label: "Viewing Data",
              desc: "Allow StreamFlix to use your data to improve the service.",
            },

            {
              key: "comms" as const,
              label: "Marketing Communications",
              desc: "Receive emails about new releases, features, and offers.",
            },
          ].map((item, i, arr) => (
            <div key={item.key}>
              <div className="flex items-start justify-between py-4 gap-4">
                <div className="flex-1">
                  <p
                    className="text-sm font-medium mb-0.5"
                    style={{ color: "var(--color-cream)" }}
                  >
                    {item.label}
                  </p>
                  <p
                    className="text-xs leading-relaxed"
                    style={{ color: "var(--color-taupe)" }}
                  >
                    {item.desc}
                  </p>
                </div>
                <button
                  onClick={() =>
                    setPrefs((p) => ({ ...p, [item.key]: !p[item.key] }))
                  }
                  className="relative w-10 h-5 rounded-full transition-colors flex-shrink-0 mt-0.5"
                  style={{
                    backgroundColor: prefs[item.key]
                      ? "var(--color-wine)"
                      : "var(--color-stone)",
                  }}
                  role="switch"
                  aria-checked={prefs[item.key]}
                  aria-label={`Toggle ${item.label}`}
                >
                  <span
                    className="absolute top-0.5 w-4 h-4 rounded-full transition-transform"
                    style={{
                      backgroundColor: "var(--color-cream)",
                      transform: prefs[item.key]
                        ? "translateX(20px)"
                        : "translateX(2px)",
                    }}
                  />
                </button>
              </div>
              {i < arr.length - 1 && <Divider />}
            </div>
          ))}
        </div>
      </div>
      <Divider />
      <div>
        <button
          className="text-sm font-medium transition-colors px-4 py-2 rounded"
          style={{
            border: "1px solid var(--color-stone)",
            color: "var(--color-taupe)",
            backgroundColor: "transparent",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--color-taupe)"
            e.currentTarget.style.color = "#F5A800"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--color-stone)"
            e.currentTarget.style.color = "var(--color-taupe)"
          }}
        >
          Download Account Data
        </button>
      </div>
    </div>
  )
}

// ─── Update Payment Modal ─────────────────────────────────────────────────────

function UpdatePaymentModal({ onClose }: { onClose: () => void }) {
  const [card, setCard] = useState("")

  const [exp, setExp] = useState("")

  const [cvv, setCvv] = useState("")

  const [done, setDone] = useState(false)

  function save() {
    if (!card || !exp || !cvv) return

    setDone(true)

    setTimeout(onClose, 1200)
  }

  return (
    <ModalOverlay onClose={onClose}>
      <ModalBox title="Update Payment Method" onClose={onClose}>
        {done ? (
          <p
            className="text-sm py-4 text-center"
            style={{ color: "var(--color-taupe)" }}
          >
            Billing information updated.
          </p>
        ) : (
          <>
            <FormField
              label="Card Number"
              type="text"
              value={card}
              onChange={setCard}
              placeholder="•••• •••• •••• ••••"
            />
            <div className="grid grid-cols-2 gap-3">
              <FormField
                label="Expiry"
                type="text"
                value={exp}
                onChange={setExp}
                placeholder="MM / YY"
              />
              <FormField
                label="CVV"
                type="password"
                value={cvv}
                onChange={setCvv}
                placeholder="•••"
              />
            </div>
            <ModalActions onCancel={onClose} onSave={save} saveLabel="Update" />
          </>
        )}
      </ModalBox>
    </ModalOverlay>
  )
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

const sidebarItems: { key: Section; label: string; icon: React.ReactNode }[] = [
  { key: "overview", label: "Overview", icon: <IconHome /> },

  { key: "membership", label: "Membership", icon: <IconCard /> },

  { key: "security", label: "Security", icon: <IconShield /> },

  { key: "devices", label: "Devices", icon: <IconMonitor /> },

  { key: "profiles", label: "Profiles", icon: <IconUsers /> },

  { key: "privacy", label: "Privacy", icon: <IconLock /> },
]

function Sidebar({
  active,
  setActive,
}: {
  active: Section
  setActive: (s: Section) => void
}) {
  return (
    <nav
      className="w-full md:w-48 lg:w-56 flex-shrink-0"
      aria-label="Account navigation"
    >
      <ul className="flex md:flex-col gap-0.5">
        {sidebarItems.map((item) => {
          const isActive = item.key === active

          return (
            <li key={item.key} className="flex-1 md:flex-initial">
              <button
                type="button"
                onClick={() => setActive(item.key)}
                className={`w-full flex items-center gap-2.5 py-3 px-3 rounded relative text-left ${styles.accountNavItem} ${
                  isActive ? styles.accountNavItemActive : ""
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                {isActive && (
                  <span
                    className="absolute left-0 top-1 bottom-1 w-0.5 rounded-full hidden md:block"
                    style={{ backgroundColor: "var(--color-gold)" }}
                  />
                )}
                <span className={styles.accountNavIcon}>
                  {item.icon}
                </span>
                <span className="text-sm font-medium hidden sm:block">
                  {item.label}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

// ─── App ──────────────────────────────────────────────────────────────────────

export function AccountView({
  onPlanChange,
}: {
  plan: Plan | null
  onPlanChange: (plan: Plan) => void
}) {
  const [section, setSection] = useState<Section>("overview")

  const [modal, setModal] = useState<Modal>(null)

  useEffect(() => {
    if (modal !== "changePlan") return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [modal])

  const [deleteStep, setDeleteStep] = useState(1)

  const [account, setAccount] = useState<AccountSnapshot | null>(null)
  const [billingHistory, setBillingHistory] = useState<BillingHistoryEntry[]>(
    [],
  )
  const [accountLoading, setAccountLoading] = useState(true)
  const [accountLoadError, setAccountLoadError] = useState("")
  const [currentDevice, setCurrentDevice] = useState<DeviceSession | null>(null)
  const [deviceLoading, setDeviceLoading] = useState(true)
  const [deviceLoadError, setDeviceLoadError] = useState("")

  const loadAccount = useCallback(async () => {
    setAccountLoading(true)
    setAccountLoadError("")

    const { data: authData, error: authError } = await supabase.auth.getUser()
    if (authError) throw authError
    if (!authData.user)
      throw new Error("You must be signed in to view account details.")

    const [settingsResult, accountResult] = await Promise.all([
      supabase.rpc("get_my_account_settings"),
      supabase
        .from("user")
        .select("user_id, joined_at, account_status, reference_number")
        .eq("auth_user_id", authData.user.id)
        .maybeSingle(),
    ])

    if (settingsResult.error) throw settingsResult.error
    if (accountResult.error) throw accountResult.error
    if (!accountResult.data)
      throw new Error("No account is linked to this sign-in.")

    const paymentsResult = await supabase
      .from("payment_transaction")
      .select(
        "payment_id, amount, payment_method, reference_number, status, paid_at, created_at",
      )
      .eq("user_id", accountResult.data.user_id)
      .order("created_at", { ascending: false })
      .limit(12)

    if (paymentsResult.error) throw paymentsResult.error

    const settings = Array.isArray(settingsResult.data)
      ? settingsResult.data[0]
      : settingsResult.data
    if (!settings) throw new Error("No account is linked to this sign-in.")

    const numberOrNull = (value: unknown) => {
      if (value == null) return null
      const parsed = Number(value)
      return Number.isFinite(parsed) ? parsed : null
    }

    const snapshot: AccountSnapshot = {
      email: settings.email ? String(settings.email) : null,
      planName: settings.plan_name ? String(settings.plan_name) : null,
      monthlyPrice: numberOrNull(settings.monthly_price),
      maxUser: numberOrNull(settings.max_user),
      paymentDate: settings.payment_date ? String(settings.payment_date) : null,
      paymentAmount: numberOrNull(settings.payment_amount),
      endDate: settings.end_date ? String(settings.end_date) : null,
      paymentMethod: settings.payment_method
        ? String(settings.payment_method)
        : null,
      referenceNumber: accountResult.data?.reference_number
        ? String(accountResult.data.reference_number)
        : null,
      joinedAt: accountResult.data?.joined_at
        ? String(accountResult.data.joined_at)
        : null,
      accountStatus: accountResult.data?.account_status
        ? String(accountResult.data.account_status)
        : null,
    }

    const history = (paymentsResult.data ?? []).map((payment) => ({
      id: String(payment.payment_id),
      amount: Number(payment.amount),
      paymentMethod: payment.payment_method
        ? String(payment.payment_method)
        : null,
      referenceNumber: payment.reference_number
        ? String(payment.reference_number)
        : null,
      status: String(payment.status),
      paidAt: String(payment.paid_at ?? payment.created_at),
    }))

    if (
      history.length === 0 &&
      snapshot.paymentDate &&
      snapshot.paymentAmount != null
    ) {
      history.push({
        id: `account-payment-${snapshot.paymentDate}`,
        amount: snapshot.paymentAmount,
        paymentMethod: snapshot.paymentMethod,
        referenceNumber: snapshot.referenceNumber,
        status: "Paid",
        paidAt: snapshot.paymentDate,
      })
    }

    setAccount(snapshot)
    setBillingHistory(history)
    setAccountLoading(false)
  }, [])

  useEffect(() => {
    void loadAccount().catch((error: unknown) => {
      setAccountLoadError(
        error instanceof Error
          ? error.message
          : "Account details could not be loaded.",
      )
      setAccountLoading(false)
    })
  }, [loadAccount])

  const loadCurrentDevice = useCallback(async () => {
    setDeviceLoading(true)
    setDeviceLoadError("")

    const [sessionResult, userResult] = await Promise.all([
      supabase.auth.getSession(),
      supabase.auth.getUser(),
    ])
    if (sessionResult.error) throw sessionResult.error
    if (userResult.error) throw userResult.error

    setCurrentDevice(
      sessionResult.data.session && userResult.data.user
        ? getCurrentDeviceSession()
        : null,
    )
    setDeviceLoading(false)
  }, [])

  useEffect(() => {
    void loadCurrentDevice().catch((error: unknown) => {
      setDeviceLoadError(
        error instanceof Error
          ? error.message
          : "Signed-in devices could not be loaded.",
      )
      setDeviceLoading(false)
    })
  }, [loadCurrentDevice])

  const sectionTitles: Record<Section, string> = {
    overview: "Account",

    membership: "Membership",

    security: "Security",

    devices: "Devices",

    profiles: "Profiles",

    privacy: "Privacy",
  }

  return (
    <div className={`min-h-screen ${styles.page}`}>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-4 pb-8 md:pt-6 md:pb-10">
        <h1
          className={`font-display font-black tracking-wider mb-6 md:mb-8 ${styles.accountPageHeading} ${
            section === "membership" ? styles.membershipPageHeading : ""
          }`}
        >
          {sectionTitles[section]}
        </h1>
        <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
          <Sidebar active={section} setActive={setSection} />
          <div className="flex-1 min-w-0">
            {section === "overview" && (
              <OverviewContent
                setSection={setSection}
                setModal={setModal}
                account={account}
                loading={accountLoading}
                loadError={accountLoadError}
              />
            )}
            {section === "membership" && (
              <MembershipPage
                setModal={setModal}
                account={account}
                billingHistory={billingHistory}
              />
            )}
            {section === "security" && (
              <SecurityPage
                setModal={setModal}
                currentDevice={currentDevice}
                deviceLoading={deviceLoading}
                deviceError={deviceLoadError}
              />
            )}
            {section === "devices" && (
              <DevicesPage
                currentDevice={currentDevice}
                loading={deviceLoading}
                loadError={deviceLoadError}
              />
            )}
            {section === "profiles" && <ProfilesPage />}
            {section === "privacy" && <PrivacyPage />}
          </div>
        </div>
      </main>

      {modal === "email" && <ChangeEmailModal onClose={() => setModal(null)} />}
      {modal === "password" && (
        <ChangePasswordModal onClose={() => setModal(null)} />
      )}
      {modal === "phone" && <AddPhoneModal onClose={() => setModal(null)} />}
      {modal === "billing" && (
        <BillingDetailsModal
          onClose={() => setModal(null)}
          account={account}
          billingHistory={billingHistory}
        />
      )}
      {modal === "signout" && (
        <SignOutAllModal onClose={() => setModal(null)} />
      )}
      {modal === "updatePayment" && (
        <UpdatePaymentModal onClose={() => setModal(null)} />
      )}
      {modal === "changePlan" && (
        <div
          className={styles.subscriptionOverlay}
          role="dialog"
          aria-modal="true"
          aria-label="Choose a subscription plan"
        >
          <SubscriptionPage
            onSubscribe={(nextPlan) => {
              onPlanChange(nextPlan)
              void loadAccount()
            }}
            onComplete={() => setModal(null)}
            onBack={() => setModal(null)}
            backLabel="Back to Membership"
          />
        </div>
      )}
      {modal === "delete1" && (
        <DeleteAccountModal1
          onClose={() => setModal(null)}
          onContinue={() => {
            setDeleteStep(2)
            setModal("delete2")
          }}
        />
      )}
      {modal === "delete2" && deleteStep === 2 && (
        <DeleteAccountModal2
          onClose={() => {
            setModal(null)
            setDeleteStep(1)
          }}
        />
      )}
    </div>
  )
}
