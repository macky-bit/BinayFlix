const TMDB_BASE = "https://api.themoviedb.org/3"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: corsHeaders })
}

function mediaType(value: unknown): "movie" | "tv" {
  if (value !== "movie" && value !== "tv") throw new Error("Invalid media type")
  return value
}

function positiveId(value: unknown) {
  const id = Number(value)
  if (!Number.isSafeInteger(id) || id <= 0) throw new Error("Invalid TMDB ID")
  return id
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return json({ ok: true })
  if (request.method !== "POST")
    return json({ error: "Method not allowed" }, 405)

  try {
    const apiKey = Deno.env.get("TMDB_API_KEY")
    if (!apiKey) throw new Error("TMDB is not configured")

    const body = (await request
      .json()
      .catch(() => ({}))) as Record<string, unknown>
    const operation = String(body.operation ?? "")

    const fetchTmdb = async (
      path: string,
      params: Record<string, string> = {},
    ) => {
      const url = new URL(`${TMDB_BASE}${path}`)
      url.searchParams.set("api_key", apiKey)
      url.searchParams.set("language", "en-US")
      for (const [key, value] of Object.entries(params))
        url.searchParams.set(key, value)

      const response = await fetch(url)
      if (!response.ok)
        throw new Error(`TMDB request failed (${response.status})`)
      return response.json()
    }

    if (operation === "search") {
      const query = String(body.query ?? "")
        .trim()
        .slice(0, 100)
      if (query.length < 1) throw new Error("Search query is required")
      return json({
        data: await fetchTmdb("/search/multi", {
          query,
          include_adult: "false",
        }),
      })
    }

    if (operation === "details") {
      const type = mediaType(body.mediaType)
      const id = positiveId(body.id)
      return json({
        data: await fetchTmdb(`/${type}/${id}`, {
          append_to_response:
            type === "movie" ? "release_dates" : "content_ratings",
        }),
      })
    }

    if (operation === "episodes") {
      const id = positiveId(body.id)
      const details = (await fetchTmdb(`/tv/${id}`)) as {
        seasons?: Array<
          Record<"season_number" | "episode_count", number>
        >
      }
      const season = details.seasons?.find(
        (item) => item.season_number > 0 && item.episode_count > 0,
      )
      return json({
        data: season
          ? await fetchTmdb(`/tv/${id}/season/${season.season_number}`)
          : { episodes: [] },
      })
    }

    if (operation === "videos" || operation === "similar") {
      const type = mediaType(body.mediaType)
      const id = positiveId(body.id)
      return json({ data: await fetchTmdb(`/${type}/${id}/${operation}`) })
    }

    if (operation === "discover") {
      const type = mediaType(body.mediaType)
      const start = String(body.start ?? "")
      const end = String(body.end ?? "")
      if (
        !/^\d{4}-\d{2}-\d{2}$/.test(start) ||
        !/^\d{4}-\d{2}-\d{2}$/.test(end)
      )
        throw new Error("Invalid discovery date range")
      const startDate = new Date(`${start}T00:00:00Z`)
      const endDate = new Date(`${end}T00:00:00Z`)
      const rangeDays = (endDate.getTime() - startDate.getTime()) / 86_400_000
      if (rangeDays < 0 || rangeDays > 366)
        throw new Error("Discovery date range is too large")
      const dateField =
        type === "movie" ? "primary_release_date" : "first_air_date"
      return json({
        data: await fetchTmdb(`/discover/${type}`, {
          [`${dateField}.gte`]: start,
          [`${dateField}.lte`]: end,
          sort_by: "popularity.desc",
          include_adult: "false",
        }),
      })
    }

    throw new Error("Unsupported TMDB operation")
  } catch (error) {
    return json(
      { error: error instanceof Error ? error.message : "TMDB request failed" },
      400,
    )
  }
})
