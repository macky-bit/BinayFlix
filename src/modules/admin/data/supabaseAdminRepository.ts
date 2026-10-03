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
const date = (value: unknown) =>
  value ? new Date(String(value)).toLocaleString() : ""
const colorFor = (id: unknown) => {
  const palette = ["#7C3AED", "#2563EB", "#059669", "#DC2626", "#D97706"]
  const source = text(id)
  const hash = [...source].reduce((total, char) => total + char.charCodeAt(0), 0)
  return palette[hash % palette.length]
}
const related = (value: unknown): DatabaseRecord | null =>
  Array.isArray(value)
    ? ((value[0] as DatabaseRecord | undefined) ?? null)
    : ((value as DatabaseRecord | null) ?? null)

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
      lastLogin: row.last_login ? date(row.last_login) : null,
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
    select: "*, category(category_name), genre(genre_name), content_genre(genre_id, genre(genre_name))",
    orderColumn: "content_id",
    fromRow: (row) => ({
      id: text(row.content_id),
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
      availability: row.availability_status === "unavailable" ? "unavailable" : "available",
      availabilityLabel: row.availability_status === "unavailable" ? "Unavailable" : "Available",
    }),
    toRow: (record) => ({
      title: record.title,
      category_id: record.categoryId ? number(record.categoryId) : null,
      synopsis: record.synopsis,
      release_year: record.releaseYear,
      runtime: record.runtime,
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
    select: "*, content(title, release_year, thumbnail, category(category_name))",
    orderColumn: "created_at",
    fromRow: (row) => {
      const content = related(row.content)
      return {
        id: text(row.review_id),
        subscriberId: text(row.user_id),
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
    select: "*",
    orderColumn: "created_at",
    fromRow: (row) => ({ id: text(row.reaction_id), subscriberId: text(row.user_id), contentId: text(row.content_id), emoji: text(row.emoji), label: text(row.emoji), date: date(row.created_at) }),
    toRow: (record) => ({ user_id: record.subscriberId, content_id: number(record.contentId), emoji: record.emoji }),
  },
  "forum-posts": {
    table: "community_post",
    idColumn: "post_id",
    select: "*, community_comment(count)",
    orderColumn: "created_at",
    fromRow: (row) => ({ id: text(row.post_id), subscriberId: text(row.user_id), title: text(row.title), content: text(row.body), body: text(row.body), datePosted: date(row.created_at), date: text(row.created_at), status: text(row.status), commentCount: number(related(row.community_comment)?.count) }),
    toRow: (record) => ({ user_id: record.subscriberId, title: record.title, body: record.content ?? record.body, status: record.status }),
  },
  "forum-comments": {
    table: "community_comment",
    idColumn: "community_comment_id",
    select: "*, community_post(title)",
    orderColumn: "created_at",
    fromRow: (row) => ({ id: text(row.community_comment_id), postId: text(row.post_id), postTitle: text(related(row.community_post)?.title), subscriberId: text(row.user_id), text: text(row.body), body: text(row.body), dateCommented: date(row.created_at), date: text(row.created_at), status: text(row.status) }),
    toRow: (record) => ({ post_id: number(record.postId), user_id: record.subscriberId, body: record.text ?? record.body, status: record.status }),
  },
  subscribers: {
    table: "user",
    idColumn: "user_id",
    select: "*",
    orderColumn: "joined_at",
    fromRow: (row) => ({ id: text(row.user_id), firstName: text(row.first_name), lastName: text(row.last_name), name: `${text(row.first_name)} ${text(row.last_name)}`.trim(), email: text(row.email), username: text(row.username), dob: text(row.date_of_birth), mobile: "", registeredAt: date(row.joined_at), joinDate: text(row.joined_at), status: text(row.account_status || "Active"), avatar: colorFor(row.user_id), avatarColor: colorFor(row.user_id) }),
    toRow: (record) => ({ first_name: record.firstName, last_name: record.lastName, email: record.email, username: record.username, date_of_birth: record.dob, account_status: record.status, user_role: record.userRole ?? "subscriber" }),
  },
  "watch-history": {
    table: "watch_history",
    idColumn: "watch_history_id",
    select: "*, user(first_name, last_name), content(title, thumbnail)",
    orderColumn: "watch_date",
    fromRow: (row) => { const user = related(row.user); const content = related(row.content); return { id: text(row.watch_history_id), subscriberId: text(row.user_id), subscriberName: `${text(user?.first_name)} ${text(user?.last_name)}`.trim(), contentId: text(row.content_id), contentTitle: text(content?.title), watchDate: date(row.watch_date), progress: number(row.last_playback), lastPlayback: text(row.last_playback), thumbnail: text(content?.thumbnail) } },
    toRow: (record) => ({ user_id: record.subscriberId, content_id: number(record.contentId), watch_date: record.watchDate, last_playback: record.progress }),
  },
  plans: {
    table: "subscription",
    idColumn: "subscription_id",
    select: "*, user_subscription(count)",
    orderColumn: "monthly_price",
    fromRow: (row) => ({ id: text(row.subscription_id), name: text(row.plan_name), price: number(row.monthly_price), monthlyPrice: number(row.monthly_price), maxUsers: number(row.max_user), description: text(row.plan_description), duration: "Monthly", features: text(row.plan_description) ? [text(row.plan_description)] : [], subscriberCount: number(related(row.user_subscription)?.count) }),
    toRow: (record) => ({ plan_name: record.name, monthly_price: record.price ?? record.monthlyPrice, max_user: record.maxUsers, plan_description: record.description }),
  },
  subscriptions: {
    table: "user_subscription",
    idColumn: "user_subscription_id",
    select: "*, user(first_name, last_name), subscription(plan_name)",
    orderColumn: "created_at",
    fromRow: (row) => { const user = related(row.user); const plan = related(row.subscription); return { id: text(row.user_subscription_id), subscriberId: text(row.user_id), subscriberName: `${text(user?.first_name)} ${text(user?.last_name)}`.trim(), plan: text(plan?.plan_name), planName: text(plan?.plan_name), startDate: text(row.started_at).slice(0, 10), endDate: text(row.ends_at).slice(0, 10), status: text(row.status) } },
    toRow: (record) => ({ user_id: record.subscriberId, subscription_id: number(record.planId), started_at: record.startDate, ends_at: record.endDate, status: record.status }),
  },
  payments: {
    table: "payment_transaction",
    idColumn: "payment_id",
    select: "*, user(first_name, last_name)",
    orderColumn: "created_at",
    fromRow: (row) => { const user = related(row.user); return { id: text(row.payment_id), subscriptionId: text(row.user_subscription_id), subscriberId: text(row.user_id), subscriberName: `${text(user?.first_name)} ${text(user?.last_name)}`.trim(), planName: "", amount: number(row.amount), method: text(row.payment_method), reference: text(row.reference_number), paymentDate: date(row.paid_at || row.created_at), date: text(row.paid_at || row.created_at), status: text(row.status) } },
    toRow: (record) => ({ user_id: record.subscriberId, user_subscription_id: record.subscriptionId ? number(record.subscriptionId) : null, amount: record.amount, payment_method: record.method, reference_number: record.reference, paid_at: record.paymentDate, status: record.status }),
  },
  "system-logs": {
    table: "system_log",
    idColumn: "system_log_id",
    select: "*",
    orderColumn: "created_at",
    fromRow: (row) => ({ id: text(row.system_log_id), dateTime: date(row.created_at), eventType: text(row.event_type), userSource: text(row.actor_auth_user_id || "system"), description: text(row.message), ip: text(row.metadata?.ip), severity: text(row.severity), status: text(row.status) }),
    toRow: (record) => ({ event_type: record.eventType, severity: record.severity, status: record.status, message: record.description, metadata: record.metadata ?? {} }),
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
      tableNames: Array.isArray(row.table_names) ? row.table_names.map(text) : [],
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
      if (value !== undefined && value !== "") request = request.eq(column, value)
    })

    const { data, error, count } = await request
    if (error) throw error
    const items = (data ?? []).map(this.config.fromRow) as T[]
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
    return this.config.fromRow(data) as T
  }

  async create(input: Omit<T, "id">): Promise<T> {
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
    const { error } = await this.client
      .from(this.config.table)
      .delete()
      .eq(this.config.idColumn, id)
    if (error) throw error
  }

  private async syncContentGenres(
    row: DatabaseRecord,
    input: DatabaseRecord,
  ): Promise<void> {
    if (this.config.table !== "content" || !Array.isArray(input.genreIds)) return

    const contentId = row.content_id
    const { error: deleteError } = await this.client
      .from("content_genre")
      .delete()
      .eq("content_id", contentId)
    if (deleteError) throw deleteError

    if (input.genreIds.length === 0) return
    const { error: insertError } = await this.client.from("content_genre").insert(
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
  const repositories = new Map<AdminResourceName, AdminRepository<AdminEntity>>()

  return {
    repository<T extends AdminEntity>(resource: AdminResourceName) {
      let repository = repositories.get(resource)
      if (!repository) {
        repository = new SupabaseAdminRepository(client, resource)
        repositories.set(resource, repository)
      }
      return repository as AdminRepository<T>
    },
    async action<TPayload, TResult>(resource: AdminResourceName, id: string, request: AdminActionRequest<TPayload>): Promise<AdminActionResult<TResult>> {
      const repository = this.repository(resource)
      const data = await repository.update(id, (request.payload ?? {}) as Record<string, unknown>)
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
      return { accessToken: data.session.access_token, expiresAt: data.session.expires_at ? new Date(data.session.expires_at * 1000).toISOString() : undefined, administrator: { id: data.user.id, name: text(data.user.user_metadata?.full_name || data.user.email), email: text(data.user.email), roles: [text(role)], permissions: [] } } as AdminSession
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
      return { accessToken: data.session.access_token, expiresAt: data.session.expires_at ? new Date(data.session.expires_at * 1000).toISOString() : undefined, administrator: { id: data.session.user.id, name: text(data.session.user.user_metadata?.full_name || data.session.user.email), email: text(data.session.user.email), roles: role ? [text(role)] : [], permissions: [] } } as AdminSession
    },
  }
}
