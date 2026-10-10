import { useCallback, useEffect, useRef, useState } from "react"
import StreamFlixSelect from "../../components/StreamFlixSelect"
import { supabase } from "../../lib/supabase"
import styles from "./profile.module.css"
import { MAX_PROFILE_NAME_LENGTH, normalizeProfileName } from "./profileName"

type ProfileIdentity = {
  id: number
  name: string
  avatarPath: string
  avatarUrl: string
  isKids: boolean
  hasPin: boolean
  displayOrder: number
  joinedAt: string | null
}

type MemberProfileRow = {
  member_profile_id: number | string
  profile_name: string
  avatar_image: string | null
  is_kids: boolean
  has_pin: boolean
  display_order: number
}

const isExternalAvatar = (value: string) =>
  /^(https?:|data:|blob:)/i.test(value)

function initialsFor(name: string) {
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

// ── Icons ──────────────────────────────────────────────────────────────────

function ChevronDownIcon({
  size = 16,

  className = "",
}: {
  size?: number

  className?: string
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

function ChevronRightIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}

function PlayIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  )
}

function InfoIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  )
}

function MoreVertIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="5" r="1.5" />
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="12" cy="19" r="1.5" />
    </svg>
  )
}

function PlayCircleIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <circle cx="12" cy="12" r="10" />
      <polygon
        points="10 8 16 12 10 16 10 8"
        fill="currentColor"
        stroke="none"
      />
    </svg>
  )
}

function FilmIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <rect x="2" y="2" width="20" height="20" rx="2" />
      <line x1="7" y1="2" x2="7" y2="22" />
      <line x1="17" y1="2" x2="17" y2="22" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <line x1="2" y1="7" x2="7" y2="7" />
      <line x1="2" y1="17" x2="7" y2="17" />
      <line x1="17" y1="17" x2="22" y2="17" />
      <line x1="17" y1="7" x2="22" y2="7" />
    </svg>
  )
}

function SubtitleIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <line x1="6" y1="13" x2="14" y2="13" />
      <line x1="6" y1="17" x2="10" y2="17" />
      <line x1="12" y1="17" x2="18" y2="17" />
      <line x1="16" y1="13" x2="18" y2="13" />
    </svg>
  )
}

function ShieldIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  )
}

function GlobeIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  )
}

function ClockIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

function LockIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

function XIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function TrashIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  )
}

function EditIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}

function PlusIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

// ── Toggle ─────────────────────────────────────────────────────────────────

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={onChange}
      className={`${styles.toggleTrack} ${
        on ? styles.toggleOn : styles.toggleOff
      } w-11 h-6 rounded-full shrink-0 focus:outline-none focus:ring-2 focus:ring-[var(--color-wine)] focus:ring-offset-2 focus:ring-offset-[var(--color-ink)]`}
    >
      <div
        className={`${styles.toggleHandle} ${
          on ? styles.toggleHandleOn : styles.toggleHandleOff
        } w-[18px] h-[18px] rounded-full top-[3px]`}
      />
      <span className="sr-only">{on ? "On" : "Off"}</span>
    </button>
  )
}

// ── SelectDropdown ─────────────────────────────────────────────────────────

function SelectDropdown({
  value,

  options,

  onChange,

  ariaLabel = "Select option",
}: {
  value: string

  options: string[]

  onChange: (v: string) => void

  ariaLabel?: string
}) {
  return (
    <StreamFlixSelect
      value={value}
      options={options}
      onChange={onChange}
      ariaLabel={ariaLabel}
    />
  )
}

// ── Avatar ─────────────────────────────────────────────────────────────────

function Avatar({
  initials,
  imageUrl,
  size = "sm",
}: {
  initials: string
  imageUrl?: string
  size?: "sm" | "lg"
}) {
  const sizeClass = size === "lg" ? "w-20 h-20 text-2xl" : "w-9 h-9 text-sm"

  return (
    <div
      className={`${sizeClass} relative overflow-hidden bg-[var(--color-wine)] text-[var(--color-cream)] font-display font-bold flex items-center justify-center rounded-sm flex-shrink-0`}
      style={{
        fontFamily: "'Barlow Condensed', sans-serif",

        letterSpacing: "0.05em",
      }}
    >
      {initials}
      {imageUrl && (
        <img
          src={imageUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          onError={(event) => {
            event.currentTarget.style.display = "none"
          }}
        />
      )}
    </div>
  )
}

// ── EditProfileModal ───────────────────────────────────────────────────────

function EditProfileModal({
  profile,
  onClose,
  onSaved,
}: {
  profile: ProfileIdentity
  onClose: () => void
  onSaved: (name: string) => void
}) {
  const [name, setName] = useState(profile.name)
  const [lang, setLang] = useState("English")

  const [maturity, setMaturity] = useState("All Maturity Ratings")

  const [saving, setSaving] = useState(false)

  const [saveError, setSaveError] = useState("")

  const handleSave = async () => {
    setSaveError("")
    let normalizedName: string
    try {
      normalizedName = normalizeProfileName(name)
    } catch (reason) {
      setSaveError(reason instanceof Error ? reason.message : "Enter a valid profile name.")
      return
    }

    setSaving(true)
    const { error } = await supabase.rpc("rename_my_member_profile", {
      selected_profile_id: profile.id,
      selected_profile_name: normalizedName,
    })
    setSaving(false)

    if (error) {
      setSaveError(
        error.code === "23505"
          ? "Another profile already uses this name."
          : error.message || "We couldn't update the profile name.",
      )
      return
    }

    onSaved(normalizedName)
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: "var(--color-ink)" }}
    >
      <div
        className="w-full max-w-md rounded-sm p-7 relative"
        style={{
          background: "var(--color-ink-soft)",

          border: "1px solid var(--color-stone)",
        }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2
            className="text-[var(--color-cream)] font-display font-bold text-xl tracking-wide uppercase"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            Edit Profile
          </h2>
          <button
            onClick={onClose}
            className="text-[var(--color-taupe)] hover:text-[var(--color-cream)] transition-colors p-1"
          >
            <XIcon />
          </button>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <Avatar
            initials={initialsFor(profile.name)}
            imageUrl={profile.avatarUrl}
            size="lg"
          />
          <button
            className="text-sm text-[var(--color-taupe)] hover:text-[var(--color-cream)] border border-[var(--color-stone)] hover:border-[var(--color-taupe)] px-3 py-1.5 rounded-sm transition-colors"
            style={{ fontFamily: "'Barlow', sans-serif" }}
          >
            Change Avatar
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label
              className="block text-xs text-[var(--color-taupe)] mb-1.5 uppercase tracking-wider"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              Profile Name
            </label>
            <input
              value={name}
              maxLength={MAX_PROFILE_NAME_LENGTH}
              disabled={saving}
              onChange={(e) => {
                setName(e.target.value)
                setSaveError("")
              }}
              className="w-full bg-transparent border border-[var(--color-stone)] text-[var(--color-cream)] px-3 py-2 rounded-sm text-sm focus:outline-none focus:border-[var(--color-wine)]"
              style={{ fontFamily: "'Barlow', sans-serif" }}
            />
            <p className="mt-1 text-right text-xs text-[var(--color-taupe)]" aria-live="polite">
              {name.length}/{MAX_PROFILE_NAME_LENGTH}
            </p>
          </div>

          <div>
            <label
              className="block text-xs text-[var(--color-taupe)] mb-1.5 uppercase tracking-wider"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              Default Language
            </label>
            <StreamFlixSelect
              value={lang}
              onChange={setLang}
              ariaLabel="Default language"
              fullWidth
              options={[
                "English",

                "Spanish",

                "French",

                "Japanese",

                "Korean",

                "Portuguese",
              ]}
            />
          </div>

          <div>
            <label
              className="block text-xs text-[var(--color-taupe)] mb-1.5 uppercase tracking-wider"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              Maturity Rating
            </label>
            <StreamFlixSelect
              value={maturity}
              onChange={setMaturity}
              ariaLabel="Maturity rating"
              fullWidth
              options={[
                "All Maturity Ratings",

                "18+",

                "16+",

                "13+",

                "7+",

                "All Ages",
              ]}
            />
          </div>
        </div>

        {saveError && (
          <p role="alert" className="mt-4 text-sm text-[#ff8a8a]">
            {saveError}
          </p>
        )}

        <div className="flex gap-3 mt-7">
          <button
            onClick={onClose}
            disabled={saving}
            className="flex-1 py-2.5 border border-[var(--color-stone)] text-[var(--color-cream)] text-sm rounded-sm hover:border-[var(--color-taupe)] transition-colors"
            style={{ fontFamily: "'Barlow', sans-serif" }}
          >
            Cancel
          </button>
          <button
            onClick={() => void handleSave()}
            disabled={saving || !name.trim() || name.trim() === profile.name}
            className="flex-1 py-2.5 bg-[var(--color-wine)] text-[var(--color-cream)] text-sm rounded-sm hover:bg-[var(--color-ink-soft)] transition-colors"
            style={{ fontFamily: "'Barlow', sans-serif" }}
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── PINModal ───────────────────────────────────────────────────────────────

function PINModal({
  profileId,
  hasPin,

  onClose,

  onSaved,
}: {
  profileId: number

  hasPin: boolean

  onClose: () => void

  onSaved: (hasPin: boolean) => void
}) {
  const [pin, setPin] = useState("")

  const [confirm, setConfirm] = useState("")

  const [saving, setSaving] = useState(false)

  const [error, setError] = useState("")

  async function savePin(selectedPin: string | null) {
    if (saving) return
    setSaving(true)
    setError("")

    const { error: saveError } = await supabase.rpc(
      "set_my_member_profile_pin",
      {
        selected_profile_id: profileId,
        selected_pin: selectedPin,
      },
    )

    if (saveError) {
      setError(saveError.message || "The profile PIN could not be saved.")
      setSaving(false)
      return
    }

    setSaving(false)
    onSaved(selectedPin !== null)
  }

  function handleSave() {
    if (pin.length === 4 && pin === confirm) void savePin(pin)
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: "var(--color-ink)" }}
    >
      <div
        className="w-full max-w-sm rounded-sm p-7 relative"
        style={{
          background: "var(--color-ink-soft)",

          border: "1px solid var(--color-stone)",
        }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2
            className="text-[var(--color-cream)] font-display font-bold text-xl tracking-wide uppercase"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            {hasPin ? "Change PIN" : "Set PIN"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Close profile PIN settings"
            className="text-[var(--color-taupe)] hover:text-[var(--color-cream)] transition-colors p-1"
          >
            <XIcon />
          </button>
        </div>
        <p
          className="text-[var(--color-taupe)] text-sm mb-5"
          style={{ fontFamily: "'Barlow', sans-serif" }}
        >
          Require a PIN to access this profile.
        </p>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="profile-pin"
              className="block text-xs text-[var(--color-taupe)] mb-1.5 uppercase tracking-wider"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              4-Digit PIN
            </label>
            <input
              id="profile-pin"
              type="password"
              inputMode="numeric"
              pattern="[0-9]{4}"
              autoComplete="new-password"
              maxLength={4}
              value={pin}
              onChange={(e) =>
                setPin(e.target.value.replace(/\D/g, "").slice(0, 4))
              }
              placeholder="••••"
              className="w-full bg-transparent border border-[var(--color-stone)] text-[var(--color-cream)] px-3 py-2 rounded-sm text-sm focus:outline-none focus:border-[var(--color-wine)] tracking-[0.4em]"
              style={{ fontFamily: "'Barlow', sans-serif" }}
            />
          </div>
          <div>
            <label
              htmlFor="profile-pin-confirm"
              className="block text-xs text-[var(--color-taupe)] mb-1.5 uppercase tracking-wider"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              Confirm PIN
            </label>
            <input
              id="profile-pin-confirm"
              type="password"
              inputMode="numeric"
              pattern="[0-9]{4}"
              autoComplete="new-password"
              maxLength={4}
              value={confirm}
              onChange={(e) =>
                setConfirm(e.target.value.replace(/\D/g, "").slice(0, 4))
              }
              placeholder="••••"
              className="w-full bg-transparent border border-[var(--color-stone)] text-[var(--color-cream)] px-3 py-2 rounded-sm text-sm focus:outline-none focus:border-[var(--color-wine)] tracking-[0.4em]"
              style={{ fontFamily: "'Barlow', sans-serif" }}
            />
          </div>
        </div>

        {error && (
          <p role="alert" className="text-red-400 text-sm mt-3">
            {error}
          </p>
        )}
        {pin.length === 4 && confirm.length === 4 && pin !== confirm && (
          <p
            className="text-red-400 text-sm mt-3"
            style={{ fontFamily: "'Barlow', sans-serif" }}
          >
            PINs do not match.
          </p>
        )}

        <div className="flex gap-3 mt-7">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex-1 py-2.5 border border-[var(--color-stone)] text-[var(--color-cream)] text-sm rounded-sm hover:border-[var(--color-taupe)] transition-colors"
            style={{ fontFamily: "'Barlow', sans-serif" }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || pin.length !== 4 || confirm.length !== 4 || pin !== confirm}
            className="flex-1 py-2.5 bg-[var(--color-wine)] text-[var(--color-cream)] text-sm rounded-sm hover:bg-[var(--color-ink-soft)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ fontFamily: "'Barlow', sans-serif" }}
          >
            {saving ? "Saving…" : "Save PIN"}
          </button>
        </div>
        {hasPin && (
          <button
            type="button"
            onClick={() => void savePin(null)}
            disabled={saving}
            className="mt-4 w-full py-2 text-sm text-red-300 hover:text-red-200 disabled:opacity-40"
          >
            Remove PIN
          </button>
        )}
      </div>
    </div>
  )
}

// ── WatchHistoryPanel ──────────────────────────────────────────────────────

const HISTORY_ITEMS: {
  id: number

  title: string

  subtitle: string

  date: string

  img: string
}[] = []

function WatchHistoryPanel({ onClose }: { onClose: () => void }) {
  const [items, setItems] = useState(HISTORY_ITEMS)

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: "var(--color-ink)" }}
    >
      <div
        className="w-full max-w-lg rounded-sm p-7 relative"
        style={{
          background: "var(--color-ink-soft)",

          border: "1px solid var(--color-stone)",
        }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2
            className="text-[var(--color-cream)] font-display font-bold text-xl tracking-wide uppercase"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            Watch History
          </h2>
          <button
            onClick={onClose}
            className="text-[var(--color-taupe)] hover:text-[var(--color-cream)] transition-colors p-1"
          >
            <XIcon />
          </button>
        </div>

        <div className="space-y-1 max-h-80 overflow-y-auto">
          {items.length === 0 && (
            <p
              className="text-[var(--color-taupe)] text-sm py-4 text-center"
              style={{ fontFamily: "'Barlow', sans-serif" }}
            >
              No watch history.
            </p>
          )}
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 py-3 group"
              style={{ borderBottom: "1px solid var(--color-stone)" }}
            >
              <img
                src={item.img}
                alt={item.title}
                className="w-20 h-12 object-cover rounded-sm flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p
                  className="text-[var(--color-cream)] text-sm font-medium truncate"
                  style={{ fontFamily: "'Barlow', sans-serif" }}
                >
                  {item.title}
                </p>
                <p
                  className="text-[var(--color-taupe)] text-xs"
                  style={{ fontFamily: "'Barlow', sans-serif" }}
                >
                  {item.subtitle}
                </p>
                <p
                  className="text-[var(--color-stone)] text-xs mt-0.5"
                  style={{ fontFamily: "'Barlow', sans-serif" }}
                >
                  {item.date}
                </p>
              </div>
              <button
                onClick={() =>
                  setItems((prev) => prev.filter((i) => i.id !== item.id))
                }
                className="text-[var(--color-stone)] hover:text-[var(--color-taupe)] transition-colors p-1.5 opacity-0 group-hover:opacity-100 focus:opacity-100"
                aria-label={`Remove ${item.title} from history`}
              >
                <TrashIcon />
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full py-2.5 border border-[var(--color-stone)] text-[var(--color-cream)] text-sm rounded-sm hover:border-[var(--color-taupe)] transition-colors"
          style={{ fontFamily: "'Barlow', sans-serif" }}
        >
          Close
        </button>
      </div>
    </div>
  )
}

// ── ManageProfilesModal ────────────────────────────────────────────────────

const PROFILES: {
  id: number
  initials: string
  name: string
}[] = []

function ManageProfilesModal({ onClose }: { onClose: () => void }) {
  const [profiles, setProfiles] = useState(PROFILES)

  const [adding, setAdding] = useState(false)

  const [newName, setNewName] = useState("")

  function addProfile() {
    if (!newName.trim()) return

    const initials = newName

      .trim()

      .split(" ")

      .map((w) => w[0])

      .join("")

      .toUpperCase()

      .slice(0, 2)

    setProfiles((prev) => [
      ...prev,

      { id: Date.now(), initials, name: newName.trim() },
    ])

    setNewName("")

    setAdding(false)
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: "var(--color-ink)" }}
    >
      <div
        className="w-full max-w-md rounded-sm p-7 relative"
        style={{
          background: "var(--color-ink-soft)",

          border: "1px solid var(--color-stone)",
        }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2
            className="text-[var(--color-cream)] font-display font-bold text-xl tracking-wide uppercase"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            Manage Profiles
          </h2>
          <button
            onClick={onClose}
            className="text-[var(--color-taupe)] hover:text-[var(--color-cream)] transition-colors p-1"
          >
            <XIcon />
          </button>
        </div>

        <div className="space-y-1 mb-4">
          {profiles.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-3 py-2.5 rounded-sm px-2 hover:bg-[var(--color-wine)] transition-colors cursor-pointer"
              style={{ borderBottom: "1px solid var(--color-stone)" }}
            >
              <div
                className="w-9 h-9 bg-[var(--color-wine)] text-[var(--color-cream)] font-bold flex items-center justify-center rounded-sm text-sm flex-shrink-0"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                {p.initials}
              </div>
              <div className="flex-1">
                <p
                  className="text-[var(--color-cream)] text-sm"
                  style={{ fontFamily: "'Barlow', sans-serif" }}
                >
                  {p.name}
                </p>
              </div>
              <button
                className="text-[var(--color-stone)] hover:text-[var(--color-taupe)] transition-colors p-1"
                aria-label={`Edit ${p.name}`}
              >
                <EditIcon />
              </button>
            </div>
          ))}
        </div>

        {adding ? (
          <div className="flex gap-2 mb-4">
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") addProfile()

                if (e.key === "Escape") setAdding(false)
              }}
              placeholder="Profile name"
              className="flex-1 bg-transparent border border-[var(--color-stone)] text-[var(--color-cream)] px-3 py-2 rounded-sm text-sm focus:outline-none focus:border-[var(--color-wine)]"
              style={{ fontFamily: "'Barlow', sans-serif" }}
            />
            <button
              onClick={addProfile}
              className="px-4 py-2 bg-[var(--color-wine)] text-[var(--color-cream)] text-sm rounded-sm hover:bg-[var(--color-ink-soft)] transition-colors"
              style={{ fontFamily: "'Barlow', sans-serif" }}
            >
              Add
            </button>
            <button
              onClick={() => setAdding(false)}
              className="px-4 py-2 border border-[var(--color-stone)] text-[var(--color-cream)] text-sm rounded-sm hover:border-[var(--color-taupe)] transition-colors"
              style={{ fontFamily: "'Barlow', sans-serif" }}
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-2 text-[var(--color-taupe)] hover:text-[var(--color-cream)] text-sm transition-colors mb-4"
            style={{ fontFamily: "'Barlow', sans-serif" }}
          >
            <PlusIcon size={16} /> Add Profile
          </button>
        )}

        <button
          onClick={onClose}
          className="w-full py-2.5 border border-[var(--color-stone)] text-[var(--color-cream)] text-sm rounded-sm hover:border-[var(--color-taupe)] transition-colors"
          style={{ fontFamily: "'Barlow', sans-serif" }}
        >
          Done
        </button>
      </div>
    </div>
  )
}

// ── ContinueWatchingCard ───────────────────────────────────────────────────

interface CardData {
  id: number

  title: string

  img: string

  progress: number
}

function ContinueWatchingCard({
  card,

  onRemove,
}: {
  card: CardData

  onRemove: () => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)

  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setMenuOpen(false)
    }

    if (menuOpen) document.addEventListener("mousedown", handleClick)

    return () => document.removeEventListener("mousedown", handleClick)
  }, [menuOpen])

  return (
    <div
      className={`${styles.cardHover} relative rounded-sm overflow-hidden flex-shrink-0 transition-transform duration-200 cursor-pointer`}
      style={{ width: "clamp(200px, 22vw, 320px)", aspectRatio: "16/9" }}
    >
      <img
        src={card.img}
        alt={card.title}
        className="w-full h-full object-cover"
      />

      {/* Dark gradient overlay at bottom */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to top, var(--color-ink) 0%, var(--color-ink) 50%, transparent 100%)",
        }}
      />

      {/* Hover overlay */}
      <div
        className={`${styles.cardOverlay} absolute inset-0 flex items-center justify-center gap-2 transition-opacity duration-200`}
        style={{ background: "var(--color-ink)" }}
      >
        <button
          className="bg-[var(--color-cream)] text-[var(--color-ink)] rounded-full p-2 hover:bg-[var(--color-taupe)] transition-colors"
          aria-label={`Play ${card.title}`}
        >
          <PlayIcon size={16} />
        </button>
        <button
          className="border border-[var(--color-cream)] text-[var(--color-cream)] rounded-full p-2 hover:border-[var(--color-cream)] transition-colors"
          aria-label={`More info about ${card.title}`}
        >
          <InfoIcon size={16} />
        </button>
      </div>

      {/* Title + progress */}
      <div className="absolute bottom-0 left-0 right-0 px-3 pb-2 pt-6">
        <p
          className="text-[var(--color-cream)] text-sm font-medium mb-2 truncate"
          style={{ fontFamily: "'Barlow', sans-serif" }}
        >
          {card.title}
        </p>
        <div
          className="w-full h-0.5 rounded-full"
          style={{ background: "var(--color-stone)" }}
        >
          <div
            className="h-full rounded-full bg-[var(--color-wine)]"
            style={{ width: `${card.progress}%` }}
          />
        </div>
      </div>

      {/* Three-dot menu */}
      <div className="absolute top-2 right-2" ref={menuRef}>
        <button
          onClick={(e) => {
            e.stopPropagation()

            setMenuOpen((v) => !v)
          }}
          className="text-[var(--color-taupe)] hover:text-[var(--color-cream)] p-1 rounded-sm opacity-0 group-hover:opacity-100 transition-all"
          style={{ background: "var(--color-ink)" }}
          aria-label="More options"
        >
          <MoreVertIcon />
        </button>
        {menuOpen && (
          <div
            className="absolute right-0 top-7 w-48 rounded-sm shadow-xl py-1 z-20"
            style={{
              background: "var(--color-ink-soft)",

              border: "1px solid var(--color-stone)",
            }}
          >
            <button
              onClick={() => {
                setMenuOpen(false)

                onRemove()
              }}
              className="w-full text-left px-4 py-2.5 text-sm text-[var(--color-taupe)] hover:text-[var(--color-cream)] hover:bg-[var(--color-wine)] transition-colors"
              style={{ fontFamily: "'Barlow', sans-serif" }}
            >
              Remove from Continue Watching
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── SettingRow ─────────────────────────────────────────────────────────────

function SettingRow({
  icon,

  label,

  description,

  control,

  last = false,
}: {
  icon: React.ReactNode

  label: string

  description: string

  control: React.ReactNode

  last?: boolean
}) {
  return (
    <div
      className={`flex flex-wrap items-center gap-4 py-4 sm:flex-nowrap ${
        !last ? "border-b border-[var(--color-stone)]" : ""
      }`}
    >
      <div className="text-[var(--color-taupe)] flex-shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <p
          className="text-[var(--color-cream)] text-sm font-medium"
          style={{ fontFamily: "'Barlow', sans-serif" }}
        >
          {label}
        </p>
        <p
          className="text-[var(--color-taupe)] text-xs mt-0.5 leading-relaxed"
          style={{ fontFamily: "'Barlow', sans-serif" }}
        >
          {description}
        </p>
      </div>
      <div className="w-full pl-10 sm:w-auto sm:pl-0 sm:flex-shrink-0">
        {control}
      </div>
    </div>
  )
}

// ── RightPanelRow ──────────────────────────────────────────────────────────

function RightPanelRow({
  icon,

  label,

  description,

  onClick,

  last = false,
}: {
  icon: React.ReactNode

  label: string

  description: string

  onClick: () => void

  last?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${styles.interactiveRow} ${
        !last ? "border-b border-[var(--color-stone)]" : ""
      }`}
    >
      <div className={styles.interactiveRowIcon}>{icon}</div>
      <div className="flex-1 min-w-0">
        <p
          className="text-[var(--color-cream)] text-sm font-medium"
          style={{ fontFamily: "'Barlow', sans-serif" }}
        >
          {label}
        </p>
        <p
          className="text-[var(--color-taupe)] text-xs mt-0.5 leading-relaxed"
          style={{ fontFamily: "'Barlow', sans-serif" }}
        >
          {description}
        </p>
      </div>
      <span className={styles.interactiveRowChevron}>
        <ChevronRightIcon size={16} />
      </span>
    </button>
  )
}

// ── Main App ───────────────────────────────────────────────────────────────

const INITIAL_CARDS: CardData[] = []

export function ProfileView({
  activeProfileId,
}: {
  activeProfileId: number | null
}) {
  const [profileIdentity, setProfileIdentity] =
    useState<ProfileIdentity | null>(null)
  const [identityLoading, setIdentityLoading] = useState(true)
  const [identityError, setIdentityError] = useState("")

  const loadProfileIdentity = useCallback(async () => {
    setIdentityLoading(true)
    setIdentityError("")

    const { data: authData, error: authError } = await supabase.auth.getUser()
    if (authError) throw authError
    if (!authData.user)
      throw new Error("You must be signed in to view this profile.")

    const [profilesResult, accountResult] = await Promise.all([
      supabase.rpc("get_my_member_profiles"),
      supabase
        .from("user")
        .select("joined_at")
        .eq("auth_user_id", authData.user.id)
        .maybeSingle(),
    ])

    if (profilesResult.error) throw profilesResult.error
    if (accountResult.error) throw accountResult.error

    const rows = (profilesResult.data ?? []) as MemberProfileRow[]
    const selectedRow =
      rows.find((row) => Number(row.member_profile_id) === activeProfileId) ??
      rows[0] ??
      null

    if (!selectedRow) {
      setProfileIdentity(null)
      setIdentityLoading(false)
      return
    }

    const avatarPath = selectedRow.avatar_image?.trim() ?? ""
    let avatarUrl = isExternalAvatar(avatarPath) ? avatarPath : ""
    if (avatarPath && !avatarUrl) {
      const { data: avatarData } = await supabase.storage
        .from("avatar")
        .createSignedUrl(avatarPath, 60 * 60)
      avatarUrl = avatarData?.signedUrl ?? ""
    }

    setProfileIdentity({
      id: Number(selectedRow.member_profile_id),
      name: selectedRow.profile_name,
      avatarPath,
      avatarUrl,
      isKids: selectedRow.is_kids,
      hasPin: selectedRow.has_pin,
      displayOrder: selectedRow.display_order,
      joinedAt: accountResult.data?.joined_at
        ? String(accountResult.data.joined_at)
        : null,
    })
    setIdentityLoading(false)
  }, [activeProfileId])

  useEffect(() => {
    void loadProfileIdentity().catch((error: unknown) => {
      setIdentityError(
        error instanceof Error
          ? error.message
          : "Profile identity could not be loaded.",
      )
      setIdentityLoading(false)
    })
  }, [loadProfileIdentity])

  // Settings state
  const [autoplayNext, setAutoplayNext] = useState(true)

  const [autoplayPreviews, setAutoplayPreviews] = useState(false)

  const [subtitle, setSubtitle] = useState("Medium")

  const [maturity, setMaturity] = useState("All Maturity Ratings")

  const [language, setLanguage] = useState("English")

  const [dirty, setDirty] = useState(false)

  const [saved, setSaved] = useState(false)

  // Modals

  const [editOpen, setEditOpen] = useState(false)

  const [pinOpen, setPinOpen] = useState(false)

  const [historyOpen, setHistoryOpen] = useState(false)

  const [manageOpen, setManageOpen] = useState(false)

  // Cards

  const [cards, setCards] = useState(INITIAL_CARDS)

  function markDirty() {
    setDirty(true)

    setSaved(false)
  }

  function handleSave() {
    setDirty(false)

    setSaved(true)

    setTimeout(() => setSaved(false), 3000)
  }

  const joinedYear = profileIdentity?.joinedAt
    ? new Date(profileIdentity.joinedAt).getFullYear()
    : null
  const memberSinceYear =
    joinedYear && Number.isFinite(joinedYear) ? joinedYear : null

  return (
    <div className={`min-h-screen ${styles.page}`}>
      {/* Modals */}
      {editOpen && profileIdentity && (
        <EditProfileModal
          profile={profileIdentity}
          onClose={() => setEditOpen(false)}
          onSaved={(name) => {
            setProfileIdentity((current) =>
              current ? { ...current, name } : current,
            )
            window.dispatchEvent(
              new CustomEvent("streamflix:profile-updated", {
                detail: { profileId: profileIdentity.id, name },
              }),
            )
            setEditOpen(false)
          }}
        />
      )}
      {pinOpen && profileIdentity && (
        <PINModal
          profileId={profileIdentity.id}
          hasPin={profileIdentity.hasPin}
          onClose={() => setPinOpen(false)}
          onSaved={(hasPin) => {
            setProfileIdentity((current) =>
              current ? { ...current, hasPin } : current,
            )
            setPinOpen(false)
          }}
        />
      )}
      {historyOpen && (
        <WatchHistoryPanel onClose={() => setHistoryOpen(false)} />
      )}
      {manageOpen && (
        <ManageProfilesModal onClose={() => setManageOpen(false)} />
      )}

      {/* Page content */}
      <div className="max-w-7xl mx-auto px-6 md:px-10 pt-4 md:pt-6">
        <div className="pb-10">
          {/* Page heading */}
          <h1
            className="text-[var(--color-cream)] font-display font-bold text-4xl tracking-wide uppercase mb-8"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            Profile
          </h1>

          {/* Profile identity */}
          {identityError && (
            <p role="alert" className="mb-5 text-sm text-[#ff8a8a]">
              {identityError}
            </p>
          )}
          <div
            className="flex flex-wrap items-center gap-5 mb-10"
            aria-busy={identityLoading}
          >
            <Avatar
              initials={
                profileIdentity ? initialsFor(profileIdentity.name) : "SF"
              }
              imageUrl={profileIdentity?.avatarUrl}
              size="lg"
            />
            <div className="flex-1 min-w-0">
              <h2
                className="text-[var(--color-cream)] font-display font-bold text-2xl tracking-wide"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                {identityLoading
                  ? "Loading profile…"
                  : profileIdentity?.name || "No active profile"}
              </h2>
              <p
                className="text-[var(--color-taupe)] text-sm mt-0.5"
                style={{ fontFamily: "'Barlow', sans-serif" }}
              >
                {profileIdentity
                  ? profileIdentity.isKids
                    ? "Kids profile"
                    : `Profile ${profileIdentity.displayOrder}`
                  : "Profile details unavailable"}
              </p>
              <p
                className="text-[var(--color-stone)] text-xs mt-0.5"
                style={{ fontFamily: "'Barlow', sans-serif" }}
              >
                {memberSinceYear
                  ? `Member since ${memberSinceYear}`
                  : "Membership date unavailable"}
              </p>
            </div>
            <button
            type="button"
            onClick={() => setEditOpen(true)}
            disabled={!profileIdentity || identityLoading}
              className="px-5 py-2 border border-[var(--color-stone)] text-[var(--color-cream)] text-sm rounded-sm hover:border-[var(--color-taupe)] hover:bg-[var(--color-wine)] transition-all"
              style={{ fontFamily: "'Barlow', sans-serif" }}
            >
              Edit Profile
            </button>
          </div>

          {/* Divider */}
          <div className="w-full h-px bg-[var(--color-stone)] mb-8" />

          {/* Two-column settings layout */}
          <div className="flex flex-col lg:flex-row gap-0">
            {/* LEFT: Playback & Display (~2/3) */}
            <div className="flex-1 lg:flex-[2] pr-0 lg:pr-10">
              <h3
                className="text-[var(--color-cream)] font-display font-semibold text-xl tracking-wide uppercase mb-2"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                Playback &amp; Display
              </h3>

              <SettingRow
                icon={<PlayCircleIcon />}
                label="Autoplay Next Episode"
                description="Automatically play the next episode of a series."
                control={
                  <Toggle
                    on={autoplayNext}
                    onChange={() => {
                      setAutoplayNext((v) => !v)

                      markDirty()
                    }}
                  />
                }
              />
              <SettingRow
                icon={<FilmIcon />}
                label="Autoplay Previews"
                description="Automatically play previews while browsing."
                control={
                  <Toggle
                    on={autoplayPreviews}
                    onChange={() => {
                      setAutoplayPreviews((v) => !v)

                      markDirty()
                    }}
                  />
                }
              />
              <SettingRow
                icon={<SubtitleIcon />}
                label="Subtitle Appearance"
                description="Customize the appearance of subtitles."
                control={
                  <SelectDropdown
                    value={subtitle}
                    ariaLabel="Subtitle appearance"
                    options={["Small", "Medium", "Large"]}
                    onChange={(v) => {
                      setSubtitle(v)

                      markDirty()
                    }}
                  />
                }
              />
              <SettingRow
                icon={<ShieldIcon />}
                label="Maturity Rating"
                description="Show titles of all maturity ratings for this profile."
                control={
                  <SelectDropdown
                    value={maturity}
                    ariaLabel="Maturity rating"
                    options={[
                      "All Maturity Ratings",

                      "18+",

                      "16+",

                      "13+",

                      "7+",

                      "All Ages",
                    ]}
                    onChange={(v) => {
                      setMaturity(v)

                      markDirty()
                    }}
                  />
                }
              />
              <SettingRow
                icon={<GlobeIcon />}
                label="Default Language"
                description="Select the default language for audio and subtitles."
                control={
                  <SelectDropdown
                    value={language}
                    ariaLabel="Default language"
                    options={[
                      "English",

                      "Spanish",

                      "French",

                      "Japanese",

                      "Korean",

                      "Portuguese",
                    ]}
                    onChange={(v) => {
                      setLanguage(v)

                      markDirty()
                    }}
                  />
                }
                last
              />

              {/* Save Changes */}
              <div className="mt-6 flex items-center gap-4">
                <button
                  onClick={handleSave}
                  disabled={!dirty}
                  className="px-6 py-2.5 bg-[var(--color-wine)] text-[var(--color-cream)] text-sm rounded-sm hover:bg-[var(--color-ink-soft)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-wine)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-ink)]"
                  style={{ fontFamily: "'Barlow', sans-serif" }}
                >
                  Save Changes
                </button>
                {saved && (
                  <p
                    className="text-[var(--color-taupe)] text-sm"
                    style={{ fontFamily: "'Barlow', sans-serif" }}
                  >
                    Profile settings saved.
                  </p>
                )}
              </div>
            </div>

            {/* Vertical divider */}
            <div className="hidden lg:block w-px bg-[var(--color-stone)] mx-2 self-stretch" />
            <div className="block lg:hidden h-px bg-[var(--color-stone)] my-8" />

            {/* RIGHT: Viewing Activity + Profile Lock (~1/3) */}
            <div className="lg:flex-[1] lg:pl-10">
              {/* Viewing Activity */}
              <div className="mb-8">
                <h3
                  className="text-[var(--color-cream)] font-display font-semibold text-xl tracking-wide uppercase mb-2"
                  style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                  }}
                >
                  Viewing Activity
                </h3>
                <RightPanelRow
                  icon={<ClockIcon />}
                  label="Watch History"
                  description="Review the movies and episodes you have watched."
                  onClick={() => setHistoryOpen(true)}
                  last
                />
              </div>

              {/* Profile Lock */}
              <div>
                <h3
                  className="text-[var(--color-cream)] font-display font-semibold text-xl tracking-wide uppercase mb-2"
                  style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                  }}
                >
                  Profile Lock
                </h3>
                <RightPanelRow
                  icon={<LockIcon />}
                  label={profileIdentity?.hasPin ? "Change PIN" : "Set PIN"}
                  description="Require a PIN to access this profile."
                  onClick={() => setPinOpen(true)}
                  last
                />
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="w-full h-px bg-[var(--color-stone)] mt-10 mb-8" />

          {/* Continue Watching */}
          {cards.length > 0 && (
            <div className="pb-12">
              <h3
                className="text-[var(--color-cream)] font-display font-bold text-2xl tracking-wide uppercase mb-5"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                Continue Watching
              </h3>
              <div
                className="flex gap-4 overflow-x-auto pb-2"
                style={{ scrollbarWidth: "none" }}
              >
                {cards.map((card) => (
                  <ContinueWatchingCard
                    key={card.id}
                    card={card}
                    onRemove={() =>
                      setCards((prev) => prev.filter((c) => c.id !== card.id))
                    }
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
