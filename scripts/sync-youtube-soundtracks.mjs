import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const ROOT = process.cwd();
const ENV_FILES = [
  path.join(ROOT, ".env.local"),
  path.join(ROOT, "supabase", ".env.youtube.local"),
];

function showHelp() {
  console.log(`Usage: npm run soundtrack:youtube -- [options]

Builds an idempotent Supabase migration containing high-confidence YouTube
soundtrack links for available content that does not already have a soundtrack.

Required environment variables:
  YOUTUBE_API_KEY
  VITE_SUPABASE_URL
  VITE_SUPABASE_PUBLISHABLE_KEY

Options:
  --apply             Run "supabase db push" after generating the migration.
  --limit <number>    Process at most this many unmatched titles.
  --content-id <id>   Process one Supabase content ID.
  --min-score <score> Minimum match score (default: 10).
  --help              Show this help.

Secrets may be placed in supabase/.env.youtube.local. That file is ignored by Git.`);
}

async function loadLocalEnvironment() {
  for (const file of ENV_FILES) {
    let source;
    try {
      source = await readFile(file, "utf8");
    } catch (error) {
      if (error?.code === "ENOENT") continue;
      throw error;
    }

    for (const rawLine of source.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;
      const separator = line.indexOf("=");
      if (separator < 1) continue;
      const name = line.slice(0, separator).trim();
      if (process.env[name]) continue;
      let value = line.slice(separator + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      process.env[name] = value;
    }
  }
}

function parseArguments(argv) {
  const options = {
    apply: false,
    contentId: null,
    limit: Number.POSITIVE_INFINITY,
    minScore: 10,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--help") return { ...options, help: true };
    if (argument === "--apply") {
      options.apply = true;
      continue;
    }

    const value = argv[index + 1];
    if (argument === "--limit") {
      options.limit = Number.parseInt(value, 10);
      index += 1;
    } else if (argument === "--content-id") {
      options.contentId = Number.parseInt(value, 10);
      index += 1;
    } else if (argument === "--min-score") {
      options.minScore = Number.parseInt(value, 10);
      index += 1;
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }

  if (!Number.isFinite(options.limit) && options.limit !== Number.POSITIVE_INFINITY) {
    throw new Error("--limit must be a positive integer.");
  }
  if (options.limit <= 0 || (options.contentId !== null && options.contentId <= 0)) {
    throw new Error("Limits and content IDs must be positive integers.");
  }
  return options;
}

function normalize(value) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const GENERIC_WORDS = new Set([
  "a",
  "an",
  "and",
  "at",
  "in",
  "is",
  "of",
  "on",
  "the",
  "to",
  "with",
]);

function titleTokens(title) {
  return normalize(title)
    .split(" ")
    .filter((token) => token.length > 1 && !GENERIC_WORDS.has(token));
}

function scoreCandidate(content, item) {
  const videoTitle = normalize(item.snippet.title);
  const description = normalize(item.snippet.description || "");
  const channel = normalize(item.snippet.channelTitle || "");
  const haystack = `${videoTitle} ${description} ${channel}`;
  const normalizedContentTitle = normalize(content.title);
  const tokens = titleTokens(content.title);
  const matchingTokens = tokens.filter((token) => haystack.includes(token));
  const tokenRatio = tokens.length ? matchingTokens.length / tokens.length : 0;

  let score = Math.round(tokenRatio * 8);
  if (videoTitle.includes(normalizedContentTitle)) score += 7;
  if (/\b(official|soundtrack|score|ost|theme|opening|main title|audio)\b/.test(haystack)) score += 5;
  if (/\b(topic|vevo|records|soundtracks?|music)\b/.test(channel)) score += 2;
  if (/\b(trailer|teaser|reaction|review|breakdown|cover|karaoke|remix|fan made|fanmade)\b/.test(videoTitle)) score -= 8;
  if (content.release_year && haystack.includes(String(content.release_year))) score += 1;

  return { score, tokenRatio };
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`${response.status} ${response.statusText}: ${body.slice(0, 500)}`);
  }
  return response.json();
}

async function loadCatalog(supabaseUrl, supabaseKey) {
  const headers = {
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
  };
  const contentUrl = new URL("/rest/v1/content", supabaseUrl);
  contentUrl.searchParams.set("select", "content_id,title,release_year,tmdb_id,category_id");
  contentUrl.searchParams.set("availability_status", "eq.available");
  contentUrl.searchParams.set("order", "content_id.asc");

  const soundtrackUrl = new URL("/rest/v1/soundtrack", supabaseUrl);
  soundtrackUrl.searchParams.set("select", "content_id");

  const [content, soundtracks] = await Promise.all([
    fetchJson(contentUrl, { headers }),
    fetchJson(soundtrackUrl, { headers }),
  ]);
  return {
    content,
    existingContentIds: new Set(soundtracks.map((row) => Number(row.content_id))),
  };
}

async function searchYouTube(apiKey, content, minScore) {
  const mediaType = Number(content.category_id) === 2 ? "TV series" : "movie";
  const query = `${content.title} ${content.release_year || ""} ${mediaType} official soundtrack theme`;
  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  url.searchParams.set("part", "snippet");
  url.searchParams.set("type", "video");
  url.searchParams.set("videoEmbeddable", "true");
  url.searchParams.set("safeSearch", "moderate");
  url.searchParams.set("maxResults", "5");
  url.searchParams.set("q", query);
  url.searchParams.set("key", apiKey);

  const data = await fetchJson(url);
  const ranked = (data.items || [])
    .map((item) => ({ item, ...scoreCandidate(content, item) }))
    .filter(({ item, tokenRatio }) => item.id?.videoId && tokenRatio >= 0.6)
    .sort((left, right) => right.score - left.score);
  const winner = ranked[0];
  if (!winner || winner.score < minScore) return null;

  return {
    contentId: Number(content.content_id),
    contentTitle: content.title,
    songTitle: winner.item.snippet.title,
    artist: winner.item.snippet.channelTitle || null,
    externalUrl: `https://www.youtube.com/watch?v=${winner.item.id.videoId}`,
    score: winner.score,
  };
}

function sqlString(value) {
  if (value === null || value === undefined || value === "") return "null";
  return `'${String(value).replaceAll("'", "''")}'`;
}

function createMigration(matches) {
  const values = matches
    .map(
      (match) =>
        `  (${match.contentId}, ${sqlString(match.songTitle.slice(0, 255))}, ${sqlString(match.songTitle)}, ${sqlString(match.artist?.slice(0, 255))}, ${sqlString(match.externalUrl)})`,
    )
    .join(",\n");

  return `-- Generated by scripts/sync-youtube-soundtracks.mjs.
-- YouTube watch pages are references, not direct audio streams.
with discovered (content_id, song_title, track_title, artist, external_url) as (
  values
${values}
)
insert into public.soundtrack (
  content_id,
  song_title,
  track_title,
  artist,
  external_url,
  stream_link
)
select
  discovered.content_id,
  discovered.song_title,
  discovered.track_title,
  discovered.artist,
  discovered.external_url,
  null
from discovered
where not exists (
  select 1
  from public.soundtrack existing
  where existing.content_id = discovered.content_id
    and existing.external_url = discovered.external_url
);
`;
}

async function applyMigration() {
  const { spawn } = await import("node:child_process");
  await new Promise((resolve, reject) => {
    const child = spawn("supabase", ["db", "push"], {
      cwd: ROOT,
      shell: process.platform === "win32",
      stdio: "inherit",
    });
    child.once("error", reject);
    child.once("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`supabase db push exited with code ${code}.`));
    });
  });
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    showHelp();
    return;
  }

  await loadLocalEnvironment();
  const apiKey = process.env.YOUTUBE_API_KEY;
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const missing = [
    ["YOUTUBE_API_KEY", apiKey],
    ["VITE_SUPABASE_URL", supabaseUrl],
    ["VITE_SUPABASE_PUBLISHABLE_KEY", supabaseKey],
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name);
  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }

  const { content, existingContentIds } = await loadCatalog(supabaseUrl, supabaseKey);
  const candidates = content
    .filter((item) => !existingContentIds.has(Number(item.content_id)))
    .filter((item) => options.contentId === null || Number(item.content_id) === options.contentId)
    .slice(0, options.limit);

  if (!candidates.length) {
    console.log("No unmatched content records were found.");
    return;
  }

  const matches = [];
  const skipped = [];
  for (const [index, contentItem] of candidates.entries()) {
    console.log(`[${index + 1}/${candidates.length}] Searching: ${contentItem.title}`);
    const match = await searchYouTube(apiKey, contentItem, options.minScore);
    if (match) matches.push(match);
    else skipped.push({ contentId: contentItem.content_id, title: contentItem.title });
  }

  await mkdir(path.join(ROOT, "artifacts"), { recursive: true });
  await writeFile(
    path.join(ROOT, "artifacts", "youtube-soundtrack-sync-report.json"),
    `${JSON.stringify({ generatedAt: new Date().toISOString(), matches, skipped }, null, 2)}\n`,
    "utf8",
  );

  if (!matches.length) {
    console.log("No high-confidence matches were found. No migration was created.");
    return;
  }

  const timestamp = new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
  const migrationPath = path.join(
    ROOT,
    "supabase",
    "migrations",
    `${timestamp}_sync_youtube_soundtracks.sql`,
  );
  await writeFile(migrationPath, createMigration(matches), "utf8");
  console.log(`Created ${path.relative(ROOT, migrationPath)} with ${matches.length} matches.`);
  console.log(`Skipped ${skipped.length} titles with no high-confidence match.`);

  if (options.apply) await applyMigration();
  else console.log("Review the report and migration, then rerun with --apply or run supabase db push.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
