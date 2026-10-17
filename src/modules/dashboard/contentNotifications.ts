import type { SupabaseClient } from "@supabase/supabase-js"
import type { Show } from "../movie/types"

interface NotificationRow {
  content_id: number
  tmdb_id: number | null
  title: string
  synopsis: string | null
  release_year: number | null
  runtime: number | null
  age_rating: string | null
  thumbnail: string | null
  video_file: string | null
  admin_updated_at: string
  category: { category_name: string } | { category_name: string }[] | null
}

export interface ContentNotification {
  id: number
  changedAt: string
  show: Show
}

function relationName(
  value: { category_name: string } | { category_name: string }[] | null,
) {
  return (Array.isArray(value) ? value[0] : value)?.category_name ?? ""
}

function formatRuntime(minutes: number | null) {
  if (!minutes) return ""
  const hours = Math.floor(minutes / 60)
  const remainder = minutes % 60
  return hours ? `${hours}h ${remainder}m` : `${remainder}m`
}

export async function loadContentNotifications(client: SupabaseClient) {
  const { data, error } = await client
    .from("content")
    .select(
      "content_id, tmdb_id, title, synopsis, release_year, runtime, age_rating, thumbnail, video_file, admin_updated_at, category(category_name)",
    )
    .eq("availability_status", "available")
    .eq("publishing_status", "ready")
    .not("video_file", "is", null)
    .not("admin_updated_at", "is", null)
    .order("admin_updated_at", { ascending: false })
    .limit(20)

  if (error) throw error

  return ((data ?? []) as unknown as NotificationRow[]).map((row) => {
    const image =
      row.thumbnail && !/^https?:/i.test(row.thumbnail)
        ? client.storage.from("content-thumbnails").getPublicUrl(row.thumbnail)
            .data.publicUrl
        : (row.thumbnail ?? "")

    return {
      id: row.content_id,
      changedAt: row.admin_updated_at,
      show: {
        contentId: row.content_id,
        tmdbId: row.tmdb_id,
        videoPath: row.video_file,
        title: row.title,
        description: row.synopsis ?? "",
        year: row.release_year?.toString() ?? "",
        duration: formatRuntime(row.runtime),
        rating: row.age_rating ?? "",
        image,
        hero: image || undefined,
        genres: [],
        mediaType: relationName(row.category).toLowerCase().includes("tv")
          ? "tv"
          : "movie",
      },
    }
  }) satisfies ContentNotification[]
}
