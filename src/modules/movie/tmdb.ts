import type { Show } from "./types"

// ─── TMDB CONFIG ────────────────────────────────────────────────────────────

// Credentials are supplied through the local environment and are exposed to

// the browser because this is a client-side TMDB integration.

export const TMDB_API_KEY = (import.meta.env
  .VITE_TMDB_API_KEY as string | undefined)

  ?.trim()

export const TMDB_READ_ACCESS_TOKEN = (import.meta.env
  .VITE_TMDB_READ_ACCESS_TOKEN as string | undefined)

  ?.trim()

export const TMDB_BASE = "https://api.themoviedb.org/3"

export const TMDB_IMG = "https://image.tmdb.org/t/p"

export const hasTMDBCredentials = Boolean(
  TMDB_API_KEY || TMDB_READ_ACCESS_TOKEN,
)

function tmdbRequest(path: string, params: Record<string, string> = {}) {
  if (!hasTMDBCredentials) return null

  const url = new URL(`${TMDB_BASE}${path}`)

  url.searchParams.set("language", "en-US")

  if (TMDB_API_KEY) url.searchParams.set("api_key", TMDB_API_KEY)

  Object.entries(params).forEach(([key, value]) =>
    url.searchParams.set(key, value),
  )

  return {
    url: url.toString(),

    init: TMDB_READ_ACCESS_TOKEN
      ? { headers: { Authorization: `Bearer ${TMDB_READ_ACCESS_TOKEN}` } }
      : undefined,
  }
}

// Map TMDB genre IDs -> names

export const GENRE_MAP: Record<number, string> = {
  28: "Action",

  12: "Adventure",

  16: "Animation",

  35: "Comedy",

  80: "Crime",

  99: "Documentary",

  18: "Drama",

  10751: "Family",

  14: "Fantasy",

  36: "Historical",

  27: "Horror",

  10402: "Music",

  9648: "Mystery",

  10749: "Romance",

  878: "Sci-Fi",

  53: "Thriller",

  10770: "TV Movie",

  37: "Western",

  10759: "Action & Adventure",

  10762: "Kids",

  10763: "News",

  10764: "Reality",

  10765: "Sci-Fi & Fantasy",

  10766: "Soap",

  10767: "Talk",

  10768: "War & Politics",
}

// Fetch helper — always returns [] on error so the UI never crashes

export async function tmdb<T>(
  path: string,

  params: Record<string, string> = {},
): Promise<T[]> {
  try {
    const request = tmdbRequest(path, params)

    if (!request) return []

    const res = await fetch(request.url, request.init)

    if (!res.ok) {
      if (res.status !== 401 && res.status !== 403) {
        console.warn(`TMDB ${res.status} on ${path}`)
      }

      throw new Error(`TMDB ${res.status}`)
    }

    const data = await res.json()

    return data.results ?? []
  } catch {
    return []
  }
}

export async function searchShows(
  query: string,
  signal?: AbortSignal,
): Promise<Show[]> {
  const request = tmdbRequest("/search/multi", {
    query,
    include_adult: "false",
  })
  if (!request) throw new Error("TMDB credentials are unavailable")

  const response = await fetch(request.url, { ...request.init, signal })
  if (!response.ok) throw new Error(`TMDB ${response.status}`)

  const payload = (await response.json()) as {
    results?: Array<Record<string, any>>
  }
  const seen = new Set<string>()
  return (payload.results ?? [])
    .filter((item) => item.media_type === "movie" || item.media_type === "tv")
    .map((item) => toShow(item, false, item.media_type as "movie" | "tv"))
    .filter((show) => {
      const key = `${show.mediaType}-${show.id}`
      if (!show.title || !show.image || seen.has(key)) return false
      seen.add(key)
      return true
    })
    .slice(0, 30)
}

async function tmdbOne<T>(
  path: string,

  params: Record<string, string> = {},
): Promise<T | null> {
  try {
    const request = tmdbRequest(path, params)

    if (!request) return null

    const res = await fetch(request.url, request.init)

    if (!res.ok) throw new Error(`TMDB ${res.status}`)

    return await res.json()
  } catch {
    return null
  }
}

export async function fetchShowDetails(
  id: number,

  mediaType: "movie" | "tv" = "movie",
): Promise<Show | null> {
  const data = await tmdbOne<any>(`/${mediaType}/${id}`, {
    append_to_response:
      mediaType === "movie" ? "release_dates" : "content_ratings",
  })

  if (!data) return null

  const show = toShow(data, true, mediaType)

  show.duration =
    mediaType === "movie" && data.runtime
      ? `${Math.floor(data.runtime / 60)}h ${data.runtime % 60}m`
      : mediaType === "tv" && data.number_of_seasons
        ? `${data.number_of_seasons} season${
            data.number_of_seasons === 1 ? "" : "s"
          }`
        : ""

  const region =
    mediaType === "movie"
      ? data.release_dates?.results?.find(
          (item: any) => item.iso_3166_1 === "US",
        )
      : data.content_ratings?.results?.find(
          (item: any) => item.iso_3166_1 === "US",
        )

  show.rating =
    mediaType === "movie"
      ? (region?.release_dates?.find((item: any) => item.certification)
          ?.certification ?? "")
      : (region?.rating ?? "")

  return show
}

export interface TMDBEpisode {
  ep: number

  title: string

  duration: string

  thumb: string
}

export async function fetchTVEpisodes(id: number): Promise<TMDBEpisode[]> {
  const details = await tmdbOne<{
    seasons?: { season_number: number episode_count: number }[]
  }>(`/tv/${id}`)

  const season = details?.seasons?.find(
    (item) => item.season_number > 0 && item.episode_count > 0,
  )

  if (!season) return []

  const seasonData = await tmdbOne<{
    episodes?: {
      episode_number: number

      name?: string

      runtime?: number

      still_path?: string | null
    }[]
  }>(`/tv/${id}/season/${season.season_number}`)

  return (seasonData?.episodes ?? [])

    .map((episode) => ({
      ep: episode.episode_number,

      title: episode.name ?? "",

      duration: episode.runtime ? `${episode.runtime}m` : "",

      thumb: episode.still_path ? `${TMDB_IMG}/w300${episode.still_path}` : "",
    }))

    .filter((episode) => Boolean(episode.title))
}

// Convert a raw TMDB movie/TV item into our Show shape

// eslint-disable-next-line @typescript-eslint/no-explicit-any

export function toShow(
  item: any,

  isHero = false,

  mediaType: "movie" | "tv" = "movie",
): Show {
  const title = item.title ?? item.name ?? ""

  const year = (item.release_date ?? item.first_air_date ?? "").slice(0, 4)

  const genreIds = item.genre_ids as number[] | undefined ?? []

  const detailGenres =
    item.genres as { id: number name: string }[] | undefined ?? []

  const genres = (
    detailGenres.length > 0
      ? detailGenres.map((genre) => genre.name)
      : genreIds.map((id) => GENRE_MAP[id])
  )

    .filter(Boolean)

    .slice(0, 3) as string[]

  const vote = Math.round((item.vote_average ?? 0) * 10)

  return {
    id: item.id,

    title,

    year,

    rating: "",

    duration: "",

    genres,

    image: item.poster_path ? `${TMDB_IMG}/w342${item.poster_path}` : "",

    hero:
      isHero && item.backdrop_path
        ? `${TMDB_IMG}/original${item.backdrop_path}`
        : undefined,

    description: item.overview ?? "",

    match: vote,

    mediaType,
  }
}

/**
 * Fetch the best available YouTube trailer key for a title (falls back to
 * a teaser if no trailer is tagged). Returns null if nothing usable exists.
 */

export async function fetchTrailerKey(
  id: number,

  mediaType: "movie" | "tv" = "movie",
): Promise<string | null> {
  try {
    const request = tmdbRequest(`/${mediaType}/${id}/videos`)

    if (!request) return null

    const res = await fetch(request.url, request.init)

    if (!res.ok) throw new Error(`TMDB ${res.status}`)

    const data = await res.json()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any

    const vids: any[] = data.results ?? []

    const youtube = vids.filter((v) => v.site === "YouTube")

    const trailer =
      youtube.find((v) => v.type === "Trailer" && v.official) ??
      youtube.find((v) => v.type === "Trailer") ??
      youtube.find((v) => v.type === "Teaser") ??
      youtube[0]

    return trailer?.key ?? null
  } catch {
    return null
  }
}

/** Fetch "More Like This" titles for a given show. */

export async function fetchSimilar(
  id: number,

  mediaType: "movie" | "tv" = "movie",
): Promise<Show[]> {
  const raw = await tmdb<Record<string, unknown>>(
    `/${mediaType}/${id}/similar`,
  )

  return raw

    .map((item) => toShow(item, true, mediaType))

    .filter((item) => Boolean(item.title && item.image))

    .slice(0, 8)
}
