import { createClient } from "npm:@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

const assetLocations = [
  { bucket: "content-thumbnails", folder: "thumbnail" },
  { bucket: "video_file", folder: "video" },
  { bucket: "subtitle", folder: "subtitle" },
] as const

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: corsHeaders })
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return json({ ok: true })
  if (request.method !== "POST")
    return json({ error: "Method not allowed" }, 405)

  try {
    const authorization = request.headers.get("Authorization")
    if (!authorization?.startsWith("Bearer "))
      throw new Error("Administrator sign-in required")

    const client = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    )
    const { data: auth, error: authError } = await client.auth.getUser(
      authorization.slice(7),
    )
    if (authError || !auth.user)
      throw new Error("Invalid administrator session")

    const { data: admin } = await client
      .from("admin")
      .select("admin_id")
      .eq("auth_user_id", auth.user.id)
      .ilike("status", "active")
      .maybeSingle()
    if (!admin) throw new Error("Administrator access required")

    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const { data: rows, error: contentError } = await client
      .from("content")
      .select("content_id, publishing_status, created_at")
    if (contentError) throw contentError

    const contentIds = new Set(
      (rows ?? []).map((row) => String(row.content_id)),
    )
    const staleIds = new Set(
      (rows ?? [])
        .filter(
          (row) =>
            ["draft", "uploading", "failed"].includes(
              String(row.publishing_status),
            ) && new Date(String(row.created_at)).getTime() < cutoff.getTime(),
        )
        .map((row) => String(row.content_id)),
    )
    const removedPaths: string[] = []

    for (const { bucket, folder } of assetLocations) {
      const { data: contentFolders, error: folderError } = await client.storage
        .from(bucket)
        .list("content", { limit: 1000 })
      if (folderError) throw folderError

      for (const entry of contentFolders ?? []) {
        const contentId = entry.name
        if (!/^\d+$/.test(contentId)) continue
        const orphaned = !contentIds.has(contentId)
        if (!orphaned && !staleIds.has(contentId)) continue

        const prefix = `content/${contentId}/${folder}`
        const { data: objects, error: listError } = await client.storage
          .from(bucket)
          .list(prefix, { limit: 1000 })
        if (listError) throw listError

        const paths = (objects ?? [])
          .filter(
            (object) =>
              staleIds.has(contentId) ||
              new Date(String(object.created_at)).getTime() < cutoff.getTime(),
          )
          .map((object) => `${prefix}/${object.name}`)
        if (!paths.length) continue

        const { error: removeError } = await client.storage
          .from(bucket)
          .remove(paths)
        if (removeError) throw removeError
        removedPaths.push(...paths.map((path) => `${bucket}/${path}`))
      }
    }

    const staleContentIds = [...staleIds].map(Number)
    if (staleContentIds.length) {
      const { error: deleteError } = await client
        .from("content")
        .delete()
        .in("content_id", staleContentIds)
      if (deleteError) throw deleteError
    }

    return json({
      removedDrafts: staleContentIds.length,
      removedObjects: removedPaths.length,
    })
  } catch (error) {
    return json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Content upload cleanup failed",
      },
      400,
    )
  }
})
