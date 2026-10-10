import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import process from "node:process"

import { createClient } from "@supabase/supabase-js"

import { loadTrackLyrics } from "../src/modules/movie/lyrics.ts"

const ROOT = process.cwd()
const BUCKET = "soundtrack-lyrics"
const ENV_FILES = [
  path.join(ROOT, ".env.local"),
  path.join(ROOT, "supabase", ".env.lyrics.local"),
]

async function loadLocalEnvironment() {
  for (const file of ENV_FILES) {
    let source
    try {
      source = await readFile(file, "utf8")
    } catch (error) {
      if (error?.code === "ENOENT") continue
      throw error
    }

    for (const rawLine of source.split(/\r?\n/)) {
      const line = rawLine.trim()
      if (!line || line.startsWith("#")) continue
      const separator = line.indexOf("=")
      if (separator < 1) continue
      const name = line.slice(0, separator).trim()
      if (process.env[name]) continue
      let value = line.slice(separator + 1).trim()
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1)
      }
      process.env[name] = value
    }
  }
}

function parseArguments(argv) {
  const options = { apply: false, overwrite: false, contentId: null }
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]
    if (argument === "--apply") options.apply = true
    else if (argument === "--overwrite") options.overwrite = true
    else if (argument === "--content-id") {
      options.contentId = Number.parseInt(argv[index + 1], 10)
      index += 1
    } else {
      throw new Error(`Unknown argument: ${argument}`)
    }
  }
  if (options.contentId !== null && (!Number.isInteger(options.contentId) || options.contentId <= 0)) {
    throw new Error("--content-id must be a positive integer.")
  }
  return options
}

function textFile(value) {
  return new Blob([`${value.trim()}\n`], { type: "text/plain" })
}

function slugify(value) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "untitled"
}

function contentFolder(contentId, title) {
  const rangeStart = Math.floor((contentId - 1) / 10) * 10 + 1
  const rangeEnd = rangeStart + 9
  return `${rangeStart}-${rangeEnd}_content/${contentId}-${slugify(title)}`
}

async function uploadText(storage, objectPath, value) {
  const { error } = await storage.upload(objectPath, textFile(value), {
    contentType: "text/plain; charset=utf-8",
    upsert: true,
  })
  if (error) throw error
}

async function main() {
  const options = parseArguments(process.argv.slice(2))
  await loadLocalEnvironment()

  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) {
    throw new Error(
      "VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required. Keep the service key in supabase/.env.lyrics.local, never in a VITE_ variable.",
    )
  }

  const client = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  let query = client
    .from("soundtrack")
    .select(
      "soundtrack_id, content_id, song_title, track_title, artist, lyrics, synced_lyrics, lyrics_storage_path, synced_lyrics_storage_path, lyrics_source_id",
    )
    .order("content_id", { ascending: true })
    .order("soundtrack_id", { ascending: true })
  if (options.contentId !== null) query = query.eq("content_id", options.contentId)

  const { data, error } = await query
  if (error) throw error

  const contentIds = [...new Set((data ?? []).map((row) => Number(row.content_id)))]
  const { data: contentRows, error: contentError } = contentIds.length
    ? await client.from("content").select("content_id, title").in("content_id", contentIds)
    : { data: [], error: null }
  if (contentError) throw contentError
  const contentTitles = new Map(
    (contentRows ?? []).map((row) => [Number(row.content_id), String(row.title)]),
  )

  const report = { generatedAt: new Date().toISOString(), stored: [], instrumental: [], unavailable: [], errors: [] }
  const storage = client.storage.from(BUCKET)

  for (const row of data ?? []) {
    const id = Number(row.soundtrack_id)
    const contentId = Number(row.content_id)

    try {
      const title = contentTitles.get(contentId)
      if (!title) throw new Error(`Content ${contentId} was not found.`)
      const basePath = contentFolder(contentId, title)
      const desiredLyricsPath = `${basePath}/lyrics.txt`
      const desiredSyncedPath = `${basePath}/lyrics.lrc`
      if (
        !options.overwrite &&
        row.lyrics_storage_path === desiredLyricsPath &&
        (!row.synced_lyrics || row.synced_lyrics_storage_path === desiredSyncedPath)
      )
        continue

      if (row.lyrics?.trim()) {
        const oldPaths = [
          row.lyrics_storage_path,
          row.synced_lyrics_storage_path,
        ].filter(
          (storedPath) =>
            storedPath &&
            storedPath !== desiredLyricsPath &&
            storedPath !== desiredSyncedPath,
        )
        if (options.apply) {
          await uploadText(storage, desiredLyricsPath, row.lyrics)
          if (row.synced_lyrics?.trim()) {
            await uploadText(storage, desiredSyncedPath, row.synced_lyrics)
          }
          const { error: updateError } = await client
            .from("soundtrack")
            .update({
              lyrics_storage_path: desiredLyricsPath,
              synced_lyrics_storage_path: row.synced_lyrics?.trim()
                ? desiredSyncedPath
                : null,
              lyrics_updated_at: new Date().toISOString(),
            })
            .eq("soundtrack_id", id)
          if (updateError) throw updateError
          if (oldPaths.length) {
            const { error: removeError } = await storage.remove(oldPaths)
            if (removeError) throw removeError
          }
        }
        report.stored.push({ soundtrackId: id, contentId, source: "existing" })
        continue
      }

      if (!options.overwrite && row.lyrics_source_id) continue
      const result = await loadTrackLyrics(
        row.song_title?.trim() || row.track_title?.trim() || "",
        row.artist?.trim() || "Artist unavailable",
      )
      if (!result) {
        report.unavailable.push({ soundtrackId: id, contentId })
        continue
      }

      const lyricsPath = result.lyrics ? desiredLyricsPath : null
      const syncedPath = result.syncedLyrics ? desiredSyncedPath : null
      if (options.apply) {
        if (lyricsPath) await uploadText(storage, lyricsPath, result.lyrics)
        if (syncedPath) await uploadText(storage, syncedPath, result.syncedLyrics)

        const { error: updateError } = await client
          .from("soundtrack")
          .update({
            lyrics: result.lyrics || null,
            synced_lyrics: result.syncedLyrics || null,
            lyrics_storage_path: lyricsPath,
            synced_lyrics_storage_path: syncedPath,
            lyrics_source_id: result.sourceId,
            lyrics_source_url: result.sourceUrl,
            lyrics_instrumental: result.instrumental,
            lyrics_updated_at: new Date().toISOString(),
          })
          .eq("soundtrack_id", id)
        if (updateError) throw updateError
      }

      const target = result.instrumental ? report.instrumental : report.stored
      target.push({ soundtrackId: id, contentId, sourceId: result.sourceId })
    } catch (error) {
      report.errors.push({
        soundtrackId: id,
        contentId,
        message: error instanceof Error ? error.message : String(error),
      })
    }
  }

  await mkdir(path.join(ROOT, "artifacts"), { recursive: true })
  await writeFile(
    path.join(ROOT, "artifacts", "soundtrack-lyrics-sync-report.json"),
    `${JSON.stringify(report, null, 2)}\n`,
    "utf8",
  )

  console.log(
    `${options.apply ? "Stored" : "Found"} ${report.stored.length} lyric files; ${report.instrumental.length} instrumental tracks; ${report.unavailable.length} unavailable; ${report.errors.length} errors.`,
  )
  if (!options.apply) console.log("Dry run only. Rerun with --apply after reviewing the report.")
  if (report.errors.length) process.exitCode = 1
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})

