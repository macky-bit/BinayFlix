import { useState, useMemo } from "react"
import type {
  Subscriber,
  Subscription,
  Payment,
  SubscriberStatus,
  PaymentStatus,
  WatchHistory,
  Plan,
} from "../types"
import { useAdminCollection, useAdminRepository } from "../../data"
import { formatDate, formatShortDate } from "../utils"
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

type UsersTab = "subscribers" | "watchHistory" | "subscriptions" | "plans" | "payments"

interface UsersTabConfig {
  id: UsersTab
  label: string
  count: number
}

function TableCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto scrollbar-thin">{children}</div>
    </div>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th
      className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap"
      style={{ color: "var(--taupe)" }}
    >
      {children}
    </th>
  )
}

function Td({
  children,
  className = "",
}: {
  children: React.ReactNode
  className?: string
}) {
  return <td className={`px-3 py-3 ${className}`}>{children}</td>
}

// Edit Subscriber Modal
function EditSubscriberModal({
  sub,
  subs,
  onSave,
  onClose,
}: {
  sub: Subscriber
  subs: Subscriber[]
  onSave: (s: Subscriber) => void
  onClose: () => void
}) {
  const [form, setForm] = useState({
    name: sub.name,
    email: sub.email,
    username: sub.username,
    status: sub.status,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  function validate() {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = "Name is required."
    if (!form.email.trim()) e.email = "Email is required."
    else if (
      subs.some(
        (s) =>
          s.id !== sub.id && s.email.toLowerCase() === form.email.toLowerCase(),
      )
    )
      e.email = "Email already in use."
    return e
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) {
      setErrors(errs)
      return
    }
    setLoading(true)
    setTimeout(() => {
      onSave({ ...sub, ...form })
      setLoading(false)
    }, 600)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Edit Subscriber</h2>
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
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4"
          noValidate
        >
          <div>
            <label className="block text-sm font-medium mb-1.5 text-white">
              Subscriber ID
            </label>
            <div className="input-field opacity-50">{sub.id}</div>
          </div>
          {[
            {
              id: "name",
              label: "Full Name *",
              type: "text",
              value: form.name,
              key: "name",
            },
            {
              id: "email",
              label: "Email *",
              type: "email",
              value: form.email,
              key: "email",
            },
            {
              id: "username",
              label: "Username",
              type: "text",
              value: form.username,
              key: "username",
            },
          ].map(({ id, label, type, value, key }) => (
            <div key={id}>
              <label
                htmlFor={id}
                className="block text-sm font-medium mb-1.5 text-white"
              >
                {label}
              </label>
              <input
                id={id}
                type={type}
                className="input-field"
                value={value}
                onChange={(e) => {
                  setForm((f) => ({ ...f, [key]: e.target.value }))
                  setErrors((er) => ({ ...er, [key]: "" }))
                }}
                placeholder={`Enter ${label.replace(" *", "").toLowerCase()}`}
              />
              {errors[key] && (
                <p className="mt-1 text-xs text-red-400">{errors[key]}</p>
              )}
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium mb-1.5 text-white">
              Account Status
            </label>
            <select
              className="select-field"
              value={form.status}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  status: e.target.value as SubscriberStatus,
                }))
              }
            >
              <option>Active</option>
              <option>Inactive</option>
              <option>Banned</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 text-white">
              Join Date
            </label>
            <div className="input-field opacity-50">
              {formatShortDate(sub.joinDate)}
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost px-4 py-2.5 rounded-lg text-sm font-medium"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-gold px-5 py-2.5 rounded-lg text-sm"
              disabled={loading}
            >
              {loading ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function UsersPage() {
  const [activeTab, setActiveTab] = useState<UsersTab>("subscribers")
  const subscriberState = useAdminCollection(
    useAdminRepository<Subscriber>("subscribers"),
  )
  const paymentState = useAdminCollection(
    useAdminRepository<Payment>("payments"),
  )
  const subscriptionState = useAdminCollection(
    useAdminRepository<Subscription>("subscriptions"),
  )
  const watchHistory = useAdminCollection(
    useAdminRepository<WatchHistory>("watch-history"),
  ).items
  const plans = useAdminCollection(useAdminRepository<Plan>("plans")).items
  const subscribers = subscriberState.items
  const payments = paymentState.items
  const subscriptions = subscriptionState.items
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [toast, setToast] = useState<{
    message: string
    type?: "success" | "error"
  } | null>(null)
  const [editSub, setEditSub] = useState<Subscriber | null>(null)
  const [verifyPaymentId, setVerifyPaymentId] = useState<string | null>(null)
  const [cancelSubId, setCancelSubId] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [page, setPage] = useState(1)
  const perPage = 10

  function showToast(msg: string) {
    setToast({ message: msg })
  }

  const filteredSubscribers = useMemo(() => {
    let list = [...subscribers]
    const q = search.toLowerCase()
    if (q)
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q) ||
          s.id.toLowerCase().includes(q),
      )
    if (statusFilter) list = list.filter((s) => s.status === statusFilter)
    return list
  }, [subscribers, search, statusFilter])

  const filteredSubscriptions = useMemo(() => {
    const q = search.toLowerCase()
    if (!q) return subscriptions
    return subscriptions.filter((s) =>
      `${s.subscriberName} ${s.planName} ${s.id}`.toLowerCase().includes(q),
    )
  }, [subscriptions, search])

  const filteredPayments = useMemo(() => {
    const q = search.toLowerCase()
    if (!q) return payments
    return payments.filter((p) =>
      `${p.subscriberName} ${p.planName} ${p.id} ${p.status}`
        .toLowerCase()
        .includes(q),
    )
  }, [payments, search])

  const TABS: UsersTabConfig[] = [
    { id: "subscribers", label: "Subscribers", count: subscribers.length },
    { id: "watchHistory", label: "Watch History", count: watchHistory.length },
    {
      id: "subscriptions",
      label: "Subscriptions",
      count: subscriptions.length,
    },
    { id: "plans", label: "Plans", count: plans.length },
    { id: "payments", label: "Payments", count: payments.length },
  ]

  const paginatedSubscribers = filteredSubscribers.slice(
    (page - 1) * perPage,
    page * perPage,
  )
  const paginatedHistory = watchHistory.slice(
    (page - 1) * perPage,
    page * perPage,
  )
  const paginatedSubscriptions = filteredSubscriptions.slice(
    (page - 1) * perPage,
    page * perPage,
  )
  const paginatedPayments = filteredPayments.slice(
    (page - 1) * perPage,
    page * perPage,
  )

  function selectTab(tab: UsersTab) {
    setActiveTab(tab)
    setSearch("")
    setStatusFilter("")
    setPage(1)
  }

  return (
    <div className="admin-page-shell users-workspace">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      {editSub && (
        <EditSubscriberModal
          sub={editSub}
          subs={subscribers}
          onSave={(updated) => {
            void subscriberState.update(updated.id, updated)
            setEditSub(null)
            showToast("Subscriber updated successfully.")
          }}
          onClose={() => setEditSub(null)}
        />
      )}
      {verifyPaymentId && (
        <ConfirmDialog
          heading="Verify payment?"
          message="This payment will be marked as verified. This action cannot be undone."
          confirmLabel="Verify Payment"
          onConfirm={() => {
            setActionLoading(true)
            setTimeout(() => {
              void paymentState.update(verifyPaymentId, {
                status: "Verified" as PaymentStatus,
              })
              setVerifyPaymentId(null)
              setActionLoading(false)
              showToast("Payment verified successfully.")
            }, 600)
          }}
          onCancel={() => setVerifyPaymentId(null)}
          loading={actionLoading}
        />
      )}
      {cancelSubId && (
        <ConfirmDialog
          heading="Cancel subscription?"
          message="The subscriber's subscription will be cancelled immediately."
          confirmLabel="Cancel Subscription"
          onConfirm={() => {
            setActionLoading(true)
            setTimeout(() => {
              void subscriptionState.update(cancelSubId, {
                status: "Cancelled",
              })
              setCancelSubId(null)
              setActionLoading(false)
              showToast("Subscription cancelled.")
            }, 600)
          }}
          onCancel={() => setCancelSubId(null)}
          danger
          loading={actionLoading}
        />
      )}

      <AdminPageHeader
        eyebrow="User management"
        title="Users"
        description="Manage subscriber accounts, viewing records, plans, subscriptions, and payment verification."
      />

      <AdminWorkspaceTabs
        tabs={TABS}
        active={activeTab}
        onChange={selectTab}
        label="User management sections"
      />

      <AdminStats>
        <AdminStatCard
          label="Total users"
          value={subscribers.length}
          hint="Subscriber records"
          tone="purple"
        />
        <AdminStatCard
          label="Active users"
          value={subscribers.filter((user) => user.status === "Active").length}
          hint="Currently active accounts"
          tone="green"
        />
        <AdminStatCard
          label="Active subscriptions"
          value={
            subscriptions.filter(
              (subscription) => subscription.status === "Active",
            ).length
          }
          hint="Current subscription records"
          tone="blue"
        />
        <AdminStatCard
          label="Pending payments"
          value={
            payments.filter((payment) => payment.status === "Pending").length
          }
          hint="Awaiting verification"
          tone="red"
        />
      </AdminStats>

      {/* Search for subscriber-heavy tabs */}
      {["subscribers", "subscriptions", "payments"].includes(activeTab) && (
        <div
          className="admin-filter-row flex flex-wrap gap-3 mb-4"
          role="search"
        >
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
              placeholder={`Search ${activeTab}…`}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              aria-label={`Search ${activeTab}`}
            />
          </div>
          {activeTab === "subscribers" && (
            <select
              className="select-field"
              style={{ width: "auto", minWidth: 160 }}
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setPage(1)
              }}
            >
              <option value="">All Statuses</option>
              <option>Active</option>
              <option>Inactive</option>
              <option>Banned</option>
            </select>
          )}
          <button
            onClick={() => {
              setSearch("")
              setStatusFilter("")
              setPage(1)
            }}
            className="btn-ghost px-4 py-2 rounded-lg text-sm font-medium"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Subscribers */}
      {activeTab === "subscribers" && (
        <>
          <TableCard>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--stone)" }}>
                  <Th>Subscriber</Th>
                  <Th>Email</Th>
                  <Th>Subscription</Th>
                  <Th>Status</Th>
                  <Th>Joined</Th>
                  <Th>Actions</Th>
                </tr>
              </thead>
              <tbody>
                {filteredSubscribers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-12 text-center text-sm"
                      style={{ color: "var(--taupe)" }}
                    >
                      No subscriber records are available.
                    </td>
                  </tr>
                ) : (
                  paginatedSubscribers.map((s) => (
                    <tr
                      key={s.id}
                      style={{ borderBottom: "1px solid rgba(55,65,81,0.5)" }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor =
                          "rgba(255,255,255,0.03)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = "transparent")
                      }
                    >
                      <Td>
                        <div className="min-w-0">
                          <span className="text-white font-medium whitespace-nowrap block">
                            {s.name}
                          </span>
                          <span
                            className="text-xs block mt-0.5"
                            style={{ color: "#7f778d" }}
                          >
                            @{s.username} · {s.id}
                          </span>
                        </div>
                      </Td>
                      <Td>
                        <span
                          className="text-sm max-w-[250px] truncate block"
                          style={{ color: "var(--taupe)" }}
                          title={s.email}
                        >
                          {s.email}
                        </span>
                      </Td>
                      <Td>
                        <span
                          className="text-sm"
                          style={{ color: "var(--taupe)" }}
                        >
                          {subscriptions.find(
                            (subscription) =>
                              subscription.subscriberId === s.id &&
                              subscription.status === "Active",
                          )?.planName ?? "—"}
                        </span>
                      </Td>
                      <Td>
                        <GenericBadge label={s.status} />
                      </Td>
                      <Td>
                        <span
                          className="text-xs whitespace-nowrap"
                          style={{ color: "var(--taupe)" }}
                        >
                          {formatShortDate(s.joinDate)}
                        </span>
                      </Td>
                      <Td>
                        <div className="flex gap-1">
                          <button
                            onClick={() => setEditSub(s)}
                            className="btn-wine px-2 py-1 rounded text-xs"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              const newStatus: SubscriberStatus =
                                s.status === "Active" ? "Inactive" : "Active"
                              void subscriberState.update(s.id, {
                                status: newStatus,
                              })
                              showToast(
                                `Subscriber ${
                                  newStatus === "Active"
                                    ? "activated"
                                    : "deactivated"
                                }.`,
                              )
                            }}
                            className={`px-2 py-1 rounded text-xs border ${
                              s.status === "Active"
                                ? "border-red-400/30 text-red-400 hover:bg-red-400/10"
                                : "border-green-400/30 text-green-400 hover:bg-green-400/10"
                            } transition-colors`}
                          >
                            {s.status === "Active" ? "Deactivate" : "Activate"}
                          </button>
                        </div>
                      </Td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </TableCard>
          <AdminTablePagination
            page={page}
            total={filteredSubscribers.length}
            perPage={perPage}
            onPage={setPage}
            label="users"
          />
        </>
      )}

      {/* Watch History */}
      {activeTab === "watchHistory" && (
        <>
          <TableCard>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--stone)" }}>
                  <Th>History ID</Th>
                  <Th>Subscriber</Th>
                  <Th>Content</Th>
                  <Th>Watched At</Th>
                  <Th>Progress</Th>
                </tr>
              </thead>
              <tbody>
                {paginatedHistory.map((w) => (
                  <tr
                    key={w.id}
                    style={{ borderBottom: "1px solid rgba(55,65,81,0.5)" }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor =
                        "rgba(255,255,255,0.03)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = "transparent")
                    }
                  >
                    <Td>
                      <span
                        className="text-xs font-mono"
                        style={{ color: "var(--taupe)" }}
                      >
                        {w.id}
                      </span>
                    </Td>
                    <Td>
                      <div className="min-w-0">
                        <span className="text-white text-sm font-medium whitespace-nowrap block">
                          {w.subscriberName}
                        </span>
                        <span
                          className="text-xs font-mono block mt-0.5"
                          style={{ color: "#7f778d" }}
                        >
                          {w.subscriberId}
                        </span>
                      </div>
                    </Td>
                    <Td>
                      <span className="text-white">{w.contentTitle}</span>
                    </Td>
                    <Td>
                      <span
                        className="text-xs whitespace-nowrap"
                        style={{ color: "var(--taupe)" }}
                      >
                        {formatDate(w.watchedAt)}
                      </span>
                    </Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-20 h-1.5 rounded-full"
                          style={{ backgroundColor: "var(--stone)" }}
                        >
                          <div
                            className="h-1.5 rounded-full"
                            style={{
                              width: w.progress,
                              backgroundColor: "var(--wine)",
                            }}
                          />
                        </div>
                        <span
                          className="text-xs"
                          style={{ color: "var(--taupe)" }}
                        >
                          {w.progress}
                        </span>
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableCard>
          <AdminTablePagination
            page={page}
            total={watchHistory.length}
            perPage={perPage}
            onPage={setPage}
            label="viewing records"
          />
        </>
      )}

      {/* Subscriptions */}
      {activeTab === "subscriptions" && (
        <>
          <TableCard>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--stone)" }}>
                  <Th>Sub ID</Th>
                  <Th>Subscriber</Th>
                  <Th>Plan</Th>
                  <Th>Start Date</Th>
                  <Th>End Date</Th>
                  <Th>Status</Th>
                  <Th>Actions</Th>
                </tr>
              </thead>
              <tbody>
                {filteredSubscriptions.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-12 text-center text-sm"
                      style={{ color: "var(--taupe)" }}
                    >
                      No subscription records are available.
                    </td>
                  </tr>
                ) : (
                  paginatedSubscriptions.map((s) => (
                    <tr
                      key={s.id}
                      style={{ borderBottom: "1px solid rgba(55,65,81,0.5)" }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor =
                          "rgba(255,255,255,0.03)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = "transparent")
                      }
                    >
                      <Td>
                        <span
                          className="text-xs font-mono"
                          style={{ color: "var(--taupe)" }}
                        >
                          {s.id}
                        </span>
                      </Td>
                      <Td>
                        <span className="text-white whitespace-nowrap">
                          {s.subscriberName}
                        </span>
                      </Td>
                      <Td>
                        <span
                          className="text-sm"
                          style={{ color: "var(--taupe)" }}
                        >
                          {s.planName}
                        </span>
                      </Td>
                      <Td>
                        <span
                          className="text-xs whitespace-nowrap"
                          style={{ color: "var(--taupe)" }}
                        >
                          {formatShortDate(s.startDate)}
                        </span>
                      </Td>
                      <Td>
                        <span
                          className="text-xs whitespace-nowrap"
                          style={{ color: "var(--taupe)" }}
                        >
                          {formatShortDate(s.endDate)}
                        </span>
                      </Td>
                      <Td>
                        <GenericBadge label={s.status} />
                      </Td>
                      <Td>
                        {s.status === "Active" && (
                          <button
                            onClick={() => setCancelSubId(s.id)}
                            className="btn-danger px-2 py-1 rounded text-xs"
                          >
                            Cancel
                          </button>
                        )}
                      </Td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </TableCard>
          <AdminTablePagination
            page={page}
            total={filteredSubscriptions.length}
            perPage={perPage}
            onPage={setPage}
            label="subscriptions"
          />
        </>
      )}

      {/* Plans */}
      {activeTab === "plans" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <div key={plan.id} className="card p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {plan.name}
                  </h3>
                  <p
                    className="text-xl font-bold mt-0.5"
                    style={{ color: "var(--gold)" }}
                  >
                    {plan.price}
                  </p>
                </div>
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: "rgba(124,58,237,0.15)",
                    color: "#A78BFA",
                    border: "1px solid rgba(124,58,237,0.35)",
                  }}
                >
                  {plan.duration}
                </span>
              </div>
              <ul className="flex flex-col gap-1.5 mb-4">
                {plan.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-center gap-2 text-sm"
                    style={{ color: "var(--taupe)" }}
                  >
                    <svg
                      className="w-3.5 h-3.5 flex-shrink-0"
                      style={{ color: "#10B981" }}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <button
                className="btn-wine w-full py-2 rounded-lg text-sm font-medium"
                onClick={() => showToast("Plan edit coming soon.")}
              >
                Edit Plan
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Payments */}
      {activeTab === "payments" && (
        <>
          <TableCard>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--stone)" }}>
                  <Th>Payment ID</Th>
                  <Th>Subscriber</Th>
                  <Th>Plan</Th>
                  <Th>Amount</Th>
                  <Th>Date</Th>
                  <Th>Status</Th>
                  <Th>Actions</Th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-12 text-center text-sm"
                      style={{ color: "var(--taupe)" }}
                    >
                      No payment records are available.
                    </td>
                  </tr>
                ) : (
                  paginatedPayments.map((p) => (
                    <tr
                      key={p.id}
                      style={{ borderBottom: "1px solid rgba(55,65,81,0.5)" }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor =
                          "rgba(255,255,255,0.03)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = "transparent")
                      }
                    >
                      <Td>
                        <span
                          className="text-xs font-mono"
                          style={{ color: "var(--taupe)" }}
                        >
                          {p.id}
                        </span>
                      </Td>
                      <Td>
                        <span className="text-white whitespace-nowrap">
                          {p.subscriberName}
                        </span>
                      </Td>
                      <Td>
                        <span
                          className="text-sm"
                          style={{ color: "var(--taupe)" }}
                        >
                          {p.planName}
                        </span>
                      </Td>
                      <Td>
                        <span
                          className="text-sm font-semibold"
                          style={{ color: "var(--gold)" }}
                        >
                          {p.amount}
                        </span>
                      </Td>
                      <Td>
                        <span
                          className="text-xs whitespace-nowrap"
                          style={{ color: "var(--taupe)" }}
                        >
                          {formatShortDate(p.date)}
                        </span>
                      </Td>
                      <Td>
                        <GenericBadge label={p.status} />
                      </Td>
                      <Td>
                        {p.status === "Pending" && (
                          <button
                            onClick={() => setVerifyPaymentId(p.id)}
                            className="btn-wine px-2 py-1 rounded text-xs"
                          >
                            Verify
                          </button>
                        )}
                      </Td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </TableCard>
          <AdminTablePagination
            page={page}
            total={filteredPayments.length}
            perPage={perPage}
            onPage={setPage}
            label="payments"
          />
        </>
      )}
    </div>
  )
}
