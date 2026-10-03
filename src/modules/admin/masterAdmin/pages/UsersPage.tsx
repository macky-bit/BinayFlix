import { useState, useMemo } from 'react'
import type { Subscriber, Subscription, Payment, SubscriberStatus, PaymentStatus, WatchHistory, Plan } from '../types'
import { useAdminCollection, useAdminRepository } from '../../data'
import { formatDate, formatShortDate, getInitials } from '../utils'
import { GenericBadge } from '../components/Badge'
import Toast from '../components/Toast'
import ConfirmDialog from '../components/ConfirmDialog'

type UsersTab = 'subscribers' | 'watchHistory' | 'subscriptions' | 'plans' | 'payments'

function Avatar({ name, color, size = 28 }: { name: string; color: string; size?: number }) {
  return (
    <div className="rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 text-xs"
      style={{ width: size, height: size, backgroundColor: color }}>
      {getInitials(name)}
    </div>
  )
}

function TableCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto scrollbar-thin">{children}</div>
    </div>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap" style={{ color: 'var(--taupe)' }}>{children}</th>
}

function Td({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-3 py-3 ${className}`}>{children}</td>
}

// Edit Subscriber Modal
function EditSubscriberModal({ sub, subs, onSave, onClose }: {
  sub: Subscriber; subs: Subscriber[]
  onSave: (s: Subscriber) => void; onClose: () => void
}) {
  const [form, setForm] = useState({ name: sub.name, email: sub.email, username: sub.username, status: sub.status })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  function validate() {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'Name is required.'
    if (!form.email.trim()) e.email = 'Email is required.'
    else if (subs.some(s => s.id !== sub.id && s.email.toLowerCase() === form.email.toLowerCase())) e.email = 'Email already in use.'
    return e
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true)
    setTimeout(() => { onSave({ ...sub, ...form }); setLoading(false) }, 600)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Edit Subscriber</h2>
          <button onClick={onClose} className="text-[#9CA3AF] hover:text-white p-1 rounded" aria-label="Close">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <div><label className="block text-sm font-medium mb-1.5 text-white">Subscriber ID</label><div className="input-field opacity-50">{sub.id}</div></div>
          {[
            { id: 'name', label: 'Full Name *', type: 'text', value: form.name, key: 'name' },
            { id: 'email', label: 'Email *', type: 'email', value: form.email, key: 'email' },
            { id: 'username', label: 'Username', type: 'text', value: form.username, key: 'username' },
          ].map(({ id, label, type, value, key }) => (
            <div key={id}>
              <label htmlFor={id} className="block text-sm font-medium mb-1.5 text-white">{label}</label>
              <input id={id} type={type} className="input-field" value={value}
                onChange={e => { setForm(f => ({ ...f, [key]: e.target.value })); setErrors(er => ({ ...er, [key]: '' })) }}
                placeholder={`Enter ${label.replace(' *', '').toLowerCase()}`} />
              {errors[key] && <p className="mt-1 text-xs text-red-400">{errors[key]}</p>}
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium mb-1.5 text-white">Account Status</label>
            <select className="select-field" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as SubscriberStatus }))}>
              <option>Active</option><option>Inactive</option><option>Banned</option>
            </select>
          </div>
          <div><label className="block text-sm font-medium mb-1.5 text-white">Join Date</label><div className="input-field opacity-50">{formatShortDate(sub.joinDate)}</div></div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={onClose} className="btn-ghost px-4 py-2.5 rounded-lg text-sm font-medium" disabled={loading}>Cancel</button>
            <button type="submit" className="btn-gold px-5 py-2.5 rounded-lg text-sm" disabled={loading}>{loading ? 'Saving…' : 'Save Changes'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function UsersPage() {
  const [activeTab, setActiveTab] = useState<UsersTab>('subscribers')
  const subscriberState = useAdminCollection(useAdminRepository<Subscriber>('subscribers'))
  const paymentState = useAdminCollection(useAdminRepository<Payment>('payments'))
  const subscriptionState = useAdminCollection(useAdminRepository<Subscription>('subscriptions'))
  const watchHistory = useAdminCollection(useAdminRepository<WatchHistory>('watch-history')).items
  const plans = useAdminCollection(useAdminRepository<Plan>('plans')).items
  const subscribers = subscriberState.items
  const payments = paymentState.items
  const subscriptions = subscriptionState.items
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'error' } | null>(null)
  const [editSub, setEditSub] = useState<Subscriber | null>(null)
  const [verifyPaymentId, setVerifyPaymentId] = useState<string | null>(null)
  const [cancelSubId, setCancelSubId] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  function showToast(msg: string) { setToast({ message: msg }) }

  const filteredSubscribers = useMemo(() => {
    let list = [...subscribers]
    const q = search.toLowerCase()
    if (q) list = list.filter(s => s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q) || s.id.toLowerCase().includes(q))
    if (statusFilter) list = list.filter(s => s.status === statusFilter)
    return list
  }, [subscribers, search, statusFilter])

  const TABS: { id: UsersTab; label: string; group: string }[] = [
    { id: 'subscribers', label: 'Subscribers', group: 'User Management' },
    { id: 'watchHistory', label: 'Watch History', group: 'User Management' },
    { id: 'subscriptions', label: 'Subscriptions', group: 'Subscription Management' },
    { id: 'plans', label: 'Plans', group: 'Subscription Management' },
    { id: 'payments', label: 'Payments', group: 'Subscription Management' },
  ]

  return (
    <div className="px-4 md:px-6 py-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {editSub && (
        <EditSubscriberModal
          sub={editSub}
          subs={subscribers}
          onSave={updated => { void subscriberState.update(updated.id, updated); setEditSub(null); showToast('Subscriber updated successfully.') }}
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
              void paymentState.update(verifyPaymentId, { status: 'Verified' as PaymentStatus })
              setVerifyPaymentId(null); setActionLoading(false)
              showToast('Payment verified successfully.')
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
              void subscriptionState.update(cancelSubId, { status: 'Cancelled' })
              setCancelSubId(null); setActionLoading(false)
              showToast('Subscription cancelled.')
            }, 600)
          }}
          onCancel={() => setCancelSubId(null)}
          danger loading={actionLoading}
        />
      )}

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">User & Subscription Management</h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--taupe)' }}>Manage subscribers, watch history, subscriptions, plans, and payments.</p>
      </div>

      {/* Tab groups */}
      <div className="mb-6">
        <div className="flex gap-6 mb-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--taupe)' }}>User Management</p>
            <div className="flex gap-1" style={{ borderBottom: '2px solid var(--stone)' }}>
              {TABS.filter(t => t.group === 'User Management').map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === tab.id ? 'tab-active' : 'tab-inactive'}`}>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--taupe)' }}>Subscription Management</p>
            <div className="flex gap-1" style={{ borderBottom: '2px solid var(--stone)' }}>
              {TABS.filter(t => t.group === 'Subscription Management').map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === tab.id ? 'tab-active' : 'tab-inactive'}`}>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Search for subscriber-heavy tabs */}
      {['subscribers', 'subscriptions', 'payments'].includes(activeTab) && (
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="relative flex-1 min-w-40">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'var(--taupe)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
            </svg>
            <input className="input-field" style={{ paddingLeft: '2.25rem' }} placeholder={`Search ${activeTab}…`} value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          {activeTab === 'subscribers' && (
            <select className="select-field" style={{ width: 'auto', minWidth: 160 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">All Statuses</option>
              <option>Active</option><option>Inactive</option><option>Banned</option>
            </select>
          )}
          <button onClick={() => { setSearch(''); setStatusFilter('') }} className="btn-ghost px-4 py-2 rounded-lg text-sm font-medium">Reset Filters</button>
        </div>
      )}

      {/* Subscribers */}
      {activeTab === 'subscribers' && (
        <TableCard>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--stone)' }}>
                <Th>Sub ID</Th><Th>Subscriber</Th><Th>Email</Th><Th>Username</Th><Th>Status</Th><Th>Join Date</Th><Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {filteredSubscribers.length === 0
                ? <tr><td colSpan={7} className="px-4 py-12 text-center text-sm" style={{ color: 'var(--taupe)' }}>No subscriber records are available.</td></tr>
                : filteredSubscribers.map(s => (
                  <tr key={s.id} style={{ borderBottom: '1px solid rgba(55,65,81,0.5)' }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                    <Td><span className="text-xs font-mono" style={{ color: 'var(--taupe)' }}>{s.id}</span></Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        <Avatar name={s.name} color={s.avatarColor} />
                        <span className="text-white font-medium whitespace-nowrap">{s.name}</span>
                      </div>
                    </Td>
                    <Td><span className="text-sm" style={{ color: 'var(--taupe)' }}>{s.email}</span></Td>
                    <Td><span className="text-sm" style={{ color: 'var(--taupe)' }}>{s.username}</span></Td>
                    <Td><GenericBadge label={s.status} /></Td>
                    <Td><span className="text-xs whitespace-nowrap" style={{ color: 'var(--taupe)' }}>{formatShortDate(s.joinDate)}</span></Td>
                    <Td>
                      <div className="flex gap-1">
                        <button onClick={() => setEditSub(s)} className="btn-wine px-2 py-1 rounded text-xs">Edit</button>
                        <button onClick={() => {
                          const newStatus: SubscriberStatus = s.status === 'Active' ? 'Inactive' : 'Active'
                          void subscriberState.update(s.id, { status: newStatus })
                          showToast(`Subscriber ${newStatus === 'Active' ? 'activated' : 'deactivated'}.`)
                        }} className={`px-2 py-1 rounded text-xs border ${s.status === 'Active' ? 'border-red-400/30 text-red-400 hover:bg-red-400/10' : 'border-green-400/30 text-green-400 hover:bg-green-400/10'} transition-colors`}>
                          {s.status === 'Active' ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </Td>
                  </tr>
                ))}
            </tbody>
          </table>
        </TableCard>
      )}

      {/* Watch History */}
      {activeTab === 'watchHistory' && (
        <TableCard>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--stone)' }}>
                <Th>History ID</Th><Th>Subscriber</Th><Th>Content</Th><Th>Watched At</Th><Th>Progress</Th>
              </tr>
            </thead>
            <tbody>
              {watchHistory.map(w => (
                <tr key={w.id} style={{ borderBottom: '1px solid rgba(55,65,81,0.5)' }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                  <Td><span className="text-xs font-mono" style={{ color: 'var(--taupe)' }}>{w.id}</span></Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <Avatar name={w.subscriberName} color="#7C3AED" size={24} />
                      <span className="text-white text-sm whitespace-nowrap">{w.subscriberName}</span>
                    </div>
                  </Td>
                  <Td><span className="text-white">{w.contentTitle}</span></Td>
                  <Td><span className="text-xs whitespace-nowrap" style={{ color: 'var(--taupe)' }}>{formatDate(w.watchedAt)}</span></Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 rounded-full" style={{ backgroundColor: 'var(--stone)' }}>
                        <div className="h-1.5 rounded-full" style={{ width: w.progress, backgroundColor: 'var(--wine)' }} />
                      </div>
                      <span className="text-xs" style={{ color: 'var(--taupe)' }}>{w.progress}</span>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableCard>
      )}

      {/* Subscriptions */}
      {activeTab === 'subscriptions' && (
        <TableCard>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--stone)' }}>
                <Th>Sub ID</Th><Th>Subscriber</Th><Th>Plan</Th><Th>Start Date</Th><Th>End Date</Th><Th>Status</Th><Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.map(s => (
                <tr key={s.id} style={{ borderBottom: '1px solid rgba(55,65,81,0.5)' }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                  <Td><span className="text-xs font-mono" style={{ color: 'var(--taupe)' }}>{s.id}</span></Td>
                  <Td><span className="text-white whitespace-nowrap">{s.subscriberName}</span></Td>
                  <Td><span className="text-sm" style={{ color: 'var(--taupe)' }}>{s.planName}</span></Td>
                  <Td><span className="text-xs whitespace-nowrap" style={{ color: 'var(--taupe)' }}>{formatShortDate(s.startDate)}</span></Td>
                  <Td><span className="text-xs whitespace-nowrap" style={{ color: 'var(--taupe)' }}>{formatShortDate(s.endDate)}</span></Td>
                  <Td><GenericBadge label={s.status} /></Td>
                  <Td>
                    {s.status === 'Active' && (
                      <button onClick={() => setCancelSubId(s.id)} className="btn-danger px-2 py-1 rounded text-xs">Cancel</button>
                    )}
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableCard>
      )}

      {/* Plans */}
      {activeTab === 'plans' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map(plan => (
            <div key={plan.id} className="card p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
                  <p className="text-xl font-bold mt-0.5" style={{ color: 'var(--gold)' }}>{plan.price}</p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(124,58,237,0.15)', color: '#A78BFA', border: '1px solid rgba(124,58,237,0.35)' }}>{plan.duration}</span>
              </div>
              <ul className="flex flex-col gap-1.5 mb-4">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm" style={{ color: 'var(--taupe)' }}>
                    <svg className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#10B981' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <button className="btn-wine w-full py-2 rounded-lg text-sm font-medium" onClick={() => showToast('Plan edit coming soon.')}>Edit Plan</button>
            </div>
          ))}
        </div>
      )}

      {/* Payments */}
      {activeTab === 'payments' && (
        <TableCard>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--stone)' }}>
                <Th>Payment ID</Th><Th>Subscriber</Th><Th>Plan</Th><Th>Amount</Th><Th>Date</Th><Th>Status</Th><Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {payments.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid rgba(55,65,81,0.5)' }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                  <Td><span className="text-xs font-mono" style={{ color: 'var(--taupe)' }}>{p.id}</span></Td>
                  <Td><span className="text-white whitespace-nowrap">{p.subscriberName}</span></Td>
                  <Td><span className="text-sm" style={{ color: 'var(--taupe)' }}>{p.planName}</span></Td>
                  <Td><span className="text-sm font-semibold" style={{ color: 'var(--gold)' }}>{p.amount}</span></Td>
                  <Td><span className="text-xs whitespace-nowrap" style={{ color: 'var(--taupe)' }}>{formatShortDate(p.date)}</span></Td>
                  <Td><GenericBadge label={p.status} /></Td>
                  <Td>
                    {p.status === 'Pending' && (
                      <button onClick={() => setVerifyPaymentId(p.id)} className="btn-wine px-2 py-1 rounded text-xs">Verify</button>
                    )}
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableCard>
      )}
    </div>
  )
}
