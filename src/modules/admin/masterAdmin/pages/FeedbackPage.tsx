import { useState, useMemo } from 'react'
import type { FeedbackItem, FeedbackStatus } from '../types'
import { useAdminCollection, useAdminRepository } from '../../data'
import { formatDate } from '../utils'
import { GenericBadge } from '../components/Badge'
import Toast from '../components/Toast'

// Feedback Detail Panel
function FeedbackDetailPanel({ item, onClose, onStatusChange }: {
  item: FeedbackItem
  onClose: () => void
  onStatusChange: (id: string, status: FeedbackStatus) => void
}) {
  const [status, setStatus] = useState<FeedbackStatus>(item.status)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  function handleSave() {
    if (status === item.status) return
    setSaving(true)
    setTimeout(() => {
      onStatusChange(item.id, status)
      setSaving(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }, 600)
  }

  return (
    <aside
      className="flex flex-col rounded-xl overflow-hidden flex-shrink-0"
      style={{ width: 340, backgroundColor: 'var(--ink-soft)', border: '1px solid var(--stone)' }}
    >
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--stone)' }}>
        <h2 className="text-base font-semibold text-white">Feedback Details</h2>
        <button onClick={onClose} className="text-[#9CA3AF] hover:text-white p-1 rounded" aria-label="Close">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-thin px-5 py-4 flex flex-col gap-4">
        <div className="flex flex-col gap-2.5 text-sm">
          {[
            ['Feedback ID', item.id],
            ['Subscriber ID', item.subscriberId],
            ['Type', null],
            ['Submission Date', formatDate(item.submissionDate)],
          ].map(([label, val]) => (
            <div key={String(label)} className="flex items-start justify-between gap-2">
              <span className="text-xs flex-shrink-0" style={{ color: 'var(--taupe)' }}>{label}</span>
              {label === 'Type'
                ? <GenericBadge label={item.type} />
                : <span className="text-xs text-white text-right">{String(val)}</span>
              }
            </div>
          ))}
        </div>
        <div style={{ height: 1, backgroundColor: 'var(--stone)' }} />
        <div>
          <p className="text-xs mb-1.5" style={{ color: 'var(--taupe)' }}>Subject</p>
          <p className="text-sm font-medium text-white">{item.subject}</p>
        </div>
        <div>
          <p className="text-xs mb-1.5" style={{ color: 'var(--taupe)' }}>Description</p>
          <p className="text-sm text-white leading-relaxed rounded-lg p-3" style={{ backgroundColor: 'rgba(26,16,48,0.5)', border: '1px solid var(--stone)' }}>{item.description}</p>
        </div>
        {item.screenshot ? (
          <div>
            <p className="text-xs mb-1.5" style={{ color: 'var(--taupe)' }}>Screenshot</p>
            <div className="rounded-lg h-24 flex items-center justify-center text-xs" style={{ backgroundColor: 'rgba(26,16,48,0.5)', border: '1px solid var(--stone)', color: 'var(--taupe)' }}>
              Screenshot attached
            </div>
          </div>
        ) : (
          <div className="text-xs" style={{ color: 'var(--taupe)' }}>No screenshot attached.</div>
        )}
        <div style={{ height: 1, backgroundColor: 'var(--stone)' }} />
        <div>
          <label className="block text-xs mb-1.5" style={{ color: 'var(--taupe)' }}>Status</label>
          <select className="select-field" value={status} onChange={e => setStatus(e.target.value as FeedbackStatus)}>
            <option>Open</option>
            <option>In Progress</option>
            <option>Closed</option>
          </select>
        </div>
      </div>
      <div className="px-5 py-4 flex gap-2" style={{ borderTop: '1px solid var(--stone)' }}>
        <button onClick={onClose} className="btn-ghost flex-1 py-2 rounded-lg text-sm font-medium">Close</button>
        <button
          onClick={handleSave}
          disabled={status === item.status || saving}
          className="btn-gold flex-1 py-2 rounded-lg text-sm disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving…' : saved ? 'Saved!' : 'Update Status'}
        </button>
      </div>
    </aside>
  )
}

export default function FeedbackPage() {
  const feedbackState = useAdminCollection(
    useAdminRepository<FeedbackItem>('feedback'),
  )
  const feedbackItems = feedbackState.items
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'error' } | null>(null)

  function showToast(msg: string) { setToast({ message: msg }) }

  const selectedItem = feedbackItems.find(f => f.id === selectedId) ?? null

  const filtered = useMemo(() => {
    let list = [...feedbackItems]
    const q = search.toLowerCase()
    if (q) list = list.filter(f => f.id.toLowerCase().includes(q) || f.subject.toLowerCase().includes(q) || f.subscriberId.toLowerCase().includes(q))
    if (typeFilter) list = list.filter(f => f.type === typeFilter)
    if (statusFilter) list = list.filter(f => f.status === statusFilter)
    return list
  }, [feedbackItems, search, typeFilter, statusFilter])

  function handleStatusChange(id: string, status: FeedbackStatus) {
    void feedbackState.update(id, { status })
    showToast('Feedback status updated successfully.')
  }

  return (
    <div className="px-4 md:px-6 py-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">Feedback Management</h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--taupe)' }}>Review and manage platform feedback from subscribers.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-40">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'var(--taupe)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
          </svg>
          <input className="input-field" style={{ paddingLeft: '2.25rem' }} placeholder="Search feedback…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="select-field" style={{ width: 'auto', minWidth: 160 }} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <option value="">All Types</option>
          <option>Bug Report</option><option>Feature Request</option><option>Suggestion</option><option>Support Request</option>
        </select>
        <select className="select-field" style={{ width: 'auto', minWidth: 140 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          <option>Open</option><option>In Progress</option><option>Closed</option>
        </select>
        <button onClick={() => { setSearch(''); setTypeFilter(''); setStatusFilter('') }} className="btn-ghost px-4 py-2 rounded-lg text-sm font-medium">Reset Filters</button>
      </div>

      <div className="flex gap-4 items-start">
        {/* Table */}
        <div className="flex-1 min-w-0 card overflow-hidden">
          <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--stone)' }}>
            <h2 className="text-base font-semibold text-white">Feedback ({filtered.length})</h2>
          </div>
          <div className="overflow-x-auto scrollbar-thin">
            {filtered.length === 0
              ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <p className="text-sm" style={{ color: 'var(--taupe)' }}>No feedback records are available.</p>
                  <button onClick={() => { setSearch(''); setTypeFilter(''); setStatusFilter('') }} className="btn-wine px-4 py-2 rounded-lg text-sm font-medium">Reset Filters</button>
                </div>
              )
              : (
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--stone)' }}>
                      {['Feedback ID', 'Subscriber ID', 'Type', 'Subject', 'Date', 'Status', 'Actions'].map(col => (
                        <th key={col} className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap" style={{ color: 'var(--taupe)' }}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(f => {
                      const isSelected = selectedId === f.id
                      return (
                        <tr
                          key={f.id}
                          onClick={() => setSelectedId(isSelected ? null : f.id)}
                          style={{
                            borderBottom: '1px solid rgba(55,65,81,0.5)',
                            cursor: 'pointer',
                            borderLeft: isSelected ? '3px solid var(--wine)' : '3px solid transparent',
                            backgroundColor: isSelected ? 'rgba(124,58,237,0.08)' : 'transparent',
                          }}
                          onMouseEnter={e => { if (!isSelected) (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)') }}
                          onMouseLeave={e => { if (!isSelected) (e.currentTarget.style.backgroundColor = 'transparent') }}
                        >
                          <td className="px-3 py-3"><span className="text-xs font-mono" style={{ color: 'var(--taupe)' }}>{f.id}</span></td>
                          <td className="px-3 py-3"><span className="text-xs font-mono" style={{ color: 'var(--taupe)' }}>{f.subscriberId}</span></td>
                          <td className="px-3 py-3"><GenericBadge label={f.type} /></td>
                          <td className="px-3 py-3 max-w-[200px] truncate text-white">{f.subject}</td>
                          <td className="px-3 py-3 whitespace-nowrap text-xs" style={{ color: 'var(--taupe)' }}>{formatDate(f.submissionDate)}</td>
                          <td className="px-3 py-3"><GenericBadge label={f.status} /></td>
                          <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
                            <button onClick={() => setSelectedId(f.id)} className="btn-wine px-2.5 py-1 rounded text-xs">View</button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
          </div>
        </div>

        {/* Detail Panel */}
        {selectedItem && (
          <FeedbackDetailPanel
            item={selectedItem}
            onClose={() => setSelectedId(null)}
            onStatusChange={(id, status) => { handleStatusChange(id, status) }}
          />
        )}
      </div>
    </div>
  )
}
