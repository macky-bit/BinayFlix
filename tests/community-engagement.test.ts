import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"
import {
  categoryMatchesMedia,
  isCommentVisible,
  normalizeComment,
  optimisticReaction,
  persistReaction,
  requireAuthenticatedUserId,
} from "../src/modules/movie/engagement.ts"
import { createEmptyReactionCounts } from "../src/shared/reactions.ts"
import { getMemberDestination } from "../src/lib/authRouting.ts"
import {
  MAX_SEARCH_LENGTH,
  normalizeSearchQuery,
} from "../src/modules/dashboard/search.ts"
import {
  MAX_PROFILE_NAME_LENGTH,
  normalizeProfileName,
} from "../src/modules/profile/profileName.ts"
import {
  MAX_FEEDBACK_DESCRIPTION_LENGTH,
  MAX_FEEDBACK_IMAGE_BYTES,
  MAX_FEEDBACK_SUBJECT_LENGTH,
  validateFeedbackImage,
  validateFeedbackText,
} from "../src/modules/help/feedback.ts"

test("creates a reaction optimistically", async () => {
  const result = optimisticReaction(createEmptyReactionCounts(), null, "love")
  assert.equal(result.myReaction, "love")
  assert.equal(result.counts.love, 1)
  const calls: string[] = []
  await persistReaction(
    {
      remove: async () => {
        calls.push("remove")
      },
      insert: async (reaction) => {
        calls.push(`insert:${reaction}`)
      },
    },
    "user-1",
    null,
    "love",
  )
  assert.deepEqual(calls, ["insert:love"])
})

test("subscribed members choose a profile after login", () => {
  assert.equal(getMemberDestination(true), "profileSelect")
  assert.equal(getMemberDestination(false), "subscription")
  assert.equal(getMemberDestination(null), "subscription")
  assert.equal(getMemberDestination(undefined), "subscription")
})

test("dashboard search normalizes and limits user queries", () => {
  assert.equal(normalizeSearchQuery("  star   wars  "), "star wars")
  assert.equal(normalizeSearchQuery("x".repeat(120)).length, MAX_SEARCH_LENGTH)
})

test("profile names are trimmed, normalized, and limited", () => {
  assert.equal(normalizeProfileName("  Movie   Night  "), "Movie Night")
  assert.throws(() => normalizeProfileName("   "), /Enter a profile name/)
  assert.throws(
    () => normalizeProfileName("x".repeat(MAX_PROFILE_NAME_LENGTH + 1)),
    /50 characters or fewer/,
  )
})

test("changes a reaction without changing the aggregate total", async () => {
  const counts = createEmptyReactionCounts()
  counts.love = 1
  const result = optimisticReaction(counts, "love", "funny")
  assert.equal(result.counts.love, 0)
  assert.equal(result.counts.funny, 1)
  assert.equal(
    Object.values(result.counts).reduce((sum, count) => sum + count, 0),
    1,
  )
  const calls: string[] = []
  await persistReaction(
    {
      remove: async () => {
        calls.push("remove")
      },
      insert: async (reaction) => {
        calls.push(`insert:${reaction}`)
      },
    },
    "user-1",
    "love",
    "funny",
  )
  assert.deepEqual(calls, ["remove", "insert:funny"])
})

test("removes the current reaction", async () => {
  const counts = createEmptyReactionCounts()
  counts.upvote = 1
  const result = optimisticReaction(counts, "upvote", null)
  assert.equal(result.myReaction, null)
  assert.equal(result.counts.upvote, 0)
  const calls: string[] = []
  await persistReaction(
    {
      remove: async () => {
        calls.push("remove")
      },
      insert: async (reaction) => {
        calls.push(`insert:${reaction}`)
      },
    },
    "user-1",
    "upvote",
    null,
  )
  assert.deepEqual(calls, ["remove"])
})

test("rejects mutations without an authenticated app user", async () => {
  assert.throws(() => requireAuthenticatedUserId(null), /Sign in/)
  assert.equal(requireAuthenticatedUserId("user-1"), "user-1")
  await assert.rejects(
    () =>
      persistReaction(
        { remove: async () => undefined, insert: async () => undefined },
        null,
        null,
        "love",
      ),
    /Sign in/,
  )
})

test("trims comment submissions and rejects empty posts", () => {
  assert.equal(normalizeComment("  Great ending!  "), "Great ending!")
  assert.throws(() => normalizeComment("  \n "), /before posting/)
})

test("hides moderated comments from public views while preserving admin visibility", () => {
  assert.equal(isCommentVisible("Active"), true)
  assert.equal(isCommentVisible("Hidden"), false)
  assert.equal(isCommentVisible("Hidden", true), true)
})

test("resolves the production Movie and TV Series category names", () => {
  assert.equal(categoryMatchesMedia("Movie", false), true)
  assert.equal(categoryMatchesMedia("Movies", false), true)
  assert.equal(categoryMatchesMedia("TV Series", true), true)
  assert.equal(categoryMatchesMedia("TV Shows", true), true)
  assert.equal(categoryMatchesMedia("Movie", true), false)
})

test("migration preserves owner and moderator authorization policies", () => {
  const sql = readFileSync(
    new URL(
      "../supabase/migrations/20261007090000_connect_watch_engagement.sql",
      import.meta.url,
    ),
    "utf8",
  )
  assert.match(sql, /reaction_owner_insert/i)
  assert.match(sql, /reaction_owner_delete/i)
  assert.match(sql, /comment_manager_can_delete_reactions/i)
  assert.match(sql, /reaction_content_user_unique/i)
  assert.match(sql, /reaction_admin_update/i)
  assert.match(sql, /reaction_status_check/i)
  assert.match(
    sql,
    /grant execute on function public\.is_admin_role\(varchar\) to anon/i,
  )
  assert.match(sql, /content_comment_owner_insert/i)
  assert.match(sql, /content_comment_owner_or_admin_delete/i)
  assert.match(sql, /content_comment_admin_update/i)
  assert.match(sql, /lower\(status\) = 'active'/i)
  assert.match(sql, /is_admin_role\('commentManager'/i)
})

test("comment owners can edit without overriding moderation status", () => {
  const sql = readFileSync(
    new URL(
      "../supabase/migrations/20261007103000_allow_owner_manage_content_comments.sql",
      import.meta.url,
    ),
    "utf8",
  )
  assert.match(sql, /content_comment_owner_update/i)
  assert.match(sql, /protect_content_comment_moderation_fields/i)
  assert.match(sql, /Only community moderators can change comment status/i)
})

test("help feedback validates image attachments", () => {
  assert.doesNotThrow(() =>
    validateFeedbackImage({ type: "image/png", size: 1024 } as File),
  )
  assert.throws(
    () =>
      validateFeedbackImage({ type: "application/pdf", size: 1024 } as File),
    /PNG, JPG, WebP, or GIF/,
  )
  assert.throws(
    () =>
      validateFeedbackImage({
        type: "image/jpeg",
        size: MAX_FEEDBACK_IMAGE_BYTES + 1,
      } as File),
    /5 MB or smaller/,
  )
})

test("help feedback enforces subject and description character limits", () => {
  assert.doesNotThrow(() =>
    validateFeedbackText(
      "S".repeat(MAX_FEEDBACK_SUBJECT_LENGTH),
      "D".repeat(MAX_FEEDBACK_DESCRIPTION_LENGTH),
    ),
  )
  assert.throws(
    () =>
      validateFeedbackText(
        "S".repeat(MAX_FEEDBACK_SUBJECT_LENGTH + 1),
        "Issue",
      ),
    /Subject must be 50 characters or fewer/,
  )
  assert.throws(
    () =>
      validateFeedbackText(
        "Issue",
        "D".repeat(MAX_FEEDBACK_DESCRIPTION_LENGTH + 1),
      ),
    /Description must be 200 characters or fewer/,
  )
})

test("help feedback migration creates a private owner-scoped attachment bucket", () => {
  const sql = readFileSync(
    new URL(
      "../supabase/migrations/20261007120000_connect_help_feedback_attachments.sql",
      import.meta.url,
    ),
    "utf8",
  )
  assert.match(sql, /'feedback-attachments'[\s\S]*false/i)
  assert.match(sql, /feedback_owner_upload_attachments/i)
  assert.match(sql, /feedback_owner_delete_attachments/i)
  assert.match(sql, /feedback_attachment_admin_read/i)
  assert.match(sql, /user_can_insert_own_feedback/i)
  assert.match(sql, /is_admin_role\('feedbackManager'/i)
})

test("subscription profile flow uses only active subscription records", () => {
  const sql = readFileSync(
    new URL(
      "../supabase/migrations/20261007130000_align_active_subscription_profile_flow.sql",
      import.meta.url,
    ),
    "utf8",
  )
  assert.match(sql, /get_my_subscription_state/i)
  assert.match(sql, /get_my_member_profile_context/i)
  assert.match(sql, /create_my_member_profile/i)
  assert.match(sql, /lower\(membership\.status\) = 'active'/i)
  assert.match(
    sql,
    /membership\.ends_at is null or membership\.ends_at > now\(\)/i,
  )
  assert.match(sql, /plan\.max_user/i)
})
