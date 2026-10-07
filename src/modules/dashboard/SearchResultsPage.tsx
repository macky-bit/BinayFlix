import { useEffect, useState } from "react"
import type { Show } from "../movie/types"
import { searchShows } from "../movie/tmdb"
import { Footer, TrendingCard } from "./components"
import { normalizeSearchQuery } from "./search"

interface Props {
  query: string
  onWatch: (show: Show) => void
  onInfo: (show: Show) => void
}

export default function SearchResultsPage({ query, onWatch, onInfo }: Props) {
  const normalizedQuery = normalizeSearchQuery(query)
  const [results, setResults] = useState<Show[]>([])
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
        .then(setResults)
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
            />
          ))}
        </section>
      )}

      <div className="mt-12">
        <Footer />
      </div>
    </main>
  )
}
