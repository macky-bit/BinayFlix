export interface LyricsMatchCandidate {
  id: number
  trackName: string
  artistName: string
  albumName: string
  instrumental: boolean
  plainLyrics: string | null
  syncedLyrics: string | null
}

export interface TrackLyricsResult {
  sourceId: number
  sourceUrl: string
  trackName: string
  artistName: string
  instrumental: boolean
  lyrics: string
  syncedLyrics: string
}

const GENERIC_ARTIST = /\b(topic|vevo|records?|soundtracks?|music|official|nick jr|release)\b/i

function normalize(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
}

function tokens(value: string) {
  return new Set(normalize(value).split(" ").filter((token) => token.length > 1))
}

function overlap(left: string, right: string) {
  const leftTokens = tokens(left)
  const rightTokens = tokens(right)
  if (!leftTokens.size || !rightTokens.size) return 0
  let matching = 0
  for (const token of leftTokens) {
    if (rightTokens.has(token)) matching += 1
  }
  return matching / Math.max(leftTokens.size, rightTokens.size)
}

function cleanArtist(value: string) {
  return value
    .replace(/\s+-\s+Topic$/i, "")
    .replace(/VEVO$/i, "")
    .trim()
}

export function selectBestLyricsMatch(
  trackTitle: string,
  artist: string,
  candidates: LyricsMatchCandidate[],
) {
  const normalizedTitle = normalize(trackTitle)
  const cleanedArtist = cleanArtist(artist)
  const artistIsGeneric = GENERIC_ARTIST.test(artist)
  const titleTokenCount = tokens(trackTitle).size

  const ranked = candidates
    .map((candidate) => {
      const candidateTitle = normalize(candidate.trackName)
      const titleOverlap = overlap(trackTitle, candidate.trackName)
      const artistOverlap = artistIsGeneric
        ? 0
        : overlap(cleanedArtist, candidate.artistName)
      let score = titleOverlap * 8 + artistOverlap * 4
      if (candidateTitle === normalizedTitle) score += 8
      else if (
        candidateTitle.includes(normalizedTitle) ||
        normalizedTitle.includes(candidateTitle)
      ) score += 4
      return { candidate, score, titleOverlap, artistOverlap }
    })
    .filter(({ titleOverlap, artistOverlap }) => {
      if (titleOverlap < 0.7) return false
      if (titleTokenCount <= 1) return !artistIsGeneric && artistOverlap >= 0.7
      return true
    })
    .sort((left, right) => right.score - left.score)

  return ranked[0]?.score >= 10 ? ranked[0].candidate : null
}

function lyricsFromSynced(value: string | null) {
  if (!value) return ""
  return value
    .split(/\r?\n/)
    .map((line) => line.replace(/^\[[0-9:.]+\]\s*/, ""))
    .filter(Boolean)
    .join("\n")
}

export async function loadTrackLyrics(
  trackTitle: string,
  artist: string,
  signal?: AbortSignal,
): Promise<TrackLyricsResult | null> {
  const url = new URL("https://lrclib.net/api/search")
  url.searchParams.set("track_name", trackTitle)
  if (!GENERIC_ARTIST.test(artist)) {
    url.searchParams.set("artist_name", cleanArtist(artist))
  }

  const response = await fetch(url, {
    signal,
    headers: { "Lrclib-Client": "StreamFlix/1.0" },
  })
  if (!response.ok) {
    throw new Error(`Lyrics provider returned ${response.status}.`)
  }

  const candidates = (await response.json()) as LyricsMatchCandidate[]
  const match = selectBestLyricsMatch(trackTitle, artist, candidates)
  if (!match) return null

  return {
    sourceId: match.id,
    sourceUrl: `https://lrclib.net/api/get/${match.id}`,
    trackName: match.trackName,
    artistName: match.artistName,
    instrumental: match.instrumental,
    lyrics: match.plainLyrics?.trim() || lyricsFromSynced(match.syncedLyrics),
    syncedLyrics: match.syncedLyrics?.trim() || "",
  }
}
