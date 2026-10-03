import { useState } from 'react'
import Toast from '../components/Toast'

interface ProfilePageProps {
  onBack: () => void
}

export default function ProfilePage({ onBack }: ProfilePageProps) {
  const [form, setForm] = useState({
    name: 'Master Admin',
    email: 'admin@streamflix.com',
    username: 'master.admin',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string } | null>(null)
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' })
  const [pwErrors, setPwErrors] = useState<Record<string, string>>({})
  const [pwLoading, setPwLoading] = useState(false)

  function validateProfile() {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'Name is required.'
    if (!form.email.trim()) e.email = 'Email is required.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email.'
    return e
  }

  function handleProfileSave(e: React.FormEvent) {
    e.preventDefault()
    const errs = validateProfile()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true)
    setTimeout(() => { setLoading(false); setToast({ message: 'Profile updated successfully.' }) }, 700)
  }

  function validatePw() {
    const e: Record<string, string> = {}
    if (!pwForm.current) e.current = 'Current password is required.'
    if (!pwForm.newPw) e.newPw = 'New password is required.'
    else if (pwForm.newPw.length < 8) e.newPw = 'Password must be at least 8 characters.'
    if (!pwForm.confirm) e.confirm = 'Please confirm the password.'
    else if (pwForm.newPw !== pwForm.confirm) e.confirm = 'Passwords do not match.'
    return e
  }

  function handlePwSave(e: React.FormEvent) {
    e.preventDefault()
    const errs = validatePw()
    if (Object.keys(errs).length) { setPwErrors(errs); return }
    setPwLoading(true)
    setTimeout(() => {
      setPwLoading(false)
      setPwForm({ current: '', newPw: '', confirm: '' })
      setToast({ message: 'Password changed successfully.' })
    }, 700)
  }

  return (
    <div className="px-4 md:px-6 py-6 max-w-2xl mx-auto">
      {toast && <Toast message={toast.message} onClose={() => setToast(null)} />}

      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-medium transition-colors"
          style={{ color: 'var(--taupe)' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--cream)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--taupe)')}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <h1 className="text-2xl font-bold text-white">Account & Profile</h1>
      </div>

      {/* Profile card */}
      <div className="card p-6 mb-4">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0"
            style={{ backgroundColor: 'var(--wine)' }}>
            M
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Master Admin</h2>
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(245,168,0,0.15)', color: '#F5A800', border: '1px solid rgba(245,168,0,0.35)' }}>
              Master Admin
            </span>
          </div>
        </div>

        <form onSubmit={handleProfileSave} className="flex flex-col gap-4">
          <h3 className="text-sm font-semibold text-white" style={{ borderBottom: '1px solid var(--stone)', paddingBottom: '0.5rem' }}>Profile Information</h3>
          {[
            { id: 'pname', label: 'Full Name *', key: 'name', type: 'text', value: form.name },
            { id: 'pemail', label: 'Email *', key: 'email', type: 'email', value: form.email },
            { id: 'pusername', label: 'Username', key: 'username', type: 'text', value: form.username },
          ].map(({ id, label, key, type, value }) => (
            <div key={id}>
              <label htmlFor={id} className="block text-sm font-medium mb-1.5 text-white">{label}</label>
              <input id={id} type={type} className="input-field" value={value}
                onChange={e => { setForm(f => ({ ...f, [key]: e.target.value })); setErrors(er => ({ ...er, [key]: '' })) }} />
              {errors[key] && <p className="mt-1 text-xs text-red-400">{errors[key]}</p>}
            </div>
          ))}
          <div className="flex justify-end">
            <button type="submit" className="btn-gold px-5 py-2.5 rounded-lg text-sm" disabled={loading}>
              {loading ? 'Saving…' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>

      {/* Change Password */}
      <div className="card p-6">
        <form onSubmit={handlePwSave} className="flex flex-col gap-4">
          <h3 className="text-sm font-semibold text-white" style={{ borderBottom: '1px solid var(--stone)', paddingBottom: '0.5rem' }}>Change Password</h3>
          {[
            { id: 'current-pw', label: 'Current Password *', key: 'current', value: pwForm.current },
            { id: 'new-pw', label: 'New Password *', key: 'newPw', value: pwForm.newPw },
            { id: 'confirm-pw', label: 'Confirm Password *', key: 'confirm', value: pwForm.confirm },
          ].map(({ id, label, key, value }) => (
            <div key={id}>
              <label htmlFor={id} className="block text-sm font-medium mb-1.5 text-white">{label}</label>
              <input id={id} type="password" className="input-field" value={value}
                onChange={e => { setPwForm(f => ({ ...f, [key]: e.target.value })); setPwErrors(er => ({ ...er, [key]: '' })) }}
                placeholder={key === 'current' ? 'Enter current password' : 'Min. 8 characters'}
                autoComplete={key === 'current' ? 'current-password' : 'new-password'} />
              {pwErrors[key] && <p className="mt-1 text-xs text-red-400">{pwErrors[key]}</p>}
            </div>
          ))}
          <div className="flex justify-end">
            <button type="submit" className="btn-gold px-5 py-2.5 rounded-lg text-sm" disabled={pwLoading}>
              {pwLoading ? 'Saving…' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

