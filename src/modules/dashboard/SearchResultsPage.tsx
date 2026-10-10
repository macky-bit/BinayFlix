import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"
import type { Show } from "../movie/types"
import { searchShows } from "../movie/tmdb"
import { Footer, TrendingCard } from "./components"
import { normalizeSearchQuery } from "./search"

interface Props {
  query: string
  onWatch: (show: Show) => void
  onInfo: (show: Show) => void
  onNavigateHelp: () => void
}

type SearchResult = Show & { available: boolean }

type ContentAvailabilityRow = {
  tmdb_id: number | string | null
  category:
    | { category_name: string }
    | { category_name: string }[]
    | null
}

function categoryName(row: ContentAvailabilityRow) {
  const category = Array.isArray(row.category) ? row.category[0] : row.category
  return category?.category_name?.toLowerCase() ?? ""
}

function availabilityKey(id: number | string, mediaType: "movie" | "tv") {
  return `${mediaType}-${id}`
}

async function attachCatalogAvailability(
  shows: Show[],
): Promise<SearchResult[]> {
  if (!shows.length) return []

  const tmdbIds = [...new Set(shows.map((show) => show.id))]
  const { data, error } = await supabase
    .from("content")
    .select("tmdb_id, category(category_name)")
    .eq("availability_status", "available")
    .in("tmdb_id", tmdbIds)

  if (error) throw error

  const availableKeys = new Set(
    ((data ?? []) as unknown as ContentAvailabilityRow[]).flatMap((row) => {
      if (row.tmdb_id === null) return []
      const name = categoryName(row)
      const mediaType = name.includes("tv") ? "tv" : "movie"
      return [availabilityKey(row.tmdb_id, mediaType)]
    }),
  )

  return shows.map((show) => ({
    ...show,
    available: availableKeys.has(
      availabilityKey(show.id, show.mediaType ?? "movie"),
    ),
  }))
}

export default function SearchResultsPage({
  query,
  onWatch,
  onInfo,
  onNavigateHelp,
}: Props) {
  const normalizedQuery = normalizeSearchQuery(query)
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!normalizedQuery) {
      setResults([])
      setLoading(false)
      setError("")
      return
    }

    const controller = new AbortController()
    setLoading(true)
    setError("")
    const timeout = window.setTimeout(() => {
      void searchShows(normalizedQuery, controller.signal)
        .then(attachCatalogAvailability)
        .then((nextResults) => {
          if (!controller.signal.aborted) setResults(nextResults)
        })
        .catch((reason) => {
          if (reason instanceof DOMException && reason.name === "AbortError")
            return
          setResults([])
          setError("Search is temporarily unavailable. Please try again.")
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false)
        })
    }, 300)

    return () => {
      window.clearTimeout(timeout)
      controller.abort()
    }
  }, [normalizedQuery])

  return (
    <main className="min-h-screen bg-[var(--color-ink)] px-4 pb-10 pt-24 text-[var(--color-cream)] sm:px-10 xl:px-12">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-gold-warm)]">
            Search
          </p>
          <h1 className="text-2xl font-bold sm:text-3xl">
            Results for “{normalizedQuery}”
          </h1>
        </div>
        {!loading && !error && (
          <p className="text-sm text-[#9CA3AF]" aria-live="polite">
            {results.length} {results.length === 1 ? "title" : "titles"}
          </p>
        )}
      </div>

      {loading && (
        <div
          className="flex flex-wrap gap-4"
          role="status"
          aria-label="Searching titles"
        >
          {Array.from({ length: 8 }, (_, index) => (
            <div
              key={index}
              className="h-[230px] w-[200px] animate-pulse rounded-xl bg-[#1A1030] sm:w-[220px] lg:w-[240px]"
            />
          ))}
        </div>
      )}

      {!loading && error && (
        <section
          className="rounded-xl border border-red-400/20 bg-red-400/10 p-6"
          role="alert"
        >
          <h2 className="font-semibold">Unable to search</h2>
          <p className="mt-1 text-sm text-red-100/80">{error}</p>
        </section>
      )}

      {!loading && !error && results.length === 0 && (
        <section className="rounded-xl border border-white/10 bg-white/[0.03] p-8 text-center">
          <h2 className="text-lg font-semibold">No matching titles</h2>
          <p className="mt-2 text-sm text-[#9CA3AF]">
            Try another movie or TV show name.
          </p>
        </section>
      )}

      {!loading && !error && results.length > 0 && (
        <section className="flex flex-wrap gap-4" aria-label="Search results">
          {results.map((show) => (
            <TrendingCard
              key={`${show.mediaType}-${show.id}`}
              show={show}
              onPlay={onWatch}
              onInfo={onInfo}
              unavailable={!show.available}
            />
          ))}
        </section>
      )}

      <div className="mt-12">
        <Footer onNavigateHelp={onNavigateHelp} />
      </div>
    </main>
  )
}
