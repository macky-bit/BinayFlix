import type { ManagerRole, AccountStatus } from '../types'

const ROLE_STYLES: Record<ManagerRole, { bg: string; text: string; border: string }> = {
  'Master Admin':   { bg: 'rgba(236,72,153,0.12)', text: '#F472B6', border: 'rgba(236,72,153,0.35)' },
  'Content Manager':  { bg: 'rgba(245,168,0,0.12)',  text: '#F5A800', border: 'rgba(245,168,0,0.35)' },
  'Comment Manager':  { bg: 'rgba(6,182,212,0.12)',  text: '#22D3EE', border: 'rgba(6,182,212,0.35)' },
  'Feedback Manager': { bg: 'rgba(124,58,237,0.12)', text: '#A78BFA', border: 'rgba(124,58,237,0.35)' },
  'User Manager':     { bg: 'rgba(239,68,68,0.12)',  text: '#F87171', border: 'rgba(239,68,68,0.35)' },
  'System Manager':   { bg: 'rgba(59,130,246,0.12)', text: '#60A5FA', border: 'rgba(59,130,246,0.35)' },
}

export function RoleBadge({ role }: { role: ManagerRole }) {
  const s = ROLE_STYLES[role] ?? { bg: 'rgba(107,114,128,0.12)', text: '#D1D5DB', border: 'rgba(107,114,128,0.35)' }
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap"
      style={{ backgroundColor: s.bg, color: s.text, border: `1px solid ${s.border}` }}
    >
      {role}
    </span>
  )
}

export function StatusBadge({ status }: { status: AccountStatus }) {
  const isActive = status === 'Active'
  return (
    <span className="inline-flex items-center gap-1.5 text-sm font-medium">
      <span
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ backgroundColor: isActive ? '#10B981' : '#EF4444' }}
        aria-hidden
      />
      <span style={{ color: isActive ? '#10B981' : '#EF4444' }}>{status}</span>
    </span>
  )
}

const GENERIC_STATUS_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  Active:     { bg: 'rgba(16,185,129,0.12)', text: '#10B981', border: 'rgba(16,185,129,0.35)' },
  Inactive:   { bg: 'rgba(239,68,68,0.12)',  text: '#F87171', border: 'rgba(239,68,68,0.35)' },
  Banned:     { bg: 'rgba(220,38,38,0.15)',  text: '#F87171', border: 'rgba(220,38,38,0.4)' },
  Available:  { bg: 'rgba(16,185,129,0.12)', text: '#10B981', border: 'rgba(16,185,129,0.35)' },
  Unavailable:{ bg: 'rgba(107,114,128,0.12)',text: '#9CA3AF', border: 'rgba(107,114,128,0.35)' },
  Open:       { bg: 'rgba(245,168,0,0.12)',  text: '#F5A800', border: 'rgba(245,168,0,0.35)' },
  'In Progress':{ bg: 'rgba(59,130,246,0.12)',text: '#60A5FA', border: 'rgba(59,130,246,0.35)' },
  Closed:     { bg: 'rgba(107,114,128,0.12)',text: '#9CA3AF', border: 'rgba(107,114,128,0.35)' },
  Expired:    { bg: 'rgba(239,68,68,0.12)',  text: '#F87171', border: 'rgba(239,68,68,0.35)' },
  Cancelled:  { bg: 'rgba(107,114,128,0.12)',text: '#9CA3AF', border: 'rgba(107,114,128,0.35)' },
  Pending:    { bg: 'rgba(245,168,0,0.12)',  text: '#F5A800', border: 'rgba(245,168,0,0.35)' },
  Verified:   { bg: 'rgba(16,185,129,0.12)', text: '#10B981', border: 'rgba(16,185,129,0.35)' },
  Failed:     { bg: 'rgba(239,68,68,0.12)',  text: '#F87171', border: 'rgba(239,68,68,0.35)' },
  Hidden:     { bg: 'rgba(245,168,0,0.12)',  text: '#F5A800', border: 'rgba(245,168,0,0.35)' },
  Deleted:    { bg: 'rgba(239,68,68,0.12)',  text: '#F87171', border: 'rgba(239,68,68,0.35)' },
  'Bug Report':      { bg: 'rgba(239,68,68,0.12)',  text: '#F87171', border: 'rgba(239,68,68,0.35)' },
  'Feature Request': { bg: 'rgba(59,130,246,0.12)', text: '#60A5FA', border: 'rgba(59,130,246,0.35)' },
  'Suggestion':      { bg: 'rgba(124,58,237,0.12)', text: '#A78BFA', border: 'rgba(124,58,237,0.35)' },
}

export function GenericBadge({ label }: { label: string }) {
  const s = GENERIC_STATUS_STYLES[label] ?? { bg: 'rgba(107,114,128,0.12)', text: '#9CA3AF', border: 'rgba(107,114,128,0.35)' }
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap"
      style={{ backgroundColor: s.bg, color: s.text, border: `1px solid ${s.border}` }}
    >
      {label}
    </span>
  )
}
