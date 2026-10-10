import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const jsonHeaders = { "Content-Type": "application/json" }
const CACHE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000

type RefresherPayload = {
  summary: string
  events: string[]
  characters: string[]
  keyDetails: string[]
  sourceName: "Wikipedia"
  sourceTitle: string
  sourceUrl: string
  scope: "movie" | "series"
  cached: boolean
}

type SearchPage = {
  key?: unknown
  title?: unknown
  excerpt?: unknown
  description?: unknown
}

function response(
  body: Record<string, unknown>,
  status: number,
  origin: string,
) {
  return Response.json(body, {
    status,
    headers: {
      ...jsonHeaders,
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      Vary: "Origin",
    },
  })
}

function allowedOrigin(request: Request) {
  const configured = Deno.env.get("APP_URL")?.trim()
  const candidate = configured || request.headers.get("Origin") || ""
  const url = new URL(candidate)
  if (!["http:", "https:"].includes(url.protocol))
    throw new Error("Invalid application URL")
  return url.origin
}

function cleanText(value: unknown) {
  return String(value ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\[[^\]]{1,80}\]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function clip(value: string, maximum: number) {
  if (value.length <= maximum) return value
  const candidate = value.slice(0, maximum + 1)
  const boundary = candidate.lastIndexOf(" ")
  return `${candidate.slice(0, boundary > maximum * 0.7 ? boundary : maximum).trim()}…`
}

function sentences(value: string) {
  return cleanText(value)
    .split(/(?<=[.!?])\s+(?=[A-Z0-9"“])/)
    .map((sentence) => cleanText(sentence))
    .filter((sentence) => sentence.length >= 35)
}

function uniqueItems(items: string[], limit: number, maximum = 280) {
  const seen = new Set<string>()
  const result: string[] = []
  for (const item of items) {
    const cleaned = clip(cleanText(item), maximum)
    const key = cleaned.toLocaleLowerCase()
    if (!cleaned || seen.has(key)) continue
    seen.add(key)
    result.push(cleaned)
    if (result.length === limit) break
  }
  return result
}

function sectionMap(extract: string) {
  const sections = new Map<string, string[]>()
  let current = "lead"
  sections.set(current, [])

  for (const rawLine of extract.split(/\r?\n/)) {
    const line = rawLine.trim()
    const heading = line.match(/^={2,}\s*(.+?)\s*={2,}$/)
    if (heading) {
      current = cleanText(heading[1]).toLocaleLowerCase()
      if (!sections.has(current)) sections.set(current, [])
      continue
    }
    if (line) sections.get(current)?.push(line)
  }
  return sections
}

function findSection(sections: Map<string, string[]>, names: RegExp) {
  for (const [name, lines] of sections) {
    if (names.test(name)) return lines
  }
  return []
}

function buildRefresher(
  extract: string,
  sourceTitle: string,
  sourceUrl: string,
  scope: "movie" | "series",
): RefresherPayload {
  const sections = sectionMap(extract)
  const leadLines = sections.get("lead") ?? []
  const plotLines = findSection(
    sections,
    /^(plot|premise|synopsis|story|series overview|plot summary)$/i,
  )
  const castLines = findSection(
    sections,
    /^(cast|cast and characters|characters|main cast|voice cast)$/i,
  )
  const productionLines = findSection(
    sections,
    /^(production|development|release|broadcast|reception)$/i,
  )

  const leadSentences = sentences(leadLines.join(" "))
  const plotSentences = sentences(plotLines.join(" "))
  const summary = clip(
    uniqueItems(leadSentences, 3, 320).join(" ") ||
      `${sourceTitle} has a verified Wikipedia article, but it does not include a plain-text introduction.`,
    700,
  )
  const events = uniqueItems(
    plotSentences.length ? plotSentences : leadSentences.slice(1),
    5,
  )
  const characters = uniqueItems(
    castLines.filter(
      (line) =>
        line.length >= 5 &&
        line.length <= 240 &&
        !/^(cast|main|recurring|guest|additional)$/i.test(cleanText(line)),
    ),
    6,
    240,
  )
  const eventKeys = new Set(events.map((item) => item.toLocaleLowerCase()))
  const details = uniqueItems(
    [...plotSentences.slice().reverse(), ...sentences(productionLines.join(" "))]
      .filter((item) => !eventKeys.has(clip(item, 280).toLocaleLowerCase())),
    5,
  )

  return {
    summary,
    events,
    characters,
    keyDetails: details,
    sourceName: "Wikipedia",
    sourceTitle,
    sourceUrl,
    scope,
    cached: false,
  }
}

function normalizedTitle(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s*\([^)]*\)\s*$/g, "")
    .replace(/[^a-z0-9]+/gi, " ")
    .trim()
    .toLocaleLowerCase()
}

function chooseSearchResult(
  pages: SearchPage[],
  title: string,
  year: number | null,
  scope: "movie" | "series",
) {
  const expectedTitle = normalizedTitle(title)
  const mediumPattern =
    scope === "movie" ? /\b(film|movie)\b/i : /\b(television|tv|series|sitcom|drama)\b/i

  return pages
    .map((page) => {
      const pageTitle = cleanText(page.title)
      const description = cleanText(page.description)
      const excerpt = cleanText(page.excerpt)
      const normalized = normalizedTitle(pageTitle)
      let score = 0
      if (normalized === expectedTitle) score += 12
      if (normalized.startsWith(`${expectedTitle} `)) score += 8
      if (normalized.includes(expectedTitle)) score += 4
      if (mediumPattern.test(`${description} ${excerpt}`)) score += 4
      if (year && `${description} ${excerpt}`.includes(String(year))) score += 3
      if (/disambiguation/i.test(`${description} ${excerpt}`)) score -= 20
      return { page, score, pageTitle }
    })
    .filter((candidate) => candidate.pageTitle && candidate.score >= 6)
    .sort((left, right) => right.score - left.score)[0]?.page ?? null
}

function stringArray(value: unknown) {
  return Array.isArray(value)
    ? value.map((item) => cleanText(item)).filter(Boolean).slice(0, 8)
    : []
}

Deno.serve(async (request) => {
  let origin = "*"
  try {
    origin = allowedOrigin(request)
  } catch {
    if (request.method !== "OPTIONS")
      return response({ error: "The application origin is not allowed" }, 400, "*")
  }

  if (request.method === "OPTIONS") return response({ ok: true }, 200, origin)
  if (request.method !== "POST")
    return response({ error: "Method not allowed" }, 405, origin)

  try {
    const authorization = request.headers.get("Authorization")
    if (!authorization?.startsWith("Bearer "))
      throw new Error("Sign in before loading a refresher")

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    )
    const { data: authData, error: authError } =
      await serviceClient.auth.getUser(authorization.slice(7))
    if (authError || !authData.user)
      throw new Error("Your session is no longer valid")

    const body = (await request.json().catch(() => ({}))) as {
      contentId?: unknown
    }
    const contentId = Number(body.contentId)
    if (!Number.isSafeInteger(contentId) || contentId <= 0)
      throw new Error("A valid StreamFlix content ID is required")

    const { data: content, error: contentError } = await serviceClient
      .from("content")
      .select("content_id, category_id, title, release_year")
      .eq("content_id", contentId)
      .eq("availability_status", "available")
      .maybeSingle()
    if (contentError) throw contentError
    if (!content) return response({ error: "Content is unavailable" }, 404, origin)

    const { data: category } = await serviceClient
      .from("category")
      .select("category_name")
      .eq("category_id", content.category_id)
      .maybeSingle()
    const categoryName = cleanText(category?.category_name)
    const scope: "movie" | "series" = /tv|series/i.test(categoryName)
      ? "series"
      : "movie"

    const { data: cached } = await serviceClient
      .from("previous_film_refresher")
      .select(
        "refresher_text_summary, source_title, source_url, key_events, important_characters, key_details, source_updated_at",
      )
      .eq("content_id", contentId)
      .eq("source_name", "Wikipedia")
      .order("source_updated_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    const cachedAt = cached?.source_updated_at
      ? new Date(cached.source_updated_at).getTime()
      : 0
    if (
      cached &&
      cachedAt > Date.now() - CACHE_MAX_AGE_MS &&
      cleanText(cached.refresher_text_summary) &&
      cleanText(cached.source_url)
    ) {
      return response(
        {
          summary: cleanText(cached.refresher_text_summary),
          events: stringArray(cached.key_events),
          characters: stringArray(cached.important_characters),
          keyDetails: stringArray(cached.key_details),
          sourceName: "Wikipedia",
          sourceTitle: cleanText(cached.source_title),
          sourceUrl: cleanText(cached.source_url),
          scope,
          cached: true,
        },
        200,
        origin,
      )
    }

    const title = cleanText(content.title)
    const year = Number.isInteger(content.release_year)
      ? Number(content.release_year)
      : null
    const query = `${title}${year ? ` ${year}` : ""} ${scope === "movie" ? "film" : "television series"}`
    const userAgent =
      Deno.env.get("WIKIMEDIA_USER_AGENT")?.trim() ||
      `StreamFlix/1.0 (${Deno.env.get("APP_URL") || "Wikipedia refresher"})`
    const wikiHeaders = {
      Accept: "application/json",
      "User-Agent": userAgent,
      "Api-User-Agent": userAgent,
    }
    const searchUrl = new URL(
      "https://en.wikipedia.org/w/rest.php/v1/search/page",
    )
    searchUrl.searchParams.set("q", query)
    searchUrl.searchParams.set("limit", "8")
    const searchResponse = await fetch(searchUrl, { headers: wikiHeaders })
    if (!searchResponse.ok)
      throw new Error(`Wikipedia search failed (${searchResponse.status})`)
    const searchData = (await searchResponse.json()) as { pages?: SearchPage[] }
    const match = chooseSearchResult(
      Array.isArray(searchData.pages) ? searchData.pages : [],
      title,
      year,
      scope,
    )
    if (!match) {
      return response(
        { error: "No verified Wikipedia article was found for this title" },
        404,
        origin,
      )
    }

    const sourceTitle = cleanText(match.title)
    const articleUrl = new URL("https://en.wikipedia.org/w/api.php")
    articleUrl.search = new URLSearchParams({
      action: "query",
      format: "json",
      formatversion: "2",
      prop: "extracts|info",
      inprop: "url",
      explaintext: "1",
      redirects: "1",
      titles: sourceTitle,
    }).toString()
    const articleResponse = await fetch(articleUrl, { headers: wikiHeaders })
    if (!articleResponse.ok)
      throw new Error(`Wikipedia article request failed (${articleResponse.status})`)
    const articleData = (await articleResponse.json()) as {
      query?: { pages?: Array<{ extract?: unknown; fullurl?: unknown }> }
    }
    const page = articleData.query?.pages?.[0]
    const extract = String(page?.extract ?? "").trim()
    const sourceUrl = cleanText(page?.fullurl)
    if (!extract || !sourceUrl)
      return response(
        { error: "The matched Wikipedia article has no readable recap text" },
        404,
        origin,
      )

    const refresher = buildRefresher(
      extract,
      sourceTitle,
      sourceUrl,
      scope,
    )
    const cacheRow = {
      content_id: contentId,
      refresher_title: `Wikipedia — ${sourceTitle}`,
      refresher_text_summary: refresher.summary,
      source_name: "Wikipedia",
      source_title: sourceTitle,
      source_url: sourceUrl,
      key_events: refresher.events,
      important_characters: refresher.characters,
      key_details: refresher.keyDetails,
      availability_status: "available",
      source_updated_at: new Date().toISOString(),
    }
    if (cached) {
      await serviceClient
        .from("previous_film_refresher")
        .update(cacheRow)
        .eq("content_id", contentId)
        .eq("source_name", "Wikipedia")
    } else {
      await serviceClient.from("previous_film_refresher").insert(cacheRow)
    }

    return response(refresher, 200, origin)
  } catch (error) {
    console.error(
      "wikipedia-refresher",
      error instanceof Error ? error.message : error,
    )
    return response(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load the Wikipedia refresher",
      },
      400,
      origin,
    )
  }
})
