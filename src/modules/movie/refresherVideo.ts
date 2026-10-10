import type { SupabaseClient } from "@supabase/supabase-js"

export const REFRESHER_VIDEO_BUCKET = "refresher_video_url"
export const REFRESHER_VIDEO_PATH = "refresher_all.mp4"

export async function createRefresherVideoUrl(client: SupabaseClient) {
  const { data, error } = await client.storage
    .from(REFRESHER_VIDEO_BUCKET)
    .createSignedUrl(REFRESHER_VIDEO_PATH, 30 * 60)

  if (error) throw error
  if (!data.signedUrl)
    throw new Error("The refresher video does not have a playable URL.")
  return data.signedUrl
}
