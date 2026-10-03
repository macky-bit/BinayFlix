import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

const DATASETS: Record<string, { label: string; tables: string[] }> = {
  full: {
    label: "Full Database",
    tables: [
      "admin", "master_admin", "category", "genre", "content",
      "content_genre", "soundtrack", "previous_film_refresher",
      "content_review", "reaction", "content_comment", "community_post",
      "community_comment", "platform_feedback", "user", "subscriber",
      "member_profile", "watch_history", "subscription", "user_subscription",
      "payment_transaction", "system_log", "backup_job",
    ],
  },
  catalog: {
    label: "Content Catalog",
    tables: [
      "category", "genre", "content", "content_genre", "soundtrack",
      "previous_film_refresher",
    ],
  },
  community: {
    label: "Community Data",
    tables: [
      "content_review", "reaction", "content_comment", "community_post",
      "community_comment", "platform_feedback",
    ],
  },
  accounts: {
    label: "Accounts & Subscriptions",
    tables: [
      "user", "subscriber", "member_profile", "watch_history",
      "subscription", "user_subscription", "payment_transaction",
    ],
  },
  system: {
    label: "System Configuration",
    tables: ["admin", "master_admin", "system_log", "backup_job"],
  },
}

const sensitiveColumn = (column: string) =>
  /password|secret|token|pin_hash|encrypted/i.test(column)

function csvCell(value: unknown): string {
  if (value == null) return ""
  let output = typeof value === "object" ? JSON.stringify(value) : String(value)
  if (/^[=+\-@]/.test(output)) output = `'${output}`
  return `"${output.replaceAll('"', '""')}"`
}

function toCsv(rows: Record<string, unknown>[]): string {
  const columns = [...new Set(rows.flatMap((row) => Object.keys(row)))]
    .filter((column) => !sensitiveColumn(column))
  if (columns.length === 0) return "record_status\r\n\"No rows\"\r\n"
  const lines = [columns.map(csvCell).join(",")]
  for (const row of rows) {
    lines.push(columns.map((column) => csvCell(row[column])).join(","))
  }
  return `${lines.join("\r\n")}\r\n`
}

async function authenticate(request: Request, serviceClient: ReturnType<typeof createClient>) {
  const authorization = request.headers.get("Authorization")
  if (!authorization?.startsWith("Bearer ")) throw new Error("Authentication is required")
  const token = authorization.slice(7)
  const { data: userData, error: userError } = await serviceClient.auth.getUser(token)
  if (userError || !userData.user) throw new Error("Invalid administrator session")

  const { data: admin } = await serviceClient
    .from("admin")
    .select("role, status")
    .eq("auth_user_id", userData.user.id)
    .maybeSingle()
  const role = String(admin?.role ?? "").replaceAll(" ", "").toLowerCase()
  if (!admin || admin.status !== "Active" || !["masteradmin", "systemmanager"].includes(role)) {
    throw new Error("System Manager access is required")
  }
  return userData.user
}

async function readAllRows(serviceClient: ReturnType<typeof createClient>, table: string) {
  const rows: Record<string, unknown>[] = []
  const pageSize = 1000
  for (let start = 0; ; start += pageSize) {
    const { data, error } = await serviceClient
      .from(table)
      .select("*")
      .range(start, start + pageSize - 1)
    if (error) throw new Error(`${table}: ${error.message}`)
    rows.push(...((data ?? []) as Record<string, unknown>[]))
    if (!data || data.length < pageSize) break
  }
  return rows
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405, headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  try {
    const user = await authenticate(request, serviceClient)
    const body = await request.json()

    if (body.action === "download") {
      const { data: job, error: jobError } = await serviceClient
        .from("backup_job")
        .select("storage_path, status")
        .eq("backup_job_id", body.jobId)
        .single()
      if (jobError || !job?.storage_path) throw new Error("Backup files are unavailable")
      if (job.status !== "Successful") throw new Error("Only successful backups can be downloaded")

      const { data: objects, error: listError } = await serviceClient.storage
        .from("database-backups")
        .list(job.storage_path, { limit: 100, sortBy: { column: "name", order: "asc" } })
      if (listError) throw listError
      const paths = (objects ?? []).filter((object) => object.name.endsWith(".csv"))
        .map((object) => `${job.storage_path}/${object.name}`)
      const { data: signed, error: signedError } = await serviceClient.storage
        .from("database-backups")
        .createSignedUrls(paths, 300)
      if (signedError) throw signedError
      const files = (signed ?? []).map((file) => {
        const result = file as typeof file & { signedURL?: string; signedUrl?: string }
        const rawUrl = result.signedUrl ?? result.signedURL ?? ""
        return {
          path: result.path,
          signedUrl: rawUrl.startsWith("http")
            ? rawUrl
            : `${supabaseUrl}/storage/v1${rawUrl}`,
          error: result.error,
        }
      })
      return Response.json({ files }, { headers: { ...corsHeaders, "Content-Type": "application/json" } })
    }

    const dataset = DATASETS[String(body.dataset)]
    if (!dataset) throw new Error("Select a valid backup dataset")
    const startedAt = new Date().toISOString()
    const { data: job, error: createError } = await serviceClient
      .from("backup_job")
      .insert({
        backup_type: dataset.label,
        dataset_key: body.dataset,
        description: String(body.description ?? "").trim() || null,
        status: "In Progress",
        table_names: dataset.tables,
        created_by: user.id,
        started_at: startedAt,
      })
      .select("backup_job_id")
      .single()
    if (createError) throw createError

    const folder = `${job.backup_job_id}/${startedAt.replaceAll(":", "-")}`
    const uploadedPaths: string[] = []
    let totalBytes = 0

    try {
      for (const table of dataset.tables) {
        const csv = toCsv(await readAllRows(serviceClient, table))
        const bytes = new TextEncoder().encode(csv)
        const path = `${folder}/${table}.csv`
        const { error: uploadError } = await serviceClient.storage
          .from("database-backups")
          .upload(path, bytes, { contentType: "text/csv; charset=utf-8", upsert: false })
        if (uploadError) throw new Error(`${table}: ${uploadError.message}`)
        uploadedPaths.push(path)
        totalBytes += bytes.byteLength
      }

      const completedAt = new Date().toISOString()
      const { error: completeError } = await serviceClient
        .from("backup_job")
        .update({
          status: "Successful",
          storage_path: folder,
          size_bytes: totalBytes,
          file_count: uploadedPaths.length,
          completed_at: completedAt,
          error_message: null,
        })
        .eq("backup_job_id", job.backup_job_id)
      if (completeError) throw completeError
      return Response.json({
        jobId: String(job.backup_job_id),
        dataset: body.dataset,
        tables: dataset.tables,
        fileCount: uploadedPaths.length,
        sizeBytes: totalBytes,
      }, { headers: { ...corsHeaders, "Content-Type": "application/json" } })
    } catch (error) {
      if (uploadedPaths.length > 0) {
        await serviceClient.storage.from("database-backups").remove(uploadedPaths)
      }
      await serviceClient.from("backup_job").update({
        status: "Failed",
        completed_at: new Date().toISOString(),
        error_message: error instanceof Error ? error.message : "Backup failed",
      }).eq("backup_job_id", job.backup_job_id)
      throw error
    }
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Backup request failed" },
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    )
  }
})
