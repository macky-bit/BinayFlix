export interface Show {
  contentId?: number

  tmdbId?: number | null

  videoPath?: string | null

  title: string

  year: string

  rating: string

  duration: string

  genres: string[]

  image: string

  hero?: string

  description?: string

  match?: number

  mediaType?: "movie" | "tv"
}

export function showIdentity(show: Show): string {
  if (show.contentId != null) return `content:${show.contentId}`
  if (show.tmdbId != null)
    return `tmdb:${show.mediaType ?? "movie"}:${show.tmdbId}`
  return `title:${show.mediaType ?? "movie"}:${show.title}:${show.year}`
}

export interface CatalogRow {
  title: string

  shows: Show[]

  top10?: boolean
}

export interface TMDBCatalogData {
  featured: Show | null

  rows: CatalogRow[]

  genres: string[]

  loading: boolean

  error: string | null
}

export type CatalogKind = "home" | "movies" | "tvShows" | "newAndPopular"
