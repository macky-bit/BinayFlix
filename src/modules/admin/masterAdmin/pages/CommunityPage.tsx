import { useState, useMemo } from "react"
import type {
  Review,
  Reaction,
  ForumPost,
  ForumComment,
  PostStatus,
} from "../types"
import { useAdminCollection, useAdminRepository } from "../../data"
import { formatDate } from "../utils"
import { GenericBadge } from "../components/Badge"
import Toast from "../components/Toast"
import ConfirmDialog from "../components/ConfirmDialog"
import {
  AdminPageHeader,
  AdminStatCard,
  AdminStats,
  AdminTablePagination,
  AdminWorkspaceTabs,
} from "../../components/AdminUI"

type CommunityTab = "reviews" | "posts" | "comments"

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          className="w-3.5 h-3.5"
          fill={i <= rating ? "#F5A800" : "none"}
          stroke={i <= rating ? "#F5A800" : "#374151"}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
          />
        </svg>
      ))}
    </div>
  )
}

// Review View Modal
function ReviewViewModal({
  review,
  onClose,
  onDelete,
}: {
  review: Review
  onClose: () => void
  onDelete: () => void
}) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-semibold text-white">Review Details</h2>
          <button
            onClick={onClose}
            className="text-[#9CA3AF] hover:text-white p-1 rounded"
            aria-label="Close"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <div
          className="flex items-center gap-3 mb-4 p-3 rounded-lg"
          style={{
            backgroundColor: "rgba(26,16,48,0.5)",
            border: "1px solid var(--stone)",
          }}
        >
          <div>
            <p className="text-white font-medium text-sm">
              {review.subscriberName}
            </p>
            <p className="text-xs" style={{ color: "var(--taupe)" }}>
              {review.subscriberId}
            </p>
          </div>
          <div className="ml-auto">
            <StarRating rating={review.rating} />
          </div>
        </div>
        <div className="flex flex-col gap-3 text-sm">
          <div className="flex justify-between">
            <span style={{ color: "var(--taupe)" }}>Review ID</span>
            <span className="text-white font-mono text-xs">{review.id}</span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: "var(--taupe)" }}>Content</span>
            <span className="text-white">{review.contentTitle}</span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: "var(--taupe)" }}>Date</span>
            <span className="text-white">{formatDate(review.date)}</span>
          </div>
          <div>
            <p style={{ color: "var(--taupe)" }} className="mb-1">
              Review
            </p>
            <p
              className="text-white rounded-lg p-3"
              style={{
                backgroundColor: "rgba(26,16,48,0.5)",
                border: "1px solid var(--stone)",
              }}
            >
              {review.text}
            </p>
          </div>
        </div>
        <div className="flex gap-3 justify-end mt-6">
          <button
            onClick={onClose}
            className="btn-ghost px-4 py-2 rounded-lg text-sm font-medium"
          >
            Close
          </button>
          <button
            onClick={onDelete}
            className="btn-danger px-4 py-2 rounded-lg text-sm font-medium"
          >
            Delete Review
          </button>
        </div>
      </div>
    </div>
  )
}

// Post View Modal
function PostViewModal({
  post,
  onClose,
  onHide,
  onRestore,
  onDelete,
}: {
  post: ForumPost
  onClose: () => void
  onHide: () => void
  onRestore: () => void
  onDelete: () => void
}) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-semibold text-white">Forum Post</h2>
          <button
            onClick={onClose}
            className="text-[#9CA3AF] hover:text-white p-1 rounded"
            aria-label="Close"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <div className="flex flex-col gap-3 text-sm mb-4">
          <div className="flex justify-between">
            <span style={{ color: "var(--taupe)" }}>Post ID</span>
            <span className="text-white font-mono text-xs">{post.id}</span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: "var(--taupe)" }}>Author</span>
            <span className="text-white">{post.authorName}</span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: "var(--taupe)" }}>Status</span>
            <GenericBadge label={post.status} />
          </div>
          <div className="flex justify-between">
            <span style={{ color: "var(--taupe)" }}>Date</span>
            <span className="text-white">{formatDate(post.date)}</span>
          </div>
          <div>
            <p style={{ color: "var(--taupe)" }} className="mb-1">
              Title
            </p>
            <p className="text-white font-medium">{post.title}</p>
          </div>
          <div>
            <p style={{ color: "var(--taupe)" }} className="mb-1">
              Body
            </p>
            <p
              className="text-white rounded-lg p-3"
              style={{
                backgroundColor: "rgba(26,16,48,0.5)",
                border: "1px solid var(--stone)",
              }}
            >
              {post.body}
            </p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          <button
            onClick={onClose}
            className="btn-ghost px-4 py-2 rounded-lg text-sm font-medium"
          >
            Close
          </button>
          {post.status === "Active" && (
            <button
              onClick={onHide}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{
                backgroundColor: "rgba(245,168,0,0.15)",
                color: "#F5A800",
                border: "1px solid rgba(245,168,0,0.35)",
              }}
            >
              Hide Post
            </button>
          )}
          {post.status === "Hidden" && (
            <button
              onClick={onRestore}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{
                backgroundColor: "rgba(16,185,129,0.12)",
                color: "#10B981",
                border: "1px solid rgba(16,185,129,0.35)",
              }}
            >
              Restore Post
            </button>
          )}
          {post.status !== "Deleted" && (
            <button
              onClick={onDelete}
              className="btn-danger px-4 py-2 rounded-lg text-sm font-medium"
            >
              Delete Post
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function CommunityPage() {
  const [activeTab, setActiveTab] = useState<CommunityTab>("reviews")
  const reviewState = useAdminCollection(useAdminRepository<Review>("reviews"))
  const reactionState = useAdminCollection(
    useAdminRepository<Reaction>("reactions"),
  )
  const postState = useAdminCollection(
    useAdminRepository<ForumPost>("forum-posts"),
  )
  const commentState = useAdminCollection(
    useAdminRepository<ForumComment>("forum-comments"),
  )
  const reviews = reviewState.items
  const reactions = reactionState.items
  const posts = postState.items
  const comments = commentState.items
  const [search, setSearch] = useState("")
  const [toast, setToast] = useState<{
    message: string
    type?: "success" | "error"
  } | null>(null)
  const [viewReview, setViewReview] = useState<Review | null>(null)
  const [viewPost, setViewPost] = useState<ForumPost | null>(null)
  const [deleteReviewId, setDeleteReviewId] = useState<string | null>(null)
  const [deletePostId, setDeletePostId] = useState<string | null>(null)
  const [postFilter, setPostFilter] = useState("")
  const [reviewsSubTab, setReviewsSubTab] = useState<"reviews" | "reactions">(
    "reviews",
  )
  const [page, setPage] = useState(1)
  const perPage = 10

  function showToast(msg: string) {
    setToast({ message: msg })
  }

  function updatePostStatus(id: string, status: PostStatus) {
    void postState.update(id, { status })
  }

  const filteredReviews = useMemo(() => {
    const q = search.toLowerCase()
    if (!q) return reviews
    return reviews.filter(
      (r) =>
        r.subscriberName.toLowerCase().includes(q) ||
        r.contentTitle.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q),
    )
  }, [reviews, search])

  const filteredPosts = useMemo(() => {
    let list = [...posts]
    if (postFilter) list = list.filter((p) => p.status === postFilter)
    const q = search.toLowerCase()
    if (q)
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.authorName.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q),
      )
    return list
  }, [posts, postFilter, search])

  const filteredComments = useMemo(() => {
    const q = search.toLowerCase()
    if (!q) return comments
    return comments.filter((c) =>
      `${c.authorName} ${c.postTitle} ${c.body} ${c.id}`
        .toLowerCase()
        .includes(q),
    )
  }, [comments, search])

  const filteredReactions = useMemo(() => {
    const q = search.toLowerCase()
    if (!q) return reactions
    return reactions.filter((r) =>
      `${r.subscriberName} ${r.contentTitle} ${r.type} ${r.id}`
        .toLowerCase()
        .includes(q),
    )
  }, [reactions, search])

  const TABS = [
    {
      id: "reviews" as CommunityTab,
      label: "Reviews & Reactions",
      count: reviews.length + reactions.length,
    },
    { id: "posts" as CommunityTab, label: "Posts", count: posts.length },
    {
      id: "comments" as CommunityTab,
      label: "Comments",
      count: comments.length,
    },
  ]

  const activeRows =
    activeTab === "reviews"
      ? reviewsSubTab === "reviews"
        ? filteredReviews
        : filteredReactions
      : activeTab === "posts"
        ? filteredPosts
        : filteredComments
  const paginatedRows = activeRows.slice((page - 1) * perPage, page * perPage)

  function selectTab(tab: CommunityTab) {
    setActiveTab(tab)
    setSearch("")
    setPostFilter("")
    setPage(1)
  }

  return (
    <div className="admin-page-shell community-workspace">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {viewReview && !deleteReviewId && (
        <ReviewViewModal
          review={viewReview}
          onClose={() => setViewReview(null)}
          onDelete={() => {
            setDeleteReviewId(viewReview.id)
            setViewReview(null)
          }}
        />
      )}
      {deleteReviewId && (
        <ConfirmDialog
          heading="Delete review?"
          message="This review will be permanently removed."
          confirmLabel="Delete Review"
          onConfirm={() => {
            void reviewState.remove(deleteReviewId)
            setDeleteReviewId(null)
            showToast("Review deleted successfully.")
          }}
          onCancel={() => setDeleteReviewId(null)}
          danger
        />
      )}
      {viewPost && !deletePostId && (
        <PostViewModal
          post={viewPost}
          onClose={() => setViewPost(null)}
          onHide={() => {
            updatePostStatus(viewPost.id, "Hidden")
            setViewPost(null)
            showToast("Post hidden successfully.")
          }}
          onRestore={() => {
            updatePostStatus(viewPost.id, "Active")
            setViewPost(null)
            showToast("Post restored successfully.")
          }}
          onDelete={() => {
            setDeletePostId(viewPost.id)
            setViewPost(null)
          }}
        />
      )}
      {deletePostId && (
        <ConfirmDialog
          heading="Delete post?"
          message="This forum post will be permanently removed."
          confirmLabel="Delete Post"
          onConfirm={() => {
            updatePostStatus(deletePostId, "Deleted")
            setDeletePostId(null)
            showToast("Post deleted successfully.")
          }}
          onCancel={() => setDeletePostId(null)}
          danger
        />
      )}

      <AdminPageHeader
        eyebrow="Community moderation"
        title="Community"
        description="Monitor and manage community activity across reviews, reactions, posts, and comments."
      />

      <AdminWorkspaceTabs
        tabs={TABS}
        active={activeTab}
        onChange={selectTab}
        label="Community moderation sections"
      />

      <AdminStats>
        <AdminStatCard
          label="Reviews"
          value={reviews.length}
          hint="Available review records"
          tone="purple"
        />
        <AdminStatCard
          label="Reactions"
          value={reactions.length}
          hint="Available reaction records"
          tone="gold"
        />
        <AdminStatCard
          label="Posts"
          value={posts.length}
          hint="All forum post records"
          tone="green"
        />
        <AdminStatCard
          label="Comments"
          value={comments.length}
          hint="All forum comment records"
          tone="blue"
        />
      </AdminStats>

      {/* Search */}
      <div className="admin-filter-row flex gap-3 mb-4 flex-wrap" role="search">
        <div className="relative flex-1 min-w-40">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
            style={{ color: "var(--taupe)" }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"
            />
          </svg>
          <input
            className="input-field"
            style={{ paddingLeft: "2.25rem" }}
            placeholder={
              activeTab === "reviews"
                ? "Search reviews and reactions…"
                : activeTab === "posts"
                  ? "Search posts…"
                  : "Search comments…"
            }
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            aria-label="Search community records"
          />
        </div>
        {activeTab === "posts" && (
          <select
            className="select-field"
            style={{ width: "auto", minWidth: 160 }}
            value={postFilter}
            onChange={(e) => {
              setPostFilter(e.target.value)
              setPage(1)
            }}
          >
            <option value="">All Statuses</option>
            <option>Active</option>
            <option>Hidden</option>
            <option>Deleted</option>
          </select>
        )}
        <button
          onClick={() => {
            setSearch("")
            setPostFilter("")
            setPage(1)
          }}
          className="btn-ghost px-4 py-2 rounded-lg text-sm font-medium"
        >
          Reset Filters
        </button>
      </div>

      {/* Reviews & Reactions Tab */}
      {activeTab === "reviews" && (
        <>
          <div className="flex gap-2 mb-4">
            {(["reviews", "reactions"] as const).map((t) => (
              <button
                key={t}
                onClick={() => {
                  setReviewsSubTab(t)
                  setPage(1)
                }}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
                  reviewsSubTab === t ? "text-white" : "text-[#9CA3AF]"
                }`}
                style={
                  reviewsSubTab === t
                    ? {
                        backgroundColor: "rgba(124,58,237,0.2)",
                        border: "1px solid rgba(124,58,237,0.4)",
                      }
                    : { border: "1px solid var(--stone)" }
                }
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {reviewsSubTab === "reviews" && (
            <>
              <div className="card overflow-hidden">
                <div className="overflow-x-auto scrollbar-thin">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--stone)" }}>
                        {[
                          "Review ID",
                          "Subscriber",
                          "Content",
                          "Rating",
                          "Review",
                          "Date",
                          "Actions",
                        ].map((col) => (
                          <th
                            key={col}
                            className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap"
                            style={{ color: "var(--taupe)" }}
                          >
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredReviews.length === 0 ? (
                        <tr>
                          <td
                            colSpan={7}
                            className="px-4 py-12 text-center text-sm"
                            style={{ color: "var(--taupe)" }}
                          >
                            No reviews found.
                          </td>
                        </tr>
                      ) : (
                        (paginatedRows as Review[]).map((r) => (
                          <tr
                            key={r.id}
                            style={{
                              borderBottom: "1px solid rgba(55,65,81,0.5)",
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.backgroundColor =
                                "rgba(255,255,255,0.03)")
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.backgroundColor =
                                "transparent")
                            }
                          >
                            <td className="px-3 py-3">
                              <span
                                className="text-xs font-mono"
                                style={{ color: "var(--taupe)" }}
                              >
                                {r.id}
                              </span>
                            </td>
                            <td className="px-3 py-3">
                              <div className="min-w-0">
                                <span className="text-white text-sm font-medium whitespace-nowrap block">
                                  {r.subscriberName}
                                </span>
                                <span
                                  className="text-xs font-mono block mt-0.5"
                                  style={{ color: "#7f778d" }}
                                >
                                  {r.subscriberId}
                                </span>
                              </div>
                            </td>
                            <td
                              className="px-3 py-3 max-w-[160px] truncate"
                              style={{ color: "var(--taupe)" }}
                            >
                              {r.contentTitle}
                            </td>
                            <td className="px-3 py-3">
                              <StarRating rating={r.rating} />
                            </td>
                            <td
                              className="px-3 py-3 max-w-[260px] truncate"
                              style={{ color: "var(--taupe)" }}
                              title={r.text}
                            >
                              {r.text}
                            </td>
                            <td
                              className="px-3 py-3 whitespace-nowrap text-xs"
                              style={{ color: "var(--taupe)" }}
                            >
                              {formatDate(r.date)}
                            </td>
                            <td className="px-3 py-3">
                              <div className="flex gap-1">
                                <button
                                  onClick={() => setViewReview(r)}
                                  className="btn-wine px-2 py-1 rounded text-xs"
                                >
                                  View
                                </button>
                                <button
                                  onClick={() => setDeleteReviewId(r.id)}
                                  className="btn-danger px-2 py-1 rounded text-xs"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              <AdminTablePagination
                page={page}
                total={filteredReviews.length}
                perPage={perPage}
                onPage={setPage}
                label="reviews"
              />
            </>
          )}

          {reviewsSubTab === "reactions" && (
            <>
              <div className="card overflow-hidden">
                <div className="overflow-x-auto scrollbar-thin">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--stone)" }}>
                        {[
                          "Reaction ID",
                          "Subscriber",
                          "Content",
                          "Type",
                          "Date",
                          "Actions",
                        ].map((col) => (
                          <th
                            key={col}
                            className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap"
                            style={{ color: "var(--taupe)" }}
                          >
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredReactions.length === 0 ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-4 py-12 text-center text-sm"
                            style={{ color: "var(--taupe)" }}
                          >
                            No reactions found.
                          </td>
                        </tr>
                      ) : (
                        (paginatedRows as Reaction[]).map((r) => (
                          <tr
                            key={r.id}
                            style={{
                              borderBottom: "1px solid rgba(55,65,81,0.5)",
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.backgroundColor =
                                "rgba(255,255,255,0.03)")
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.backgroundColor =
                                "transparent")
                            }
                          >
                            <td className="px-3 py-3">
                              <span
                                className="text-xs font-mono"
                                style={{ color: "var(--taupe)" }}
                              >
                                {r.id}
                              </span>
                            </td>
                            <td className="px-3 py-3">
                              <div className="min-w-0">
                                <span className="text-white text-sm font-medium whitespace-nowrap block">
                                  {r.subscriberName}
                                </span>
                                <span
                                  className="text-xs font-mono block mt-0.5"
                                  style={{ color: "#7f778d" }}
                                >
                                  {r.subscriberId}
                                </span>
                              </div>
                            </td>
                            <td
                              className="px-3 py-3 max-w-[160px] truncate"
                              style={{ color: "var(--taupe)" }}
                            >
                              {r.contentTitle}
                            </td>
                            <td className="px-3 py-3 text-white">{r.type}</td>
                            <td
                              className="px-3 py-3 whitespace-nowrap text-xs"
                              style={{ color: "var(--taupe)" }}
                            >
                              {formatDate(r.date)}
                            </td>
                            <td className="px-3 py-3">
                              <button
                                onClick={() => {
                                  void reactionState.remove(r.id)
                                  showToast("Reaction removed.")
                                }}
                                className="btn-danger px-2 py-1 rounded text-xs"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              <AdminTablePagination
                page={page}
                total={filteredReactions.length}
                perPage={perPage}
                onPage={setPage}
                label="reactions"
              />
            </>
          )}
        </>
      )}

      {/* Posts Tab */}
      {activeTab === "posts" && (
        <>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--stone)" }}>
                    {[
                      "Post ID",
                      "Author",
                      "Post",
                      "Status",
                      "Date",
                      "Actions",
                    ].map((col) => (
                      <th
                        key={col}
                        className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap"
                        style={{ color: "var(--taupe)" }}
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredPosts.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-12 text-center text-sm"
                        style={{ color: "var(--taupe)" }}
                      >
                        No posts found.
                      </td>
                    </tr>
                  ) : (
                    (paginatedRows as ForumPost[]).map((p) => (
                      <tr
                        key={p.id}
                        style={{ borderBottom: "1px solid rgba(55,65,81,0.5)" }}
                      >
                        <td className="px-3 py-3">
                          <span
                            className="text-xs font-mono"
                            style={{ color: "var(--taupe)" }}
                          >
                            {p.id}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <div className="min-w-0">
                            <span className="text-white text-sm font-medium whitespace-nowrap block">
                              {p.authorName}
                            </span>
                            <span
                              className="text-xs font-mono block mt-0.5"
                              style={{ color: "#7f778d" }}
                            >
                              {p.subscriberId}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-3 max-w-[320px]">
                          <span className="text-white font-medium truncate block">
                            {p.title}
                          </span>
                          <span
                            className="text-xs truncate block mt-0.5"
                            style={{ color: "var(--taupe)" }}
                            title={p.body}
                          >
                            {p.body}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <GenericBadge label={p.status} />
                        </td>
                        <td
                          className="px-3 py-3 whitespace-nowrap text-xs"
                          style={{ color: "var(--taupe)" }}
                        >
                          {formatDate(p.date)}
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex gap-1">
                            <button
                              onClick={() => setViewPost(p)}
                              className="btn-wine px-2 py-1 rounded text-xs"
                            >
                              View
                            </button>
                            {p.status === "Active" && (
                              <button
                                onClick={() => {
                                  updatePostStatus(p.id, "Hidden")
                                  showToast("Post hidden.")
                                }}
                                className="px-2 py-1 rounded text-xs transition-colors"
                                style={{
                                  backgroundColor: "rgba(245,168,0,0.12)",
                                  color: "#F5A800",
                                  border: "1px solid rgba(245,168,0,0.3)",
                                }}
                              >
                                Hide
                              </button>
                            )}
                            {p.status === "Hidden" && (
                              <button
                                onClick={() => {
                                  updatePostStatus(p.id, "Active")
                                  showToast("Post restored.")
                                }}
                                className="px-2 py-1 rounded text-xs"
                                style={{
                                  backgroundColor: "rgba(16,185,129,0.12)",
                                  color: "#10B981",
                                  border: "1px solid rgba(16,185,129,0.3)",
                                }}
                              >
                                Restore
                              </button>
                            )}
                            {p.status !== "Deleted" && (
                              <button
                                onClick={() => setDeletePostId(p.id)}
                                className="btn-danger px-2 py-1 rounded text-xs"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <AdminTablePagination
            page={page}
            total={filteredPosts.length}
            perPage={perPage}
            onPage={setPage}
            label="posts"
          />
        </>
      )}

      {/* Comments Tab */}
      {activeTab === "comments" && (
        <>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--stone)" }}>
                    {[
                      "Comment ID",
                      "Related Post",
                      "Author",
                      "Comment",
                      "Date",
                      "Actions",
                    ].map((col) => (
                      <th
                        key={col}
                        className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap"
                        style={{ color: "var(--taupe)" }}
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredComments.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-12 text-center text-sm"
                        style={{ color: "var(--taupe)" }}
                      >
                        No comments found.
                      </td>
                    </tr>
                  ) : (
                    (paginatedRows as ForumComment[]).map((c) => (
                      <tr
                        key={c.id}
                        style={{ borderBottom: "1px solid rgba(55,65,81,0.5)" }}
                      >
                        <td className="px-3 py-3">
                          <span
                            className="text-xs font-mono"
                            style={{ color: "var(--taupe)" }}
                          >
                            {c.id}
                          </span>
                        </td>
                        <td
                          className="px-3 py-3 max-w-[180px] truncate text-xs"
                          style={{ color: "var(--taupe)" }}
                        >
                          {c.postTitle}
                        </td>
                        <td className="px-3 py-3">
                          <div className="min-w-0">
                            <span className="text-white text-sm font-medium whitespace-nowrap block">
                              {c.authorName}
                            </span>
                            <span
                              className="text-xs font-mono block mt-0.5"
                              style={{ color: "#7f778d" }}
                            >
                              {c.subscriberId}
                            </span>
                          </div>
                        </td>
                        <td
                          className="px-3 py-3 max-w-[320px] truncate"
                          style={{ color: "var(--taupe)" }}
                          title={c.body}
                        >
                          {c.body}
                        </td>
                        <td
                          className="px-3 py-3 whitespace-nowrap text-xs"
                          style={{ color: "var(--taupe)" }}
                        >
                          {formatDate(c.date)}
                        </td>
                        <td className="px-3 py-3">
                          <button
                            onClick={() => {
                              void commentState.remove(c.id)
                              showToast("Comment deleted.")
                            }}
                            className="btn-danger px-2 py-1 rounded text-xs"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <AdminTablePagination
            page={page}
            total={filteredComments.length}
            perPage={perPage}
            onPage={setPage}
            label="comments"
          />
        </>
      )}
    </div>
  )
}
