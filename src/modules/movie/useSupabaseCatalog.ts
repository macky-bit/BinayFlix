import { useEffect, useMemo, useState } from "react"
import { supabase } from "../../lib/supabase"
import type { CatalogKind, CatalogRow, Show, TMDBCatalogData } from "./types"

interface ContentRow {
  content_id: number
  tmdb_id: number | null
  title: string
  synopsis: string | null
  release_year: number | null
  runtime: number | null
  age_rating: string | null
  thumbnail: string | null
  total_streams_count: number | null
  popularity_rank: number | null
  category: { category_name: string } | { category_name: string }[] | null
  genre: { genre_name: string } | { genre_name: string }[] | null
  content_genre?: Array<{
    genre: { genre_name: string } | { genre_name: string }[] | null
  }> | null
}

interface GenreRow {
  genre_name: string
  content_genre: { count: number } | { count: number }[] | null
}

interface CatalogShow extends Show {
  popularityRank: number
}

function relationName(
  value: Record<string, string> | Record<string, string>[] | null,
  key: string,
) {
  const relation = Array.isArray(value) ? value[0] : value
  return relation?.[key] ?? ""
}

function formatRuntime(minutes: number | null) {
  if (!minutes) return ""
  const hours = Math.floor(minutes / 60)
  const remainder = minutes % 60
  return hours ? `${hours}h ${remainder}m` : `${remainder}m`
}

function mapContent(row: ContentRow): CatalogShow {
  const category = relationName(row.category, "category_name").toLowerCase()
  const legacyGenre = relationName(row.genre, "genre_name")
  const genres = Array.from(
    new Set(
      [
        legacyGenre,
        ...(row.content_genre ?? []).map((item) =>
          relationName(item.genre, "genre_name"),
        ),
      ].filter(Boolean),
    ),
  )

  return {
    id: row.tmdb_id ?? row.content_id,
    title: row.title,
    description: row.synopsis ?? "",
    year: row.release_year?.toString() ?? "",
    duration: formatRuntime(row.runtime),
    rating: row.age_rating ?? "",
    image: row.thumbnail ?? "",
    hero: row.thumbnail ?? undefined,
    genres,
    mediaType: category.includes("tv") ? "tv" : "movie",
    popularityRank: row.popularity_rank ?? Number.MAX_SAFE_INTEGER,
  }
}

function byPopularity(a: CatalogShow, b: CatalogShow) {
  return a.popularityRank - b.popularityRank
}

function byNewest(a: CatalogShow, b: CatalogShow) {
  return Number(b.year ?? 0) - Number(a.year ?? 0) || byPopularity(a, b)
}

function interleave(left: CatalogShow[], right: CatalogShow[], limit = 12) {
  const mixed: CatalogShow[] = []
  for (let index = 0; mixed.length < limit; index += 1) {
    if (left[index]) mixed.push(left[index])
    if (mixed.length < limit && right[index]) mixed.push(right[index])
    if (!left[index] && !right[index]) break
  }
  return mixed
}

function recommendations(items: CatalogShow[]) {
  const recommended = items.slice(10, 22)
  return recommended.length >= 6 ? recommended : items.slice(0, 12)
}

export function buildCatalog(
  kind: CatalogKind,
  records: ContentRow[],
): Pick<TMDBCatalogData, "featured" | "rows" | "genres"> {
  const all = records.map(mapContent).filter((show) => show.image)
  const genreCounts = new Map<string, number>()
  all.forEach((show) => {
    show.genres.forEach((genre) => {
      genreCounts.set(genre, (genreCounts.get(genre) ?? 0) + 1)
    })
  })
  const genres = [...genreCounts.entries()]
    .sort(([leftName, leftCount], [rightName, rightCount]) =>
      rightCount - leftCount || leftName.localeCompare(rightName),
    )
    .slice(0, 15)
    .map(([name]) => name)
  const movies = all.filter((show) => show.mediaType === "movie").sort(byPopularity)
  const tv = all.filter((show) => show.mediaType === "tv").sort(byPopularity)
  const trending = interleave(movies, tv)
  const newestMovies = [...movies].sort(byNewest).slice(0, 12)
  const newestTv = [...tv].sort(byNewest).slice(0, 12)

  let rows: CatalogRow[]
  if (kind === "movies") {
    rows = [
      { title: "Popular Movies", shows: movies.slice(0, 12) },
      { title: "New Movies", shows: newestMovies },
      { title: "Top 10 Movies", shows: movies.slice(0, 10), top10: true },
      { title: "Recommended Movies", shows: recommendations(movies) },
    ]
  } else if (kind === "tvShows") {
    rows = [
      { title: "Popular TV Shows", shows: tv.slice(0, 12) },
      { title: "New TV Shows", shows: newestTv },
      { title: "Top 10 TV Shows", shows: tv.slice(0, 10), top10: true },
      { title: "Recommended TV Shows", shows: recommendations(tv) },
    ]
  } else if (kind === "newAndPopular") {
    rows = [
      { title: "Trending Now", shows: trending },
      { title: "New Movies", shows: newestMovies },
      { title: "New TV Shows", shows: newestTv },
      { title: "Popular Movies", shows: movies.slice(0, 12) },
      { title: "Popular TV Shows", shows: tv.slice(0, 12) },
    ]
  } else {
    rows = [
      { title: "Trending Now", shows: trending },
      { title: "New Movies", shows: newestMovies },
      { title: "Popular TV Shows", shows: tv.slice(0, 12) },
      { title: "Top 10 Movies", shows: movies.slice(0, 10), top10: true },
      { title: "Recommended Movies", shows: recommendations(movies) },
      { title: "Recommended TV Shows", shows: recommendations(tv) },
    ]
  }

  const candidates = kind === "movies" ? movies : kind === "tvShows" ? tv : trending
  return { featured: candidates[0] ?? null, rows, genres }
}

export function useSupabaseCatalog(kind: CatalogKind): TMDBCatalogData {
  const [records, setRecords] = useState<ContentRow[]>([])
  const [databaseGenres, setDatabaseGenres] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function loadCatalog() {
      setLoading(true)
      setError(null)

      const [contentResult, genreResult] = await Promise.all([
        supabase
          .from("content")
          .select(
            "content_id, tmdb_id, title, synopsis, release_year, runtime, age_rating, thumbnail, total_streams_count, popularity_rank, category(category_name), genre!content_genre_id_fkey(genre_name), content_genre(genre(genre_name))",
          )
          .eq("availability_status", "available")
          .not("tmdb_id", "is", null)
          .order("popularity_rank", { ascending: true, nullsFirst: false }),
        supabase.from("genre").select("genre_name, content_genre(count)"),
      ])

      if (!active) return
      const { data, error: queryError } = contentResult
      if (queryError) {
        setError(queryError.message)
        setRecords([])
      } else {
        setRecords((data ?? []) as unknown as ContentRow[])
      }
      if (!genreResult.error) {
        const rankedGenres = ((genreResult.data ?? []) as unknown as GenreRow[])
          .map((row) => ({
            name: row.genre_name.trim(),
            count: Number(
              (Array.isArray(row.content_genre)
                ? row.content_genre[0]?.count
                : row.content_genre?.count) ?? 0,
            ),
          }))
          .filter((genre) => genre.name)
          .sort((left, right) =>
            right.count - left.count || left.name.localeCompare(right.name),
          )
          .slice(0, 15)
          .map((genre) => genre.name)
        setDatabaseGenres(rankedGenres)
      }
      setLoading(false)
    }

    void loadCatalog()
    return () => {
      active = false
    }
  }, [])

  const catalog = useMemo(() => buildCatalog(kind, records), [kind, records])
  return {
    ...catalog,
    genres: databaseGenres.length > 0 ? databaseGenres : catalog.genres,
    loading,
    error,
  }
}
