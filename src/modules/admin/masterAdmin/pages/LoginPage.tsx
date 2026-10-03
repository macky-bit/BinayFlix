import { useState } from 'react'
import { supabase } from '../../../../lib/supabase'
const streamflixLogo = "/streamflix_logo.svg";
interface LoginPageProps {
  onLogin: () => void
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!email || !password) { setError('Please enter your email and password.'); return }
    setLoading(true)
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (signInError) {
      setError(signInError.message)
      setLoading(false)
      return
    }
    const { data: role, error: roleError } = await supabase.rpc('get_admin_role')
    if (roleError || role !== 'masterAdmin') {
      await supabase.auth.signOut()
      setError('This account does not have master administrator access.')
      setLoading(false)
      return
    }
    onLogin()
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ backgroundColor: 'var(--ink)' }}>
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <img src={streamflixLogo} alt="" className="h-12 w-12 object-contain" />
          <span className="text-2xl font-bold" style={{
            background: 'linear-gradient(to right, #F5A800, #7C3AED)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>STREAMFLIX</span>
        </div>

        <div className="card p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-white">Master Admin</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--taupe)' }}>Sign in to access the admin panel</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label htmlFor="login-email" className="block text-sm font-medium mb-1.5 text-white">Email</label>
              <input
                id="login-email"
                type="email"
                className="input-field"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Enter your administrator email"
                autoComplete="email"
              />
            </div>
            <div>
              <label htmlFor="login-password" className="block text-sm font-medium mb-1.5 text-white">Password</label>
              <input
                id="login-password"
                type="password"
                className="input-field"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
              />
            </div>
            {error && (
              <p className="text-sm text-red-400 rounded-lg px-3 py-2" style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>{error}</p>
            )}
            <button
              type="submit"
              className="btn-gold w-full py-3 rounded-xl text-sm font-semibold mt-2"
              disabled={loading}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: 'var(--taupe)' }}>
          STREAMFLIX Master Admin Portal — Authorized access only
        </p>
      </div>
    </div>
  )
}
