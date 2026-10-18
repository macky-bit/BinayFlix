import type { Show, TMDBCatalogData } from "../movie/types"
import { CarouselRow, Footer } from "./components"

interface Props {
  data: TMDBCatalogData
  onWatch: (show: Show) => void
  onInfo: (show: Show) => void
  onNavigateHelp: () => void
}

export default function NewAndPopularPage({ data, onWatch, onInfo, onNavigateHelp }: Props) {
  const rows = data.rows
  const newTitles = rows.find((row) => row.title === "New on StreamFlix")?.shows ?? []
  const movies = rows.find((row) => row.title === "Top 10 Movies")?.shows ?? []
  const series = rows.find((row) => row.title === "Top 10 TV Series")?.shows ?? []

  return (
    <main className="min-h-screen bg-[var(--color-ink)] pt-20 text-[var(--color-cream)]">
      <div className="space-y-8 pb-10">
        <CarouselRow title="New on StreamFlix" shows={newTitles} variant="wide" onPlay={onWatch} onInfo={onInfo} />
        <CarouselRow title="Top 10 Movies" shows={movies} top10 onPlay={onWatch} onInfo={onInfo} />
        <CarouselRow title="Top 10 TV Series" shows={series} top10 onPlay={onWatch} onInfo={onInfo} />
        <Footer onNavigateHelp={onNavigateHelp} />
      </div>
    </main>
  )
}
