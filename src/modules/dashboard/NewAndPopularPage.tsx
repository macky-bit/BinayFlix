import type { Show, TMDBCatalogData } from "../movie/types"
import { CarouselRow, Footer } from "./components"
import { useUpcomingTMDB, type UpcomingTitle } from "./useUpcomingTMDB"

interface Props {
  data: TMDBCatalogData
  onWatch: (show: Show) => void
  onInfo: (show: Show) => void
  onNavigateHelp: () => void
}

function releaseDate(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString(undefined, {
    month: "short", day: "numeric", year: "numeric",
  })
}

function UpcomingRow({ title, items, loading }: {
  title: string
  items: UpcomingTitle[]
  loading: boolean
}) {
  if (items.length === 0) {
    return (
      <section className="px-4 sm:px-10 xl:px-12">
        <h2 className="mb-3 text-base font-bold text-white">{title}</h2>
        <p className="rounded-xl border border-white/10 bg-white/5 px-4 py-6 text-sm text-gray-400">
          {loading ? "Finding upcoming titles…" : "No release dates announced for this period yet."}
        </p>
      </section>
    )
  }

  return (
    <CarouselRow
      title={title}
      shows={items.map(({ show, date }) => ({ ...show, year: releaseDate(date) }))}
      variant="wide"
      unavailable
      unavailableLabel="Coming soon"
    />
  )
}

export default function NewAndPopularPage({ data, onWatch, onInfo, onNavigateHelp }: Props) {
  const upcoming = useUpcomingTMDB()
  const rows = data.rows
  const newTitles = rows.find((row) => row.title === "New on StreamFlix")?.shows ?? []
  const movies = rows.find((row) => row.title === "Top 10 Movies")?.shows ?? []
  const series = rows.find((row) => row.title === "Top 10 TV Series")?.shows ?? []

  return (
    <main className="min-h-screen bg-[var(--color-ink)] pt-20 text-[var(--color-cream)]">
      <div className="space-y-8 pb-10">
        <CarouselRow title="New on StreamFlix" shows={newTitles} variant="wide" onPlay={onWatch} onInfo={onInfo} />
        <CarouselRow title="Top 10 Movies" shows={movies} top10 onInfo={onInfo} />
        <CarouselRow title="Top 10 TV Series" shows={series} top10 onInfo={onInfo} />
        <UpcomingRow title="Coming This Week" items={upcoming.thisWeek} loading={upcoming.loading} />
        <UpcomingRow title="Coming Next Week" items={upcoming.nextWeek} loading={upcoming.loading} />
        <UpcomingRow title="Worth the Wait" items={upcoming.worthTheWait} loading={upcoming.loading} />
        <Footer onNavigateHelp={onNavigateHelp} />
      </div>
    </main>
  )
}
