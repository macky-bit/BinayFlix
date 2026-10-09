import assert from "node:assert/strict"

import { readFileSync } from "node:fs"

import test from "node:test"

import {
  COMMENT_MAX_LENGTH,
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
  assert.equal(MAX_SEARCH_LENGTH, 25)

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

test("accepts long comments through the supported character limit", () => {
  const longComment = "x".repeat(501)

  assert.equal(normalizeComment(longComment), longComment)

  assert.throws(
    () => normalizeComment("x".repeat(COMMENT_MAX_LENGTH + 1)),

    /limited to/i,
  )
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

test("content comments preserve and safely expose their author profile", () => {
  const sql = readFileSync(
    new URL(
      "../supabase/migrations/20261009194500_connect_comment_author_profiles.sql",

      import.meta.url,
    ),

    "utf8",
  )

  assert.match(sql, /add column if not exists member_profile_id bigint/i)

  assert.match(sql, /profile\.user_id = content_comment\.user_id/i)

  assert.match(sql, /Comment authorship cannot be changed/i)

  assert.match(sql, /get_content_comments_with_authors/i)

  assert.match(sql, /lower\(comment\.status\) = 'active'/i)
})

test("opening video runs after a profile card is clicked instead of login", () => {
  const appSource = readFileSync(
    new URL("../src/App.tsx", import.meta.url),

    "utf8",
  )
  const loginSource = readFileSync(
    new URL("../src/modules/login/LoginPage.tsx", import.meta.url),

    "utf8",
  )
  const profileSelectSource = readFileSync(
    new URL(
      "../src/modules/profileSelect/ProfileSelectPage.tsx",
      import.meta.url,
    ),
    "utf8",
  )

  assert.match(appSource, /setActiveProfile\(profile\)[\s\S]*beginOpening\(\)/)

  assert.match(appSource, /page === "opening"[\s\S]*<OpeningVideo/)

  assert.doesNotMatch(loginSource, /requestOpeningVideo|onAuthenticated/)
  assert.match(profileSelectSource, /onClick=\{\(\) => onSelect\(profile\)\}/)
  assert.doesNotMatch(
    profileSelectSource,
    /Choose a profile|continueBtn|setSelected/,
  )
})

test("opening video uses its own public media bucket", () => {
  const sql = readFileSync(
    new URL(
      "../supabase/migrations/20261009211500_publish_opening_video.sql",

      import.meta.url,
    ),

    "utf8",
  )

  assert.match(sql, /'streamflix-media'[\s\S]*true[\s\S]*'video\/mp4'/i)

  assert.match(sql, /file_size_limit[\s\S]*52428800/i)

  assert.match(sql, /drop policy if exists authenticated_can_read_streamflix_opening/i)
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

test("Stripe billing is webhook-authoritative and idempotent", () => {
  const sql = readFileSync(
    new URL(
      "../supabase/migrations/20261009090000_connect_stripe_billing.sql",
      import.meta.url,
    ),
    "utf8",
  )
  assert.match(sql, /stripe_webhook_event/i)
  assert.match(sql, /on conflict \(event_id\) do nothing/i)
  assert.match(sql, /process_stripe_billing_event/i)
  assert.match(sql, /subscription_stripe_price_unique/i)
  assert.match(
    sql,
    /revoke execute on function public\.select_subscription_plan/i,
  )
  assert.match(sql, /from public, anon, authenticated/i)
})

test("Stripe webhook verifies signatures before mutating billing records", () => {
  const source = readFileSync(
    new URL("../supabase/functions/stripe-webhook/index.ts", import.meta.url),
    "utf8",
  )
  assert.match(source, /constructEventAsync/i)
  assert.match(source, /Stripe-Signature/i)
  assert.match(source, /STRIPE_WEBHOOK_SIGNING_SECRET/i)
  assert.match(source, /process_stripe_billing_event/i)
})

test("Checkout sessions use server-owned recurring prices and authenticated users", () => {
  const source = readFileSync(
    new URL(
      "../supabase/functions/create-checkout-session/index.ts",
      import.meta.url,
    ),
    "utf8",
  )
  assert.match(source, /serviceClient\.auth\.getUser/i)
  assert.match(source, /STRIPE_PRICE_BASIC/i)
  assert.match(source, /STRIPE_PRICE_STANDARD/i)
  assert.match(source, /STRIPE_PRICE_PREMIUM/i)
  assert.match(source, /mode: "subscription"/i)
  assert.doesNotMatch(source, /selected_subscription_id/)
})

test("movie soundtrack uses database audio and lyrics instead of placeholders", () => {
  const playerSource = readFileSync(
    new URL("../src/modules/movie/fixedscreen/movie.tsx", import.meta.url),
    "utf8",
  )
  const soundtrackSource = readFileSync(
    new URL("../src/modules/movie/soundtrack.ts", import.meta.url),
    "utf8",
  )

  assert.match(playerSource, /<audio[\s\S]*soundtrackAudioRef/)
  assert.match(playerSource, /toggleSoundtrack\(track\)/)
  assert.match(playerSource, /lyricsTrack\.lyrics/)
  assert.doesNotMatch(
    playerSource,
    /Main Theme|Featured Track|Soundtrack source pending/,
  )
  assert.match(soundtrackSource, /\.from\("soundtrack"\)/)
  assert.match(soundtrackSource, /stream_link/)
})

test("Help Center renders at true 100 percent while preserving all actions", () => {
  const pageSource = readFileSync(
    new URL("../src/modules/help/HelpPage.tsx", import.meta.url),
    "utf8",
  )
  const viewSource = readFileSync(
    new URL("../src/modules/help/components.tsx", import.meta.url),
    "utf8",
  )

  assert.match(pageSource, /style\.setProperty\("zoom", "1"\)/)
  assert.match(pageSource, /style\.removeProperty\("zoom"\)/)
  assert.match(viewSource, />\s*Back to StreamFlix\s*</)
  assert.match(viewSource, />\s*Contact Us\s*</)
})


