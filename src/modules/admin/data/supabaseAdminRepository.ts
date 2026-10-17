import type { SupabaseClient } from "@supabase/supabase-js"

import type {
  AdminActionRequest,
  AdminActionResult,
  AdminEntity,
  AdminListQuery,
  AdminPage,
  AdminRepository,
  AdminResourceName,
  AdminSession,
} from "./contracts"

import type { AdminDataServices } from "./repositories"

import type { ContentUploadProgress } from "../contentManager/types"

type DatabaseRecord = Record<string, any>

interface ResourceConfiguration {
  table: string

  idColumn: string

  select: string

  orderColumn: string

  fromRow: (row: DatabaseRecord) => AdminEntity

  toRow: (record: DatabaseRecord) => DatabaseRecord
}

const text = (value: unknown) => (value == null ? "" : String(value))

const number = (value: unknown) => Number(value ?? 0)

const positiveInteger = (value: unknown, label: string) => {
  const parsed = Number(value)

  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new Error(`${label} must be a positive integer`)
  }

  return parsed
}

const date = (value: unknown) =>
  value ? new Date(String(value)).toLocaleString() : ""

const colorFor = (id: unknown) => {
  const palette = ["#7C3AED", "#2563EB", "#059669", "#DC2626", "#D97706"]

  const source = text(id)

  const hash = [...source].reduce(
    (total, char) => total + char.charCodeAt(0),

    0,
  )

  return palette[hash % palette.length]
}

const related = (value: unknown): DatabaseRecord | null =>
  Array.isArray(value)
    ? (value[0] as DatabaseRecord | undefined ?? null)
    : (value as DatabaseRecord | null ?? null)

const FEEDBACK_ATTACHMENT_BUCKET = "feedback-attachments"

const uploadWithProgress = async ({
  client,
  bucket,
  path,
  file,
  signal,
  onProgress,
}: {
  client: SupabaseClient
  bucket: string
  path: string
  file: File
  signal?: AbortSignal
  onProgress?: (loadedBytes: number) => void
}) => {
  if (signal?.aborted) throw new DOMException("Upload cancelled", "AbortError")

  const { data, error } = await client.storage
    .from(bucket)
    .createSignedUploadUrl(path)

  if (error) throw error

  if (signal?.aborted) throw new DOMException("Upload cancelled", "AbortError")

  await new Promise<void>((resolve, reject) => {
    const request = new XMLHttpRequest()
    const body = new FormData()
    const abort = () => request.abort()

    body.append("cacheControl", "3600")
    body.append("", file)
    request.open("PUT", data.signedUrl)
    request.setRequestHeader("x-upsert", "false")

    request.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) onProgress?.(event.loaded)
    })
    request.addEventListener("load", () => {
      signal?.removeEventListener("abort", abort)
      if (request.status >= 200 && request.status < 300) {
        onProgress?.(file.size)
        resolve()
        return
      }

      reject(
        new Error(
          request.responseText || `Storage upload failed (${request.status})`,
        ),
      )
    })
    request.addEventListener("error", () => {
      signal?.removeEventListener("abort", abort)
      reject(
        new Error("Storage upload failed. Check your connection and retry."),
      )
    })
    request.addEventListener("abort", () => {
      signal?.removeEventListener("abort", abort)
      reject(new DOMException("Upload cancelled", "AbortError"))
    })
    signal?.addEventListener("abort", abort, { once: true })
    request.send(body)
  })
}

const removeStorageAssets = async (
  client: SupabaseClient,
  assets: Array<Record<"bucket" | "path", string>>,
) => {
  const failures: string[] = []
  for (const asset of assets) {
    const { error } = await client.storage.from(asset.bucket).remove([asset.path])
    if (error) failures.push(`${asset.bucket}/${asset.path}: ${error.message}`)
  }
  if (failures.length)
    throw new Error(`Storage cleanup incomplete: ${failures.join("; ")}`)
}

const adminRoleLabel = (value: unknown) => {
  const normalized = text(value).replace(/\s/g, "").toLowerCase()

  const labels: Record<string, string> = {
    masteradmin: "Master Admin",

    contentmanager: "Content Manager",

    commentmanager: "Comment Manager",

    feedbackmanager: "Feedback Manager",

    usermanager: "User Manager",

    systemmanager: "System Manager",
  }

  return labels[normalized] ?? (text(value) || "Unknown Role")
}

const adminRoleValue = (value: unknown) => {
  const normalized = text(value).replace(/\s/g, "").toLowerCase()

  const values: Record<string, string> = {
    masteradmin: "masterAdmin",

    contentmanager: "contentManager",

    commentmanager: "commentManager",

    feedbackmanager: "feedbackManager",

    usermanager: "userManager",

    systemmanager: "systemManager",
  }

  return values[normalized] ?? text(value)
}

const CONFIG: Record<AdminResourceName, ResourceConfiguration> = {
  managers: {
    table: "admin",

    idColumn: "admin_id",

    select: "*",

    orderColumn: "created_at",

    fromRow: (row) => ({
      id: text(row.admin_id),

      name: text(row.full_name),

      email: text(row.email),

      username: text(row.username),

      role: adminRoleLabel(row.role),

      status: text(row.status || "Active"),

      lastLogin: row.last_login ? String(row.last_login) : null,

      avatarColor: colorFor(row.admin_id),
    }),

    toRow: (record) => ({
      full_name: record.name,

      email: record.email,

      username: record.username,

      role: adminRoleValue(record.role),

      status: record.status,

      last_login: record.lastLogin,
    }),
  },

  content: {
    table: "content",

    idColumn: "content_id",

    select:
      "*, category(category_name), content_genre(genre_id, genre(genre_name))",

    orderColumn: "content_id",

    fromRow: (row) => ({
      id: text(row.content_id),

      tmdbId: row.tmdb_id == null ? null : number(row.tmdb_id),

      title: text(row.title),

      category: text(related(row.category)?.category_name),

      categoryId: text(row.category_id),

      genreIds: (row.content_genre ?? []).map((item: DatabaseRecord) =>
        text(item.genre_id),
      ),

      genres: (row.content_genre ?? []).map((item: DatabaseRecord) =>
        text(related(item.genre)?.genre_name),
      ),

      synopsis: text(row.synopsis),

      releaseYear: number(row.release_year),

      runtime: number(row.runtime),

      runtimeLabel: row.runtime ? `${number(row.runtime)} min` : "",

      ageRating: text(row.age_rating),

      thumbnailUrl: text(row.thumbnail),

      thumbnail: text(row.thumbnail),

      thumbnailFilename: text(row.thumbnail).split("/").pop() ?? "",

      videoFilename: text(row.video_file),

      subtitleFilename: text(row.subtitle),

      totalStreams: number(row.total_streams_count),

      availability:
        row.availability_status === "unavailable" ? "unavailable" : "available",

      availabilityLabel:
        row.availability_status === "unavailable" ? "Unavailable" : "Available",

      syncedAt: text(row.synced_at),
    }),

    toRow: (record) => ({
      title: record.title,

      tmdb_id: record.tmdbId ?? null,

      category_id: record.categoryId ? number(record.categoryId) : null,

      synopsis: record.synopsis,

      release_year: record.releaseYear,

      runtime:
        record.runtime === undefined
          ? undefined
          : positiveInteger(record.runtime, "Runtime"),

      age_rating: record.ageRating,

      thumbnail: record.thumbnailUrl,

      video_file: record.videoFilename,

      subtitle: record.subtitleFilename,

      total_streams_count: record.totalStreams,

      availability_status: text(record.availability).toLowerCase(),
    }),
  },

  categories: {
    table: "category",

    idColumn: "category_id",

    select: "*, content(count)",

    orderColumn: "category_name",

    fromRow: (row) => ({
      id: text(row.category_id),

      name: text(row.category_name),

      description: text(row.description),

      contentCount: number(related(row.content)?.count),
    }),

    toRow: (record) => ({
      category_name: record.name,

      description: record.description,
    }),
  },

  genres: {
    table: "genre",

    idColumn: "genre_id",

    select: "*, content_genre(count)",

    orderColumn: "genre_name",

    fromRow: (row) => ({
      id: text(row.genre_id),

      name: text(row.genre_name),

      description: text(row.description),

      contentCount: number(related(row.content_genre)?.count),
    }),

    toRow: (record) => ({
      genre_name: record.name,

      description: record.description,
    }),
  },

  soundtracks: {
    table: "soundtrack",

    idColumn: "soundtrack_id",

    select: "*, content(title)",

    orderColumn: "soundtrack_id",

    fromRow: (row) => ({
      id: text(row.soundtrack_id),

      contentId: text(row.content_id),

      songTitle: text(row.song_title),

      title: text(row.song_title),

      contentTitle: text(related(row.content)?.title),

      artist: text(row.artist),

      lyrics: text(row.lyrics),

      timestamp: text(row.timestamp_label),

      duration: text(row.timestamp_label),

      streamingLink: text(row.stream_link || row.external_url),
    }),

    toRow: (record) => ({
      content_id: number(record.contentId),

      song_title: record.songTitle,

      artist: record.artist,

      lyrics: record.lyrics,

      timestamp_label: record.timestamp,

      stream_link: record.streamingLink,
    }),
  },

  "film-refreshers": {
    table: "previous_film_refresher",

    idColumn: "refresher_id",

    select: "*",

    orderColumn: "updated_at",

    fromRow: (row) => ({
      id: text(row.refresher_id),

      contentId: text(row.content_id),

      title: text(row.refresher_title),

      summary: text(row.refresher_text_summary),

      videoFilename: text(row.refresher_video_url),

      availability:
        row.availability_status === "unavailable" ? "unavailable" : "available",

      lastUpdated: text(row.updated_at).slice(0, 10),
    }),

    toRow: (record) => ({
      content_id: number(record.contentId),

      refresher_title: record.title,

      refresher_text_summary: record.summary,

      refresher_video_url: record.videoFilename,

      availability_status: record.availability,
    }),
  },

  feedback: {
    table: "platform_feedback",

    idColumn: "feedback_id",

    select: "*",

    orderColumn: "submission_date",

    fromRow: (row) => ({
      id: text(row.feedback_id),

      subscriberId: text(row.user_id),

      type: text(row.feedback_type),

      subject: text(row.subject),

      description: text(row.description),

      screenshot: row.screenshot ?? undefined,

      date: date(row.submission_date),

      submissionDate: text(row.submission_date),

      status: text(row.status || "Open"),
    }),

    toRow: (record) => ({
      user_id: record.subscriberId,

      feedback_type: record.type,

      subject: record.subject,

      description: record.description,

      screenshot: record.screenshot,

      status: record.status,
    }),
  },

  reviews: {
    table: "content_review",

    idColumn: "review_id",

    select:
      "*, user(first_name, last_name), content(title, release_year, thumbnail, category(category_name))",

    orderColumn: "created_at",

    fromRow: (row) => {
      const content = related(row.content)

      const user = related(row.user)

      return {
        id: text(row.review_id),

        subscriberId: text(row.user_id),

        subscriberName:
          `${text(user?.first_name)} ${text(user?.last_name)}`.trim(),

        contentTitle: text(content?.title),

        contentCategory: text(related(content?.category)?.category_name),

        contentYear: number(content?.release_year),

        contentThumb: text(content?.thumbnail),

        rating: number(row.rating),

        text: text(row.review_text),

        date: date(row.created_at),

        reactions: [],

        status: text(row.status),
      }
    },

    toRow: (record) => ({
      content_id: number(record.contentId),

      user_id: record.subscriberId,

      rating: record.rating,

      review_text: record.text,

      status: record.status,
    }),
  },

  reactions: {
    table: "reaction",

    idColumn: "reaction_id",

    select: "*, user(first_name, last_name), content(title, thumbnail)",

    orderColumn: "created_at",

    fromRow: (row) => {
      const user = related(row.user)

      const content = related(row.content)

      return {
        id: text(row.reaction_id),

        subscriberId: text(row.user_id),

        subscriberName:
          `${text(user?.first_name)} ${text(user?.last_name)}`.trim(),

        contentId: text(row.content_id),

        contentTitle: text(content?.title),

        contentThumb: text(content?.thumbnail),

        emoji: text(row.emoji),

        label: text(row.emoji),

        type: text(row.emoji),

        date: date(row.created_at),

        status: text(row.status || "Active"),
      }
    },

    toRow: (record) => ({
      user_id: record.subscriberId,

      content_id: record.contentId ? number(record.contentId) : undefined,

      emoji: record.emoji,

      status: record.status,
    }),
  },

  "content-comments": {
    table: "content_comment",

    idColumn: "comment_id",

    select: "*, user(first_name, last_name), content(title, thumbnail)",

    orderColumn: "commented_at",

    fromRow: (row) => {
      const user = related(row.user)

      return {
        id: text(row.comment_id),

        contentId: text(row.content_id),

        contentTitle: text(related(row.content)?.title),

        contentThumb: text(related(row.content)?.thumbnail),

        subscriberId: text(row.user_id),

        authorName: `${text(user?.first_name)} ${text(user?.last_name)}`.trim(),

        text: text(row.comment_text),

        dateCommented: date(row.commented_at),

        date: text(row.commented_at),

        status: text(row.status || "Active"),
      }
    },

    toRow: (record) => ({
      content_id: record.contentId ? number(record.contentId) : undefined,

      user_id: record.subscriberId,

      comment_text: record.text,

      status: record.status,
    }),
  },

  "forum-posts": {
    table: "community_post",

    idColumn: "post_id",

    select: "*, user(first_name, last_name), community_comment(count)",

    orderColumn: "created_at",

    fromRow: (row) => {
      const user = related(row.user)

      return {
        id: text(row.post_id),

        subscriberId: text(row.user_id),

        authorName: `${text(user?.first_name)} ${text(user?.last_name)}`.trim(),

        title: text(row.title),

        content: text(row.body),

        body: text(row.body),

        datePosted: date(row.created_at),

        date: text(row.created_at),

        status: text(row.status),

        commentCount: number(related(row.community_comment)?.count),
      }
    },

    toRow: (record) => ({
      user_id: record.subscriberId,

      title: record.title,

      body: record.content ?? record.body,

      status: record.status,
    }),
  },

  "forum-comments": {
    table: "community_comment",

    idColumn: "community_comment_id",

    select: "*, user(first_name, last_name), community_post(title)",

    orderColumn: "created_at",

    fromRow: (row) => {
      const user = related(row.user)

      return {
        id: text(row.community_comment_id),

        postId: text(row.post_id),

        postTitle: text(related(row.community_post)?.title),

        subscriberId: text(row.user_id),

        authorName: `${text(user?.first_name)} ${text(user?.last_name)}`.trim(),

        text: text(row.body),

        body: text(row.body),

        dateCommented: date(row.created_at),

        date: text(row.created_at),

        status: text(row.status),
      }
    },

    toRow: (record) => ({
      post_id: number(record.postId),

      user_id: record.subscriberId,

      body: record.text ?? record.body,

      status: record.status,
    }),
  },

  subscribers: {
    table: "user",

    idColumn: "user_id",

    select: "*",

    orderColumn: "joined_at",

    fromRow: (row) => ({
      id: text(row.user_id),

      firstName: text(row.first_name),

      lastName: text(row.last_name),

      name: `${text(row.first_name)} ${text(row.last_name)}`.trim(),

      email: text(row.email),

      username: text(row.username),

      dob: text(row.date_of_birth),

      mobile: "",

      registeredAt: date(row.joined_at),

      joinDate: text(row.joined_at),

      status: text(row.account_status || "Active"),

      avatar: colorFor(row.user_id),

      avatarColor: colorFor(row.user_id),
    }),

    toRow: (record) => ({
      first_name: record.firstName,

      last_name: record.lastName,

      email: record.email,

      username: record.username,

      date_of_birth: record.dob,

      account_status: record.status,

      user_role: record.userRole ?? "subscriber",
    }),
  },

  "watch-history": {
    table: "watch_history",

    idColumn: "watch_history_id",

    select: "*, user(first_name, last_name), content(title, thumbnail)",

    orderColumn: "watch_date",

    fromRow: (row) => {
      const user = related(row.user)

      const content = related(row.content)

      return {
        id: text(row.watch_history_id),

        subscriberId: text(row.user_id),

        subscriberName:
          `${text(user?.first_name)} ${text(user?.last_name)}`.trim(),

        contentId: text(row.content_id),

        contentTitle: text(content?.title),

        watchDate: date(row.watch_date),

        progress: number(row.last_playback),

        lastPlayback: text(row.last_playback),

        thumbnail: text(content?.thumbnail),
      }
    },

    toRow: (record) => ({
      user_id: record.subscriberId,

      content_id: number(record.contentId),

      watch_date: record.watchDate,

      last_playback: record.progress,
    }),
  },

  plans: {
    table: "subscription",

    idColumn: "subscription_id",

    select: "*, user_subscription(count)",

    orderColumn: "monthly_price",

    fromRow: (row) => ({
      id: text(row.subscription_id),

      name: text(row.plan_name),

      price: number(row.monthly_price),

      monthlyPrice: number(row.monthly_price),

      maxUsers: number(row.max_user),

      description: text(row.plan_description),

      duration: "Monthly",

      features: text(row.plan_description) ? [text(row.plan_description)] : [],

      subscriberCount: number(related(row.user_subscription)?.count),
    }),

    toRow: (record) => ({
      plan_name: record.name,

      monthly_price: record.price ?? record.monthlyPrice,

      max_user: record.maxUsers,

      plan_description: record.description,
    }),
  },

  subscriptions: {
    table: "user_subscription",

    idColumn: "user_subscription_id",

    select: "*, user(first_name, last_name), subscription(plan_name)",

    orderColumn: "created_at",

    fromRow: (row) => {
      const user = related(row.user)

      const plan = related(row.subscription)

      return {
        id: text(row.user_subscription_id),

        subscriberId: text(row.user_id),

        subscriberName:
          `${text(user?.first_name)} ${text(user?.last_name)}`.trim(),

        planId: text(row.subscription_id),

        plan: text(plan?.plan_name),

        planName: text(plan?.plan_name),

        startDate: text(row.started_at).slice(0, 10),

        endDate: text(row.ends_at).slice(0, 10),

        status: text(row.status),
      }
    },

    toRow: (record) => ({
      ...(record.subscriberId !== undefined
        ? { user_id: record.subscriberId }
        : {}),

      ...(record.planId !== undefined
        ? {
            subscription_id: positiveInteger(
              record.planId,

              "Subscription plan ID",
            ),
          }
        : {}),

      ...(record.startDate !== undefined
        ? { started_at: record.startDate }
        : {}),

      ...(record.endDate !== undefined
        ? { ends_at: record.endDate || null }
        : {}),

      ...(record.status !== undefined ? { status: record.status } : {}),
    }),
  },

  payments: {
    table: "payment_transaction",

    idColumn: "payment_id",

    select: "*, user(first_name, last_name)",

    orderColumn: "created_at",

    fromRow: (row) => {
      const user = related(row.user)

      return {
        id: text(row.payment_id),

        subscriptionId: text(row.user_subscription_id),

        subscriberId: text(row.user_id),

        subscriberName:
          `${text(user?.first_name)} ${text(user?.last_name)}`.trim(),

        planName: "",

        amount: number(row.amount),

        method: text(row.payment_method),

        reference: text(row.reference_number),

        paymentDate: date(row.paid_at || row.created_at),

        date: text(row.paid_at || row.created_at),

        status: text(row.status),
      }
    },

    toRow: (record) => ({
      user_id: record.subscriberId,

      user_subscription_id: record.subscriptionId
        ? number(record.subscriptionId)
        : null,

      amount: record.amount,

      payment_method: record.method,

      reference_number: record.reference,

      paid_at: record.paymentDate,

      status: record.status,
    }),
  },

  "system-logs": {
    table: "system_log",

    idColumn: "system_log_id",

    select: "*",

    orderColumn: "created_at",

    fromRow: (row) => ({
      id: text(row.system_log_id),

      dateTime: date(row.created_at),

      eventType: text(row.event_type),

      userSource: text(row.actor_auth_user_id || "system"),

      description: text(row.message),

      ip: text(row.metadata?.ip),

      severity: text(row.severity),

      status: text(row.status),
    }),

    toRow: (record) => ({
      event_type: record.eventType,

      severity: record.severity,

      status: record.status,

      message: record.description,

      metadata: record.metadata,
    }),
  },

  backups: {
    table: "backup_job",

    idColumn: "backup_job_id",

    select: "*",

    orderColumn: "created_at",

    fromRow: (row) => ({
      id: text(row.backup_job_id),

      type: text(row.backup_type),

      datasetKey: text(row.dataset_key),

      description: text(row.description),

      started: date(row.started_at),

      completed: date(row.completed_at),

      size: row.size_bytes
        ? `${(number(row.size_bytes) / 1024 / 1024).toFixed(2)} MB`
        : "—",

      createdBy: text(row.created_by || "System"),

      status: text(row.status),

      storagePath: text(row.storage_path),

      tableNames: Array.isArray(row.table_names)
        ? row.table_names.map(text)
        : [],

      fileCount: number(row.file_count),

      errorMessage: text(row.error_message),
    }),

    toRow: (record) => ({
      backup_type: record.type,

      dataset_key: record.datasetKey,

      description: record.description,

      status: record.status,

      started_at: record.started,

      table_names: record.tableNames,
    }),
  },
}

export class SupabaseAdminRepository<T extends AdminEntity>
  implements AdminRepository<T>
{
  private readonly config: ResourceConfiguration

  constructor(
    private readonly client: SupabaseClient,

    resource: AdminResourceName,
  ) {
    this.config = CONFIG[resource]
  }

  async list(query: AdminListQuery = {}): Promise<AdminPage<T>> {
    const page = query.page ?? 1

    const pageSize = query.pageSize ?? 100

    const start = (page - 1) * pageSize

    const end = start + pageSize - 1

    let request = this.client

      .from(this.config.table)

      .select(this.config.select, { count: "exact" })

      .order(this.config.orderColumn, {
        ascending: query.sortDirection === "asc",
      })

      .range(start, end)

    Object.entries(query.filters ?? {}).forEach(([column, value]) => {
      if (value !== undefined && value !== "")
        request = request.eq(column, value)
    })

    const { data, error, count } = await request

    if (error) throw error

    const items = await Promise.all(
      (data ?? []).map((row) =>
        this.hydratePrivateAssets(this.config.fromRow(row) as T),
      ),
    )

    const total = count ?? items.length

    return {
      items,

      page,

      pageSize,

      total,

      totalPages: Math.ceil(total / pageSize),
    }
  }

  async get(id: string): Promise<T> {
    const { data, error } = await this.client

      .from(this.config.table)

      .select(this.config.select)

      .eq(this.config.idColumn, id)

      .single()

    if (error) throw error

    return this.hydratePrivateAssets(this.config.fromRow(data) as T)
  }

  async create(input: Omit<T, "id">): Promise<T> {
    if (this.config.table === "content") {
      return this.createContent(input as DatabaseRecord)
    }

    const { data, error } = await this.client

      .from(this.config.table)

      .insert(this.config.toRow(input))

      .select(this.config.select)

      .single()

    if (error) throw error

    await this.syncContentGenres(data, input)

    const createdRow = data as DatabaseRecord

    return this.get(text(createdRow[this.config.idColumn]))
  }

  async update(id: string, input: Partial<Omit<T, "id">>): Promise<T> {
    if (this.config.table === "content") {
      return this.updateContent(id, input as DatabaseRecord)
    }

    const { data, error } = await this.client

      .from(this.config.table)

      .update(this.config.toRow(input))

      .eq(this.config.idColumn, id)

      .select(this.config.select)

      .single()

    if (error) throw error

    await this.syncContentGenres(data, input)

    return this.get(id)
  }

  async remove(id: string): Promise<void> {
    if (this.config.table === "content") {
      const { data: row, error: rowError } = await this.client
        .from("content")
        .select("thumbnail, video_file, subtitle")
        .eq("content_id", id)
        .single()
      if (rowError) throw rowError

      const { error } = await this.client
        .from("content")
        .delete()
        .eq("content_id", id)
      if (error) throw error

      const assets = [
        ["content-thumbnails", row.thumbnail],
        ["video_file", row.video_file],
        ["subtitle", row.subtitle],
      ] as const
      await removeStorageAssets(
        this.client,
        assets.flatMap(([bucket, path]) =>
          path && !/^(?:https?:|data:)/i.test(path)
            ? [{ bucket, path }]
            : [],
        ),
      )
      return
    }

    const { error } = await this.client

      .from(this.config.table)

      .delete()

      .eq(this.config.idColumn, id)

    if (error) throw error
  }

  private async hydratePrivateAssets(record: T): Promise<T> {
    if (this.config.table === "content") {
      const thumbnail = text((record as DatabaseRecord).thumbnailUrl)

      if (thumbnail && !/^(?:https?:|data:)/i.test(thumbnail)) {
        const { data } = this.client.storage

          .from("content-thumbnails")

          .getPublicUrl(thumbnail)

        return { ...record, thumbnailUrl: data.publicUrl } as T
      }

      return record
    }

    if (this.config.table !== "platform_feedback") return record

    const screenshot = text((record as DatabaseRecord).screenshot)

    if (!screenshot || /^https?:\/\//i.test(screenshot)) return record

    const { data, error } = await this.client.storage

      .from(FEEDBACK_ATTACHMENT_BUCKET)

      .createSignedUrl(screenshot, 60 * 60)

    if (error || !data?.signedUrl) {
      return { ...record, screenshot: undefined } as T
    }

    return { ...record, screenshot: data.signedUrl } as T
  }

  private async createContent(input: DatabaseRecord): Promise<T> {
    const thumbnailFile = input.thumbnailFile as File | undefined

    const videoFile = input.videoFile as File | undefined

    const subtitleFile = input.subtitleFile as File | undefined

    const uploadSignal = input.uploadSignal as AbortSignal | undefined

    const onUploadProgress = input.onUploadProgress as ((
      progress: ContentUploadProgress,
    ) => void) | undefined

    if (!thumbnailFile || !videoFile)
      throw new Error("A thumbnail and video file are required")

    const { data: contentId, error: draftError } = await this.client.rpc(
      "create_admin_content_draft",

      {
        p_content: {
          category_id: input.categoryId,

          title: input.title,

          synopsis: input.synopsis,

          release_year: input.releaseYear,

          runtime: input.runtime,

          age_rating: input.ageRating,

          tmdb_id: input.tmdbId ?? null,
        },

        p_genre_ids: input.genreIds.map(Number),
      },
    )

    if (draftError) throw draftError

    const id = Number(contentId)

    if (!Number.isSafeInteger(id) || id <= 0)
      throw new Error("Supabase did not return a valid content ID")

    const safeName = (name: string) =>
      name.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "asset"

    const nonce = crypto.randomUUID()

    const assets = [
      {
        kind: "thumbnail" as const,

        bucket: "content-thumbnails",

        path: `content/${id}/thumbnail/${nonce}-${safeName(thumbnailFile.name)}`,

        file: thumbnailFile,
      },

      {
        kind: "video" as const,

        bucket: "video_file",

        path: `content/${id}/video/${nonce}-${safeName(videoFile.name)}`,

        file: videoFile,
      },

      ...(subtitleFile
        ? [
            {
              kind: "subtitle" as const,

              bucket: "subtitle",

              path: `content/${id}/subtitle/${nonce}-${safeName(subtitleFile.name)}`,

              file: subtitleFile,
            },
          ]
        : []),
    ] as const

    const uploaded: Array<{ bucket: string; path: string }> = []

    const totalBytes = assets.reduce(
      (total, asset) => total + asset.file.size,
      0,
    )

    let completedBytes = 0

    try {
      const { error: uploadingError } = await this.client
        .from("content")
        .update({ publishing_status: "uploading" })
        .eq("content_id", id)
      if (uploadingError) throw uploadingError

      for (const asset of assets) {
        await uploadWithProgress({
          client: this.client,
          bucket: asset.bucket,
          path: asset.path,
          file: asset.file,
          signal: uploadSignal,
          onProgress: (loadedBytes) => {
            const overallLoaded = completedBytes + loadedBytes
            onUploadProgress?.({
              asset: asset.kind,
              loadedBytes: overallLoaded,
              totalBytes,
              percent: totalBytes
                ? Math.min(100, Math.round((overallLoaded / totalBytes) * 100))
                : 100,
            })
          },
        })

        uploaded.push({ bucket: asset.bucket, path: asset.path })
        completedBytes += asset.file.size
      }

      const { error: finalizeError } = await this.client.rpc(
        "finalize_admin_content_upload",

        {
          p_content_id: id,

          p_thumbnail_path: assets[0].path,

          p_video_path: assets[1].path,

          p_subtitle_path: assets[2]?.path ?? null,

          p_availability_status: input.availability,
        },
      )

      if (finalizeError) throw finalizeError
    } catch (error) {
      const recoveryFailures: string[] = []
      try {
        await removeStorageAssets(this.client, uploaded)
      } catch (cleanupError) {
        recoveryFailures.push(
          cleanupError instanceof Error
            ? cleanupError.message
            : "Storage cleanup failed",
        )
      }

      const { error: markError } = await this.client
        .from("content")
        .update({
          availability_status: "unavailable",
          publishing_status: "failed",
        })
        .eq("content_id", id)
      if (markError)
        recoveryFailures.push(`Draft status update failed: ${markError.message}`)

      if (recoveryFailures.length) {
        const originalMessage =
          error instanceof Error ? error.message : "Content upload failed"
        throw new Error(`${originalMessage}. ${recoveryFailures.join("; ")}`)
      }
      throw error
    }

    return this.get(String(id))
  }

  private async updateContent(id: string, input: DatabaseRecord): Promise<T> {
    const numericId = positiveInteger(id, "Content ID")
    const { data: current, error: currentError } = await this.client
      .from("content")
      .select("thumbnail, video_file, subtitle")
      .eq("content_id", numericId)
      .single()

    if (currentError) throw currentError

    const replacements = [
      {
        field: "thumbnail",
        bucket: "content-thumbnails",
        folder: "thumbnail",
        file: input.thumbnailFile as File | undefined,
      },
      {
        field: "video_file",
        bucket: "video_file",
        folder: "video",
        file: input.videoFile as File | undefined,
      },
      {
        field: "subtitle",
        bucket: "subtitle",
        folder: "subtitle",
        file: input.subtitleFile as File | undefined,
      },
    ] as const
    const nextPaths: Record<string, string | null> = {
      thumbnail: current.thumbnail,
      video_file: current.video_file,
      subtitle: current.subtitle,
    }
    const uploaded: Array<{ bucket: string; path: string }> = []

    const uploadSignal = input.uploadSignal as AbortSignal | undefined

    const onUploadProgress = input.onUploadProgress as ((
      progress: ContentUploadProgress,
    ) => void) | undefined

    const totalBytes = replacements.reduce(
      (total, item) => total + (item.file?.size ?? 0),
      0,
    )

    let completedBytes = 0

    try {
      for (const replacement of replacements) {
        if (!replacement.file) continue
        const filename =
          replacement.file.name
            .replace(/[^a-zA-Z0-9._-]+/g, "-")
            .replace(/^-+|-+$/g, "") || "asset"
        const path = `content/${numericId}/${replacement.folder}/${crypto.randomUUID()}-${filename}`
        await uploadWithProgress({
          client: this.client,
          bucket: replacement.bucket,
          path,
          file: replacement.file,
          signal: uploadSignal,
          onProgress: (loadedBytes) => {
            const overallLoaded = completedBytes + loadedBytes
            onUploadProgress?.({
              asset: replacement.folder as ContentUploadProgress["asset"],
              loadedBytes: overallLoaded,
              totalBytes,
              percent: totalBytes
                ? Math.min(100, Math.round((overallLoaded / totalBytes) * 100))
                : 100,
            })
          },
        })
        uploaded.push({ bucket: replacement.bucket, path })
        nextPaths[replacement.field] = path
        completedBytes += replacement.file.size
      }

      const row = {
        ...this.config.toRow(input),
        thumbnail: nextPaths.thumbnail,
        video_file: nextPaths.video_file,
        subtitle: nextPaths.subtitle,
      }
      const { data, error } = await this.client
        .from("content")
        .update(row)
        .eq("content_id", numericId)
        .select(this.config.select)
        .single()
      if (error) throw error

      await this.syncContentGenres(data, input)
    } catch (error) {
      try {
        await removeStorageAssets(this.client, uploaded)
      } catch (cleanupError) {
        const originalMessage =
          error instanceof Error ? error.message : "Content update failed"
        const cleanupMessage =
          cleanupError instanceof Error
            ? cleanupError.message
            : "Replacement upload cleanup failed"
        throw new Error(`${originalMessage}. ${cleanupMessage}`)
      }
      throw error
    }

    await removeStorageAssets(
      this.client,
      replacements.flatMap((replacement) => {
        const oldPath = current[replacement.field]
        const nextPath = nextPaths[replacement.field]
        return oldPath &&
          oldPath !== nextPath &&
          !/^(?:https?:|data:)/i.test(oldPath)
          ? [{ bucket: replacement.bucket, path: oldPath }]
          : []
      }),
    )

    return this.get(id)
  }

  private async syncContentGenres(
    row: DatabaseRecord,

    input: DatabaseRecord,
  ): Promise<void> {
    if (this.config.table !== "content" || !Array.isArray(input.genreIds))
      return

    const contentId = row.content_id

    const { error: deleteError } = await this.client

      .from("content_genre")

      .delete()

      .eq("content_id", contentId)

    if (deleteError) throw deleteError

    if (input.genreIds.length === 0) return

    const { error: insertError } = await this.client

      .from("content_genre")

      .insert(
        input.genreIds.map((genreId: string) => ({
          content_id: contentId,

          genre_id: number(genreId),
        })),
      )

    if (insertError) throw insertError
  }
}

export function createSupabaseAdminDataServices(
  client: SupabaseClient,
): AdminDataServices {
  const repositories =
    new Map<AdminResourceName, AdminRepository<AdminEntity>>()

  return {
    repository<T extends AdminEntity,>(resource: AdminResourceName) {
      let repository = repositories.get(resource)

      if (!repository) {
        repository = new SupabaseAdminRepository(client, resource)

        repositories.set(resource, repository)
      }

      return repository as AdminRepository<T>
    },

    async action<TPayload,
    TResult,>(
      resource: AdminResourceName,

      id: string,

      request: AdminActionRequest<TPayload>,
    ): Promise<AdminActionResult<TResult>> {
      const repository = this.repository(resource)

      const data = await repository.update(
        id,

        (request.payload ?? {}) as Record<string, unknown>,
      )

      return { success: true, data: data as TResult }
    },

    async login(input) {
      const { data, error } = await client.auth.signInWithPassword(input)

      if (error) throw error

      const { data: role } = await client.rpc("get_admin_role")

      if (!role) {
        await client.auth.signOut()

        throw new Error("This account does not have administrator access.")
      }

      return {
        accessToken: data.session.access_token,

        expiresAt: data.session.expires_at
          ? new Date(data.session.expires_at * 1000).toISOString()
          : undefined,

        administrator: {
          id: data.user.id,

          name: text(data.user.user_metadata?.full_name || data.user.email),

          email: text(data.user.email),

          roles: [text(role)],

          permissions: [],
        },
      } as AdminSession
    },

    async logout() {
      const { error } = await client.auth.signOut()

      if (error) throw error
    },

    async session() {
      const { data, error } = await client.auth.getSession()

      if (error) throw error

      if (!data.session) throw new Error("No active admin session")

      const { data: role } = await client.rpc("get_admin_role")

      return {
        accessToken: data.session.access_token,

        expiresAt: data.session.expires_at
          ? new Date(data.session.expires_at * 1000).toISOString()
          : undefined,

        administrator: {
          id: data.session.user.id,

          name: text(
            data.session.user.user_metadata?.full_name ||
              data.session.user.email,
          ),

          email: text(data.session.user.email),

          roles: role ? [text(role)] : [],

          permissions: [],
        },
      } as AdminSession
    },
  }
}
