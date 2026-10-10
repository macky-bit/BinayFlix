import type { SupabaseClient } from "@supabase/supabase-js"

export interface SoundtrackTrack {
  id: string
  title: string
  lookupTitle: string
  artist: string
  audioUrl: string
  referenceUrl: string
  timestamp: string
  lyrics: string
  instrumental: boolean
  lyricsSourceUrl: string
}

interface SoundtrackRow {
  soundtrack_id: string | number
  song_title: string
  track_title: string | null
  artist: string | null
  stream_link: string | null
  external_url: string | null
  timestamp_label: string | null
  lyrics: string | null
  lyrics_instrumental: boolean | null
  lyrics_source_url: string | null
}

export async function loadSoundtracks(
  client: SupabaseClient,
  contentId: number,
): Promise<SoundtrackTrack[]> {
  const { data, error } = await client
    .from("soundtrack")
    .select(
      "soundtrack_id, song_title, track_title, artist, stream_link, external_url, timestamp_label, lyrics, lyrics_instrumental, lyrics_source_url",
    )
    .eq("content_id", contentId)
    .order("soundtrack_id", { ascending: true })

  if (error) throw error

  return ((data ?? []) as SoundtrackRow[]).map((row) => ({
    id: String(row.soundtrack_id),
    title: row.track_title?.trim() || row.song_title.trim(),
    lookupTitle: row.song_title.trim(),
    artist: row.artist?.trim() || "Artist unavailable",
    audioUrl: row.stream_link?.trim() || "",
    referenceUrl: row.external_url?.trim() || "",
    timestamp: row.timestamp_label?.trim() || "",
    lyrics: row.lyrics?.trim() || "",
    instrumental: row.lyrics_instrumental === true,
    lyricsSourceUrl: row.lyrics_source_url?.trim() || "",
  }))
}
