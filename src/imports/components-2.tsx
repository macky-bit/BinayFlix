import { useState, useRef } from "react"
import type { Show } from "../movie/types"
import styles from "./dashboard.module.css"
import { useMyList } from "./myList/myListStore"

// ─── Logo ─────────────────────────────────────────────────────────────────────

export const LOGO_SVG = (
  <svg
    viewBox="0 0 111.81 30"
    className="h-6 w-auto fill-[var(--color-red)]"
    aria-label="StreamFlix"
  >
    <path d="M0.66 22.02V20.82H3.78V22.26Q3.78 24.3 5.49 24.3Q6.33 24.3 6.765 23.805Q7.2 23.31 7.2 22.2Q7.2 20.88 6.6 19.875Q6.0 18.87 4.38 17.46Q2.34 15.66 1.53 14.205Q0.72 12.75 0.72 10.92Q0.72 8.43 1.98 7.065Q3.24 5.7 5.64 5.7Q8.01 5.7 9.225 7.065Q10.44 8.43 10.44 10.98V11.85H7.32V10.77Q7.32 9.69 6.9 9.195Q6.48 8.7 5.67 8.7Q4.02 8.7 4.02 10.71Q4.02 11.85 4.635 12.84Q5.25 13.83 6.87 15.24Q8.94 17.04 9.72 18.51Q10.5 19.98 10.5 21.96Q10.5 24.54 9.225 25.92Q7.95 27.3 5.52 27.3Q3.12 27.3 1.89 25.935Q0.66 24.57 0.66 22.02Z M14.97 9.0H11.52V6.0H21.72V9.0H18.27V27.0H14.97Z M23.31 6.0H28.2Q30.75 6.0 31.92 7.185Q33.09 8.37 33.09 10.83V12.12Q33.09 15.39 30.93 16.26V16.32Q32.13 16.68 32.625 17.79Q33.12 18.9 33.12 20.76V24.45Q33.12 25.35 33.18 25.905Q33.24 26.46 33.48 27.0H30.12Q29.94 26.49 29.88 26.04Q29.82 25.59 29.82 24.42V20.58Q29.82 19.14 29.355 18.57Q28.89 18.0 27.75 18.0H26.61V27.0H23.31ZM27.81 15.0Q28.8 15.0 29.295 14.49Q29.79 13.98 29.79 12.78V11.16Q29.79 10.02 29.385 9.51Q28.98 9.0 28.11 9.0H26.61V15.0Z M35.4 6.0H44.4V9.0H38.7V14.55H43.23V17.55H38.7V24.0H44.4V27.0H35.4Z M48.84 6.0H53.31L56.73 27.0H53.43L52.83 22.83V22.89H49.08L48.48 27.0H45.42ZM52.44 20.04 50.97 9.66H50.91L49.47 20.04Z M58.32 6.0H63.03L65.13 21.03H65.19L67.29 6.0H72.0V27.0H68.88V11.1H68.82L66.42 27.0H63.66L61.26 11.1H61.2V27.0H58.32Z M74.46 6.0H83.19V9.0H77.76V14.85H82.02V17.85H77.76V27.0H74.46Z M84.78 6.0H88.08V24.0H93.51V27.0H84.78Z M95.1 6.0H98.4V27.0H95.1Z M103.77 16.26 100.14 6.0H103.62L105.84 12.78H105.9L108.18 6.0H111.3L107.67 16.26L111.48 27.0H108.0L105.6 19.68H105.54L103.08 27.0H99.96Z" />
  </svg>
)

// ─── Icons ────────────────────────────────────────────────────────────────────

export function PlayIcon({
  size = 16,
  color = "var(--color-cream)",
}: {
  size?: number
  color?: string
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill={color}>
      <polygon points="3,2 13,8 3,14" />
    </svg>
  )
}

function CirclePlayIcon({
  size = 18,
  color = "#7C3AED",
}: {
  size?: number
  color?: string
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="11" fill={color} />
      <polygon points="10,8 17,12 10,16" fill="white" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

function BellIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  )
}

function ChevronDown() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

function InfoIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="11" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  )
}

function MoreDotsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="5" r="1.5" />
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="12" cy="19" r="1.5" />
    </svg>
  )
}

function MuteIcon({ muted }: { muted: boolean }) {
  return muted ? (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <line x1="23" y1="9" x2="17" y2="15" />
      <line x1="17" y1="9" x2="23" y2="15" />
    </svg>
  ) : (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
  )
}

// ─── Movie card (portrait 2:3) ─────────────────────────────────────────────

export function MovieCard({
  show,
  showProgress,
  onPlay,
  onInfo,
}: {
  show: Show & { progress?: number }
  showProgress?: boolean
  onPlay?: (show: Show) => void
  onInfo?: (show: Show) => void
}) {
  const [hovered, setHovered] = useState(false)
  const { isSaved, toggle } = useMyList()
  const mediaType = show.mediaType ?? "movie"
  const inList = isSaved(show.id, mediaType)

  return (
    <div
      className="relative shrink-0 rounded-xl overflow-hidden cursor-pointer w-[120px] sm:w-[140px] md:w-[160px]"
      style={{
        aspectRatio: "2/3",
        transform: hovered ? "scale(1.06)" : "scale(1)",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
        boxShadow: hovered ? "0 8px 32px rgba(0,0,0,0.6)" : "none",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onInfo?.(show)}
    >
      <img
        src={show.image}
        alt={show.title}
        className="w-full h-full object-cover"
        style={{ transition: "transform 0.3s ease" }}
      />

      {showProgress && show.progress !== undefined && (
        <div
          className={`absolute bottom-0 left-0 right-0 h-1 ${styles.progressTrack}`}
        >
          <div
            className={`h-full rounded-full ${styles.progressFill}`}
            style={{ width: `${show.progress}%` }}
          />
        </div>
      )}

      {hovered && (
        <div
          className={`absolute inset-0 flex flex-col justify-end p-3 ${styles.cardOverlay}`}
        >
          <p
            className={`text-xs font-bold leading-tight mb-1 line-clamp-2 ${styles.cardTitle}`}
          >
            {show.title}
          </p>
          <div className="flex items-center gap-1.5 mb-2 flex-wrap">
            {typeof show.match === "number" && (
              <span className={`text-[10px] font-bold ${styles.cardMatch}`}>
                {show.match}%
              </span>
            )}
            <span className={`text-[10px] ${styles.cardMeta}`}>
              {show.year}
            </span>
            <span
              className={`text-[10px] px-1 border rounded ${styles.cardBadge}`}
            >
              {show.rating}
            </span>
          </div>
          <div className="flex gap-1.5">
            <button
              className={`flex items-center justify-center rounded-full w-7 h-7 transition-colors ${styles.playBtn}`}
              aria-label="Play"
              onClick={(e) => {
                e.stopPropagation()
                onPlay?.(show)
              }}
            >
              <PlayIcon size={10} color="var(--color-ink)" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggle(show.id, mediaType)
              }}
              className={`flex items-center justify-center rounded-full w-7 h-7 border transition-colors ${
                inList ? styles.listBtnActive : styles.listBtnInactive
              }`}
              aria-label={inList ? "Remove from list" : "Add to list"}
            >
              <span className="text-xs leading-none">{inList ? "✓" : "+"}</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onInfo?.(show)
              }}
              className={`flex items-center justify-center rounded-full w-7 h-7 border transition-colors ${styles.infoBtn}`}
              aria-label="More info"
            >
              <InfoIcon />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Trending Card (landscape with persistent metadata + action buttons) ────

export function TrendingCard({
  show,
  onPlay,
  onInfo,
}: {
  show: Show
  onPlay?: (show: Show) => void
  onInfo?: (show: Show) => void
}) {
  const [hovered, setHovered] = useState(false)
  const { isSaved, toggle } = useMyList()
  const mediaType = show.mediaType ?? "movie"
  const inList = isSaved(show.id, mediaType)

  return (
    <div
      className={`relative shrink-0 rounded-xl overflow-hidden cursor-pointer ${styles.trendingCard}`}
      style={{
        transform: hovered ? "scale(1.04)" : "scale(1)",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
        boxShadow: hovered ? "0 8px 32px rgba(0,0,0,0.7)" : "none",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onInfo?.(show)}
    >
      {/* thumbnail */}
      <div className="relative w-full" style={{ aspectRatio: "16/10" }}>
        <img
          src={show.image}
          alt={show.title}
          className="w-full h-full object-cover"
        />
        <div className={`absolute inset-0 ${styles.trendingCardImgGradient}`} />

        {/* centered play circle on hover */}
        {hovered && (
          <button
            className="absolute inset-0 flex items-center justify-center"
            onClick={(e) => {
              e.stopPropagation()
              onPlay?.(show)
            }}
            aria-label="Play"
          >
            <div
              className={`w-11 h-11 rounded-full flex items-center justify-center ${styles.trendingPlayOverlay}`}
            >
              <PlayIcon size={15} color="#fff" />
            </div>
          </button>
        )}
      </div>

      {/* metadata always visible */}
      <div className={`px-2.5 pt-2 pb-2.5 ${styles.trendingMeta}`}>
        {/* title row */}
        <div className="flex items-start justify-between gap-1 mb-1">
          <p className="text-[13px] font-semibold text-white leading-snug line-clamp-1 flex-1">
            {show.title}
          </p>
          <button
            className={`shrink-0 w-6 h-6 flex items-center justify-center rounded-full transition-colors ${styles.trendingMoreBtnInline}`}
            onClick={(e) => e.stopPropagation()}
            aria-label="More options"
          >
            <MoreDotsIcon />
          </button>
        </div>

        {/* match + year */}
        <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
          {typeof show.match === "number" && (
            <span
              className="text-[11px] font-bold"
              style={{ color: "#3BE477" }}
            >
              {show.match}% Match
            </span>
          )}
          <span className="text-[11px]" style={{ color: "#9CA3AF" }}>
            • {show.year}
          </span>
        </div>

        {/* genre pill + action buttons */}
        <div className="flex items-center justify-between gap-2">
          {show.genres?.[0] ? (
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-medium ${styles.trendingGenrePill}`}
            >
              {show.genres[0]}
            </span>
          ) : (
            <span />
          )}

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Play */}
            <button
              className={`w-7 h-7 flex items-center justify-center rounded-full transition-colors ${styles.playBtn}`}
              aria-label="Play"
              onClick={(e) => {
                e.stopPropagation()
                onPlay?.(show)
              }}
            >
              <PlayIcon size={10} color="#0A0A0F" />
            </button>
            {/* Add / Remove from list */}
            <button
              className={`w-7 h-7 flex items-center justify-center rounded-full border text-xs font-bold transition-colors ${
                inList ? styles.listBtnActive : styles.listBtnInactive
              }`}
              aria-label={inList ? "Remove from list" : "Add to list"}
              onClick={(e) => {
                e.stopPropagation()
                toggle(show.id, mediaType)
              }}
            >
              {inList ? "✓" : "+"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Continue Watching Card ───────────────────────────────────────────────────

export function ContinueWatchingCard({
  show,
  onPlay,
  onInfo,
}: {
  show: Show & { progress: number; episodeLabel?: string }
  onPlay?: (show: Show) => void
  onInfo?: (show: Show) => void
}) {
  const [hovered, setHovered] = useState(false)
  const { isSaved, toggle } = useMyList()
  const mediaType = show.mediaType ?? "movie"
  const inList = isSaved(show.id, mediaType)

  return (
    <div
      className={`relative shrink-0 rounded-xl overflow-hidden cursor-pointer ${styles.continueCard}`}
      style={{
        transform: hovered ? "scale(1.03)" : "scale(1)",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
        boxShadow: hovered ? "0 8px 32px rgba(0,0,0,0.7)" : "none",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onInfo?.(show)}
    >
      {/* thumbnail */}
      <div className="relative w-full" style={{ aspectRatio: "16/9" }}>
        <img
          src={show.hero ?? show.image}
          alt={show.title}
          className="w-full h-full object-cover"
        />
        <div className={`absolute inset-0 ${styles.continueImgGradient}`} />

        {/* play overlay */}
        <button
          className="absolute inset-0 flex items-center justify-center"
          onClick={(e) => {
            e.stopPropagation()
            onPlay?.(show)
          }}
          aria-label="Play"
        >
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform ${styles.continuePlayCircle} ${
              hovered ? "scale-110" : ""
            }`}
          >
            <PlayIcon size={14} color="#fff" />
          </div>
        </button>

        {/* more options */}
        <button
          className={`absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-full opacity-0 transition-opacity ${styles.trendingMoreBtn} ${
            hovered ? "opacity-100" : ""
          }`}
          onClick={(e) => e.stopPropagation()}
          aria-label="More options"
        >
          <MoreDotsIcon />
        </button>
      </div>

      {/* bottom bar: title, episode, progress, actions */}
      <div className={`px-2.5 pt-2 pb-2.5 ${styles.continueMeta}`}>
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-white leading-tight truncate">
              {show.title}
            </p>
            {"episodeLabel" in show && show.episodeLabel && (
              <p className="text-[10px] mt-0.5" style={{ color: "#9CA3AF" }}>
                {show.episodeLabel}
              </p>
            )}
          </div>
          {/* action buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              className={`w-7 h-7 flex items-center justify-center rounded-full transition-colors ${styles.playBtn}`}
              aria-label="Play"
              onClick={(e) => {
                e.stopPropagation()
                onPlay?.(show)
              }}
            >
              <PlayIcon size={10} color="#0A0A0F" />
            </button>
            <button
              className={`w-7 h-7 flex items-center justify-center rounded-full border text-xs font-bold transition-colors ${
                inList ? styles.listBtnActive : styles.listBtnInactive
              }`}
              aria-label={inList ? "Remove from list" : "Add to list"}
              onClick={(e) => {
                e.stopPropagation()
                toggle(show.id, mediaType)
              }}
            >
              {inList ? "✓" : "+"}
            </button>
          </div>
        </div>
        {/* progress bar */}
        <div className="flex items-center gap-2">
          <div
            className="flex-1 h-1 rounded-full overflow-hidden"
            style={{ background: "rgba(255,255,255,0.15)" }}
          >
            <div
              className="h-full rounded-full"
              style={{ width: `${show.progress}%`, background: "#7C3AED" }}
            />
          </div>
          <span className="text-[10px] shrink-0" style={{ color: "#9CA3AF" }}>
            {show.progress}%
          </span>
        </div>
      </div>
    </div>
  )
}

// ─── Top-10 Card ──────────────────────────────────────────────────────────────

export function Top10Card({
  show,
  rank,
  onInfo,
}: {
  show: Show
  rank: number
  onInfo?: (show: Show) => void
}) {
  return (
    <div
      className="relative shrink-0 flex items-end cursor-pointer w-[140px] sm:w-[160px]"
      onClick={() => onInfo?.(show)}
    >
      <span
        className={`absolute left-0 bottom-0 z-10 leading-none select-none ${styles.rankNumber}`}
        style={{ bottom: -8, left: -10 }}
      >
        {rank}
      </span>
      <div
        className="relative z-20 ml-10 rounded-xl overflow-hidden w-[100px] sm:w-[120px]"
        style={{ aspectRatio: "2/3" }}
      >
        <img
          src={show.image}
          alt={show.title}
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  )
}

// ─── Carousel Row ─────────────────────────────────────────────────────────────

export function CarouselRow({
  title,
  shows,
  exploreAll,
  showProgress,
  top10,
  variant = "portrait",
  onPlay,
  onInfo,
}: {
  title: string
  shows: (Show & { progress?: number })[]
  exploreAll?: boolean
  showProgress?: boolean
  top10?: boolean
  variant?: "portrait" | "trending" | "continue"
  onPlay?: (show: Show) => void
  onInfo?: (show: Show) => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  if (shows.length === 0) return null

  const scroll = (dir: "left" | "right") => {
    if (!ref.current) return
    ref.current.scrollBy({
      left: dir === "right" ? 600 : -600,
      behavior: "smooth",
    })
  }

  return (
    <section className="px-4 sm:px-10 xl:px-12">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <CirclePlayIcon size={20} />
          <h2 className={`text-base font-bold ${styles.rowTitle}`}>{title}</h2>
        </div>
        {(exploreAll || true) && (
          <button
            className={`text-xs font-medium flex items-center gap-1 ${styles.seeAllBtn}`}
          >
            See All <span className="text-[13px] leading-none">›</span>
          </button>
        )}
      </div>

      <div className="relative group">
        <button
          onClick={() => scroll("left")}
          className={`hidden sm:flex absolute left-0 top-0 bottom-0 z-10 w-12 items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ${styles.scrollFadeLeft}`}
          aria-label="Scroll left"
        >
          <span className={styles.scrollArrow}>‹</span>
        </button>

        <div
          ref={ref}
          className={`flex gap-3 overflow-x-auto pb-2 ${styles.noScrollbar}`}
        >
          {shows.map((show, i) =>
            top10 ? (
              <Top10Card
                key={show.id}
                show={show}
                rank={i + 1}
                onInfo={onInfo}
              />
            ) : variant === "continue" ? (
              <ContinueWatchingCard
                key={show.id}
                show={{ ...show, progress: show.progress ?? 50 }}
                onPlay={onPlay}
                onInfo={onInfo}
              />
            ) : (
              <TrendingCard
                key={show.id}
                show={show}
                onPlay={onPlay}
                onInfo={onInfo}
              />
            ),
          )}
        </div>

        <button
          onClick={() => scroll("right")}
          className={`hidden sm:flex absolute right-0 top-0 bottom-0 z-10 w-12 items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ${styles.scrollFadeRight}`}
          aria-label="Scroll right"
        >
          <span className={styles.scrollArrow}>›</span>
        </button>
      </div>
    </section>
  )
}

// ─── Nav ──────────────────────────────────────────────────────────────────────

const NAV_LINKS = ["Home", "TV Shows", "Movies", "New & Popular", "My List"]

export type DashboardView = "home" | "tvShows" | "movies" | "newAndPopular" | "myList"

const VIEW_BY_LINK: Record<string, DashboardView | null> = {
  Home: "home",
  "TV Shows": "tvShows",
  Movies: "movies",
  "New & Popular": "newAndPopular",
  "My List": "myList",
}

export function Navbar({
  onSignOut,
  searchOpen,
  setSearchOpen,
  onNavigatePage,
  onNavigateView,
  activeView,
}: {
  onSignOut: () => void
  searchOpen: boolean
  setSearchOpen: (v: boolean) => void
  onNavigatePage?: (page: "account" | "profile" | "help") => void
  onNavigateView?: (view: DashboardView) => void
  activeView: DashboardView
}) {
  const [profileOpen, setProfileOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  const navigateLink = (link: string) => {
    const target = VIEW_BY_LINK[link]
    if (target) onNavigateView?.(target)
  }

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 flex items-center gap-4 sm:gap-6 px-4 sm:px-10 xl:px-12 h-14 ${styles.header}`}
    >
      <button
        className="md:hidden flex flex-col justify-center gap-1 w-6 h-6"
        onClick={() => setMobileNavOpen((v) => !v)}
        aria-label="Menu"
      >
        <span className={`block h-0.5 w-full ${styles.hamburgerBar}`} />
        <span className={`block h-0.5 w-full ${styles.hamburgerBar}`} />
        <span className={`block h-0.5 w-full ${styles.hamburgerBar}`} />
      </button>

      <div className="shrink-0 mr-2">{LOGO_SVG}</div>

      <nav className="hidden md:flex items-center gap-5">
        {NAV_LINKS.map((link) => (
          <button
            key={link}
            className={`text-sm transition-colors whitespace-nowrap ${styles.navLink} ${
              VIEW_BY_LINK[link] === activeView
                ? styles.navLinkActive
                : styles.navLinkInactive
            }`}
            onClick={() => navigateLink(link)}
          >
            {link}
          </button>
        ))}
      </nav>

      {mobileNavOpen && (
        <nav
          className={`md:hidden absolute top-14 left-0 right-0 flex flex-col py-2 ${styles.mobileNav}`}
        >
          {NAV_LINKS.map((link) => (
            <button
              key={link}
              className={`text-left px-4 py-2.5 text-sm ${
                VIEW_BY_LINK[link] === activeView
                  ? styles.mobileNavLinkActive
                  : styles.mobileNavLinkInactive
              }`}
              onClick={() => {
                setMobileNavOpen(false)
                navigateLink(link)
              }}
            >
              {link}
            </button>
          ))}
        </nav>
      )}

      <div className="flex-1" />

      <div className="flex items-center gap-3 sm:gap-4">
        {searchOpen ? (
          <input
            autoFocus
            placeholder="Search movies, shows, genres..."
            className={`w-32 sm:w-56 px-3 py-1.5 text-sm rounded-lg outline-none ${styles.searchInput}`}
            onBlur={() => setSearchOpen(false)}
          />
        ) : (
          <button
            onClick={() => setSearchOpen(true)}
            className={`transition-colors ${styles.iconBtn}`}
            aria-label="Search"
          >
            <SearchIcon />
          </button>
        )}

        <div className="relative">
          <button
            onClick={() => {
              setNotifOpen((n) => !n)
              setProfileOpen(false)
            }}
            className={`relative transition-colors ${styles.iconBtn}`}
            aria-label="Notifications"
          >
            <BellIcon />
          </button>
          {notifOpen && (
            <div
              className={`absolute right-0 top-8 w-64 sm:w-72 rounded-xl overflow-hidden shadow-2xl ${styles.dropdown}`}
            >
              <div className={`px-4 py-4 ${styles.notifRow}`}>
                <span className={`text-xs ${styles.notifDesc}`}>
                  No new notifications.
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => {
              setProfileOpen((p) => !p)
              setNotifOpen(false)
            }}
            className="flex items-center gap-1.5"
            aria-label="Profile"
          >
            <span
              className={`w-7 h-7 rounded flex items-center justify-center text-xs font-bold ${styles.avatarBadge}`}
            >
              A
            </span>
            <span className={`hidden sm:inline ${styles.iconBtn}`}>
              <ChevronDown />
            </span>
          </button>
          {profileOpen && (
            <div
              className={`absolute right-0 top-9 w-44 rounded-xl overflow-hidden shadow-2xl ${styles.dropdown}`}
            >
              {["Profile", "Account", "Settings", "Help Center"].map((item) => (
                <button
                  key={item}
                  onClick={() => {
                    setProfileOpen(false)
                    if (item === "Profile") onNavigatePage?.("profile")
                    if (item === "Account" || item === "Settings")
                      onNavigatePage?.("account")
                    if (item === "Help Center") onNavigatePage?.("help")
                  }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-[var(--color-wine)]/30 ${styles.dropdownItem}`}
                >
                  {item}
                </button>
              ))}
              <div className={`border-t ${styles.dropdownDivider}`} />
              <button
                onClick={onSignOut}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-[var(--color-wine)]/30 ${styles.dropdownItemMuted}`}
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

export function Hero({
  show,
  onWatch,
  onInfo,
}: {
  show: Show
  onWatch: (show: Show) => void
  onInfo: (show: Show) => void
}) {
  const [muted, setMuted] = useState(true)
  const bg = show.hero ?? show.image
  const genreTag = show.genres?.[0] ?? "Drama"

  return (
    <section
      className="relative w-full"
      style={{ height: "53vh", minHeight: 280 }}
    >
      <img
        src={bg}
        alt=""
        aria-hidden
        className="absolute inset-0 w-full h-full object-cover object-top"
      />
      <div className={`absolute inset-0 ${styles.heroDim}`} />
      <div className={`absolute inset-0 ${styles.heroGradientRight}`} />
      <div className={`absolute inset-0 ${styles.heroGradientTop}`} />

      <div className="absolute bottom-16 sm:bottom-20 left-4 sm:left-10 xl:left-12 right-4 sm:right-auto max-w-[540px]">
        {/* Genre tag replaces "StreamFlix Original" */}
        <p className={`text-[11px] font-semibold mb-3 ${styles.heroEyebrow}`}>
          {genreTag}
        </p>
        <h1
          className={`text-3xl sm:text-5xl xl:text-6xl uppercase leading-none mb-4 ${styles.heroTitle}`}
        >
          {show.title}
        </h1>
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          {typeof show.match === "number" && (
            <span className={`text-sm font-bold ${styles.heroMatch}`}>
              {show.match}% Match
            </span>
          )}
          <span className={`text-sm ${styles.heroMeta}`}>{show.year}</span>
          <span
            className={`text-xs px-1.5 py-0.5 border rounded ${styles.heroBadge}`}
          >
            {show.rating}
          </span>
        </div>
        <p
          className={`text-sm leading-relaxed mb-6 line-clamp-3 sm:line-clamp-4 ${styles.heroDescription}`}
        >
          {show.description || "No description available."}
        </p>
        <div className="flex gap-3">
          <button
            className={`flex items-center gap-2 px-6 sm:px-8 py-3 text-sm font-bold transition-all duration-150 active:scale-[0.98] ${styles.heroPlayBtn}`}
            onClick={() => onWatch(show)}
          >
            <PlayIcon size={14} color="var(--color-ink)" />
            Play
          </button>
          <button
            className={`flex items-center gap-2 px-6 sm:px-8 py-3 text-sm font-bold transition-all duration-150 active:scale-[0.98] ${styles.heroInfoBtn}`}
            onClick={() => onInfo(show)}
          >
            <span className="text-base leading-none">ⓘ</span>
            More Info
          </button>
        </div>
      </div>

      <div className="absolute bottom-20 right-4 sm:right-10 xl:right-12 flex flex-col items-end gap-3">
        <button
          onClick={() => setMuted((m) => !m)}
          className={`w-9 h-9 flex items-center justify-center transition-colors ${styles.heroMuteBtn}`}
          aria-label={muted ? "Unmute" : "Mute"}
        >
          <MuteIcon muted={muted} />
        </button>
        <span
          className={`px-2 py-0.5 text-xs font-bold ${styles.heroRatingBadge}`}
        >
          {show.rating}
        </span>
      </div>
    </section>
  )
}

// ─── Genre Filters ────────────────────────────────────────────────────────────

export const GENRES = ["All", "Action", "Drama", "Sci-Fi", "Horror", "Comedy"]

export function GenreFilters({
  active,
  setActive,
  genres = GENRES,
}: {
  active: string
  setActive: (g: string) => void
  genres?: string[]
}) {
  return (
    <div className="flex items-center gap-2 px-4 sm:px-10 xl:px-12 py-4 flex-wrap">
      <span className={`text-sm font-semibold mr-1 ${styles.genresLabel}`}>
        Genres
      </span>
      {genres.map((g) => (
        <button
          key={g}
          onClick={() => setActive(g)}
          className={`px-4 py-1.5 rounded-full text-sm transition-all duration-150 ${
            active === g ? styles.genrePillActive : styles.genrePillInactive
          }`}
        >
          {g}
        </button>
      ))}
    </div>
  )
}

// ─── Footer ───────────────────────────────────────────────────────────────────

const FOOTER_LINKS = [
  "Audio Description",
  "Help Center",
  "Gift Cards",
  "Media Centre",
  "Investor Relations",
  "Jobs",
  "Terms of Use",
  "Privacy",
  "Cookie Preferences",
  "Corporate Information",
  "Contact Us",
]

export function Footer() {
  return (
    <footer className={`px-4 sm:px-10 xl:px-12 py-10 mt-8 ${styles.footer}`}>
      <div className="flex flex-wrap gap-x-5 gap-y-2 mb-4">
        {FOOTER_LINKS.map((link) => (
          <button
            key={link}
            className={`text-xs transition-colors ${styles.footerLink}`}
          >
            {link}
          </button>
        ))}
      </div>
      <p className={`text-xs ${styles.footerCopy}`}>&copy; STREAMFLIX 2026</p>
    </footer>
  )
}
