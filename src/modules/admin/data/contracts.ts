export type AdminResourceName = "managers" | "content" | "categories" | "genres" | "soundtracks" | "film-refreshers" | "reviews" | "reactions" | "content-comments" | "forum-posts" | "forum-comments" | "feedback" | "subscribers" | "watch-history" | "subscriptions" | "plans" | "payments" | "system-logs" | "backups"

export type SortDirection = "asc" | "desc"

export interface AdminListQuery {
  page?: number
  pageSize?: number
  search?: string
  sortBy?: string
  sortDirection?: SortDirection
  filters?: Record<string, string | number | boolean | undefined>
  signal?: AbortSignal
}

export interface AdminPage<T> {
  items: T[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export interface AdminEntity {
  id: string
}

export type CreateInput<T extends AdminEntity> = Omit<T, "id">
export type UpdateInput<T extends AdminEntity> = Partial<Omit<T, "id">>

export interface AdminRepository<
  T extends AdminEntity,
  TCreate = CreateInput<T>,
  TUpdate = UpdateInput<T>,
> {
  list(query?: AdminListQuery): Promise<AdminPage<T>>
  get(id: string, signal?: AbortSignal): Promise<T>
  create(input: TCreate): Promise<T>
  update(id: string, input: TUpdate): Promise<T>
  remove(id: string): Promise<void>
}

export interface AdminActionRequest<TPayload = unknown> {
  action: string
  payload?: TPayload
}

export interface AdminActionResult<TData = unknown> {
  success: boolean
  message?: string
  data?: TData
}

export interface AdminSession {
  accessToken: string
  expiresAt?: string
  administrator: {
    id: string
    name: string
    email: string
    roles: string[]
    permissions: string[]
  }
}

export interface AdminLoginInput {
  email: string
  password: string
}

export interface AdminApiEnvelope<T> {
  data: T
  message?: string
  requestId?: string
}

export interface AdminApiErrorBody {
  message?: string
  code?: string
  errors?: Record<string, string[]>
  requestId?: string
}
