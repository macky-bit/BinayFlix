import type { SupabaseClient } from "@supabase/supabase-js"

interface SubtitleRow {
  subtitle: string | null

  category: { category_name: string } | { category_name: string }[] | null
}

export interface SubtitleCue {
  start: number

  end: number

  text: string
}

function categoryName(row: SubtitleRow) {
  const category = Array.isArray(row.category) ? row.category[0] : row.category

  return category?.category_name?.trim().toLowerCase() ?? ""
}

export function convertSrtToVtt(source: string) {
  const cleanSource = source.replace(/^\uFEFF/, "").trim()

  if (/^WEBVTT(?:\s|$)/i.test(cleanSource)) return cleanSource

  return `WEBVTT\n\n${cleanSource.replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, "$1.$2")}`
}

function parseTimestamp(value: string) {
  const match = value.trim().match(/^(?:(\d+):)?(\d{2}):(\d{2})[,.](\d{3})$/)

  if (!match) return null

  return (
    Number(match[1] ?? 0) * 3600 +
    Number(match[2]) * 60 +
    Number(match[3]) +
    Number(match[4]) / 1000
  )
}

function parseAssTimestamp(value: string) {
  const match = value.trim().match(/^(\d+):(\d{2}):(\d{2})\.(\d{1,2})$/)
  if (!match) return null
  return Number(match[1]) * 3600 + Number(match[2]) * 60 +
    Number(match[3]) + Number(match[4].padEnd(2, "0")) / 100
}

function parseAssCues(source: string): SubtitleCue[] {
  const lines = source.replace(/^\uFEFF/, "").split(/\r?\n/)
  let inEvents = false
  let fields: string[] = []
  const cues: SubtitleCue[] = []

  for (const line of lines) {
    const trimmed = line.trim()
    if (/^\[.*\]$/.test(trimmed)) {
      inEvents = /^\[Events\]$/i.test(trimmed)
      continue
    }
    if (!inEvents) continue
    if (/^Format\s*:/i.test(trimmed)) {
      fields = trimmed.replace(/^Format\s*:/i, "").split(",").map((field) => field.trim().toLowerCase())
      continue
    }
    if (!/^Dialogue\s*:/i.test(trimmed) || !fields.length) continue

    const values = trimmed.replace(/^Dialogue\s*:/i, "").split(",")
    if (values.length < fields.length) continue
    const startIndex = fields.indexOf("start")
    const endIndex = fields.indexOf("end")
    const textIndex = fields.indexOf("text")
    if (startIndex < 0 || endIndex < 0 || textIndex < 0) continue
    const start = parseAssTimestamp(values[startIndex])
    const end = parseAssTimestamp(values[endIndex])
    const text = values.slice(textIndex).join(",")
      .replace(/\{[^}]*\}/g, "")
      .replace(/\\[Nn]/g, "\n")
      .replace(/\\h/g, " ")
      .trim()
    if (start !== null && end !== null && end > start && text) {
      cues.push({ start, end, text })
    }
  }
  return cues
}

export function parseSubtitleCues(source: string): SubtitleCue[] {
  if (/^\s*(?:\uFEFF)?\[Script Info\]/i.test(source) || /\[Events\]/i.test(source)) {
    return parseAssCues(source)
  }
  return source

    .replace(/^\uFEFF/, "")

    .replace(/^WEBVTT[^\n]*\n/i, "")

    .split(/\r?\n\s*\r?\n/)

    .flatMap((block) => {
      const lines = block.split(/\r?\n/)

      const timingIndex = lines.findIndex((line) => line.includes("-->"))

      if (timingIndex < 0) return []

      const [startValue, endValue] = lines[timingIndex].split("-->")

      const start = parseTimestamp(startValue)

      const end = parseTimestamp(endValue.trim().split(/\s/)[0])

      const text = lines
        .slice(timingIndex + 1)
        .join("\n")
        .trim()

      return start === null || end === null || !text
        ? []
        : [{ start, end, text }]
    })
}

export async function loadSubtitleTrack(
  client: SupabaseClient,

  tmdbId: number | null | undefined,

  isSeries: boolean,

  contentId?: number,
) {
  if (contentId === undefined && tmdbId == null) return null

  let request = client

    .from("content")

    .select("subtitle, category(category_name)")

    .not("subtitle", "is", null)

    .limit(10)

  request = contentId === undefined
    ? request.eq("tmdb_id", tmdbId!)
    : request.eq("content_id", contentId)

  const { data, error } = await request

  if (error) throw error

  const expectedCategory = isSeries ? "tv series" : "movie"

  const content = ((data ?? []) as unknown as SubtitleRow[]).find(
    (row) =>
      categoryName(row) === expectedCategory &&
      typeof row.subtitle === "string" &&
      row.subtitle.trim().length > 0,
  )

  if (!content?.subtitle) return null

  const path = content.subtitle.trim()
  let source: string
  if (/^https?:\/\//i.test(path)) {
    const response = await fetch(path)
    if (!response.ok) throw new Error(`Subtitle file could not be loaded (${response.status}).`)
    source = await response.text()
  } else {
    const { data: file, error: downloadError } = await client.storage
      .from("subtitle")
      .download(path.replace(/^\/+/, ""))
    if (downloadError) throw downloadError
    if (!file) throw new Error("The subtitle file could not be downloaded.")
    source = await file.text()
  }

  const cues = parseSubtitleCues(source)

  if (cues.length === 0) {
    throw new Error("The subtitle file does not contain any valid cues.")
  }

  return cues
}
