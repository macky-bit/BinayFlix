export type Tab = "content" | "categories" | "genres" | "soundtracks" | "film-refreshers"

export interface Category {
  id: string

  name: string

  description: string

  contentCount: number
}

export interface Genre {
  id: string

  name: string

  description: string

  contentCount: number
}

export interface Content {
  id: string

  title: string

  categoryId: string

  genreIds: string[]

  synopsis: string

  releaseYear: number

  runtime: number

  ageRating: string

  thumbnailUrl: string

  thumbnailFilename: string

  videoFilename: string

  subtitleFilename: string

  totalStreams: number

  availability: "available" | "unavailable"

  syncedAt: string
}

export interface Soundtrack {
  id: string

  contentId: string

  songTitle: string

  artist: string

  lyrics: string

  timestamp: string

  streamingLink: string
}

export interface FilmRefresher {
  id: string

  contentId: string

  title: string

  summary: string

  videoFilename: string

  availability: "available" | "unavailable"

  lastUpdated: string
}

export interface Toast {
  id: string

  message: string

  type: "success" | "error"
}
