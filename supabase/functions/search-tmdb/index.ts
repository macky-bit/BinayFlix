import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const TMDB_BASE = "https://api.themoviedb.org/3"
const POSTER_BASE = "https://image.tmdb.org/t/p/w500"

function json(body: unknown, status = 200, origin = "*") {
  return Response.json(body, {
    status,
    headers: {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      Vary: "Origin",
    },
  })
}

Deno.serve(async (request) => {
  const origin = request.headers.get("Origin") ?? "*"
  if (request.method === "OPTIONS") return json({ ok: true }, 200, origin)
  if (request.method !== "POST")
    return json({ error: "Method not allowed" }, 405, origin)

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

    const body = (await request.json().catch(() => ({}))) as {
      query?: unknown
      mediaType?: unknown
    }
    const query = String(body.query ?? "").trim()
    if (body.mediaType !== "movie" && body.mediaType !== "tv")
      throw new Error("Choose Movie or TV Series before searching")
    const mediaType = body.mediaType
    if (query.length < 2) throw new Error("Enter at least two characters")
    if (query.length > 100) throw new Error("Search query is too long")

    const apiKey = Deno.env.get("TMDB_API_KEY")
    if (!apiKey) throw new Error("TMDB is not configured")
    const url = new URL(`${TMDB_BASE}/search/${mediaType}`)
    url.searchParams.set("api_key", apiKey)
    url.searchParams.set("language", "en-US")
    url.searchParams.set("query", query)
    url.searchParams.set("include_adult", "false")

    const tmdbResponse = await fetch(url)
    if (!tmdbResponse.ok)
      throw new Error(`TMDB search failed (${tmdbResponse.status})`)
    const payload = (await tmdbResponse.json()) as {
      results?: Array<Record<string, unknown>>
    }
    const results = (payload.results ?? []).slice(0, 8).map((item) => ({
      tmdbId: Number(item.id),
      mediaType,
      title: String(
        mediaType === "movie" ? (item.title ?? "") : (item.name ?? ""),
      ),
      synopsis: String(item.overview ?? ""),
      releaseYear:
        Number(
          String(
            mediaType === "movie"
              ? (item.release_date ?? "")
              : (item.first_air_date ?? ""),
          ).slice(0, 4),
        ) || null,
      posterUrl: item.poster_path ? `${POSTER_BASE}${item.poster_path}` : "",
    }))

    return json({ results }, 200, origin)
  } catch (error) {
    return json(
      { error: error instanceof Error ? error.message : "TMDB search failed" },
      400,
      origin,
    )
  }
})
