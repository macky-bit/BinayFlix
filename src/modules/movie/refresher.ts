import type { SupabaseClient } from "@supabase/supabase-js"

export interface WikipediaRefresher {
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

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.every((item) => typeof item === "string")
  )
}

function isRefresher(value: unknown): value is WikipediaRefresher {
  if (!value || typeof value !== "object") return false
  const candidate = value as Partial<WikipediaRefresher>
  return (
    typeof candidate.summary === "string" &&
    isStringArray(candidate.events) &&
    isStringArray(candidate.characters) &&
    isStringArray(candidate.keyDetails) &&
    candidate.sourceName === "Wikipedia" &&
    typeof candidate.sourceTitle === "string" &&
    /^https:\/\/en\.wikipedia\.org\//i.test(candidate.sourceUrl ?? "") &&
    (candidate.scope === "movie" || candidate.scope === "series") &&
    typeof candidate.cached === "boolean"
  )
}

async function functionErrorMessage(error: unknown) {
  let message = error instanceof Error ? error.message : ""
  const context = (error as { context?: unknown } | null)?.context
  if (context instanceof Response) {
    const payload = (await context
      .clone()
      .json()
      .catch(() => null)) as { error?: unknown } | null
    if (typeof payload?.error === "string" && payload.error.trim()) {
      message = payload.error.trim()
    }
  }
  return message || "Unable to load this refresher."
}

export async function loadWikipediaRefresher(
  client: SupabaseClient,
  contentId: number,
) {
  const { data, error } = await client.functions.invoke(
    "wikipedia-refresher",
    { body: { contentId } },
  )
  if (error) throw new Error(await functionErrorMessage(error))
  if (!isRefresher(data))
    throw new Error("Wikipedia returned an invalid refresher response.")
  return data
}
