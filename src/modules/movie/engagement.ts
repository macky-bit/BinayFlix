import type { SupabaseClient } from "@supabase/supabase-js"
import {
  createEmptyReactionCounts,
  REACTION_DEFINITIONS,
  type ReactionKey,
} from "../../shared/reactions.ts"

export const COMMENT_MAX_LENGTH = 1000
export const AUTH_REQUIRED_MESSAGE = "Sign in to join the conversation."

export interface ContentComment {
  id: string
  text: string
  commentedAt: string
  userId: string
  status: string
  memberProfileId: number | null
  authorName: string
  authorAvatarUrl: string | null
}

export interface CommentAuthor {
  profileId: number
  name: string
  avatarUrl: string
}

export interface EngagementSnapshot {
  contentId: number | null
  counts: Record<ReactionKey, number>
  myReaction: ReactionKey | null
  comments: ContentComment[]
  userId: string | null
  warning: string | null
}

interface ReactionRow {
  emoji: string | null
  user_id: string
}

interface CommentAuthorRow {
  comment_id: string | number
  comment_text: string
  commented_at: string
  user_id: string
  status: string
  member_profile_id?: string | number | null
  author_name?: string | null
  author_avatar?: string | null
}

const isExternalAvatar = (value: string) => /^(https?:|data:|blob:)/i.test(value)

async function mapCommentRows(
  client: SupabaseClient,
  rows: CommentAuthorRow[],
): Promise<ContentComment[]> {
  const storedAvatarPaths = [
    ...new Set(
      rows
        .map((row) => row.author_avatar?.trim() ?? "")
        .filter((path) => path && !isExternalAvatar(path)),
    ),
  ]
  const signedAvatarUrls = new Map<string, string>()
  if (storedAvatarPaths.length) {
    const { data } = await client.storage
      .from("avatar")
      .createSignedUrls(storedAvatarPaths, 60 * 60)
    for (const item of data ?? []) {
      if (item.signedUrl) signedAvatarUrls.set(item.path, item.signedUrl)
    }
  }

  return rows
    .filter((row) => isCommentVisible(String(row.status ?? "")))
    .map((row) => {
      const avatar = row.author_avatar?.trim() ?? ""
      return {
        id: String(row.comment_id),
        text: String(row.comment_text),
        commentedAt: String(row.commented_at),
        userId: String(row.user_id),
        status: String(row.status),
        memberProfileId:
          row.member_profile_id == null ? null : Number(row.member_profile_id),
        authorName: row.author_name?.trim() || "Community member",
        authorAvatarUrl: avatar
          ? isExternalAvatar(avatar)
            ? avatar
            : (signedAvatarUrls.get(avatar) ?? null)
          : null,
      }
    })
}

async function loadContentComments(
  client: SupabaseClient,
  contentId: number,
): Promise<{ comments: ContentComment[]; error: unknown | null }> {
  const authorResult = await client.rpc("get_content_comments_with_authors", {
    selected_content_id: contentId,
  })
  if (!authorResult.error) {
    return {
      comments: await mapCommentRows(
        client,
        (authorResult.data ?? []) as CommentAuthorRow[],
      ),
      error: null,
    }
  }

  // Keep comments available during a staggered database rollout.
  const fallbackResult = await client
    .from("content_comment")
    .select("comment_id, comment_text, commented_at, user_id, status")
    .eq("content_id", contentId)
    .eq("status", "Active")
    .order("commented_at", { ascending: false })
  return {
    comments: fallbackResult.error
      ? []
      : await mapCommentRows(
          client,
          (fallbackResult.data ?? []) as CommentAuthorRow[],
        ),
    error: fallbackResult.error,
  }
}

export function normalizeComment(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) throw new Error("Write a comment before posting.")
  if (trimmed.length > COMMENT_MAX_LENGTH) {
    throw new Error(`Comments are limited to ${COMMENT_MAX_LENGTH} characters.`)
  }
  return trimmed
}

export function requireAuthenticatedUserId(userId: string | null): string {
  if (!userId) throw new Error(AUTH_REQUIRED_MESSAGE)
  return userId
}

export function isCommentVisible(status: string, isModerator = false): boolean {
  return isModerator || status.toLowerCase() === "active"
}

export function categoryMatchesMedia(
  categoryName: string,
  isSeries: boolean,
): boolean {
  const normalized = categoryName.trim().toLowerCase()
  return isSeries
    ? normalized === "tv series" || normalized === "tv shows"
    : normalized === "movie" || normalized === "movies"
}

export function summarizeReactions(rows: ReactionRow[], userId: string | null) {
  const counts = createEmptyReactionCounts()
  let myReaction: ReactionKey | null = null
  for (const row of rows) {
    const definition = REACTION_DEFINITIONS.find(
      (item) => item.emoji === row.emoji,
    )
    if (!definition) continue
    counts[definition.key] += 1
    if (userId && row.user_id === userId) myReaction = definition.key
  }
  return { counts, myReaction }
}

export function optimisticReaction(
  counts: Record<ReactionKey, number>,
  current: ReactionKey | null,
  next: ReactionKey | null,
) {
  const updated = { ...counts }
  if (current) updated[current] = Math.max(0, updated[current] - 1)
  if (next) updated[next] += 1
  return { counts: updated, myReaction: next }
}

export interface ReactionPersistence {
  remove: () => Promise<void>
  insert: (reaction: ReactionKey) => Promise<void>
}

export async function persistReaction(
  persistence: ReactionPersistence,
  userId: string | null,
  previous: ReactionKey | null,
  next: ReactionKey | null,
): Promise<void> {
  requireAuthenticatedUserId(userId)
  if (previous) await persistence.remove()
  if (!next) return
  try {
    await persistence.insert(next)
  } catch (error) {
    if (previous) await persistence.insert(previous).catch(() => undefined)
    throw error
  }
}

async function currentAppUserId(
  client: SupabaseClient,
): Promise<string | null> {
  const { data: authData, error: authError } = await client.auth.getUser()
  if (authError || !authData.user) return null
  const { data, error } = await client
    .from("user")
    .select("user_id")
    .eq("auth_user_id", authData.user.id)
    .maybeSingle()
  if (error) throw error
  return data?.user_id ? String(data.user_id) : null
}

export async function resolveContentId(
  client: SupabaseClient,
  tmdbId: number,
  isSeries: boolean,
): Promise<number | null> {
  const { data, error } = await client
    .from("content")
    .select("content_id, category(category_name)")
    .eq("tmdb_id", tmdbId)
    .limit(10)
  if (error) throw error
  const row = (data ?? []).find((item) => {
    const category = Array.isArray(item.category)
      ? item.category[0]
      : item.category
    return categoryMatchesMedia(
      String(category?.category_name ?? ""),
      isSeries,
    )
  })
  return row?.content_id == null ? null : Number(row.content_id)
}

export async function loadEngagement(
  client: SupabaseClient,
  contentId: number,
): Promise<EngagementSnapshot> {
  const userPromise = currentAppUserId(client)
  const reactionsPromise = client
    .from("reaction")
    .select("emoji, user_id")
    .eq("content_id", contentId)
    .eq("status", "Active")
  const commentsPromise = loadContentComments(client, contentId)
  const [userId, reactionsResult, commentsResult] = await Promise.all([
    userPromise,
    reactionsPromise,
    commentsPromise,
  ])
  const { counts, myReaction } = summarizeReactions(
    (reactionsResult.error ? [] : (reactionsResult.data ?? [])) as ReactionRow[],
    userId,
  )
  const warnings = [reactionsResult.error, commentsResult.error]
    .filter(Boolean)
    .map((error) => (error as { message?: string }).message || "Community request failed")
  return {
    contentId,
    counts,
    myReaction,
    userId,
    warning: warnings.length ? warnings.join(" ") : null,
    comments: commentsResult.comments,
  }
}

export async function saveReaction(
  client: SupabaseClient,
  contentId: number,
  userId: string | null,
  previous: ReactionKey | null,
  next: ReactionKey | null,
): Promise<void> {
  const ownerId = requireAuthenticatedUserId(userId)
  await persistReaction(
    {
      remove: async () => {
        const { error } = await client
          .from("reaction")
          .delete()
          .eq("content_id", contentId)
          .eq("user_id", ownerId)
        if (error) throw error
      },
      insert: async (reaction) => {
        const emoji = REACTION_DEFINITIONS.find((item) => item.key === reaction)
          ?.emoji
        const { error } = await client.from("reaction").insert({
          content_id: contentId,
          user_id: ownerId,
          emoji,
        })
        if (error) throw error
      },
    },
    ownerId,
    previous,
    next,
  )
}

export async function postContentComment(
  client: SupabaseClient,
  contentId: number,
  userId: string | null,
  value: string,
  author?: CommentAuthor | null,
): Promise<ContentComment> {
  const ownerId = requireAuthenticatedUserId(userId)
  const commentText = normalizeComment(value)
  const basePayload = {
    content_id: contentId,
    user_id: ownerId,
    comment_text: commentText,
  }
  let result = await client
    .from("content_comment")
    .insert({
      ...basePayload,
      member_profile_id: author?.profileId ?? null,
    })
    .select("comment_id, comment_text, commented_at, user_id, status")
    .single()
  if (
    result.error &&
    author?.profileId &&
    /member_profile_id/i.test(result.error.message)
  ) {
    result = await client
      .from("content_comment")
      .insert(basePayload)
      .select("comment_id, comment_text, commented_at, user_id, status")
      .single()
  }
  const { data, error } = result
  if (error) throw error
  return {
    id: String(data.comment_id),
    text: String(data.comment_text),
    commentedAt: String(data.commented_at),
    userId: String(data.user_id),
    status: String(data.status),
    memberProfileId: author?.profileId ?? null,
    authorName: author?.name.trim() || "You",
    authorAvatarUrl: author?.avatarUrl || null,
  }
}

export async function updateContentComment(
  client: SupabaseClient,
  commentId: string,
  userId: string | null,
  value: string,
): Promise<ContentComment> {
  const ownerId = requireAuthenticatedUserId(userId)
  const commentText = normalizeComment(value)
  const { data, error } = await client
    .from("content_comment")
    .update({ comment_text: commentText })
    .eq("comment_id", commentId)
    .eq("user_id", ownerId)
    .select("comment_id, comment_text, commented_at, user_id, status")
    .single()
  if (error) throw error
  return {
    id: String(data.comment_id),
    text: String(data.comment_text),
    commentedAt: String(data.commented_at),
    userId: String(data.user_id),
    status: String(data.status),
    memberProfileId: null,
    authorName: "Community member",
    authorAvatarUrl: null,
  }
}

export async function deleteContentComment(
  client: SupabaseClient,
  commentId: string,
  userId: string | null,
): Promise<void> {
  const ownerId = requireAuthenticatedUserId(userId)
  const { error } = await client
    .from("content_comment")
    .delete()
    .eq("comment_id", commentId)
    .eq("user_id", ownerId)
  if (error) throw error
}
