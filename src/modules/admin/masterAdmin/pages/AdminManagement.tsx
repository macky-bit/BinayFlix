import { useState, useMemo, useRef, useEffect } from 'react'
import type { Manager, ManagerRole, AccountStatus } from '../types'
import { useAdminCollection, useAdminRepository } from '../../data'
import { supabase } from '../../../../lib/supabase'
import { getInitials, formatDate, generateId } from '../utils'
import { RoleBadge, StatusBadge } from '../components/Badge'
import Toast from '../components/Toast'
import ConfirmDialog from '../components/ConfirmDialog'

const ROLES: ManagerRole[] = ['Master Admin', 'Content Manager', 'Comment Manager', 'Feedback Manager', 'User Manager', 'System Manager']
const ROLE_ACCESS: Record<ManagerRole, string> = {
  'Master Admin': 'Full access to every administrator workspace and account.',
  'Content Manager': 'Content, categories, genres, and soundtracks.',
  'Comment Manager': 'Reviews, reactions, forum posts, and forum comments.',
  'Feedback Manager': 'Platform feedback and feedback-status management.',
  'User Manager': 'Subscribers, Watch History, subscriptions, plans, and payments.',
  'System Manager': 'System security, server maintenance, database maintenance, and backups.',
}
const SORT_OPTIONS = [
  { value: 'name-az', label: 'Name A–Z' },
  { value: 'name-za', label: 'Name Z–A' },
  { value: 'newest-login', label: 'Newest Login' },
  { value: 'oldest-login', label: 'Oldest Login' },
]

type ModalType = 'add' | 'edit' | 'assignRole' | 'resetPassword' | null
type ConfirmType = 'activate' | 'deactivate' | 'remove' | 'confirmRole' | null

interface FormErrors {
  [key: string]: string
}

interface GrantCandidate {
  userId: string
  authUserId: string | null
  name: string
  email: string
  username: string
  accountStatus: string
  existingAdminId: string | null
  existingRole: string | null
  existingStatus: string | null
}

function Avatar({ name, color, size = 'md' }: { name: string; color: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'w-7 h-7 text-xs', md: 'w-9 h-9 text-sm', lg: 'w-14 h-14 text-lg' }
  return (
    <div
      className={`${sizes[size]} rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0`}
      style={{ backgroundColor: color }}
      aria-hidden
    >
      {getInitials(name)}
    </div>
  )
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="w-8 h-8 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: 'var(--wine)' }} />
    </div>
  )
}

function EmptyState({ message, onReset }: { message: string; onReset?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(124,58,237,0.1)' }}>
        <svg className="w-8 h-8" style={{ color: 'var(--wine)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" />
        </svg>
      </div>
      <p className="text-center" style={{ color: 'var(--taupe)' }}>{message}</p>
      {onReset && (
        <button onClick={onReset} className="btn-wine px-4 py-2 rounded-lg text-sm font-medium">
          Reset Filters
        </button>
      )}
    </div>
  )
}

function GrantAdminModal({ onGrant, onClose }: {
  onGrant: (uuid: string, role: ManagerRole) => Promise<void>
  onClose: () => void
}) {
  const [uuid, setUuid] = useState('')
  const [role, setRole] = useState<ManagerRole>('Content Manager')
  const [candidate, setCandidate] = useState<GrantCandidate | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function searchUser(event: React.FormEvent) {
    event.preventDefault()
    const value = uuid.trim()
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
      setError('Enter a valid user UUID.')
      setCandidate(null)
      return
    }
    setLoading(true)
    setError('')
    const { data, error: searchError } = await supabase.rpc('find_user_for_admin', { target_uuid: value })
    setLoading(false)
    if (searchError) {
      setError(searchError.message)
      setCandidate(null)
      return
    }
    if (!data) {
      setError('No StreamFlix user was found for that UUID.')
      setCandidate(null)
      return
    }
    const result = data as unknown as GrantCandidate
    setCandidate(result)
    const existingRole = ROLES.find(item => item.replace(/\s/g, '').toLowerCase() === String(result.existingRole ?? '').replace(/\s/g, '').toLowerCase())
    if (existingRole) setRole(existingRole)
  }

  async function grantAccess() {
    setLoading(true)
    setError('')
    try {
      await onGrant(uuid.trim(), role)
    } catch (grantError) {
      setError(grantError instanceof Error ? grantError.message : 'Unable to grant administrator access.')
      setLoading(false)
    }
  }

  useEffect(() => {
    const handler = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" style={{ maxWidth: 560 }} onClick={event => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-semibold text-white">Make User an Admin</h2>
            <p className="mt-1 text-sm" style={{ color: 'var(--taupe)' }}>Search by the user's profile UUID or Auth UUID, then assign a role.</p>
          </div>
          <button type="button" onClick={onClose} className="text-[#9CA3AF] hover:text-white p-1 rounded" aria-label="Close">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={searchUser} className="flex gap-2">
          <div className="flex-1">
            <label htmlFor="admin-user-uuid" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--cream)' }}>User UUID</label>
            <input id="admin-user-uuid" className="input-field font-mono text-sm" value={uuid} onChange={event => { setUuid(event.target.value); setCandidate(null); setError('') }} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" autoFocus />
          </div>
          <button type="submit" className="btn-wine self-end px-4 py-2.5 rounded-lg text-sm font-medium" disabled={loading || !uuid.trim()}>{loading ? 'Searching…' : 'Search'}</button>
        </form>

        {error && <p className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300" role="alert">{error}</p>}

        {candidate && (
          <div className="mt-5 rounded-xl p-4" style={{ border: '1px solid var(--stone)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
            <div className="flex items-center gap-3">
              <Avatar name={candidate.name || candidate.username} color="#7C3AED" />
              <div className="min-w-0">
                <p className="font-semibold text-white truncate">{candidate.name || candidate.username}</p>
                <p className="text-xs truncate" style={{ color: 'var(--taupe)' }}>{candidate.email}</p>
              </div>
            </div>
            <dl className="mt-4 grid grid-cols-[120px_1fr] gap-x-3 gap-y-2 text-xs">
              <dt style={{ color: 'var(--taupe)' }}>Profile UUID</dt><dd className="text-white font-mono break-all">{candidate.userId}</dd>
              <dt style={{ color: 'var(--taupe)' }}>Auth UUID</dt><dd className="text-white font-mono break-all">{candidate.authUserId ?? 'Not linked'}</dd>
              <dt style={{ color: 'var(--taupe)' }}>User status</dt><dd className="text-white">{candidate.accountStatus}</dd>
              <dt style={{ color: 'var(--taupe)' }}>Admin access</dt><dd className="text-white">{candidate.existingAdminId ? `${candidate.existingRole} · ${candidate.existingStatus}` : 'Not currently an admin'}</dd>
            </dl>
            <div className="mt-4">
              <label htmlFor="grant-admin-role" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--cream)' }}>Administrator Role</label>
              <select id="grant-admin-role" className="select-field" value={role} onChange={event => setRole(event.target.value as ManagerRole)}>
                {ROLES.map(item => <option key={item} value={item}>{item}</option>)}
              </select>
              <p className="mt-2 text-xs" style={{ color: 'var(--taupe)' }}>{ROLE_ACCESS[role]}</p>
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button type="button" onClick={onClose} className="btn-ghost px-4 py-2.5 rounded-lg text-sm font-medium" disabled={loading}>Cancel</button>
              <button type="button" onClick={grantAccess} className="btn-gold px-5 py-2.5 rounded-lg text-sm" disabled={loading || !candidate.authUserId}>{loading ? 'Saving…' : candidate.existingAdminId ? 'Update & Activate' : 'Grant Admin Access'}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Add Manager Modal
function AddManagerModal({ managers, onAdd, onClose }: {
  managers: Manager[]
  onAdd: (m: Manager) => void
  onClose: () => void
}) {
  const [form, setForm] = useState({ name: '', email: '', username: '', password: '', confirm: '', role: '' as ManagerRole | '', status: 'Active' as AccountStatus })
  const [errors, setErrors] = useState<FormErrors>({})
  const [loading, setLoading] = useState(false)

  function validate() {
    const e: FormErrors = {}
    if (!form.name.trim()) e.name = 'Full name is required.'
    if (!form.email.trim()) e.email = 'Email is required.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email address.'
    else if (managers.some(m => m.email.toLowerCase() === form.email.toLowerCase())) e.email = 'This email is already in use.'
    if (!form.username.trim()) e.username = 'Username is required.'
    else if (managers.some(m => m.username.toLowerCase() === form.username.toLowerCase())) e.username = 'This username is already in use.'
    if (!form.password) e.password = 'Password is required.'
    else if (form.password.length < 8) e.password = 'Password must be at least 8 characters.'
    if (!form.confirm) e.confirm = 'Please confirm the password.'
    else if (form.password !== form.confirm) e.confirm = 'Passwords do not match.'
    if (!form.role) e.role = 'Role is required.'
    return e
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true)
    setTimeout(() => {
      const newManager: Manager = {
        id: generateId('ADM', managers),
        name: form.name.trim(),
        email: form.email.trim(),
        username: form.username.trim(),
        role: form.role as ManagerRole,
        status: form.status,
        lastLogin: null,
        avatarColor: '#' + Math.floor(Math.random() * 0xAAAAAA + 0x555555).toString(16),
      }
      onAdd(newManager)
      setLoading(false)
    }, 800)
  }

  function field(id: string, label: string, input: React.ReactNode) {
    return (
      <div>
        <label htmlFor={id} className="block text-sm font-medium mb-1.5" style={{ color: 'var(--cream)' }}>
          {label} <span className="text-red-400">*</span>
        </label>
        {input}
        {errors[id] && <p className="mt-1 text-xs text-red-400">{errors[id]}</p>}
      </div>
    )
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" style={{ maxWidth: 540 }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Add Manager</h2>
          <button onClick={onClose} className="text-[#9CA3AF] hover:text-white transition-colors p-1 rounded" aria-label="Close">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          {field('name', 'Full Name',
            <input id="name" className="input-field" value={form.name}
              onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setErrors(er => ({ ...er, name: '' })) }}
              placeholder="Enter full name" autoComplete="off" />
          )}
          {field('email', 'Email',
            <input id="email" type="email" className="input-field" value={form.email}
              onChange={e => { setForm(f => ({ ...f, email: e.target.value })); setErrors(er => ({ ...er, email: '' })) }}
              placeholder="Enter email address" autoComplete="off" />
          )}
          {field('username', 'Username',
            <input id="username" className="input-field" value={form.username}
              onChange={e => { setForm(f => ({ ...f, username: e.target.value })); setErrors(er => ({ ...er, username: '' })) }}
              placeholder="Enter username" autoComplete="off" />
          )}
          {field('password', 'Temporary Password',
            <input id="password" type="password" className="input-field" value={form.password}
              onChange={e => { setForm(f => ({ ...f, password: e.target.value })); setErrors(er => ({ ...er, password: '' })) }}
              placeholder="Min. 8 characters" autoComplete="new-password" />
          )}
          {field('confirm', 'Confirm Temporary Password',
            <input id="confirm" type="password" className="input-field" value={form.confirm}
              onChange={e => { setForm(f => ({ ...f, confirm: e.target.value })); setErrors(er => ({ ...er, confirm: '' })) }}
              placeholder="Re-enter password" autoComplete="new-password" />
          )}
          {field('role', 'Role',
            <select id="role" className="select-field" value={form.role}
              onChange={e => { setForm(f => ({ ...f, role: e.target.value as ManagerRole })); setErrors(er => ({ ...er, role: '' })) }}>
              <option value="">Select a role</option>
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          )}
          <div>
            <label htmlFor="status" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--cream)' }}>
              Account Status <span className="text-red-400">*</span>
            </label>
            <select id="status" className="select-field" value={form.status}
              onChange={e => setForm(f => ({ ...f, status: e.target.value as AccountStatus }))}>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={onClose} className="btn-ghost px-4 py-2.5 rounded-lg text-sm font-medium" disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn-gold px-5 py-2.5 rounded-lg text-sm" disabled={loading}>
              {loading ? 'Creating…' : 'Add Manager'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Edit Manager Modal
function EditManagerModal({ manager, managers, onSave, onClose, onResetPassword }: {
  manager: Manager
  managers: Manager[]
  onSave: (m: Manager) => void
  onClose: () => void
  onResetPassword: () => void
}) {
  const [form, setForm] = useState({
    name: manager.name,
    email: manager.email,
    username: manager.username,
    role: manager.role,
    status: manager.status,
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [loading, setLoading] = useState(false)

  function validate() {
    const e: FormErrors = {}
    if (!form.name.trim()) e.name = 'Full name is required.'
    if (!form.email.trim()) e.email = 'Email is required.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email address.'
    else if (managers.some(m => m.id !== manager.id && m.email.toLowerCase() === form.email.toLowerCase())) e.email = 'This email is already in use.'
    if (!form.username.trim()) e.username = 'Username is required.'
    else if (managers.some(m => m.id !== manager.id && m.username.toLowerCase() === form.username.toLowerCase())) e.username = 'This username is already in use.'
    return e
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true)
    setTimeout(() => {
      onSave({ ...manager, name: form.name.trim(), email: form.email.trim(), username: form.username.trim(), role: form.role, status: form.status })
      setLoading(false)
    }, 600)
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  function field(id: string, label: string, input: React.ReactNode) {
    return (
      <div>
        <label htmlFor={id} className="block text-sm font-medium mb-1.5" style={{ color: 'var(--cream)' }}>{label}</label>
        {input}
        {errors[id] && <p className="mt-1 text-xs text-red-400">{errors[id]}</p>}
      </div>
    )
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" style={{ maxWidth: 540 }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Edit Manager</h2>
          <button onClick={onClose} className="text-[#9CA3AF] hover:text-white transition-colors p-1 rounded" aria-label="Close">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--cream)' }}>User ID</label>
            <div className="input-field opacity-50 cursor-not-allowed">{manager.id}</div>
          </div>
          {field('name', 'Full Name *',
            <input id="name" className="input-field" value={form.name}
              onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setErrors(er => ({ ...er, name: '' })) }}
              placeholder="Enter full name" />
          )}
          {field('email', 'Email *',
            <input id="email" type="email" className="input-field" value={form.email}
              onChange={e => { setForm(f => ({ ...f, email: e.target.value })); setErrors(er => ({ ...er, email: '' })) }}
              placeholder="Enter email address" />
          )}
          {field('username', 'Username *',
            <input id="username" className="input-field" value={form.username}
              onChange={e => { setForm(f => ({ ...f, username: e.target.value })); setErrors(er => ({ ...er, username: '' })) }}
              placeholder="Enter username" />
          )}
          <div>
            <label htmlFor="edit-role" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--cream)' }}>Role *</label>
            <select id="edit-role" className="select-field" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as ManagerRole }))}>
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="edit-status" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--cream)' }}>Account Status *</label>
            <select id="edit-status" className="select-field" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as AccountStatus }))}>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--cream)' }}>Last Login</label>
            <div className="input-field opacity-50 cursor-not-allowed">{formatDate(manager.lastLogin)}</div>
          </div>
          <div className="pt-1">
            <button type="button" onClick={onResetPassword}
              className="flex items-center gap-2 text-sm font-medium transition-colors"
              style={{ color: 'var(--wine-hover)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--wine)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--wine-hover)')}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              Reset Password
            </button>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={onClose} className="btn-ghost px-4 py-2.5 rounded-lg text-sm font-medium" disabled={loading}>Cancel</button>
            <button type="submit" className="btn-gold px-5 py-2.5 rounded-lg text-sm" disabled={loading}>
              {loading ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Assign Role Modal
function AssignRoleModal({ manager, onAssign, onClose }: {
  manager: Manager
  onAssign: (role: ManagerRole) => void
  onClose: () => void
}) {
  const [selectedRole, setSelectedRole] = useState<ManagerRole | ''>(manager.role)
  const [step, setStep] = useState<'select' | 'confirm'>('select')
  const [loading, setLoading] = useState(false)

  const canAssign = selectedRole && selectedRole !== manager.role

  function handleConfirm() {
    setLoading(true)
    setTimeout(() => {
      onAssign(selectedRole as ManagerRole)
      setLoading(false)
    }, 700)
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  if (step === 'confirm') {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-panel" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
          <div className="flex items-start gap-3 mb-6">
            <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(124,58,237,0.15)' }}>
              <svg className="w-5 h-5" style={{ color: 'var(--wine)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">Confirm role change?</h3>
              <p className="text-sm" style={{ color: 'var(--taupe)' }}>
                Changing this Manager&apos;s role will update their access to STREAMFLIX management features.
              </p>
            </div>
          </div>
          <div className="rounded-lg p-4 mb-6 flex flex-col gap-2" style={{ backgroundColor: 'rgba(26,16,48,0.5)', border: '1px solid var(--stone)' }}>
            <div className="flex items-center justify-between text-sm">
              <span style={{ color: 'var(--taupe)' }}>Manager</span>
              <span className="text-white font-medium">{manager.name}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span style={{ color: 'var(--taupe)' }}>Current Role</span>
              <RoleBadge role={manager.role} />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span style={{ color: 'var(--taupe)' }}>New Role</span>
              <RoleBadge role={selectedRole as ManagerRole} />
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setStep('select')} className="btn-ghost px-4 py-2.5 rounded-lg text-sm font-medium" disabled={loading}>Cancel</button>
            <button onClick={handleConfirm} className="btn-gold px-5 py-2.5 rounded-lg text-sm" disabled={loading}>
              {loading ? 'Assigning…' : 'Confirm Role Change'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Assign Manager Role</h2>
          <button onClick={onClose} className="text-[#9CA3AF] hover:text-white transition-colors p-1 rounded" aria-label="Close">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex items-center gap-3 mb-6 p-3 rounded-lg" style={{ backgroundColor: 'rgba(26,16,48,0.5)', border: '1px solid var(--stone)' }}>
          <Avatar name={manager.name} color={manager.avatarColor} size="md" />
          <div>
            <p className="text-white font-medium text-sm">{manager.name}</p>
            <p className="text-xs" style={{ color: 'var(--taupe)' }}>{manager.id}</p>
          </div>
          <div className="ml-auto"><RoleBadge role={manager.role} /></div>
        </div>
        <div className="flex flex-col gap-4">
          <div>
            <label htmlFor="new-role" className="block text-sm font-medium mb-2" style={{ color: 'var(--cream)' }}>
              New Role <span className="text-red-400">*</span>
            </label>
            <select id="new-role" className="select-field" value={selectedRole}
              onChange={e => setSelectedRole(e.target.value as ManagerRole)}>
              <option value="">Select a role</option>
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          {selectedRole && (
            <div className="rounded-lg p-4" style={{ backgroundColor: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.25)' }}>
              <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--wine-hover)' }}>Access Description</p>
              <p className="text-sm text-white">{ROLE_ACCESS[selectedRole as ManagerRole]}</p>
            </div>
          )}
          <div className="flex gap-3 justify-end pt-2">
            <button onClick={onClose} className="btn-ghost px-4 py-2.5 rounded-lg text-sm font-medium">Cancel</button>
            <button
              onClick={() => setStep('confirm')}
              disabled={!canAssign}
              className="btn-gold px-5 py-2.5 rounded-lg text-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Assign Role
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Reset Password Modal
function ResetPasswordModal({ onReset, onClose }: {
  onReset: () => void
  onClose: () => void
}) {
  const [form, setForm] = useState({ password: '', confirm: '' })
  const [errors, setErrors] = useState<FormErrors>({})
  const [loading, setLoading] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs: FormErrors = {}
    if (!form.password) errs.password = 'Password is required.'
    else if (form.password.length < 8) errs.password = 'Password must be at least 8 characters.'
    if (!form.confirm) errs.confirm = 'Please confirm the password.'
    else if (form.password !== form.confirm) errs.confirm = 'Passwords do not match.'
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true)
    setTimeout(() => { onReset(); setLoading(false) }, 700)
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Reset Password</h2>
          <button onClick={onClose} className="text-[#9CA3AF] hover:text-white p-1 rounded" aria-label="Close">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <div>
            <label htmlFor="new-pw" className="block text-sm font-medium mb-1.5 text-white">New Temporary Password <span className="text-red-400">*</span></label>
            <input id="new-pw" type="password" className="input-field" value={form.password}
              onChange={e => { setForm(f => ({ ...f, password: e.target.value })); setErrors(er => ({ ...er, password: '' })) }}
              placeholder="Min. 8 characters" autoComplete="new-password" />
            {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password}</p>}
          </div>
          <div>
            <label htmlFor="confirm-pw" className="block text-sm font-medium mb-1.5 text-white">Confirm Temporary Password <span className="text-red-400">*</span></label>
            <input id="confirm-pw" type="password" className="input-field" value={form.confirm}
              onChange={e => { setForm(f => ({ ...f, confirm: e.target.value })); setErrors(er => ({ ...er, confirm: '' })) }}
              placeholder="Re-enter password" autoComplete="new-password" />
            {errors.confirm && <p className="mt-1 text-xs text-red-400">{errors.confirm}</p>}
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={onClose} className="btn-ghost px-4 py-2.5 rounded-lg text-sm font-medium" disabled={loading}>Cancel</button>
            <button type="submit" className="btn-gold px-5 py-2.5 rounded-lg text-sm" disabled={loading}>
              {loading ? 'Resetting…' : 'Reset Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Details Panel
function ManagerDetailsPanel({ manager, onClose, onEdit, onAssignRole, onActivate, onDeactivate, onRemove, onSaveInline }: {
  manager: Manager
  onClose: () => void
  onEdit: () => void
  onAssignRole: () => void
  onActivate: () => void
  onDeactivate: () => void
  onRemove: () => void
  onSaveInline: (updates: Partial<Manager>) => void
}) {
  const [panelRole, setPanelRole] = useState<ManagerRole>(manager.role)
  const [panelStatus, setPanelStatus] = useState<AccountStatus>(manager.status)
  const [pendingConfirm, setPendingConfirm] = useState<'role' | 'status' | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setPanelRole(manager.role)
    setPanelStatus(manager.status)
  }, [manager.id, manager.role, manager.status])

  function handleSave() {
    const roleChanged = panelRole !== manager.role
    const statusChanged = panelStatus !== manager.status
    if (roleChanged) { setPendingConfirm('role'); return }
    if (statusChanged) { setPendingConfirm('status'); return }
  }

  function confirmSave() {
    setLoading(true)
    setTimeout(() => {
      onSaveInline({ role: panelRole, status: panelStatus })
      setPendingConfirm(null)
      setLoading(false)
    }, 600)
  }

  const hasChanges = panelRole !== manager.role || panelStatus !== manager.status

  return (
    <>
      {pendingConfirm && (
        <ConfirmDialog
          heading={pendingConfirm === 'role' ? 'Confirm role change?' : panelStatus === 'Active' ? 'Activate Manager account?' : 'Deactivate Manager account?'}
          message={pendingConfirm === 'role'
            ? "Changing this Manager's role will update their access to STREAMFLIX management features."
            : panelStatus === 'Active'
            ? 'This Manager will regain access to the features assigned to their role.'
            : 'This Manager will no longer be able to access STREAMFLIX management features until the account is activated again.'
          }
          confirmLabel={pendingConfirm === 'role' ? 'Confirm Role Change' : panelStatus === 'Active' ? 'Activate Account' : 'Deactivate Account'}
          onConfirm={confirmSave}
          onCancel={() => setPendingConfirm(null)}
          danger={pendingConfirm === 'status' && panelStatus === 'Inactive'}
          loading={loading}
        />
      )}
      <aside
        className="flex flex-col rounded-xl overflow-hidden flex-shrink-0"
        style={{ width: 320, backgroundColor: 'var(--ink-soft)', border: '1px solid var(--stone)' }}
        aria-label="Manager Details"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--stone)' }}>
          <h2 className="text-base font-semibold text-white">Manager Details</h2>
          <button onClick={onClose} className="text-[#9CA3AF] hover:text-white transition-colors p-1 rounded" aria-label="Close Manager Details">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {/* Profile */}
          <div className="px-5 py-4 flex items-center gap-3" style={{ borderBottom: '1px solid var(--stone)' }}>
            <Avatar name={manager.name} color={manager.avatarColor} size="lg" />
            <div>
              <p className="text-white font-semibold">{manager.name}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--taupe)' }}>User ID: {manager.id}</p>
            </div>
          </div>

          {/* Fields */}
          <div className="px-5 py-4 flex flex-col gap-3" style={{ borderBottom: '1px solid var(--stone)' }}>
            {[
              { label: 'Email', value: manager.email },
              { label: 'Username', value: manager.username },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-start justify-between gap-2">
                <span className="text-xs flex-shrink-0" style={{ color: 'var(--taupe)' }}>{label}</span>
                <span className="text-xs text-white text-right break-all">{value}</span>
              </div>
            ))}
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs flex-shrink-0" style={{ color: 'var(--taupe)' }}>Role</span>
              <RoleBadge role={manager.role} />
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs flex-shrink-0" style={{ color: 'var(--taupe)' }}>Account Status</span>
              <StatusBadge status={manager.status} />
            </div>
            <div className="flex items-start justify-between gap-2">
              <span className="text-xs flex-shrink-0" style={{ color: 'var(--taupe)' }}>Last Login</span>
              <span className="text-xs text-white text-right">{formatDate(manager.lastLogin)}</span>
            </div>
          </div>

          {/* Role & Access section */}
          <div className="px-5 py-4 flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-white">Role & Access</h3>
            <div>
              <label htmlFor="panel-role" className="block text-xs mb-1.5" style={{ color: 'var(--taupe)' }}>Role</label>
              <select id="panel-role" className="select-field text-sm"
                value={panelRole}
                onChange={e => setPanelRole(e.target.value as ManagerRole)}>
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            {panelRole && (
              <p className="text-xs" style={{ color: 'var(--taupe)' }}>{ROLE_ACCESS[panelRole]}</p>
            )}
            <div className="flex items-center justify-between">
              <label htmlFor="panel-status-toggle" className="text-xs" style={{ color: 'var(--taupe)' }}>Account Status</label>
              <div className="flex items-center gap-2">
                <label className="toggle-switch" title={panelStatus === 'Active' ? 'Active' : 'Inactive'}>
                  <input
                    id="panel-status-toggle"
                    type="checkbox"
                    checked={panelStatus === 'Active'}
                    onChange={e => setPanelStatus(e.target.checked ? 'Active' : 'Inactive')}
                  />
                  <span className="toggle-slider" />
                </label>
                <span className="text-xs text-white">{panelStatus}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-5 py-4 flex flex-col gap-2" style={{ borderTop: '1px solid var(--stone)' }}>
          <div className="flex gap-2">
            <button onClick={onClose} className="btn-ghost flex-1 py-2 rounded-lg text-sm font-medium">Close</button>
            <button
              onClick={hasChanges ? handleSave : onEdit}
              className="btn-gold flex-1 py-2 rounded-lg text-sm"
            >
              {hasChanges ? 'Save Changes' : 'Edit Manager'}
            </button>
          </div>
          {!hasChanges && (
            <button onClick={onAssignRole} className="btn-wine py-2 rounded-lg text-sm font-medium w-full">
              Assign Role
            </button>
          )}
          <div className="pt-1">
            {manager.status === 'Active'
              ? (
                <button onClick={onDeactivate} className="flex items-center gap-2 text-sm font-medium w-full justify-center py-1.5 rounded-lg transition-colors text-red-400 hover:bg-red-400/10">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                  Deactivate Account
                </button>
              )
              : (
                <button onClick={onActivate} className="flex items-center gap-2 text-sm font-medium w-full justify-center py-1.5 rounded-lg transition-colors" style={{ color: '#10B981' }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(16,185,129,0.1)')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Activate Account
                </button>
              )
            }
          </div>
          <button onClick={onRemove} className="flex items-center justify-center gap-2 rounded-lg border border-red-500/30 py-2 text-sm font-medium text-red-300 transition-colors hover:bg-red-500/10">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3m-9 0h12" /></svg>
            Remove as Admin
          </button>
        </div>
      </aside>
    </>
  )
}

// Main Page
export default function AdminManagement() {
  const managerState = useAdminCollection(
    useAdminRepository<Manager>('managers'),
  )
  const managers = managerState.items
  const [selectedId, setSelectedId] = useState<string | null>('ADM-001')
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sortBy, setSortBy] = useState('name-az')
  const [page, setPage] = useState(1)
  const [rowsPerPage] = useState(10)
  const [modal, setModal] = useState<ModalType>(null)
  const [confirmType, setConfirmType] = useState<ConfirmType>(null)
  const [confirmTargetId, setConfirmTargetId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'error' } | null>(null)
  const [actionPending, setActionPending] = useState(false)
  const [pendingResetPw, setPendingResetPw] = useState(false)
  const addBtnRef = useRef<HTMLButtonElement>(null)

  const selectedManager = useMemo(() => managers.find(m => m.id === selectedId) ?? null, [managers, selectedId])

  function showToast(message: string, type: 'success' | 'error' = 'success') {
    setToast({ message, type })
  }

  const filtered = useMemo(() => {
    let list = [...managers]
    const q = search.toLowerCase()
    if (q) list = list.filter(m =>
      m.id.toLowerCase().includes(q) ||
      m.name.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q) ||
      m.username.toLowerCase().includes(q)
    )
    if (roleFilter) list = list.filter(m => m.role === roleFilter)
    if (statusFilter) list = list.filter(m => m.status === statusFilter)
    list.sort((a, b) => {
      if (sortBy === 'name-az') return a.name.localeCompare(b.name)
      if (sortBy === 'name-za') return b.name.localeCompare(a.name)
      if (sortBy === 'newest-login') {
        if (!a.lastLogin) return 1
        if (!b.lastLogin) return -1
        return new Date(b.lastLogin).getTime() - new Date(a.lastLogin).getTime()
      }
      if (sortBy === 'oldest-login') {
        if (!a.lastLogin) return 1
        if (!b.lastLogin) return -1
        return new Date(a.lastLogin).getTime() - new Date(b.lastLogin).getTime()
      }
      return 0
    })
    return list
  }, [managers, search, roleFilter, statusFilter, sortBy])

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage))
  const safePage = Math.min(page, totalPages)
  const pageStart = (safePage - 1) * rowsPerPage
  const paginated = filtered.slice(pageStart, pageStart + rowsPerPage)

  function resetFilters() {
    setSearch(''); setRoleFilter(''); setStatusFilter(''); setSortBy('name-az'); setPage(1)
  }

  function toggleRow(id: string) {
    setSelectedRows(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAllRows() {
    if (selectedRows.size === paginated.length) setSelectedRows(new Set())
    else setSelectedRows(new Set(paginated.map(m => m.id)))
  }

  function handleAddManager(m: Manager) {
    const { id: _id, ...input } = m
    void managerState.create(input)
    setSelectedId(m.id)
    setModal(null)
    showToast('Manager account created successfully.')
    addBtnRef.current?.focus()
  }

  async function handleGrantAdmin(uuid: string, role: ManagerRole) {
    const { error } = await supabase.rpc('grant_admin_access', { target_uuid: uuid, assigned_role: role })
    if (error) throw error
    await managerState.reload()
    setModal(null)
    showToast('Administrator access granted successfully.')
    addBtnRef.current?.focus()
  }

  async function handleEditSave(updated: Manager) {
    const previous = managers.find(manager => manager.id === updated.id)
    if (!previous) return
    const { error: profileError } = await supabase.rpc('update_admin_profile', {
      target_admin_id: updated.id,
      new_name: updated.name,
      new_email: updated.email,
      new_username: updated.username,
    })
    if (profileError) { showToast(profileError.message, 'error'); return }
    if (updated.role !== previous.role) {
      const { error } = await supabase.rpc('set_admin_access_role', { target_admin_id: updated.id, assigned_role: updated.role })
      if (error) { showToast(error.message, 'error'); return }
    }
    if (updated.status !== previous.status) {
      const { error } = await supabase.rpc('set_admin_access_status', { target_admin_id: updated.id, new_status: updated.status })
      if (error) { showToast(error.message, 'error'); return }
    }
    await managerState.reload()
    setModal(null)
    showToast('Manager account updated successfully.')
  }

  async function handleAssignRole(role: ManagerRole) {
    if (!selectedId) return
    const { error } = await supabase.rpc('set_admin_access_role', { target_admin_id: selectedId, assigned_role: role })
    if (error) { showToast(error.message, 'error'); return }
    await managerState.reload()
    setModal(null)
    showToast('Manager role updated successfully.')
  }

  async function handleSaveInline(updates: Partial<Manager>) {
    if (!selectedId) return
    const prev = managers.find(m => m.id === selectedId)
    if (!prev) return
    const wasRole = updates.role && updates.role !== prev.role
    const wasStatus = updates.status && updates.status !== prev.status
    if (wasRole) {
      const { error } = await supabase.rpc('set_admin_access_role', { target_admin_id: selectedId, assigned_role: updates.role })
      if (error) { showToast(error.message, 'error'); return }
    }
    if (wasStatus) {
      const { error } = await supabase.rpc('set_admin_access_status', { target_admin_id: selectedId, new_status: updates.status })
      if (error) { showToast(error.message, 'error'); return }
    }
    await managerState.reload()
    if (wasRole) showToast('Manager role updated successfully.')
    else if (wasStatus) showToast(`Manager account ${updates.status === 'Active' ? 'activated' : 'deactivated'} successfully.`)
    else showToast('Manager account updated successfully.')
  }

  async function handleStatusChange(id: string, status: AccountStatus) {
    setActionPending(true)
    try {
      const { error } = await supabase.rpc('set_admin_access_status', { target_admin_id: id, new_status: status })
      if (error) throw error
      await managerState.reload()
      setStatusFilter('')
      setPage(1)
      setConfirmType(null)
      setConfirmTargetId(null)
      showToast(`Manager account ${status === 'Active' ? 'activated' : 'deactivated'} successfully.`)
    } catch (reason) {
      const message = reason && typeof reason === 'object' && 'message' in reason
        ? String(reason.message)
        : `Unable to ${status === 'Active' ? 'activate' : 'deactivate'} this administrator.`
      showToast(message, 'error')
    } finally {
      setActionPending(false)
    }
  }

  async function handleRemoveAdmin(id: string) {
    const { error } = await supabase.rpc('remove_admin_access', { target_admin_id: id })
    if (error) { showToast(error.message, 'error'); return }
    await managerState.reload()
    setSelectedId(null)
    setConfirmType(null)
    setConfirmTargetId(null)
    showToast('Administrator role removed. The user account remains active.')
  }

  function handleResetPassword() {
    setPendingResetPw(false)
    setModal('edit')
    showToast('Manager password reset successfully.')
  }

  // Confirm dialogs for activate/deactivate
  const confirmTarget = confirmTargetId ? managers.find(m => m.id === confirmTargetId) : null

  return (
    <div className="px-4 md:px-6 py-6 min-h-screen" style={{ backgroundColor: 'var(--ink)' }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Confirm: activate/deactivate from actions column */}
      {(confirmType === 'activate' || confirmType === 'deactivate' || confirmType === 'remove') && confirmTarget && (
        <ConfirmDialog
          heading={confirmType === 'activate' ? 'Activate Manager account?' : confirmType === 'deactivate' ? 'Deactivate Manager account?' : 'Remove this administrator role?'}
          message={confirmType === 'activate'
            ? 'This Manager will regain access to the features assigned to their role.'
            : confirmType === 'deactivate'
              ? 'This Manager will temporarily lose access to STREAMFLIX management features until activated again.'
              : 'This permanently removes all administrator privileges. Their regular StreamFlix user account and login will not be deleted.'}
          confirmLabel={confirmType === 'activate' ? 'Activate Account' : confirmType === 'deactivate' ? 'Deactivate Account' : 'Remove as Admin'}
          onConfirm={() => confirmType === 'remove' ? handleRemoveAdmin(confirmTarget.id) : handleStatusChange(confirmTarget.id, confirmType === 'activate' ? 'Active' : 'Inactive')}
          onCancel={() => { setConfirmType(null); setConfirmTargetId(null) }}
          danger={confirmType !== 'activate'}
          loading={actionPending}
        />
      )}

      {/* Modals */}
      {modal === 'add' && (
        <GrantAdminModal onGrant={handleGrantAdmin} onClose={() => { setModal(null); addBtnRef.current?.focus() }} />
      )}
      {modal === 'edit' && selectedManager && !pendingResetPw && (
        <EditManagerModal
          manager={selectedManager}
          managers={managers}
          onSave={handleEditSave}
          onClose={() => setModal(null)}
          onResetPassword={() => { setModal(null); setPendingResetPw(true) }}
        />
      )}
      {pendingResetPw && (
        <ResetPasswordModal onReset={handleResetPassword} onClose={() => { setPendingResetPw(false); setModal('edit') }} />
      )}
      {modal === 'assignRole' && selectedManager && (
        <AssignRoleModal manager={selectedManager} onAssign={handleAssignRole} onClose={() => setModal(null)} />
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Admin Management</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--taupe)' }}>Manage STREAMFLIX Manager accounts, roles, and access.</p>
        </div>
        <button
          ref={addBtnRef}
          onClick={() => setModal('add')}
          className="btn-gold flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm flex-shrink-0"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Make User Admin
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-48">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'var(--taupe)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
          </svg>
          <input
            className="input-field"
            style={{ paddingLeft: '2.25rem' }}
            placeholder="Search managers…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            aria-label="Search managers"
          />
        </div>
        <select className="select-field" style={{ width: 'auto', minWidth: 160 }} value={roleFilter}
          onChange={e => { setRoleFilter(e.target.value); setPage(1) }}>
          <option value="">All Roles</option>
          {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <select className="select-field" style={{ width: 'auto', minWidth: 180 }} value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1) }}>
          <option value="">All Account Statuses</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
        <button
          onClick={resetFilters}
          className="btn-ghost flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium flex-shrink-0"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Reset Filters
        </button>
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--taupe)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
          </svg>
          <select className="select-field" style={{ width: 'auto', minWidth: 148 }} value={sortBy}
            onChange={e => { setSortBy(e.target.value); setPage(1) }}>
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {/* Main content: table + panel */}
      <div className="flex gap-4 items-start">
        {/* Table */}
        <div className="flex-1 min-w-0 card overflow-hidden">
          <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--stone)' }}>
            <h2 className="text-base font-semibold text-white">Managers ({filtered.length})</h2>
          </div>
          <div>
            {managerState.loading
              ? <LoadingSpinner />
              : filtered.length === 0
                ? <EmptyState message="No Manager accounts match your search or selected filters." onReset={resetFilters} />
                : (
                  <table className="w-full text-sm" style={{ tableLayout: 'fixed' }} role="grid">
                    <colgroup>
                      <col style={{ width: 36 }} />
                      <col style={{ width: 80 }} />
                      <col style={{ width: '16%' }} />
                      <col style={{ width: '18%' }} />
                      <col style={{ width: '13%' }} />
                      <col style={{ width: '17%' }} />
                      <col style={{ width: 96 }} />
                      <col style={{ width: '15%' }} />
                      <col style={{ width: 244 }} />
                    </colgroup>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--stone)' }}>
                        <th className="px-2 py-3 text-left">
                          <input
                            type="checkbox"
                            className="w-4 h-4 rounded accent-purple-500"
                            checked={selectedRows.size > 0 && selectedRows.size === paginated.length}
                            onChange={toggleAllRows}
                            aria-label="Select all managers on page"
                          />
                        </th>
                        {['User ID', 'Manager', 'Email', 'Username', 'Role', 'Status', 'Last Login', 'Actions'].map(col => (
                          <th key={col} className="px-2 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--taupe)' }}>
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {paginated.map(m => {
                        const isSelected = selectedId === m.id
                        return (
                          <tr
                            key={m.id}
                            onClick={() => setSelectedId(isSelected ? null : m.id)}
                            className={`cursor-pointer transition-colors ${isSelected ? 'table-row-selected' : ''}`}
                            style={{
                              borderBottom: '1px solid rgba(55,65,81,0.5)',
                              borderLeft: isSelected ? '3px solid var(--wine)' : '3px solid transparent',
                            }}
                            onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.03)' }}
                            onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent' }}
                            tabIndex={0}
                            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedId(isSelected ? null : m.id) } }}
                            aria-selected={isSelected}
                            role="row"
                          >
                            <td className="px-2 py-3" onClick={e => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                className="w-4 h-4 rounded accent-purple-500"
                                checked={selectedRows.has(m.id)}
                                onChange={() => toggleRow(m.id)}
                                aria-label={`Select ${m.name}`}
                              />
                            </td>
                            <td className="px-2 py-3">
                              <span className="text-xs font-mono" style={{ color: 'var(--taupe)' }}>{m.id}</span>
                            </td>
                            <td className="px-2 py-3">
                              <div className="flex items-center gap-2 min-w-0">
                                <Avatar name={m.name} color={m.avatarColor} size="sm" />
                                <span className="text-white font-medium truncate text-xs">{m.name}</span>
                              </div>
                            </td>
                            <td className="px-2 py-3">
                              <span className="text-xs truncate block" style={{ color: 'var(--taupe)' }}>{m.email}</span>
                            </td>
                            <td className="px-2 py-3">
                              <span className="text-xs truncate block" style={{ color: 'var(--taupe)' }}>{m.username}</span>
                            </td>
                            <td className="px-2 py-3"><RoleBadge role={m.role} /></td>
                            <td className="px-2 py-3"><StatusBadge status={m.status} /></td>
                            <td className="px-2 py-3">
                              <span className="text-xs block truncate" style={{ color: 'var(--taupe)' }}>{formatDate(m.lastLogin)}</span>
                            </td>
                            <td className="px-2 py-3" onClick={e => e.stopPropagation()}>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => { setSelectedId(m.id) }}
                                  className="btn-wine px-2 py-1 rounded text-xs font-medium flex-shrink-0"
                                  aria-label={`View ${m.name}`}
                                >View</button>
                                <button
                                  onClick={() => { setSelectedId(m.id); setModal('edit') }}
                                  className="btn-wine px-2 py-1 rounded text-xs font-medium flex-shrink-0"
                                  aria-label={`Edit ${m.name}`}
                                >Edit</button>
                                <button
                                  onClick={() => { setSelectedId(m.id); setModal('assignRole') }}
                                  className="btn-wine px-2 py-1 rounded text-xs font-medium flex-shrink-0 whitespace-nowrap"
                                  aria-label={`Assign role to ${m.name}`}
                                >Role</button>
                                <button
                                  onClick={() => {
                                    setSelectedId(m.id)
                                    setConfirmTargetId(m.id)
                                    setConfirmType(m.status === 'Active' ? 'deactivate' : 'activate')
                                  }}
                                  className={`px-2 py-1 rounded text-xs font-medium flex-shrink-0 whitespace-nowrap transition-colors ${m.status === 'Active' ? 'text-red-300 hover:bg-red-500/10' : 'text-emerald-300 hover:bg-emerald-500/10'}`}
                                  aria-label={`${m.status === 'Active' ? 'Deactivate' : 'Activate'} ${m.name}`}
                                >{m.status === 'Active' ? 'Deactivate' : 'Activate'}</button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )}
          </div>

          {/* Pagination */}
          <div
            className="flex items-center justify-center gap-1 px-5 py-3"
            style={{ borderTop: '1px solid var(--stone)' }}
          >
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={safePage <= 1}
                  className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors disabled:opacity-30"
                  style={{ border: '1px solid var(--stone)' }}
                  onMouseEnter={e => { if (safePage > 1) (e.currentTarget.style.borderColor = 'var(--wine)') }}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--stone)')}
                  aria-label="Previous page"
                >
                  <svg className="w-4 h-4" style={{ color: 'var(--cream)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-xs font-medium transition-colors"
                    style={p === safePage
                      ? { backgroundColor: 'var(--wine)', color: 'white' }
                      : { border: '1px solid var(--stone)', color: 'var(--taupe)' }}
                    aria-label={`Page ${p}`}
                    aria-current={p === safePage ? 'page' : undefined}
                  >{p}</button>
                ))}
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={safePage >= totalPages}
                  className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors disabled:opacity-30"
                  style={{ border: '1px solid var(--stone)' }}
                  onMouseEnter={e => { if (safePage < totalPages) (e.currentTarget.style.borderColor = 'var(--wine)') }}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--stone)')}
                  aria-label="Next page"
                >
                  <svg className="w-4 h-4" style={{ color: 'var(--cream)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
          </div>
        </div>

        {/* Details Panel */}
        {selectedManager && (
          <ManagerDetailsPanel
            manager={selectedManager}
            onClose={() => setSelectedId(null)}
            onEdit={() => setModal('edit')}
            onAssignRole={() => setModal('assignRole')}
            onActivate={() => { setConfirmType('activate'); setConfirmTargetId(selectedManager.id) }}
            onDeactivate={() => { setConfirmType('deactivate'); setConfirmTargetId(selectedManager.id) }}
            onRemove={() => { setConfirmType('remove'); setConfirmTargetId(selectedManager.id) }}
            onSaveInline={handleSaveInline}
          />
        )}
      </div>
    </div>
  )
}
